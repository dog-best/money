// hooks/useProviders.ts
import { supabase } from "@/supabase/client";
import { useEffect, useState } from "react";

export function useProviders() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true });

      if (!error) setProviders(data || []);
      setLoading(false);
    };

    load();
  }, []);

  return { providers, loading };
}
