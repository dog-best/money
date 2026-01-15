import { useWalletActions } from "@/hooks/useWalletActions";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function SendMoneyModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { sendMoney } = useWalletActions();

  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!receiverId || !amount) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    const numericAmount = Number(amount);

    if (numericAmount <= 0) {
      Alert.alert("Error", "Invalid amount");
      return;
    }

    try {
      setLoading(true);
      await sendMoney(receiverId.trim(), numericAmount);
      Alert.alert("Success", "Transfer successful");
      onClose();
      setReceiverId("");
      setAmount("");
    } catch (err: any) {
      Alert.alert("Transfer failed", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-black rounded-t-2xl p-5">
          <Text className="text-white text-lg font-semibold mb-4">
            Send Money
          </Text>

          <Text className="text-gray-400 text-sm mb-1">Receiver User ID</Text>
          <TextInput
            value={receiverId}
            onChangeText={setReceiverId}
            placeholder="Paste user ID"
            placeholderTextColor="#666"
            className="bg-gray-900 text-white rounded-lg p-3 mb-4"
          />

          <Text className="text-gray-400 text-sm mb-1">Amount (NGN)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#666"
            className="bg-gray-900 text-white rounded-lg p-3 mb-6"
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={loading}
            className="bg-green-600 rounded-xl py-4"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center font-semibold">
                Send Money
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} className="mt-4">
            <Text className="text-gray-400 text-center">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
