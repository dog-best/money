import { Pressable, Text, View } from "react-native";

export default function WalletActions({ onFundPress }: any) {
  return (
    <View style={{ flexDirection: "row", marginVertical: 16 }}>
      <Pressable
        onPress={onFundPress}
        style={{
          paddingVertical: 14,
          paddingHorizontal: 20,
          backgroundColor: "#5b3deb",
          borderRadius: 12,
          marginRight: 12,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Fund Wallet</Text>
      </Pressable>
    </View>
  );
}
