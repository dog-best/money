import WalletActions from "../wallet/WalletActions";
import WalletBalance from "../wallet/WalletBalance";

export default function WalletOverview() {
  return (
    <div className="mt-4">
      <WalletBalance />
      <WalletActions />
    </div>
  );
}
