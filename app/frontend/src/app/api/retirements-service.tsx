import { api } from "./client";

/**
 * Fetches all retirements for the authenticated user.
 * @returns The list of retirements or an error response.
 */
export const getRetirements = async (): Promise<{
  success: boolean;
  data?: any[];
  totalOffset?: number;
  message?: string;
}> => {
  try {
    const response = await api.get("/user/retirements");

    const retirements = response.data.data || response.data || [];
    const totalOffset = retirements.reduce(
      (sum: number, retirement: any) => sum + (retirement.quantity || 0),
      0
    );

    return {
      success: true,
      data: retirements,
      totalOffset,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch retirements.",
    };
  }
};

/**
 * Gets a retirement by ID.
 * @param retirementId The retirement ID
 * @returns The retirement or an error response
 */
export const getRetirementById = async (
  retirementId: string
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const response = await api.get(`/user/retirements/${retirementId}`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch retirement.",
    };
  }
};

/**
 * Retires carbon credits to offset emissions.
 * @param retirementData The retirement data
 * @returns The retirement result or an error response
 */
export const retireEmissions = async (retirementData: {
  projectId: string;
  quantity: number;
  beneficiary?: string;
  retirementMessage?: string;
  reportingPeriodStart?: string;
  reportingPeriodEnd?: string;
}): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const response = await api.post("/user/retire-emissions", retirementData);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to retire emissions.",
    };
  }
};