import React from "react";
import {
    ActivityIndicator,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
  visible: boolean;
  title?: string;

  // What we are showing
  lines: Array<{ label: string; value: string }>;

  // Optional phone input (for Data screen use-case)
  phone?: string;
  onPhoneChange?: (v: string) => void;

  loading?: boolean;

  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
};

export default function ConfirmPurchaseModal({
  visible,
  title = "Confirm Purchase",
  lines,
  phone,
  onPhoneChange,
  loading = false,
  onClose,
  onConfirm,
  confirmText = "Pay",
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-center p-6">
        <View className="bg-white rounded-xl p-6">
          <Text className="text-lg font-semibold mb-3">{title}</Text>

          {lines.map((l, idx) => (
            <View key={idx} className="mb-1">
              <Text>
                {l.label}: {l.value}
              </Text>
            </View>
          ))}

          {typeof phone === "string" && onPhoneChange && (
            <TextInput
              placeholder="Phone Number"
              value={phone}
              onChangeText={onPhoneChange}
              keyboardType="number-pad"
              className="border p-3 rounded-lg mt-4"
            />
          )}

          <View className="flex-row justify-between mt-6">
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              className="px-4 py-3 border rounded-lg"
            >
              <Text>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className="px-4 py-3 bg-blue-600 rounded-lg"
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Text className="text-white">{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
