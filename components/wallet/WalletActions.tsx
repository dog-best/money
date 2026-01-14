import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import FundWalletModal from "./FundWalletModal";
import WithdrawWalletModal from "./WithdrawWalletModal";

export default function WalletActions() {
  const [fundVisible, setFundVisible] = useState(false);
  const [withdrawVisible, setWithdrawVisible] = useState(false);

  return (
    <View className="flex-row justify-between mt-4">
      <TouchableOpacity
        className="bg-green-600 flex-1 mr-2 py-3 rounded items-center"
        onPress={() => setFundVisible(true)}
      >
        <Text className="text-white font-medium">Deposit</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-blue-600 flex-1 ml-2 py-3 rounded items-center"
        onPress={() => setWithdrawVisible(true)}
      >
        <Text className="text-white font-medium">Withdraw</Text>
      </TouchableOpacity>

      <FundWalletModal
        visible={fundVisible}
        onClose={() => setFundVisible(false)}
      />

      <WithdrawWalletModal
        visible={withdrawVisible}
        onClose={() => setWithdrawVisible(false)}
      />
    </View>
  );
}
