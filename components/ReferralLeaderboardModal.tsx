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
  const [searchResult, setSearchResult] =
    useState<LeaderboardRow | null>(null);
  const [searchRank, setSearchRank] =
    useState<number | string>("—");

  useEffect(() => {
    if (!visible) return;

    (async () => {
      try {
        setLoading(true);

        /** TOP USERS — ONLY referral_count > 0 */
        const { data: top } = await supabase
          .from("referral_leaderboard")
          .select("*")
          .gt("referral_count", 0)
          .order("referral_count", { ascending: false })
          .limit(50);

        /** CURRENT USER STATS */
        const { data: me } = await supabase
          .from("referral_leaderboard")
          .select("referral_count")
          .eq("user_id", userId)
          .single();

        /** CURRENT USER RANK */
        const { data: rank } = await supabase.rpc(
          "get_referral_rank",
          { uid: userId }
        );

        setLeaderboard(top ?? []);
        setUserReferrals(me?.referral_count ?? 0);
        setUserRank(rank ?? "—");
      } catch (e) {
        console.error("Leaderboard error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, userId]);

  /** SEARCH USER (EVEN IF 0 REFERRALS) */
  useEffect(() => {
    if (!search.trim()) {
      setSearchResult(null);
      setSearchRank("—");
      return;
    }

    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("referral_leaderboard")
        .select("*")
        .ilike("username", `%${search}%`)
        .limit(1)
        .maybeSingle();

      if (data) {
        const { data: rank } = await supabase.rpc(
          "get_referral_rank",
          { uid: data.user_id }
        );

        setSearchResult(data);
        setSearchRank(rank ?? "—");
      } else {
        setSearchResult(null);
        setSearchRank("—");
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  /** TOTAL REFERRALS (VISIBLE USERS ONLY) */
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
            <Stat label="Your Rank" value={`#${userRank}`} />
            <Stat label="Your Referrals" value={userReferrals} />
            <Stat label="Total Referrals" value={totalReferrals} />
          </View>

          {/* SEARCH */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#9FA8C7" />
            <TextInput
              placeholder="Search any username"
              placeholderTextColor="#64748B"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>

          {/* SEARCH RESULT */}
          {searchResult && (
            <View style={styles.searchResult}>
              <Text style={styles.searchName}>
                {searchResult.username}
              </Text>
              <Text style={styles.searchMeta}>
                Rank #{searchRank} •{" "}
                {searchResult.referral_count} referrals
              </Text>
            </View>
          )}

          {/* LEADERBOARD */}
          {loading ? (
            <ActivityIndicator color="#A78BFA" />
          ) : (
            <ScrollView>
              {leaderboard.map((u, i) => (
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
                      u.user_id === userId && styles.activeUser,
                    ]}
                    numberOfLines={1}
                  >
                    {u.username}
                  </Text>
                  <Text style={styles.count}>
                    {u.referral_count}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ---------- SMALL COMPONENT ---------- */

const Stat = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <View style={styles.statBox}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

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
    maxHeight: "90%",
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
    color: "#A78BFA",
    fontSize: 16,
    fontWeight: "900",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B1020",
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    height: 42,
  },
  searchInput: {
    color: "#fff",
    marginLeft: 8,
    flex: 1,
  },

  searchResult: {
    backgroundColor: "#0B1020",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  searchName: {
    color: "#fff",
    fontWeight: "800",
  },
  searchMeta: {
    color: "#9FA8C7",
    fontSize: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  activeRow: {
    backgroundColor: "#020617",
  },
  rank: {
    color: "#A78BFA",
    fontWeight: "900",
    width: 28,
  },
  username: {
    color: "#fff",
    fontWeight: "700",
    flex: 1,
    marginHorizontal: 6,
  },
  activeUser: {
    color: "#A78BFA",
  },
  count: {
    color: "#9FA8C7",
    fontWeight: "700",
  },
});
