import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useState } from "react";

export default function FundWalletModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const numericAmount = Number(amount.replace(/,/g, ""));

  const isValid = numericAmount >= 100;

  function formatAmount(value: string) {
    const clean = value.replace(/[^0-9]/g, "");
    return Number(clean || 0).toLocaleString();
  }

  async function handleFund() {
    if (!isValid || loading) return;

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // 1️⃣ Initialize Paystack here (frontend)

      // 2️⃣ After success → verify on backend
      await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/paystack-verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            reference: "PAYSTACK_REF",
            amount: numericAmount,
            user_id: "USER_ID",
          }),
        }
      );

      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>Fund Wallet</Text>
          <Text style={styles.subtitle}>
            Enter amount you want to add
          </Text>

          <View style={styles.amountBox}>
            <Text style={styles.currency}>₦</Text>
            <TextInput
              value={amount}
              onChangeText={(v) => setAmount(formatAmount(v))}
              placeholder="0"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
              style={styles.amountInput}
            />
          </View>

          {!isValid && amount !== "" && (
            <Text style={styles.error}>Minimum amount is ₦100</Text>
          )}

          <Pressable
            style={[
              styles.button,
              (!isValid || loading) && { opacity: 0.5 },
            ]}
            onPress={handleFund}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </Pressable>

          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },

  card: {
    backgroundColor: "#0B0B0F",
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#2A2A35",
    marginBottom: 16,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  subtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },

  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14141B",
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 8,
  },

  currency: {
    color: "#9CA3AF",
    fontSize: 20,
    marginRight: 6,
  },

  amountInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 22,
    paddingVertical: 14,
  },

  error: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#6D28D9",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  cancel: {
    alignItems: "center",
    marginTop: 14,
  },

  cancelText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
});
