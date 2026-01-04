import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { useAuth } from "./useAuth";

export function usePolicy(slug: string) {
  const { loading: authLoading } = useAuth();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      console.log("[policy] waiting for auth hydration");
      return;
    }

    let cancelled = false;

    const fetchPolicy = async () => {
      console.log("[policy] fetching policy:", slug);
      setLoading(true);

      const { data, error } = await supabase
        .from("policy_documents")
        .select("id,title,content,version,effective_from")
        .eq("slug", slug)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle(); // 🔥 FIX

      if (cancelled) return;

      if (error) {
        console.error("[policy] fetch error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        setPolicy(null);
      } else if (!data) {
        console.warn("[policy] no active policy found:", slug);
        setPolicy(null);
      } else {
        console.log("[policy] loaded:", {
          id: data.id,
          version: data.version,
        });
        setPolicy(data);
      }

      setLoading(false);
    };

    fetchPolicy();

    return () => {
      cancelled = true;
    };
  }, [slug, authLoading]);

  return { policy, loading };
}

