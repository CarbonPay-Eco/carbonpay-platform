"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/solana/solana-provider";
import { useEffect } from "react";

export default function Hero() {
  const { publicKey } = useWallet();
  const router = useRouter();

  // Set cookie when wallet is connected
  useEffect(() => {
    if (publicKey) {
      document.cookie = "walletConnected=true; path=/";
    }
  }, [publicKey]);

  const mockCheckWalletInDB = async (walletAddress: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const existingWallet = "mock-wallet-address";
        resolve(walletAddress === existingWallet);
      }, 500);
    });
  };

  const handleAccessPlatform = async () => {
    if (!publicKey) {
      return;
    }

    const walletAddress = publicKey.toBase58();
    const walletExists = await mockCheckWalletInDB(walletAddress);

    if (walletExists) {
      router.push("/webapp/dashboard");
    } else {
      router.push("/webapp/onboard");
    }
  };

  return (
    <section className="container flex min-h-[calc(100vh-3.5rem)] max-w-screen-2xl flex-col items-center justify-center space-y-8 py-24 text-center md:py-32">
      <div className="space-y-4">
        <h1 className="bg-gradient-to-br from-foreground from-30% via-foreground/90 to-foreground/70 bg-clip-text text-4xl tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
          Driving Transparent
          <br />
          <span className="font-bold">Carbon</span> Solutions.
        </h1>
        <p className="mx-auto max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Seamless, secure, and transparent carbon credit trading powered by
          blockchain.
        </p>
      </div>
      <div className="flex gap-4">
        <WalletButton className="bg-green-600 hover:bg-green-500" />
        {publicKey && (
          <Button size="lg" variant="outline" onClick={handleAccessPlatform}>
            Access Platform
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </section>
  );
}