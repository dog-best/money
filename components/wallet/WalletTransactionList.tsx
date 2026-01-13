import { useWallet } from "@/hooks/useWallet";
import { FlatList, Text, View } from "react-native";

export default function WalletTransactionList() {
  const { transactions } = useWallet();

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: "#fff" }}>
            {item.type === "CREDIT" ? "➕" : "➖"} {item.description}
          </Text>
          <Text style={{ color: item.type === "CREDIT" ? "#4ade80" : "#f87171" }}>
            ₦{Number(item.amount).toLocaleString()}
          </Text>
        </View>
      )}
    />
  );
}
