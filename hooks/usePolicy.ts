import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

export function usePolicy(slug: string) {
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPolicy = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("policy_documents")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error) setPolicy(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPolicy();

    const channel = supabase
      .channel("policy-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "policy_documents" },
        fetchPolicy
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  return { policy, loading };
}
