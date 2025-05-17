import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

/**
 * Fetches all projects from the backend.
 * @param walletAddress - The wallet address to associate with the organization.
 * @returns The list of projects or an error response.
 */
export const getProjects = async (
  walletAddress: string
): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> => {
  try {
    // Send the GET request to the backend
    const response = await axios.get(`${API_BASE_URL}/admin/projects`, {
      headers: {
        "x-wallet-address": walletAddress,
      },
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    // Return a structured error response
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch projects.",
    };
  }
};

/**
 * Creates a new project.
 * @param projectData The project data to create
 * @param walletAddress The wallet address of the user
 * @returns The created project or an error response
 */
export const createProject = async (
  projectData: any,
  walletAddress: string
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/projects`, projectData, {
      headers: {
        "x-wallet-address": walletAddress,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create project.",
    };
  }
};
