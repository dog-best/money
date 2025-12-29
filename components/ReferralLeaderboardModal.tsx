import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../supabase/client";

type LeaderboardRow = {
  user_id: string;
  username: string;
  referral_count: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  userId: string;
};

export default function ReferralLeaderboardModal({
  visible,
  onClose,
  userId,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [userRank, setUserRank] = useState<number | string>("—");
  const [userReferrals, setUserReferrals] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!visible) return;

    (async () => {
      try {
        setLoading(true);

        /** TOP 50 for search usability */
        const { data: top } = await supabase
          .from("referral_leaderboard")
          .select("*")
          .order("referral_count", { ascending: false })
          .limit(50);

        /** RANK CALCULATION */
        const { data: all } = await supabase
          .from("referral_leaderboard")
          .select("user_id")
          .order("referral_count", { ascending: false });

        const rankIndex =
          all?.findIndex((u) => u.user_id === userId) ?? -1;

        /** USER TOTAL REFERRALS */
        const me = top?.find((u) => u.user_id === userId);

        setLeaderboard(top ?? []);
        setUserRank(rankIndex >= 0 ? rankIndex + 1 : "—");
        setUserReferrals(me?.referral_count ?? 0);
      } catch (e) {
        console.error("Leaderboard error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, userId]);

  /** SEARCH FILTER */
  const filteredLeaderboard = useMemo(() => {
    if (!search.trim()) return leaderboard;

    return leaderboard.filter((u) =>
      u.username?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, leaderboard]);

  /** GLOBAL TOTAL */
  const totalReferrals = useMemo(
    () =>
      leaderboard.reduce(
        (sum, u) => sum + (u.referral_count || 0),
        0
      ),
    [leaderboard]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Referral Leaderboard</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          </View>

          {/* USER STATS */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Your Rank</Text>
              <Text style={styles.statValue}>#{userRank}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Your Referrals</Text>
              <Text style={styles.statValue}>{userReferrals}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Referrals</Text>
              <Text style={styles.statValue}>{totalReferrals}</Text>
            </View>
          </View>

          {/* SEARCH */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#9FA8C7" />
            <TextInput
              placeholder="Search by username"
              placeholderTextColor="#64748B"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>

          {/* LIST */}
          {loading ? (
            <ActivityIndicator color="#A78BFA" />
          ) : (
            <ScrollView>
              {filteredLeaderboard.length === 0 ? (
                <Text style={styles.emptyText}>No user found</Text>
              ) : (
                filteredLeaderboard.map((u, i) => (
                  <View
                    key={u.user_id}
                    style={[
                      styles.row,
                      u.user_id === userId && styles.activeRow,
                    ]}
                  >
                    <Text style={styles.rank}>{i + 1}</Text>
                    <Text
                      style={[
                        styles.username,
                        u.user_id === userId && { color: "#22C55E" },
                      ]}
                      numberOfLines={1}
                    >
                      {u.username}
                    </Text>
                    <Text style={styles.count}>
                      {u.referral_count}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#050814",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "900" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statBox: {
    backgroundColor: "#0B1020",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  statLabel: { color: "#9FA8C7", fontSize: 11 },
  statValue: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "900",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B1020",
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
    height: 42,
  },
  searchInput: {
    color: "#fff",
    marginLeft: 8,
    flex: 1,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  activeRow: {
    backgroundColor: "#020617",
  },
  rank: { color: "#FACC15", fontWeight: "900", width: 24 },
  username: {
    color: "#fff",
    fontWeight: "700",
    flex: 1,
    marginHorizontal: 6,
  },
  count: { color: "#9FA8C7" },

  emptyText: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 20,
  },
});
