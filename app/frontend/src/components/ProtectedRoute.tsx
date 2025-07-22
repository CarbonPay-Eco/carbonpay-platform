"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/webapp/login"); // redireciona para nossa página de login
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
