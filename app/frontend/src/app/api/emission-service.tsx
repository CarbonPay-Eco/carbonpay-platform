import { api } from "./client";

export interface Emission {
  id: string;
  source: string;
  amount: number;
  date: Date | string;
  offset: number;
  offsetProjectId?: string | null;
  offsetRequestId?: string | null;
  description?: string | null;
  category?: string | null;
  offsetProject?: {
    id: string;
    projectName: string;
  } | null;
}

export interface EmissionStats {
  totalEmissions: number;
  totalOffset: number;
  remainingEmissions: number;
  offsetPercentage: number;
  emissionCount: number;
}

/**
 * Fetches all emissions for the authenticated user
 */
export const getEmissions = async (): Promise<{
  success: boolean;
  data?: Emission[];
  message?: string;
}> => {
  try {
    const response = await api.get("/user/emissions");
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch emissions.",
    };
  }
};

/**
 * Fetches emission statistics for the authenticated user
 */
export const getEmissionStats = async (): Promise<{
  success: boolean;
  data?: EmissionStats;
  message?: string;
}> => {
  try {
    const response = await api.get("/user/emissions/stats");
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch emission statistics.",
    };
  }
};

/**
 * Creates a new emission record
 */
export const createEmission = async (
  emissionData: {
    source: string;
    amount: number;
    date: string;
    description?: string;
    category?: string;
  }
): Promise<{
  success: boolean;
  data?: Emission;
  message?: string;
}> => {
  try {
    const response = await api.post("/user/emissions", emissionData);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create emission.",
    };
  }
};

/**
 * Updates an emission record
 */
export const updateEmission = async (
  emissionId: string,
  emissionData: {
    source?: string;
    amount?: number;
    date?: string;
    description?: string;
    category?: string;
  }
): Promise<{
  success: boolean;
  data?: Emission;
  message?: string;
}> => {
  try {
    const response = await api.put(`/user/emissions/${emissionId}`, emissionData);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update emission.",
    };
  }
};

/**
 * Deletes an emission record
 */
export const deleteEmission = async (
  emissionId: string
): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    await api.delete(`/user/emissions/${emissionId}`);
    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete emission.",
    };
  }
};

