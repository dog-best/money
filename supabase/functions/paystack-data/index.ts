import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  let userAccountId: string | null = null;
  let utilityAccountId: string | null = null;
  let amount = 0;
  let reference = "";

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

    /* ───────────────────────────────
       1️⃣ AUTHENTICATION
    ─────────────────────────────── */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return new Response("Unauthorized", { status: 401 });
    }

    /* ───────────────────────────────
       2️⃣ INPUT VALIDATION
    ─────────────────────────────── */
    const {
      phone,
      provider,
      plan_code, // Paystack data plan code
      amount: inputAmount,
      reference: inputReference,
    } = await req.json();

    if (!phone || !provider || !plan_code || !inputAmount || !inputReference) {
      return new Response("Invalid request payload", { status: 400 });
    }

    amount = Number(inputAmount);
    reference = inputReference;

    /* ───────────────────────────────
       3️⃣ FETCH LEDGER ACCOUNTS
    ─────────────────────────────── */
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

    if (!userAccount || !utilityAccount) {
      throw new Error("Ledger accounts not found");
    }

    userAccountId = userAccount.id;
    utilityAccountId = utilityAccount.id;

    /* ───────────────────────────────
       4️⃣ CREATE PURCHASE RECORD
    ─────────────────────────────── */
    await supabase.from("utility_purchases").insert({
      user_id: user.id,
      utility_type: "data",
      provider,
      phone,
      amount,
      status: "pending",
      reference,
    });

    /* ───────────────────────────────
       5️⃣ DEBIT USER (LEDGER)
    ─────────────────────────────── */
    const { error: ledgerError } = await supabase.rpc("post_transfer", {
      p_from_account: userAccountId,
      p_to_account: utilityAccountId,
      p_amount: amount,
      p_reference: reference,
      p_metadata: {
        type: "data",
        phone,
        provider,
        plan_code,
      },
    });

    if (ledgerError) throw ledgerError;

    await supabase
      .from("utility_purchases")
      .update({ status: "processing" })
      .eq("reference", reference);

    /* ───────────────────────────────
       6️⃣ CALL PAYSTACK DATA API
    ─────────────────────────────── */
    const res = await fetch("https://api.paystack.co/bill/data", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        provider,
        plan: plan_code,
        amount,
        reference,
      }),
    });

    const result = await res.json();

    /* ───────────────────────────────
       7️⃣ SUCCESS
    ─────────────────────────────── */
    if (res.ok && result.status === true) {
      await supabase
        .from("utility_purchases")
        .update({
          status: "successful",
          provider_reference: result.data?.reference,
          provider_response: result,
        })
        .eq("reference", reference);

      return new Response(
        JSON.stringify({ success: true, reference }),
        { status: 200 }
      );
    }

    throw new Error("Paystack data purchase failed");
  } catch (err) {
    console.error("DATA PURCHASE ERROR:", err);

    /* ───────────────────────────────
       8️⃣ REFUND (SEE PART 6 BELOW)
    ─────────────────────────────── */
    if (userAccountId && utilityAccountId && amount && reference) {
      await refundUtilityPayment({
        userAccountId,
        utilityAccountId,
        amount,
        reference,
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "Data purchase failed. Wallet refunded.",
      }),
      { status: 500 }
    );
  }
});

/* ───────────────────────────────
   REFUND HELPER
─────────────────────────────── */
async function refundUtilityPayment({
  userAccountId,
  utilityAccountId,
  amount,
  reference,
}: {
  userAccountId: string;
  utilityAccountId: string;
  amount: number;
  reference: string;
}) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  await supabase.rpc("post_transfer", {
    p_from_account: utilityAccountId,
    p_to_account: userAccountId,
    p_amount: amount,
    p_reference: `${reference}-REFUND`,
    p_metadata: {
      reason: "data_purchase_failed",
    },
  });

  await supabase
    .from("utility_purchases")
    .update({ status: "refunded" })
    .eq("reference", reference);
}
