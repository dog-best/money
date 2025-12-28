//components/ClaimSuccessModal.tsx
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ClaimSuccessModal({
  visible,
  amount,
  total,
  onClose,
}: {
  visible: boolean;
  amount: number;
  total: number;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
          <Text style={styles.title}>Rewards Claimed</Text>

          <Text style={styles.amount}>
            +{amount.toFixed(4)} VAD deposited
          </Text>

          <Text style={styles.total}>
            Total Balance: {total.toFixed(4)} VAD
          </Text>

          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Continue Mining</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "80%",
    backgroundColor: "#0B0614",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
  },
  amount: {
    color: "#22C55E",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
  },
  total: {
    color: "#9FA8C7",
    marginTop: 6,
  },
  btn: {
    marginTop: 18,
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
  },
});
