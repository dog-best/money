// app/(tabs)/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getUserData } from "../../services/user";
import { supabase } from "../../supabase/client";



export default function Profile() {
  return <ProfileScreen />;
}

function ProfileScreen() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);


  /* ---------- Fade ---------- */
  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  /* ---------- Auth ---------- */
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUid(data?.user?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------- Load data ---------- */
  useEffect(() => {
    if (!uid) return;

    let active = true;

    (async () => {
      try {
        setLoading(true);
        const res = await getUserData(uid);
        if (active) setData(res);
      } catch (e) {
        console.error("Profile load error:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [uid]);

  /* ---------- Logout ---------- */
  const handleLogout = useCallback(() => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }, []);

  if (!uid || loading || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centerText}>Loading profile…</Text>
      </View>
    );
  }

  /* ---------- Safe mapping ---------- */
  const profile = data.profile ?? {};
  const mining = data.mining ?? {};
  const daily = data.dailyClaim ?? {};
  const boost = data.boost ?? {};
  const watch = data.watchEarn ?? {};
  const referrals = data.referrals ?? {};

  const totalBalance = mining.balance ?? 0;

  /* ---------- Copy referral ---------- */
  const copyCode = async () => {
    if (!profile.referral_code) return;
    await Clipboard.setStringAsync(profile.referral_code);
    Alert.alert("Copied", "Referral code copied.");
  };

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={44} color="#A78BFA" />
          </View>
          <Text style={styles.username}>
            {profile.username || "Unnamed User"}
          </Text>
        </View>

        {/* TOTAL BALANCE */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total VAD Balance</Text>
          <Text style={styles.totalValue}>
            {totalBalance.toFixed(4)} VAD
          </Text>
          <Text style={styles.totalHint}>
            Includes mining, daily, boost & watch rewards
          </Text>
        </View>

        {/* STATS */}
        <Text style={styles.sectionTitle}>Earning Activity</Text>

        <View style={styles.grid}>
          <Stat icon="hardware-chip" label="Mining Earned" value={mining.balance ?? 0} />
          <Stat icon="calendar" label="Daily Earned" value={daily.total_earned ?? 0} />
          <Stat icon="flash" label="Boost Earned" value={boost.balance ?? 0} />
          <Stat icon="play-circle" label="Watch Earned" value={watch.total_earned ?? 0} />
        </View>

        {/* Referral */}
        <Section title="Referral Code" icon="gift">
          <View style={styles.row}>
            <Text style={styles.refCode}>{profile.referral_code}</Text>
            <Pressable onPress={copyCode} style={styles.copyBtn}>
              <Ionicons name="copy" size={16} color="#000" />
            </Pressable>
          </View>
        </Section>

       <Section title="Referrals" icon="people">
  <InfoRow label="Referred By" value={profile.referred_by ?? "—"} />
  <InfoRow
    label="Total Referrals"
    value={`${referrals.total_referred ?? 0} users`}
  />

  <Pressable
    style={styles.leaderboardBtn}
    onPress={() => setShowLeaderboard(true)}
  >
    <Ionicons name="trophy" size={16} color="#000" />
    <Text style={styles.leaderboardText}>View Leaderboard</Text>
  </Pressable>
</Section>


        <Section title="Referrals" icon="people">
          <InfoRow label="Referred By" value={profile.referred_by ?? "—"} />
          <InfoRow
            label="Total Referrals"
            value={`${referrals.total_referred ?? 0} users`}
          />
        </Section>

        {/* Logout */}
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>


      </ScrollView>
    </Animated.View>

    
  );
}

/* ---------- UI helpers ---------- */

function Stat({ icon, label, value }: any) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color="#A78BFA" />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value.toFixed(4)}</Text>
    </View>
  );
}

function Section({ title, icon, children }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={16} color="#9FA8C7" />
        <Text style={styles.sectionHeaderText}>{title}</Text>

        
      </View>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: any) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050814" },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerText: { color: "#fff" },

  header: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(167,139,250,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A78BFA",
  },
  username: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
  },

  totalCard: {
    backgroundColor: "#0B1020",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#22C55E66",
    marginBottom: 22,
  },
  totalLabel: { color: "#9FA8C7", fontSize: 13 },
  totalValue: {
    color: "#22C55E",
    fontSize: 30,
    fontWeight: "900",
    marginVertical: 6,
  },
  totalHint: { color: "#64748B", fontSize: 11 },

  sectionTitle: {
    color: "#9FA8C7",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#0B1020",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  statLabel: { color: "#9FA8C7", fontSize: 12, marginTop: 6 },
  statValue: { color: "#fff", fontSize: 14, fontWeight: "800" },

  section: {
    backgroundColor: "#0B1020",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 16,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionHeaderText: {
    color: "#9FA8C7",
    fontSize: 13,
    fontWeight: "700",
  },

  row: { flexDirection: "row", justifyContent: "space-between" },
  refCode: { color: "#fff", fontWeight: "900", fontSize: 15 },
  copyBtn: {
    backgroundColor: "#FACC15",
    padding: 8,
    borderRadius: 10,
  },

  infoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  infoLabel: { color: "#9FA8C7", fontSize: 12 },
  infoValue: { color: "#fff", fontWeight: "700" },

  logoutBtn: {
    marginTop: 10,
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { color: "#fff", fontWeight: "900" },

  leaderboardBtn: {
  marginTop: 10,
  backgroundColor: "#FACC15",
  paddingVertical: 10,
  borderRadius: 14,
  flexDirection: "row",
  justifyContent: "center",
  gap: 6,
},
leaderboardText: {
  fontWeight: "900",
  color: "#000",
},

});
