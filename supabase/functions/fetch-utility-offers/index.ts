import { serve } from "https://deno.land/std/http/server.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const category = url.searchParams.get("category"); // data | airtime
  const provider = url.searchParams.get("provider"); // mtn | airtel

  let query = supabaseAdmin
    .from("service_products")
    .select(`
      product_code,
      name,
      data_size_mb,
      validity_label,
      provider_code,
      service_offers (
        id,
        base_price,
        promo_price,
        offer_type,
        cashback,
        bonus_data_mb,
        start_at,
        end_at,
        priority
      )
    `)
    .eq("active", true);

  if (category) query = query.eq("category_code", category);
  if (provider) query = query.eq("provider_code", provider);

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }

  // Filter only active offers
  const now = new Date();

  const structured = data.map((p) => ({
    ...p,
    offers: p.service_offers
      .filter(o =>
        (!o.start_at || new Date(o.start_at) <= now) &&
        (!o.end_at || new Date(o.end_at) >= now)
      )
      .sort((a, b) => b.priority - a.priority)
  }));

  return new Response(
    JSON.stringify({ success: true, products: structured }),
    { headers: { "Content-Type": "application/json" } }
  );
});
