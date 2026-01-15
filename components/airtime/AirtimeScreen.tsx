import { useMakePurchase } from "@/hooks/useMakePurchase";
import { useProviders } from "@/hooks/useProviders";
import React, { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import ConfirmModal from "./ConfirmModal";
import ProviderSelect from "./ProviderSelect";

export default function AirtimeScreen() {
  const { providers } = useProviders();
  const { buyAirtime, loading } = useMakePurchase();

  const [provider, setProvider] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);

  const submit = async () => {
    setConfirmVisible(false);
    const payload = { provider, phone, amount: Number(amount) };
    await buyAirtime(payload);
  };

  return (
    <View className="flex-1 p-4 gap-4 bg-white">
      <Text className="text-xl font-semibold">Buy Airtime</Text>

      <ProviderSelect providers={providers} value={provider} onChange={setProvider} />

      <TextInput
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="number-pad"
        className="border p-3 rounded-lg"
      />

      <TextInput
        placeholder="Amount (₦)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="number-pad"
        className="border p-3 rounded-lg"
      />

      <TouchableOpacity
        disabled={!provider || !phone || !amount || loading}
        onPress={() => setConfirmVisible(true)}
        className="bg-blue-600 rounded-lg p-4"
      >
        {loading ? <ActivityIndicator /> :
          <Text className="text-white text-center font-medium">Continue</Text>}
      </TouchableOpacity>
<ConfirmModal
  visible={confirmVisible}
  phone={phone}
  amount={Number(amount)}
  provider={provider}
  onClose={() => setConfirmVisible(false)}
  onConfirm={submit}
/>

    </View>
  );
}
