import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { SolanaClient } from "../lib/solana-client";

export const useSolanaClient = () => {
  try {
    const { connection } = useConnection();
    const wallet = useWallet();

    const client = useMemo(() => {
      if (!wallet.connected || !wallet.wallet) {
        return null;
      }

      return new SolanaClient(connection, wallet.wallet);
    }, [connection, wallet.connected, wallet.wallet]);

    return {
      client,
      isConnected: wallet.connected,
      publicKey: wallet.publicKey,
      connect: wallet.connect,
      disconnect: wallet.disconnect,
    };
  } catch (error) {
    // WalletProvider not available, return safe defaults
    return {
      client: null,
      isConnected: false,
      publicKey: null,
      connect: async () => {},
      disconnect: async () => {},
    };
  }
};
