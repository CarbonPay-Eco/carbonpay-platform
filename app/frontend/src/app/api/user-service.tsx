import { api } from "./client";

export const registerUserDraft = async (data: {
  email: string;
  password: string;
  role?: string;
}) => {
  try {
    const response = await api.post("/user/register", {
      ...data,
      draft: true,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to register user draft.",
      error: error.response?.data || error.message,
    };
  }
};

export const completeUserRegistration = async (
  data: any,
  draftToken?: string
) => {
  try {
    const config = draftToken
      ? { headers: { Authorization: `Bearer ${draftToken}` } }
      : undefined;
    const response = await api.patch("/user/complete-registration", data, config);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to complete registration.",
      error: error.response?.data || error.message,
    };
  }
};

export const registerUser = async (data: {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  country: string;
  registrationNumber?: string;
  industryType?: string;
  companySize?: string;
  description?: string;
  tracksEmissions?: boolean;
  emissionSources?: string[];
  sustainabilityCertifications?: string[];
  priorOffsetting?: boolean;
  contactEmail?: string;
  websiteUrl?: string;
  acceptedTerms: boolean;
  role?: string;
}) => {
  try {
    const response = await api.post("/user/register", data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to register user.",
      error: error.response?.data || error.message,
    };
  }
};

export const loginUser = async (data: { email: string; password: string }) => {
  try {
    const response = await api.post("/user/login", data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to login.",
      error: error.response?.data || error.message,
    };
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get("/user/profile");
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to get user profile.",
      error: error.response?.data || error.message,
    };
  }
};

/**
 * Adds balance to user account.
 * @param amount - The amount to add
 * @param paymentMethod - Optional payment method
 * @returns Success or error response
 */
export const addBalance = async (data: {
  amount: number;
  paymentMethod?: string;
}) => {
  try {
    const response = await api.post("/user/add-balance", data);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to add balance.",
      error: error.response?.data || error.message,
    };
  }
};

/**
 * Purchases carbon credits with account balance.
 * @param projectId - The project ID
 * @param quantity - The quantity of credits to purchase
 * @returns Success or error response
 */
export const purchaseCredits = async (data: {
  projectId: string;
  quantity: number;
}) => {
  try {
    const response = await api.post("/user/purchase-credits", data);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to purchase credits.",
      error: error.response?.data || error.message,
    };
  }
};
