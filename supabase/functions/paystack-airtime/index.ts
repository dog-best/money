import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PurchaseStatus =
  | "pending"
  | "debited"
  | "processing"
  | "successful"
  | "failed"
  | "refunded";

serve(async (req) => {
  let userAccountId: string | null = null;
  let utilityAccountId: string | null = null;
  let amount = 0;
  let reference = "";

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // user-scoped client (uses user's Authorization header)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    /* 1) AUTH */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return new Response("Unauthorized", { status: 401 });
    }

    /* 2) INPUT */
    const {
      phone,
      amount: inputAmount,
      provider,
      reference: inputReference,
    } = await req.json();

    if (!phone || !inputAmount || !provider || !inputReference) {
      return new Response("Invalid payload", { status: 400 });
    }

    amount = Number(inputAmount);
    reference = String(inputReference);

    if (!Number.isFinite(amount) || amount <= 0) {
      return new Response("Invalid amount", { status: 400 });
    }

    /* 3) ACCOUNTS */
    const { data: userAccount, error: uaErr } = await supabase
      .from("ledger_accounts")
      .select("id")
      .eq("owner_type", "user")
      .eq("owner_id", user.id)
      .eq("currency", "NGN")
      .single();

    const { data: utilityAccount, error: utilErr } = await supabase
      .from("ledger_accounts")
      .select("id")
      .eq("owner_type", "system")
      .eq("account_type", "utility_clearing")
      .single();

    if (uaErr || utilErr || !userAccount || !utilityAccount) {
      return new Response("Ledger accounts not found", { status: 500 });
    }

    userAccountId = userAccount.id;
    utilityAccountId = utilityAccount.id;

    /* 4) IDEMPOTENCY / PURCHASE RECORD */
    const { data: existing, error: existingErr } = await supabase
      .from("utility_purchases")
      .select("id,status,reference")
      .eq("reference", reference)
      .maybeSingle();

    if (existingErr) throw existingErr;

    if (existing) {
      const status = existing.status as PurchaseStatus;

      if (status === "successful") {
        return new Response(JSON.stringify({ success: true, reference }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (status === "pending" || status === "debited" || status === "processing") {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Transaction already in progress",
            reference,
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      if (status === "failed" || status === "refunded") {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Transaction already completed (failed/refunded)",
            reference,
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    } else {
      const { error: insErr } = await supabase.from("utility_purchases").insert({
        user_id: user.id,
        utility_type: "airtime",
        provider,
        phone,
        amount,
        status: "pending",
        reference,
      });

      if (insErr) throw insErr;
    }

    /* 5) DEBIT USER (LEDGER) */
    const { error: ledgerError } = await supabase.rpc("post_transfer", {
      p_from_account: userAccountId,
      p_to_account: utilityAccountId,
      p_amount: amount,
      p_reference: reference,
      p_metadata: { type: "airtime", phone, provider },
    });

    if (ledgerError) throw ledgerError;

    // Mark debited (since your schema supports it)
    await supabase
      .from("utility_purchases")
      .update({ status: "debited" })
      .eq("reference", reference);

    /* 6) PAYSTACK CALL */
    await supabase
      .from("utility_purchases")
      .update({ status: "processing" })
      .eq("reference", reference);

    const res = await fetch("https://api.paystack.co/bill/airtime", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, amount, provider, reference }),
    });

    const result = await res.json().catch(() => ({}));

    /* 7) SUCCESS */
    if (res.ok && result?.status === true) {
      await supabase
        .from("utility_purchases")
        .update({
          status: "successful",
          provider_reference: result?.data?.reference ?? null,
          provider_response: result,
        })
        .eq("reference", reference);

      return new Response(JSON.stringify({ success: true, reference }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mark failed before refund (clean audit)
    await supabase
      .from("utility_purchases")
      .update({
        status: "failed",
        provider_response: { paystack_response: result, http_ok: res.ok },
      })
      .eq("reference", reference);

    throw new Error("Paystack airtime purchase failed");
  } catch (err) {
    console.error("AIRTIME PURCHASE ERROR:", err);

    /* 8) REFUND (if debited already) */
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
        message: "Airtime failed. Wallet refunded.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

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
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Reverse ledger transfer
  await admin.rpc("post_transfer", {
    p_from_account: utilityAccountId,
    p_to_account: userAccountId,
    p_amount: amount,
    p_reference: `${reference}-REFUND`,
    p_metadata: { reason: "airtime_purchase_failed" },
  });

  // Mark refunded
  await admin
    .from("utility_purchases")
    .update({ status: "refunded" })
    .eq("reference", reference);
}
