import { useMakePurchase } from "@/hooks/useMakePurchase";
import { useProviders } from "@/hooks/useProviders";
import { useServiceProducts } from "@/hooks/useServiceProducts";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import BundleList from "./BundleList";
import ConfirmModal from "./ConfirmModal";
import ProviderSelect from "./ProviderSelect";

export default function DataScreen() {
  const { providers } = useProviders();
  const [provider, setProvider] = useState("");

  const { products, loading: productsLoading } = useServiceProducts("data", provider);
  const { buyData, loading } = useMakePurchase();

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [phone, setPhone] = useState("");

  const submit = async () => {
    setConfirmVisible(false);
    const payload = {
      provider,
      phone,
      product_code: selectedPlan.product_code,
      amount: Number(selectedPlan.final_price),
    };
    await buyData(payload);
  };

  return (
    <View className="flex-1 p-4 gap-4 bg-white">
      <Text className="text-xl font-semibold">Buy Data</Text>

      <ProviderSelect providers={providers} value={provider} onChange={setProvider} />

      {productsLoading ? (
        <ActivityIndicator />
      ) : (
        <BundleList products={products} onSelect={setSelectedPlan} />
      )}

      {selectedPlan && (
        <TouchableOpacity
          onPress={() => setConfirmVisible(true)}
          className="bg-blue-600 rounded-lg p-4"
        >
          <Text className="text-white text-center font-medium">
            Buy {selectedPlan.name}
          </Text>
        </TouchableOpacity>
      )}

      <ConfirmModal
        visible={confirmVisible}
        product={selectedPlan}
        phone={phone}
        setPhone={setPhone}
        onClose={() => setConfirmVisible(false)}
        onConfirm={submit}
        loading={loading}
      />
    </View>
  );
}
