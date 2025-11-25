import { api } from "./client";

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
    const response = await api.get("/projects");

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
    const response = await api.get("/admin/projects");

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
    const response = await api.get(`/admin/projects/${projectId}`);

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
    const response = await api.post("/admin/projects", projectData);

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
