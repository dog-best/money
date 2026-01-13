import { supabase } from "@/supabase/client";
import { useEffect, useState } from "react";

export function useWallet() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    setLoading(true);

    const {
      data: walletRows,
      error: walletErr,
    } = await supabase
      .from("wallets")
      .select("balance")
      .single();

    const {
      data: txRows,
      error: txErr,
    } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);

    if (!walletErr && walletRows) setBalance(walletRows.balance);
    if (!txErr && txRows) setTransactions(txRows);

    setLoading(false);
  };

  // Refresh on mount
  useEffect(() => {
    fetchWallet();
  }, []);

  return { balance, transactions, loading, refresh: fetchWallet };
}
