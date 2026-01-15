import React from "react";
import {
    ActivityIndicator,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type DataProduct = {
  id: string;
  name: string;
  final_price: number;
  provider: string;
};

type ConfirmModalProps = {
  visible: boolean;
  product: DataProduct | null;
  phone: string;
  setPhone: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
};

export default function ConfirmModal({
  visible,
  product,
  phone,
  setPhone,
  onClose,
  onConfirm,
  loading,
}: ConfirmModalProps) {
  if (!product) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-center p-6">
        <View className="bg-white rounded-xl p-6">
          <Text className="text-lg font-semibold mb-3">Confirm Purchase</Text>
          <Text>Plan: {product.name}</Text>
          <Text>Price: ₦{product.final_price}</Text>

          <TextInput
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="number-pad"
            className="border p-3 rounded-lg mt-4"
          />

          <View className="flex-row justify-between mt-6">
            <TouchableOpacity onPress={onClose} className="px-4 py-3 border rounded-lg">
              <Text>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className="px-4 py-3 bg-blue-600 rounded-lg"
            >
              {loading ? <ActivityIndicator /> : <Text className="text-white">Pay</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
