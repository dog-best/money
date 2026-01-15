// hooks/useServiceProducts.ts
import { supabase } from "@/supabase/client";
import { useEffect, useState } from "react";

export function useServiceProducts(category: string, provider: string) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!provider || !category) return;

    const load = async () => {
      setLoading(true);

      const { data: base, error } = await supabase
        .from("service_products")
        .select("*")
        .eq("category_code", category)
        .eq("provider_code", provider)
        .eq("active", true)
        .order("data_size_mb", { ascending: true });

      const { data: offers } = await supabase
        .from("service_offers")
        .select("*")
        .eq("active", true)
        .order("priority", { ascending: false });

      if (error || !base) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // merge discounts + bonuses
      const merged = base.map((p) => {
        const offer = offers?.find((o) => o.product_code === p.product_code);
        return {
          ...p,
          final_price: offer?.promo_price ?? offer?.base_price ?? p.base_price,
          has_offer: !!offer,
          cashback: offer?.cashback ?? 0,
          bonus_data_mb: offer?.bonus_data_mb ?? 0,
        };
      });

      setProducts(merged);
      setLoading(false);
    };

    load();
  }, [provider, category]);

  return { products, loading };
}
