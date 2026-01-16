import { generateReference } from "@/services/utils";
import { supabase } from "@/supabase/client";

export function useWalletActions() {
  // ✅ Fund wallet (DVA)
  const getFundingAccount = async () => {
    const { data, error } = await supabase.functions.invoke("paystack-dva", {
      body: {},
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.message ?? "Failed to load account");
    return data.account;
  };

  // ✅ Send money + Withdraw remain (we will refactor them next)
  const sendMoney = async (receiverId: string, amount: number) => {
    const reference = generateReference("TRANSFER");

    const { error } = await supabase.functions.invoke("wallet-transfer", {
      body: { receiver_id: receiverId, amount, reference },
    });

    if (error) throw new Error(error.message);
    return true;
  };

  const withdraw = async (amount: number, bank_code: string, account_number: string) => {
    const reference = generateReference("WITHDRAW");

    const { error } = await supabase.functions.invoke("paystack-withdraw", {
      body: { amount, bank_code, account_number, reference },
    });

    if (error) throw new Error(error.message);
    return true;
  };

  return { getFundingAccount, sendMoney, withdraw };
}

