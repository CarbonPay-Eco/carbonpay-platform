import "./globals.css";
import { Inter } from "next/font/google";
import type React from "react";
import type { Metadata } from "next";
import MouseMoveEffect from "@/components/landingpage/mouse-move-effect";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "CarbonPay",
	description:
		"CarbonPay is transforming the carbon credit market with an innovative blockchain-based solution. Our platform reduces bureaucracy, accelerates transactions.",
	// icons: {
	//   icon: "/favicon.ico",
	// },
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="dark">
			<body
				className={`${inter.className} bg-background text-foreground antialiased`}
			>
				<Providers>
					<MouseMoveEffect />
					{children}
				</Providers>
			</body>
		</html>
	);
}
