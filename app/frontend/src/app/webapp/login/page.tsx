"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { loginUser } from "../../api/user-service";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "admin@carbonpay.com",
    password: "admin123",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        // Use auth context to store token and set authenticated state
        const token = result.data?.data?.token || result.data?.token;
        if (token) {
          login(token);
          router.push("/webapp/dashboard");
        } else {
          setError("No authentication token received");
        }
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred during login");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(50% 50% at 50% 0%, #05A94F 0%, transparent 100%)`,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="border-white/10 bg-black/60 backdrop-blur-md">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-center mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400 text-center mb-8">
              Sign in to your CarbonPay account
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="mt-2 bg-black/50 border-white/20"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="mt-2 bg-black/50 border-white/20"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-500 mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-gray-400">
                Don't have an account?{" "}
              </span>
              <a
                href="/webapp/onboard"
                className="text-green-400 hover:underline text-sm"
              >
                Sign up
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
