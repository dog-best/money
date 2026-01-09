import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { supabase } from "@/supabase/client";
import { Ionicons } from "@expo/vector-icons";

type Tx = {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  status: "SUCCESS" | "FAILED" | "PENDING";
  description: string;
  created_at: string;
};

export default function WalletTransactionList() {
  const [tx, setTx] = useState<Tx[]>([]);

  useEffect(() => {
    loadTx();
  }, []);

  async function loadTx() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("transactions")
      .select(
        "id, amount, type, status, description, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setTx(data || []);
  }

  function formatAmount(t: Tx) {
    const sign = t.type === "CREDIT" ? "+" : "-";
    return `${sign}₦${Number(t.amount).toLocaleString()}`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recent Transactions</Text>

      {tx.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={28} color="#9CA3AF" />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      )}

      {tx.map((t) => {
        const isCredit = t.type === "CREDIT";
        const success = t.status === "SUCCESS";

        return (
          <View key={t.id} style={styles.card}>
            <View style={styles.left}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isCredit ? "#DCFCE7" : "#FEE2E2" },
                ]}
              >
                <Ionicons
                  name={isCredit ? "arrow-down" : "arrow-up"}
                  size={18}
                  color={isCredit ? "#16A34A" : "#DC2626"}
                />
              </View>
            </View>

            <View style={styles.middle}>
              <Text style={styles.title} numberOfLines={1}>
                {t.description}
              </Text>
              <Text style={styles.date}>{formatDate(t.created_at)}</Text>
            </View>

            <View style={styles.right}>
              <Text
                style={[
                  styles.amount,
                  { color: isCredit ? "#16A34A" : "#DC2626" },
                ]}
              >
                {formatAmount(t)}
              </Text>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: success ? "#DCFCE7" : "#FEE2E2",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: success ? "#16A34A" : "#DC2626" },
                  ]}
                >
                  {t.status}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },

  header: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },

  empty: {
    alignItems: "center",
    paddingVertical: 28,
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    elevation: 1,
  },

  left: {
    marginRight: 12,
  },

  iconWrap: {
    height: 36,
    width: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  middle: {
    flex: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  date: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  right: {
    alignItems: "flex-end",
  },

  amount: {
    fontSize: 14,
    fontWeight: "700",
  },

  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
