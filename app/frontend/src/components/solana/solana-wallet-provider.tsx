// Integração com carteiras desativada
// import React, { useMemo } from "react";
// import {
//     ConnectionProvider,
//     WalletProvider,
//   } from "@solana/wallet-adapter-react";
//   import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
//   import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
//   import { clusterApiUrl } from "@solana/web3.js";
//   import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
// import "@solana/wallet-adapter-react-ui/styles.css";

export default function AppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Wallet integration disabled
  return <>{children}</>;
}
