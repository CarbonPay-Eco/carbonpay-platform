"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ClusterProvider } from "./cluster/cluster-data-access";
import AppWalletProvider from "./solana/solana-wallet-provider";

export default function Providers({ children }: { children: ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<ClusterProvider>
				<AppWalletProvider>{children}</AppWalletProvider>
			</ClusterProvider>
		</QueryClientProvider>
	);
}