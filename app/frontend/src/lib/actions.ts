"use server"

import { revalidatePath } from "next/cache"
// import type { OnboardingFormData } from "@/types/onboarding"
import type { OnboardingFormData } from "../../types/onboarding"

// In a real application, this would connect to a database
// For now, we'll simulate storage with a simple in-memory store
const onboardingDataStore: OnboardingFormData[] = []

export async function saveOnboardingData(data: OnboardingFormData): Promise<{ success: boolean; message: string }> {
  try {
    // Validate required fields
    if (!data.name || !data.companyName || !data.country || !data.registrationNumber) {
      return {
        success: false,
        message: "Missing required fields",
      }
    }

    // In a real app, you would:
    // 1. Connect to your database (MongoDB, PostgreSQL, etc.)
    // 2. Store the data with proper validation
    // 3. Associate it with the user's account

    // For demo purposes, we'll just add it to our in-memory store
    const timestamp = new Date().toISOString()
    const newEntry = {
      ...data,
      id: `onboarding-${timestamp}`,
      createdAt: timestamp,
    }

    // Simulate database storage
    onboardingDataStore.push(data)
    console.log("Onboarding data saved:", data)

    // Revalidate relevant paths
    revalidatePath("/webapp/dashboard")

    return {
      success: true,
      message: "Onboarding data saved successfully",
    }
  } catch (error) {
    console.error("Error saving onboarding data:", error)
    return {
      success: false,
      message: "Failed to save onboarding data",
    }
  }
}

export async function getOnboardingData(): Promise<OnboardingFormData[]> {
  // In a real app, you would fetch from your database
  return onboardingDataStore
}

