// hooks/usePurchaseHistory.ts
import { supabase } from "@/supabase/client";
import { useEffect, useState } from "react";

export function usePurchaseHistory(userId?: string) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("utility_purchases")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      setHistory(data || []);
      setLoading(false);
    };

    load();
  }, [userId]);

  return { history, loading };
}
