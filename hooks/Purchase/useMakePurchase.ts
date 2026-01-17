import { supabase } from "@/supabase/client";
import { useState } from "react";

type AirtimePayload = {
  phone: string;
  provider: string;
  amount: number;
  reference: string;
};

type DataPayload = {
  phone: string;
  provider: string;
  product_code: string;
  reference: string;
};

export function useMakePurchase() {
  const [loading, setLoading] = useState(false);

  const buyAirtime = async (payload: AirtimePayload) => {
    if (loading) throw new Error("Please wait…");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-airtime", {
        body: payload,
      });
      if (error) throw new Error(error.message);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const buyData = async (payload: DataPayload) => {
    if (loading) throw new Error("Please wait…");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-data", {
        body: payload,
      });
      if (error) throw new Error(error.message);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { buyAirtime, buyData, loading };
}
