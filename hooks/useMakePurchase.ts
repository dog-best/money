// hooks/useMakePurchase.ts
import { supabase } from "@/supabase/client";
import { useState } from "react";

export function useMakePurchase() {
  const [loading, setLoading] = useState(false);

  const buyAirtime = async (payload: any) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("paystack-airtime", {
      body: payload,
    });
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const buyData = async (payload: any) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("paystack-data", {
      body: payload,
    });
    setLoading(false);
    if (error) throw error;
    return data;
  };

  return { buyAirtime, buyData, loading };
}
