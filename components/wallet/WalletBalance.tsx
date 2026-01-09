import { View, Text, StyleSheet, Pressable, ActivityIndicator, AppState } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  withTiming,
  useDerivedValue,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { Feather } from "@expo/vector-icons";


export default function WalletBalanceCard() {
  const balance = useSharedValue(0);
  const [displayBalance, setDisplayBalance] = useState("₦0.00");
  const [loading, setLoading] = useState(false);

  const animatedBalance = useDerivedValue(() => {
    return `₦${balance.value.toFixed(2)}`;
  });

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchBalance();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    fetchBalance();
  }, []);

  // 🔥 Live updates
 useEffect(() => {
  const channel = supabase
    .channel("wallet-live")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "wallets" },
      (payload) => {
        balance.value = withTiming(Number(payload.new.balance), {
          duration: 800,
        });
      }
    )
    .subscribe();

  return () => {
    // 👇 DO NOT return the Promise
    void supabase.removeChannel(channel);
  };
}, []);


  // 🔁 Sync animated → JS
  useEffect(() => {
    const id = setInterval(() => {
      setDisplayBalance(animatedBalance.value);
    }, 16);
    return () => clearInterval(id);
  }, []);

  async function fetchBalance() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (data) {
        balance.value = withTiming(Number(data.balance), {
          duration: 1200,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#6D28D9", "#4C1D95"]} style={styles.card}>
      
      {/* 🔝 Header */}
      <View style={styles.header}>
        <Text style={styles.label}>Wallet Balance</Text>

        <Pressable
          onPress={fetchBalance}
          style={({ pressed }) => [
            styles.refreshBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#E9D5FF" />
          ) : (
            <Feather name="refresh-cw" size={18} color="#E9D5FF" />
          )}
        </Pressable>
      </View>

      {/* 💰 Balance */}
      <Animated.Text style={styles.balance}>
        {displayBalance}
      </Animated.Text>

      <Text style={styles.currency}>NGN Wallet</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 22,
    marginTop: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  label: {
    color: "#E9D5FF",
    fontSize: 14,
    fontWeight: "600",
  },

  refreshBtn: {
    height: 34,
    width: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  balance: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    marginVertical: 14,
    letterSpacing: 0.5,
  },

  currency: {
    color: "#DDD6FE",
    fontSize: 13,
  },
});
