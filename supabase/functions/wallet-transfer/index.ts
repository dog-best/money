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

    // 1️⃣ Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2️⃣ Input
    const { to_account_id, amount, reference, metadata } =
      await req.json();

    if (!to_account_id || !amount || !reference) {
      return new Response("Invalid request", { status: 400 });
    }

    // 3️⃣ Get sender account
    const { data: senderAccount } = await supabase
      .from("ledger_accounts")
      .select("id")
      .eq("owner_type", "user")
      .eq("owner_id", user.id)
      .eq("currency", "NGN")
      .single();

    if (!senderAccount) {
      return new Response("Sender account not found", { status: 404 });
    }

    // 4️⃣ Call ledger transfer
    const { error } = await supabase.rpc("post_transfer", {
      p_from_account: senderAccount.id,
      p_to_account: to_account_id,
      p_amount: amount,
      p_reference: reference,
      p_metadata: metadata ?? {},
    });

    if (error) {
      return new Response(error.message, { status: 400 });
    }

    return new Response(
      JSON.stringify({ success: true, reference }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
});
