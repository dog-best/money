import { generateReference } from "@/services/utils";
import { supabase } from "@/supabase/client";
import { useState } from "react";
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
  onClose: () => void;
};

const NETWORKS = [
  { label: "MTN", value: "mtn" },
  { label: "Airtel", value: "airtel" },
  { label: "Glo", value: "glo" },
  { label: "9mobile", value: "9mobile" },
];

export default function AirtimeModal({ visible, onClose }: Props) {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("mtn");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setError(null);

    if (!phone || !amount) {
      setError("Phone number and amount are required");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "paystack-airtime",
        {
          body: {
            phone,
            amount: Number(amount),
            provider,
            reference: generateReference("AIR"),
          },
        }
      );

      if (error || !data?.success) {
        throw new Error("Airtime purchase failed");
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white p-5 rounded-t-2xl">
          <Text className="text-lg font-semibold mb-4">
            Buy Airtime
          </Text>

          {error && (
            <Text className="text-red-500 mb-2">{error}</Text>
          )}

          <TextInput
            placeholder="Phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            className="border p-3 rounded mb-3"
          />

          <TextInput
            placeholder="Amount (NGN)"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            className="border p-3 rounded mb-3"
          />

          {/* NETWORK SELECT */}
          <View className="flex-row justify-between mb-4">
            {NETWORKS.map((n) => (
              <TouchableOpacity
                key={n.value}
                onPress={() => setProvider(n.value)}
                className={`px-3 py-2 rounded border ${
                  provider === n.value
                    ? "bg-primary border-primary"
                    : "border-gray-300"
                }`}
              >
                <Text
                  className={
                    provider === n.value
                      ? "text-white"
                      : "text-gray-700"
                  }
                >
                  {n.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handlePurchase}
            disabled={loading}
            className="bg-primary py-4 rounded items-center"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">
                Buy Airtime
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="mt-4 items-center"
          >
            <Text className="text-gray-500">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
