"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Settings, LogOut, Wallet, Bell, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Logo from "@/components/globalAssets/logo";
import { useWallet } from "@solana/wallet-adapter-react";

const navigation = [
  { name: "Dashboard", href: "/webapp/dashboard", icon: Home },
  { name: "Your assets", href: "/webapp/assets", icon: Wallet },
  { name: "Your emissions", href: "/webapp/emissions", icon: BarChart2 },
];

const systemNavigation = [
  { name: "Setting", href: "/webapp/settings", icon: Settings },
  { name: "Logout account", href: "/", icon: LogOut },
];

interface WebappShellProps {
  children: React.ReactNode;
}

export default function WebappShell({ children }: WebappShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { publicKey, disconnect } = useWallet();

  const handleLogout = async () => {
    try {
      await disconnect();
      document.cookie = "walletConnected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Redirect to landing page if wallet is disconnected
  useEffect(() => {
    if (!publicKey) {
      document.cookie = "walletConnected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/");
    }
  }, [publicKey, router]);

  return (
    <div className="flex h-full">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-black transition-transform duration-300 ease-in-out",
          "lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center px-6">
          <Logo className="h-8 w-auto" />
          <button className="absolute right-4 top-4 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-col justify-between h-[calc(100vh-4rem)]">
          <nav className="space-y-1 px-4 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive ? "bg-green-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-1 px-4 py-4 mt-auto border-t border-white/10">
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold uppercase text-gray-400">System</h3>
            </div>
            {systemNavigation.map((item) => (
              <button
                key={item.name}
                onClick={item.name === "Logout account" ? handleLogout : () => router.push(item.href)}
                className={cn(
                  "group flex w-full items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  item.name === "Logout account"
                    ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    item.name === "Logout account"
                      ? "text-red-400 group-hover:text-red-300"
                      : "text-gray-400 group-hover:text-white"
                  )}
                />
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/95">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center">
              <button className="mr-4 lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">Hello, Matheus!</h1>
                <p className="text-sm text-gray-400">Track, manage, and offset your emissions seamlessly.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="border-white/10">
                <Bell className="h-5 w-5" />
              </Button>
              <Button className="bg-green-600 hover:bg-green-500">
                <span className="hidden sm:inline">Connected: </span>
                <span className="font-mono text-xs sm:ml-1">
                  {publicKey ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}` : "Not Connected"}
                </span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}