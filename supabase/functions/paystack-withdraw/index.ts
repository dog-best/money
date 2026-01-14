import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  let userAccountId: string | null = null;
  let clearingAccountId: string | null = null;
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
       1️⃣ AUTH
    ─────────────────────────────── */
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    /* ───────────────────────────────
       2️⃣ INPUT
    ─────────────────────────────── */
    const {
      amount: inputAmount,
      bank_code,
      account_number,
      account_name,
      reference: inputReference,
    } = await req.json();

    if (!inputAmount || !bank_code || !account_number || !inputReference) {
      return new Response("Invalid payload", { status: 400 });
    }

    amount = Number(inputAmount);
    reference = inputReference;

    /* ───────────────────────────────
       3️⃣ LEDGER ACCOUNTS
    ─────────────────────────────── */
    const { data: userAccount } = await supabase
      .from("ledger_accounts")
      .select("id")
      .eq("owner_type", "user")
      .eq("owner_id", user.id)
      .eq("currency", "NGN")
      .single();

    const { data: clearingAccount } = await supabase
      .from("ledger_accounts")
      .select("id")
      .eq("owner_type", "system")
      .eq("account_type", "withdrawal_clearing")
      .single();

    if (!userAccount || !clearingAccount) {
      throw new Error("Ledger account missing");
    }

    userAccountId = userAccount.id;
    clearingAccountId = clearingAccount.id;

    /* ───────────────────────────────
       4️⃣ CREATE WITHDRAWAL RECORD
    ─────────────────────────────── */
    await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount,
      bank_code,
      account_number,
      account_name,
      status: "pending",
      reference,
    });

    /* ───────────────────────────────
       5️⃣ DEBIT USER (LEDGER)
    ─────────────────────────────── */
    const { error: debitError } = await supabase.rpc("post_transfer", {
      p_from_account: userAccountId,
      p_to_account: clearingAccountId,
      p_amount: amount,
      p_reference: reference,
      p_metadata: { type: "withdrawal" },
    });

    if (debitError) throw debitError;

    await supabase
      .from("withdrawals")
      .update({ status: "processing" })
      .eq("reference", reference);

    /* ───────────────────────────────
       6️⃣ CREATE TRANSFER RECIPIENT
    ─────────────────────────────── */
    const recipientRes = await fetch(
      "https://api.paystack.co/transferrecipient",
      {
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
      }
    );

    const recipient = await recipientRes.json();
    if (!recipient.status) throw new Error("Recipient creation failed");

    /* ───────────────────────────────
       7️⃣ INITIATE TRANSFER
    ─────────────────────────────── */
    const transferRes = await fetch(
      "https://api.paystack.co/transfer",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "balance",
          amount: Math.round(amount * 100),
          recipient: recipient.data.recipient_code,
          reference,
        }),
      }
    );

    const transfer = await transferRes.json();
    if (!transfer.status) throw new Error("Transfer failed");

    await supabase
      .from("withdrawals")
      .update({
        status: "successful",
        paystack_transfer_code: transfer.data.transfer_code,
        paystack_response: transfer,
      })
      .eq("reference", reference);

    return new Response(
      JSON.stringify({ success: true, reference }),
      { status: 200 }
    );
  } catch (err) {
    console.error("WITHDRAW ERROR:", err);

    /* ───────────────────────────────
       8️⃣ REFUND
    ─────────────────────────────── */
    if (userAccountId && clearingAccountId && amount && reference) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await admin.rpc("post_transfer", {
        p_from_account: clearingAccountId,
        p_to_account: userAccountId,
        p_amount: amount,
        p_reference: `${reference}-REFUND`,
        p_metadata: { reason: "withdrawal_failed" },
      });

      await admin
        .from("withdrawals")
        .update({ status: "refunded" })
        .eq("reference", reference);
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "Withdrawal failed. Wallet refunded.",
      }),
      { status: 500 }
    );
  }
});
