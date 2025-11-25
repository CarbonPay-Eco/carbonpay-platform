import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/**
 * Fetches all available projects from the backend (public endpoint).
 * @returns The list of available projects or an error response.
 */
export const getProjects = async (): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/projects`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch projects.",
    };
  }
};

/**
 * Fetches all projects from the backend (admin endpoint).
 * @returns The list of all projects or an error response.
 */
export const getAllProjects = async (): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/projects`,
      getAuthHeaders()
    );

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch projects.",
    };
  }
};

/**
 * Gets a project by ID.
 * @param projectId The project ID
 * @returns The project or an error response
 */
export const getProjectById = async (
  projectId: string
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/projects/${projectId}`,
      getAuthHeaders()
    );

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch project.",
    };
  }
};

/**
 * Creates a new project (admin only).
 * @param projectData The project data to create
 * @returns The created project or an error response
 */
export const createProject = async (
  projectData: any
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/admin/projects`,
      projectData,
      getAuthHeaders()
    );

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create project.",
    };
  }
};
