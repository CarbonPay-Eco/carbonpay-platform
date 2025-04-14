"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart2, Settings, LogOut, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import Logo from "@/components/globalAssets/logo"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Your assets", href: "/assets", icon: Wallet },
  { name: "Your emissions", href: "/emissions", icon: BarChart2 },
]

const systemNavigation = [
  { name: "Setting", href: "/settings", icon: Settings },
  { name: "Logout account", href: "/logout", icon: LogOut },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-black">
      <div className="flex h-16 items-center px-6">
        <Logo className="h-8 w-auto" />
      </div>
      <div className="flex flex-1 flex-col justify-between px-4 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-green-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white",
                )}
              >
                <item.icon
                  className={cn("mr-3 h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-white")}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-1">
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold uppercase text-gray-400">System</h3>
          </div>
          {systemNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                item.name === "Logout account"
                  ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white",
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5",
                  item.name === "Logout account"
                    ? "text-red-400 group-hover:text-red-300"
                    : "text-gray-400 group-hover:text-white",
                )}
              />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

