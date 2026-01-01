// hooks/useMiningConfig.ts
import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";

export function useMiningConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("mining_config")
        .select("*")
        .eq("is_active", true)
        .single();

      if (!error) setConfig(data);
      setLoading(false);
    };

    load();
  }, []);

  return { config, loading };
}
