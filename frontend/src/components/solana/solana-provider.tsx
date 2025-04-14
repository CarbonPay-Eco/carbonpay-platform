"use client";

import { WalletError } from "@solana/wallet-adapter-base";
import {
	AnchorWallet,
	ConnectionProvider,
	useConnection,
	useWallet,
	WalletProvider,
} from "@solana/wallet-adapter-react";
import {
	WalletModalProvider,
	WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { useCallback, useMemo, type ReactNode } from "react";
import { useCluster } from "../cluster/cluster-data-access";

// Only import wallets on the client side
import dynamic from "next/dynamic";
import { AnchorProvider } from "@coral-xyz/anchor";

// Dynamically import wallet adapters to prevent SSR issues
const DynamicWalletProvider = dynamic(
	() =>
		import("@solana/wallet-adapter-react").then(
			(mod) => mod.WalletProvider
		),
	{ ssr: false }
);

// Export the WalletButton component that's being imported elsewhere
export function WalletButton({ className }: { className?: string }) {
	return <WalletMultiButton className={className || "btn btn-primary"} />;
}

export function SolanaProvider({ children }: { children: ReactNode }) {
	const { cluster } = useCluster();
	const endpoint = useMemo(() => cluster.endpoint, [cluster]);
	const onError = useCallback((error: WalletError) => {
		console.error(error);
	}, []);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<DynamicWalletProvider
				wallets={[]}
				onError={onError}
				autoConnect={true}
			>
				<WalletModalProvider>{children}</WalletModalProvider>
			</DynamicWalletProvider>
		</ConnectionProvider>
	);
}

export function useAnchorProvider() {
	const { connection } = useConnection();
	const wallet = useWallet();

	return new AnchorProvider(connection, wallet as AnchorWallet, {
		commitment: "confirmed",
	});
}
