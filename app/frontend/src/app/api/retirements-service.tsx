import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

/**
 * Fetches all retirements for the given wallet address.
 * @param walletAddress - The wallet address to fetch retirements for.
 * @returns The total retirements or an error response.
 */
export const getRetirements = async (walletAddress: string): Promise<{ success: boolean; totalOffset?: number; message?: string }> => {
  try {
    // Send the GET request to the backend with the wallet address in the headers
    const response = await axios.get(`${API_BASE_URL}/retirements`, {
      headers: {
        "x-wallet-address": walletAddress,
      },
    });

    // Sum the quantities from the response data
    const totalOffset = response.data.data.reduce((sum: number, retirement: any) => sum + retirement.quantity, 0);

    return {
      success: true,
      totalOffset,
    };
  } catch (error: any) {
    // Return a structured error response
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch retirements.",
    };
  }
};