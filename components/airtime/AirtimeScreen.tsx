//components/airtime/AirtimeScreen.tsx
import ConfirmPurchaseModal from "@/components/common/ConfirmPurchaseModal";
import { useMakePurchase } from "@/hooks/Purchase/useMakePurchase";
import { useProviders } from "@/hooks/Purchase/useProviders";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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

    const payload = {
      provider,
      phone,
      amount: Number(amount),
      reference: `AIRTIME-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    };

    try {
      await buyAirtime(payload);
      Alert.alert("Success", "Airtime purchase successful");
      setAmount("");
      // optional:
      // setPhone("");
      // setProvider("");
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? "Airtime purchase failed");
    }
  };

  return (
    <View className="flex-1 p-4 gap-4 bg-white">
      <Text className="text-xl font-semibold">Buy Airtime</Text>

      <ProviderSelect
        providers={providers}
        value={provider}
        onChange={setProvider}
      />

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
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-white text-center font-medium">Continue</Text>
        )}
      </TouchableOpacity>

      <ConfirmPurchaseModal
        visible={confirmVisible}
        lines={[
          { label: "Provider", value: provider?.toUpperCase() },
          { label: "Phone", value: phone },
          { label: "Amount", value: `₦${Number(amount).toLocaleString()}` },
        ]}
        loading={loading}
        onClose={() => setConfirmVisible(false)}
        onConfirm={submit}
      />
    </View>
  );
}

