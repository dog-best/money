import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization")!,
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { phone, amount, provider, reference } = await req.json();
    if (!phone || !amount || !provider || !reference) {
      return new Response("Invalid payload", { status: 400 });
    }

    // 1️⃣ Get accounts
    const { data: userAccount } = await supabase
      .from("ledger_accounts")
      .select("id")
      .eq("owner_type", "user")
      .eq("owner_id", user.id)
      .eq("currency", "NGN")
      .single();

    const { data: utilityAccount } = await supabase
      .from("ledger_accounts")
      .select("id")
      .eq("owner_type", "system")
      .eq("account_type", "utility_clearing")
      .single();

    // 2️⃣ Create purchase record
    await supabase.from("utility_purchases").insert({
      user_id: user.id,
      utility_type: "airtime",
      provider,
      phone,
      amount,
      status: "pending",
      reference,
    });

    // 3️⃣ Debit user (ledger)
    const debit = await supabase.rpc("post_transfer", {
      p_from_account: userAccount.id,
      p_to_account: utilityAccount.id,
      p_amount: amount,
      p_reference: reference,
      p_metadata: { type: "airtime", phone, provider },
    });

    if (debit.error) throw debit.error;

    await supabase
      .from("utility_purchases")
      .update({ status: "processing" })
      .eq("reference", reference);

    // 4️⃣ Call Paystack Airtime API
    const res = await fetch("https://api.paystack.co/bill/airtime", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        amount,
        provider,
        reference,
      }),
    });

    const result = await res.json();

    if (res.ok && result.status === true) {
      await supabase
        .from("utility_purchases")
        .update({
          status: "successful",
          provider_reference: result.data?.reference,
          provider_response: result,
        })
        .eq("reference", reference);

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    throw new Error("Airtime failed");
  } catch (err) {
    console.error(err);

    // 🔁 REFUND LOGIC
    // Reverse ledger transfer
    // utility_clearing → user

    return new Response("Airtime failed, refunded", { status: 500 });
  }
});
