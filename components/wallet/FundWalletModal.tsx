import { Modal, Text, View } from "react-native";

export default function FundWalletModal({ visible, onClose }: any) {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: "#000", padding: 20 }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
          Fund Wallet
        </Text>
      </View>
    </Modal>
  );
}
