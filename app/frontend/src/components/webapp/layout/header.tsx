"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"

export default function Header({ userName = "Matheus" }) {
  const { publicKey } = useWallet()
  const { setVisible } = useWalletModal()

  return (
    <header className="border-b border-white/10 bg-black/95">
      <div className="flex h-16 items-center justify-between px-8">
        <div>
          <h1 className="text-xl font-semibold">Hello, {userName}!</h1>
          <p className="text-sm text-gray-400">Track, manage, and offset your emissions seamlessly.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="border-white/10">
            <Bell className="h-5 w-5" />
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-500"
            onClick={() => setVisible(true)}
          >
            {publicKey ? "Connected" : "Connect Wallet"}
          </Button>
        </div>
      </div>
    </header>
  )
}

