import React from "react";
import { ScrollView } from "react-native";
import WalletActions from "../../components/wallet/WalletActions";
import WalletBalance from "../../components/wallet/WalletBalance";
import WalletTransactionList from "../../components/wallet/WalletTransactionList";
// import FundWalletModal if you want to use it later

export default function Index() {
  return (
    <ScrollView
      style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}
      contentContainerStyle={{ gap: 20 }}
    >
      <WalletBalance />
      <WalletActions />
      <WalletTransactionList />
    </ScrollView>
  );
}
