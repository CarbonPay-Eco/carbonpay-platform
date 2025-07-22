"use client";

// Integração com carteiras desativada
// import { WalletError } from "@solana/wallet-adapter-base";
// import {
// 	AnchorWallet,
// 	ConnectionProvider,
// 	useConnection,
// 	useWallet,
// 	WalletProvider,
// } from "@solana/wallet-adapter-react";
// import {
// 	WalletModalProvider,
// 	WalletMultiButton,
// } from "@solana/wallet-adapter-react-ui";
// import { useCallback, useMemo, type ReactNode } from "react";
// import { useCluster } from "../cluster/cluster-data-access";
// import dynamic from "next/dynamic";
// import { AnchorProvider } from "@coral-xyz/anchor";

// export function WalletButton({ className }: { className?: string }) {
// 	return <></>;
// }

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  // Wallet integration disabled
  return <>{children}</>;
}

// export function useAnchorProvider() {
// 	return null;
// }
