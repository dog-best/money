import { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { usePolicy } from "@/hooks/usePolicy";

export default function PrivacyPolicyModal({
  visible,
  onAccept,
  onReject,
}: {
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [atBottom, setAtBottom] = useState(false);
  const { policy, loading } = usePolicy("privacy_policy");

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logo}
          />

          <Text style={styles.title}>
            {policy?.title ?? "Privacy Policy"}
          </Text>

          {loading ? (
            <ActivityIndicator color="#8B5CF6" />
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={({ nativeEvent }) => {
                const isBottom =
                  nativeEvent.layoutMeasurement.height +
                    nativeEvent.contentOffset.y >=
                  nativeEvent.contentSize.height - 20;

                if (isBottom) setAtBottom(true);
              }}
            >
              <Text style={styles.text}>
                {policy?.content || "No policy content available."}
              </Text>
            </ScrollView>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.reject} onPress={onReject}>
              <Text style={styles.rejectText}>Decline</Text>
            </Pressable>

            <Pressable
              style={[styles.accept, !atBottom && { opacity: 0.4 }]}
              disabled={!atBottom}
              onPress={onAccept}
            >
              <Text style={styles.acceptText}>Agree & Continue</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}


/* ============================================================
   STYLES
=============================================================== */
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
    padding: 14,
  },

  card: {
    maxHeight: "82%",
    backgroundColor: "#060B1A",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.35)",
  },

  logo: {
    width: 56,
    height: 56,
    alignSelf: "center",
    marginBottom: 8,
    borderRadius: 14,
  },

  title: {
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },

  scroll: {
    flex: 1,              // 🔥 THIS IS THE FIX
    marginBottom: 14,
  },

  text: {
    color: "#9FA8C7",
    fontSize: 12.5,
    lineHeight: 18,
  },

  actions: {
    flexDirection: "row",
    gap: 12,
  },

  reject: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  accept: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#8B5CF6",
  },

  rejectText: {
    color: "#F87171",
    fontWeight: "800",
    textAlign: "center",
  },

  acceptText: {
    color: "#fff",
    fontWeight: "900",
    textAlign: "center",
  },
});

