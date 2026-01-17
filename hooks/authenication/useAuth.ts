import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      console.log("[auth] loading session");

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const user = data.session?.user ?? null;
      setUser(user);

      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(); // 🔥 FIX

        if (error) {
          console.error("[auth] profile fetch error:", error.message);
        }

        setProfile(profile ?? null);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        console.log("[auth] state change:", _event);

        const user = session?.user ?? null;
        setUser(user);

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(); // 🔥 FIX

          if (!mounted) return;
          setProfile(profile ?? null);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    loading,
    onboarded: profile?.has_completed_onboarding,
  };
}
