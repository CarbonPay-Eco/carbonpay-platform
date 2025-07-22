"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { useWallet } from "@solana/wallet-adapter-react"
// import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/app/api/user-service";
import { User, Menu } from "lucide-react";

interface UserData {
  email: string;
  organization?: {
    name: string;
  };
}

interface HeaderProps {
  userName?: string;
  onMenuClick?: () => void;
}

export default function Header({ userName, onMenuClick }: HeaderProps) {
  // const { publicKey } = useWallet()
  // const { setVisible } = useWalletModal()
  const { logout } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await getUserProfile();
        if (result.success) {
          setUserData(result.data.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleProfileClick = () => {
    router.push("/webapp/profile");
  };

  const displayName =
    userName ||
    userData?.organization?.name ||
    userData?.email?.split("@")[0] ||
    "User";

  return (
    <header className="border-b border-white/10 bg-black/95">
      <div className="flex h-16 items-center justify-between px-8">
        <div className="flex items-center">
          {onMenuClick && (
            <button className="mr-4 lg:hidden" onClick={onMenuClick}>
              <Menu className="h-6 w-6" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold">
              Hello, {isLoading ? "Loading..." : displayName}!
            </h1>
            <p className="text-sm text-gray-400">
              Track, manage, and offset your emissions seamlessly.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="border-white/10 hover:bg-white/5"
            onClick={handleProfileClick}
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button
            variant="outline"
            className="border-white/10 hover:bg-white/5"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
