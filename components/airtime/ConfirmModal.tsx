import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

type ConfirmModalProps = {
  visible: boolean;
  phone: string;
  provider: string;
  amount: number;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  visible,
  phone,
  provider,
  amount,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-center p-6">
        <View className="bg-white rounded-xl p-6">
          <Text className="text-lg font-semibold mb-3">Confirm Purchase</Text>
          <Text>Provider: {provider?.toUpperCase()}</Text>
          <Text>Phone: {phone}</Text>
          <Text>Amount: ₦{amount}</Text>

          <View className="flex-row justify-between mt-6">
            <TouchableOpacity onPress={onClose} className="px-4 py-3 border rounded-lg">
              <Text>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onConfirm} className="px-4 py-3 bg-blue-600 rounded-lg">
              <Text className="text-white">Pay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
