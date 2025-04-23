"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { getOnboardingData } from "@/lib/actions";
import type { OnboardingFormData } from "../../../../types/onboarding";

export function OnboardingStatus() {
  const [onboardingData, setOnboardingData] =
    useState<OnboardingFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOnboardingData() {
      try {
        const data = await getOnboardingData();
        setOnboardingData(data.length > 0 ? data[0] : null);
      } catch (error) {
        console.error("Error fetching onboarding data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOnboardingData();
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-black/40">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!onboardingData) {
    return (
      <Card className="bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
            Complete Your Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-400 mb-4">
            Please complete your onboarding to unlock all features of CarbonPay.
          </p>
          <Button
            className="bg-green-600 hover:bg-green-500"
            ref="/webapp/onboarding"
          >
            Complete Onboarding
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          Onboarding Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-gray-400">
            Welcome, <span className="text-white">{onboardingData.name}</span>!
            Your company{" "}
            <span className="text-white">{onboardingData.companyName}</span> is
            now set up.
          </p>
          <p className="text-gray-400">
            You can now start offsetting your carbon emissions and tracking your
            progress.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
