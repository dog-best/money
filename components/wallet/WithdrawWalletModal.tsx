import { generateReference } from "@/services/utils";
import { supabase } from "@/supabase/client";
import { useState } from "react";
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function WithdrawWalletModal({ visible, onClose }: Props) {
  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    setError(null);

    if (!amount || !bankCode || !accountNumber) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "paystack-withdraw",
        {
          body: {
            amount: Number(amount),
            bank_code: bankCode,
            account_number: accountNumber,
            account_name: accountName,
            reference: generateReference("WD"),
          },
        }
      );

      if (error || !data?.success) {
        throw new Error(data?.message || "Withdrawal failed");
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white p-5 rounded-t-2xl">
          <Text className="text-lg font-semibold mb-4">
            Withdraw to Bank
          </Text>

          {error && (
            <Text className="text-red-500 mb-2">{error}</Text>
          )}

          <TextInput
            placeholder="Amount (NGN)"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            className="border p-3 rounded mb-3"
          />

          <TextInput
            placeholder="Bank Code (e.g. 058)"
            value={bankCode}
            onChangeText={setBankCode}
            className="border p-3 rounded mb-3"
          />

          <TextInput
            placeholder="Account Number"
            keyboardType="numeric"
            value={accountNumber}
            onChangeText={setAccountNumber}
            className="border p-3 rounded mb-3"
          />

          <TextInput
            placeholder="Account Name (optional)"
            value={accountName}
            onChangeText={setAccountName}
            className="border p-3 rounded mb-4"
          />

          <TouchableOpacity
            onPress={handleWithdraw}
            disabled={loading}
            className="bg-primary py-4 rounded items-center"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">
                Withdraw
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="mt-4 items-center"
          >
            <Text className="text-gray-500">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
