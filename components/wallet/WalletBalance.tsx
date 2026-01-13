import { useWallet } from "@/hooks/useWallet";
import { ActivityIndicator, Text, View } from "react-native";

export default function WalletBalance() {
  const { balance, loading } = useWallet();

  if (loading) return <ActivityIndicator />;

  return (
    <View style={{ paddingVertical: 12 }}>
      <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold" }}>
        ₦{balance?.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
      </Text>
      <Text style={{ color: "#aaa", marginTop: 4 }}>Available Balance</Text>
    </View>
  );
}

