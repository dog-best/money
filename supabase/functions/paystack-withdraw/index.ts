import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  let userAccountId: string | null = null;
  let clearingAccountId: string | null = null;
  let amount = 0;
  let reference = "";

  // user client (auth)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  // admin client (ledger + db updates)
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (req.method !== "POST") return json(405, { success: false, message: "Method not allowed" });

    // 1) Auth
    const { data: auth, error: authError } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user || authError) return json(401, { success: false, message: "Unauthorized" });

    // 2) Input
    const { amount: inputAmount, bank_code, account_number, account_name, reference: inputReference } =
      await req.json();

    amount = Number(inputAmount);
    reference = String(inputReference ?? "").trim();

    if (!reference || !Number.isFinite(amount) || amount <= 0 || !bank_code || !account_number) {
      return json(400, { success: false, message: "Invalid payload" });
    }

    // 3) Accounts
    const { data: userAccount } = await admin
      .from("ledger_accounts")
      .select("id")
      .eq("owner_type", "user")
      .eq("owner_id", user.id)
      .eq("currency", "NGN")
      .single();

    const { data: clearingAccount } = await admin
      .from("ledger_accounts")
      .select("id")
      .eq("owner_type", "system")
      .eq("account_type", "withdrawal_clearing")
      .single();

    if (!userAccount || !clearingAccount) {
      return json(500, { success: false, message: "Ledger accounts missing" });
    }

    userAccountId = userAccount.id;
    clearingAccountId = clearingAccount.id;

    // 4) Idempotency: if withdrawal already exists, return its status
    const { data: existing } = await admin
      .from("withdrawals")
      .select("status, reference, paystack_transfer_code")
      .eq("reference", reference)
      .maybeSingle();

    if (existing) {
      return json(200, {
        success: true,
        reference,
        status: existing.status,
        transfer_code: existing.paystack_transfer_code ?? null,
        message: "Already submitted",
      });
    }

    // 5) Create withdrawal record
    await admin.from("withdrawals").insert({
      user_id: user.id,
      amount,
      bank_code,
      account_number,
      account_name: account_name ?? null,
      status: "pending",
      reference,
    });

    // 6) Debit user -> withdrawal_clearing
    const { error: debitError } = await admin.rpc("post_transfer", {
      p_from_account: userAccountId,
      p_to_account: clearingAccountId,
      p_amount: amount,
      p_reference: reference,
      p_metadata: { type: "withdrawal" },
    });

    if (debitError) throw debitError;

    await admin.from("withdrawals").update({ status: "processing" }).eq("reference", reference);

    // 7) Create transfer recipient
    const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "nuban",
        name: account_name || "Wallet Withdrawal",
        account_number,
        bank_code,
        currency: "NGN",
      }),
    });

    const recipientJson = await recipientRes.json();
    if (!recipientRes.ok || !recipientJson?.status) {
      throw new Error(recipientJson?.message ?? "Recipient creation failed");
    }

    // 8) Initiate transfer
    const transferRes = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(amount * 100),
        recipient: recipientJson.data.recipient_code,
        reference,
      }),
    });

    const transferJson = await transferRes.json();
    if (!transferRes.ok || !transferJson?.status) {
      throw new Error(transferJson?.message ?? "Transfer init failed");
    }

    // Store transfer_code now, but do NOT mark successful yet.
    await admin
      .from("withdrawals")
      .update({
        paystack_transfer_code: transferJson.data.transfer_code,
        paystack_response: transferJson,
      })
      .eq("reference", reference);

    return json(200, {
      success: true,
      reference,
      status: "processing",
      transfer_code: transferJson.data.transfer_code,
    });
  } catch (err) {
    console.error("WITHDRAW ERROR:", err);

    // Refund if already debited
    if (userAccountId && clearingAccountId && amount && reference) {
      await admin.rpc("post_transfer", {
        p_from_account: clearingAccountId,
        p_to_account: userAccountId,
        p_amount: amount,
        p_reference: `${reference}-REFUND`,
        p_metadata: { reason: "withdrawal_failed" },
      });

      await admin.from("withdrawals").update({ status: "refunded" }).eq("reference", reference);
    } else if (reference) {
      await admin.from("withdrawals").update({ status: "failed" }).eq("reference", reference);
    }

    return json(500, { success: false, message: "Withdrawal failed. Wallet refunded." });
  }
});
