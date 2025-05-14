import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

/**
 * Fetches all projects from the backend.
 * @returns The list of projects or an error response.
 */
export const getProjects = async (): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    // Send the GET request to the backend
    const response = await axios.get(`${API_BASE_URL}/admin/projects`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    // Return a structured error response
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch projects.",
    };
  }
};