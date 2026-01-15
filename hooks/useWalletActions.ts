import { generateReference } from "@/services/utils";
import { supabase } from "@/supabase/client";

export function useWalletActions() {
  // 1️⃣ Fund wallet (Paystack Init)
  const fundWallet = async (amount: number) => {
    const reference = generateReference("FUND");

    const { data, error } = await supabase.functions.invoke(
      "paystack-init",
      {
        body: { amount, reference },
      }
    );

    if (error) throw new Error(error.message);

    return data; // authorization_url
  };

  // 2️⃣ Send money (internal transfer)
  const sendMoney = async (receiverId: string, amount: number) => {
    const reference = generateReference("TRANSFER");

    const { error } = await supabase.functions.invoke(
      "wallet-transfer",
      {
        body: { receiver_id: receiverId, amount, reference },
      }
    );

    if (error) throw new Error(error.message);

    return true;
  };

  // 3️⃣ Withdraw to bank
  const withdraw = async (
    amount: number,
    bank_code: string,
    account_number: string
  ) => {
    const reference = generateReference("WITHDRAW");

    const { error } = await supabase.functions.invoke(
      "paystack-withdraw",
      {
        body: {
          amount,
          bank_code,
          account_number,
          reference,
        },
      }
    );

    if (error) throw new Error(error.message);

    return true;
  };

  return {
    fundWallet,
    sendMoney,
    withdraw,
  };
}
