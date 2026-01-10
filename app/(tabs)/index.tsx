import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiText } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AdBanner from "../../components/AdBanner";
import News from "../../components/News";
import PrivacyPolicyModal from "../../components/PrivacyPolicyModal";
import { usePrivacyPolicy } from "../../hooks/usePrivacyPolicy";

/* ============================================================
   CONSTANTS
=============================================================== */

const HEADER_MAX = 140;
const HEADER_MIN = 84;

/* ============================================================
   MINI ACTION
=============================================================== */

const MiniAction = ({ icon, label }: any) => (
  <Pressable style={styles.miniBtn}>
    <MaterialIcons name={icon} size={22} color="#8B5CF6" />
    <Text style={styles.miniLabel}>{label}</Text>
  </Pressable>
);

/* ============================================================
   MAIN PAGE
=============================================================== */

export default function Page() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [refreshing, setRefreshing] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);

  const { loading: policyLoading, required, accept, reject } =
    usePrivacyPolicy();

  if (policyLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_MAX - HEADER_MIN],
    outputRange: [HEADER_MAX, HEADER_MIN],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Animated.View
        style={[
          styles.fixedHeader,
          { height: headerHeight, paddingTop: insets.top + 12 },
        ]}
      >
        <LinearGradient
          colors={["#24164a", "#0b0614"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.headerRow}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
          />

          <View>
            <Text style={styles.headerTitle}>VAD DEPOT</Text>
            <Text style={styles.headerTagline}>
              Wallet • Crypto • Utilities
            </Text>
            <Text style={styles.headerIntro}>
              Secure payments & digital assets
            </Text>
          </View>

          <Ionicons name="notifications" size={22} color="#fff" />
        </View>
      </Animated.View>

      {/* CONTENT */}
      <Animated.ScrollView
        contentContainerStyle={{
          paddingTop: HEADER_MAX - 12,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(false)}
            tintColor="#8B5CF6"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* BALANCE */}
        <View style={styles.balanceWrap}>
          <Text style={styles.label}>Total Balance</Text>
          <MotiText
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 300 }}
            style={styles.balance}
          >
            ₦12,450.00
          </MotiText>
          <Text style={styles.cryptoHint}>≈ 0.0021 BTC</Text>
        </View>

        {/* PRIMARY ACTIONS */}
        <View style={styles.primaryActions}>
          <Pressable style={styles.primaryBtn}>
            <Ionicons name="add" size={28} color="#fff" />
            <Text style={styles.primaryText}>Fund</Text>
          </Pressable>

          <Pressable style={styles.primaryBtn}>
            <Ionicons name="send" size={26} color="#fff" />
            <Text style={styles.primaryText}>Send</Text>
          </Pressable>

          <Pressable style={styles.primaryBtn}>
            <Ionicons name="wallet" size={26} color="#fff" />
            <Text style={styles.primaryText}>Withdraw</Text>
          </Pressable>
        </View>

        {/* UTILITIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilities</Text>
          <View style={styles.utilityRow}>
            <MiniAction icon="phone-android" label="Airtime" />
            <MiniAction icon="wifi" label="Data" />
            <MiniAction icon="bolt" label="Electricity" />
            <MiniAction icon="sports-esports" label="Betting" />
          </View>
        </View>

        {/* REWARDS */}
        <View style={styles.sectionCard}>
          <Ionicons name="gift" size={28} color="#8B5CF6" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.sectionTitle}>Rewards</Text>
            <Text style={styles.sectionDesc}>
              Complete tasks & watch ads to earn bonuses
            </Text>
          </View>
        </View>

        {/* NEWS */}
        <Pressable
          style={styles.newsPreview}
          onPress={() => setNewsOpen(true)}
        >
          <View style={styles.newsRow}>
            <Ionicons name="newspaper" size={22} color="#8B5CF6" />
            <Text style={styles.newsPreviewTitle}>Updates</Text>
          </View>
          <Text style={styles.newsPreviewText}>
            Platform announcements, crypto tips & offers
          </Text>
        </Pressable>

        {/* AD */}
        <View style={styles.newsAdWrap}>
          <AdBanner />
        </View>
      </Animated.ScrollView>

      {newsOpen && <News visible onClose={() => setNewsOpen(false)} />}

      <PrivacyPolicyModal
        visible={required}
        onAccept={accept}
        onReject={reject}
      />
    </View>
  );
}

/* ============================================================
   STYLES
=============================================================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060B1A" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  fixedHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 18,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: { width: 44, height: 44, borderRadius: 12 },

  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  headerTagline: { color: "#8B5CF6", fontSize: 12, fontWeight: "900" },
  headerIntro: { color: "#9FA8C7", fontSize: 11 },

  balanceWrap: { paddingHorizontal: 22, paddingTop: 20 },
  label: { color: "#9FA8C7" },
  balance: { fontSize: 40, color: "#fff", fontWeight: "900" },
  cryptoHint: { color: "#8B5CF6", fontSize: 13 },

  primaryActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 22,
    marginTop: 18,
  },
  primaryBtn: {
    flex: 1,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontWeight: "900", marginTop: 4 },

  section: { marginTop: 24, paddingHorizontal: 22 },
  sectionTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },

  utilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  miniBtn: {
    alignItems: "center",
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    width: "23%",
  },
  miniLabel: { color: "#9FA8C7", fontSize: 11, marginTop: 4 },

  sectionCard: {
    flexDirection: "row",
    alignItems: "center",
    margin: 22,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  sectionDesc: { color: "#9FA8C7", fontSize: 12 },

  newsPreview: {
    marginHorizontal: 22,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  newsRow: { flexDirection: "row", alignItems: "center" },
  newsPreviewTitle: { color: "#fff", fontWeight: "900", marginLeft: 8 },
  newsPreviewText: { color: "#9FA8C7", fontSize: 12, marginTop: 6 },

  newsAdWrap: {
    marginHorizontal: 22,
    height: 60,
    marginTop: 14,
    borderRadius: 16,
    overflow: "hidden",
  },
});
/* ============================================================
   END OF FILE
=============================================================== */