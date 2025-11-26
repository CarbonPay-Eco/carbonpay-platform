import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { SolanaClient } from "../lib/solana-client";

export const useSolanaClient = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const client = useMemo(() => {
    if (!wallet.connected || !wallet.publicKey) {
      return null;
    }

    try {
      return new SolanaClient(connection, wallet);
    } catch (error) {
      console.error("Failed to create Solana client:", error);
      return null;
    }
  }, [connection, wallet.connected, wallet.publicKey]);

  return {
    client,
    isConnected: wallet.connected,
    publicKey: wallet.publicKey,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    connecting: wallet.connecting,
  };
};
