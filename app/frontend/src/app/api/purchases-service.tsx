import { api } from "./client";

/**
 * Fetches all purchases (carbon credits) for the authenticated user.
 * @returns The list of purchases with project details or an error response.
 */
export const getUserPurchases = async (): Promise<{
  success: boolean;
  data?: any[];
  message?: string;
}> => {
  try {
    const response = await api.get("/user/purchases");

    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error: any) {
    console.error("Error fetching purchases:", error);

    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Authentication required. Please login again.",
      };
    }

    if (error.response?.status === 404) {
      return {
        success: false,
        message: "Endpoint not found. Please check if the backend is running.",
      };
    }

    if (!error.response) {
      return {
        success: false,
        message:
          "Cannot connect to server. Please check if the backend is running.",
      };
    }

    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch purchases.",
    };
  }
};
