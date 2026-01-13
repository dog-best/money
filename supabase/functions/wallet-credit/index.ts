// supabase/functions/wallet-credit/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    const body = await req.json();
    const event = body.event;
    const data = body.data;

    // only successful charge
    if (event !== "charge.success") {
      return new Response("Ignored", { status: 200 });
    }

    const email = data.customer?.email;
    const amount = data.amount / 100; // Paystack amount in kobo
    const reference = data.reference;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the user tied to this email
    const { data: userRows } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (!userRows || !userRows.length) {
      console.log("User not found for:", email);
      return new Response("No such user", { status: 404 });
    }

    const userId = userRows[0].id;

    // call DB function
    const { error: fnError } = await supabase.rpc("credit_wallet", {
      p_user_id: userId,
      p_amount: amount,
      p_reference: reference,
    });

    if (fnError) throw fnError;

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Error", { status: 500 });
  }
});
