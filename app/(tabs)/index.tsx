import WalletActions from "../../components/wallet/WalletActions";
import WalletBalance from "../../components/wallet/WalletBalance";

export default function WalletOverview() {
  return (
    <div className="mt-4">
      <WalletBalance />
      <WalletActions />
    </div>
  );
}

