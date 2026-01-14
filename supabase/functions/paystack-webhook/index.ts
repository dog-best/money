import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Paystack Webhook – Supabase Edge Function
 * - Deno-native
 * - Idempotent
 * - Secure (HMAC verification)
 * - Mobile-app safe
 */

const encoder = new TextEncoder();

serve(async (req) => {
  try {
    // 🔒 Read raw body
    const bodyText = await req.text();

    // 🔐 Verify Paystack signature
    const paystackSignature = req.headers.get("x-paystack-signature");
    if (!paystackSignature) {
      return new Response("Missing signature", { status: 400 });
    }

    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secret) {
      throw new Error("PAYSTACK_SECRET_KEY not set");
    }

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(bodyText)
    );

    const computedHash = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (computedHash !== paystackSignature) {
      return new Response("Invalid signature", { status: 401 });
    }

    // 📦 Parse payload
    const payload = JSON.parse(bodyText);
    const { event, data } = payload;

    // Ignore non-success events
    if (event !== "charge.success") {
      return new Response("Ignored", { status: 200 });
    }

    const reference = data?.reference;
    const amount = data?.amount ? data.amount / 100 : null; // Kobo → NGN
    const email = data?.customer?.email;

    if (!reference || !amount || !email) {
      return new Response("Invalid payload", { status: 400 });
    }

    // 🔑 Supabase admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🛑 1️⃣ Idempotency check (Paystack ref)
    const { data: existingTx } = await supabase
      .from("paystack_transactions")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();

    if (existingTx) {
      return new Response("Already processed", { status: 200 });
    }

    // 👤 2️⃣ Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return new Response("User not found", { status: 404 });
    }

    // 💼 3️⃣ User NGN wallet account
    const { data: userAccount } = await supabase
      .from("ledger_accounts")
      .select("id")
      .eq("owner_type", "user")
      .eq("owner_id", profile.id)
      .eq("currency", "NGN")
      .single();

    // 🏦 4️⃣ Paystack clearing account
    const { data: paystackAccount } = await supabase
      .from("ledger_accounts")
      .select("id")
      .eq("owner_type", "system")
      .eq("account_type", "paystack_clearing")
      .single();

    if (!userAccount || !paystackAccount) {
      throw new Error("Ledger accounts missing");
    }

    // 🔄 5️⃣ Atomic ledger credit (RPC)
    const { error: ledgerError } = await supabase.rpc(
      "credit_user_from_paystack",
      {
        p_user_account: userAccount.id,
        p_paystack_account: paystackAccount.id,
        p_amount: amount,
        p_reference: reference,
        p_metadata: data,
      }
    );

    if (ledgerError) {
      throw ledgerError;
    }

    // 🧾 6️⃣ Store Paystack transaction record
    await supabase.from("paystack_transactions").insert({
      reference,
      user_id: profile.id,
      amount,
      status: "success",
      raw: data,
    });

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Server error", { status: 500 });
  }
});
