import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const encoder = new TextEncoder();

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function verifyPaystackSignature(rawBody: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computedHash = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedHash === signature;
}

serve(async (req) => {
  try {
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) return json(400, { ok: false, message: "Missing signature" });

    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secret) return json(500, { ok: false, message: "PAYSTACK_SECRET_KEY not set" });

    const rawBody = await req.text();

    const isValid = await verifyPaystackSignature(rawBody, signature, secret);
    if (!isValid) return json(401, { ok: false, message: "Invalid signature" });

    const payload = JSON.parse(rawBody);
    const { event, data } = payload ?? {};

    // Paystack recommends listening to charge.success for bank transfers
    if (event !== "charge.success") return json(200, { ok: true, ignored: true });

    const reference = data?.reference as string | undefined;
    const amount = data?.amount ? Number(data.amount) / 100 : null; // kobo -> NGN
    const email = data?.customer?.email as string | undefined;

    if (!reference || !amount || amount <= 0) {
      return json(400, { ok: false, message: "Invalid payload: missing reference/amount" });
    }

    // ✅ Handle withdrawals finalization
if (event === "transfer.success" || event === "transfer.failed" || event === "transfer.reversed") {
  const reference = data?.reference;
  if (!reference) return new Response("Missing reference", { status: 400 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: wd } = await admin
    .from("withdrawals")
    .select("id, status, amount, user_id, reference")
    .eq("reference", reference)
    .maybeSingle();

  if (!wd) return new Response("Withdrawal not found", { status: 200 });

  if (event === "transfer.success") {
    await admin.from("withdrawals").update({ status: "successful" }).eq("reference", reference);
    return new Response("OK", { status: 200 });
  }

  // failed or reversed => refund wallet
  const { data: userAccount } = await admin
    .from("ledger_accounts")
    .select("id")
    .eq("owner_type", "user")
    .eq("owner_id", wd.user_id)
    .eq("currency", "NGN")
    .single();

  const { data: clearingAccount } = await admin
    .from("ledger_accounts")
    .select("id")
    .eq("owner_type", "system")
    .eq("account_type", "withdrawal_clearing")
    .single();

  if (userAccount && clearingAccount) {
    await admin.rpc("post_transfer", {
      p_from_account: clearingAccount.id,
      p_to_account: userAccount.id,
      p_amount: Number(wd.amount),
      p_reference: `${reference}-REFUND`,
      p_metadata: { reason: event },
    });
  }

  await admin.from("withdrawals").update({ status: "refunded" }).eq("reference", reference);
  return new Response("OK", { status: 200 });
}


    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) If already processed, exit
    const { data: existingTx, error: existErr } = await admin
      .from("paystack_transactions")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();

    if (existErr) return json(500, { ok: false, message: existErr.message });
    if (existingTx) return json(200, { ok: true, message: "Already processed" });

    // 2) Find user (BEST: by virtual account number)
    // Paystack dedicated virtual account payments include an authorization object. :contentReference[oaicite:3]{index=3}
    const authorization = data?.authorization ?? {};
    const possibleAccountNumber =
      authorization?.receiver_bank_account_number ||
      authorization?.account_number ||
      data?.authorization?.account_number ||
      null;

    let userId: string | null = null;

    if (possibleAccountNumber) {
      const { data: va } = await admin
        .from("user_virtual_accounts")
        .select("user_id")
        .eq("account_number", String(possibleAccountNumber))
        .eq("active", true)
        .maybeSingle();

      userId = va?.user_id ?? null;
    }

    // Fallback: by email (your old flow)
    if (!userId && email) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      userId = profile?.id ?? null;
    }

    if (!userId) {
      return json(404, { ok: false, message: "User not found for this payment" });
    }

    // 3) Credit wallet (idempotent inside DB via your function + unique reference)
    const { error: creditErr } = await admin.rpc("credit_user_from_paystack", {
      p_user_id: userId,
      p_amount: amount,
      p_reference: reference,
      p_raw: data ?? {},
    });

    if (creditErr) return json(500, { ok: false, message: creditErr.message });

    return json(200, { ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return json(500, { ok: false, message: "Server error" });
  }
});
