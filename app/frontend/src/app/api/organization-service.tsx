import axios from "axios";
import type { OnboardingFormData } from "../../../types/onboarding";

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
 * Creates a new organization (admin only).
 * Note: Organizations are typically created during user registration via /user/register.
 * This endpoint is for admin use only.
 * @param formData - The onboarding form data for the organization.
 * @returns A success or error response with the created organization data.
 */
export const createOrganization = async (
  formData: OnboardingFormData,
  userId: string
) => {
  try {
    // Validate required fields
    if (
      !formData.name ||
      !formData.companyName ||
      !formData.country ||
      !formData.registrationNumber
    ) {
      throw new Error(
        "Missing required fields: name, companyName, country, or registrationNumber."
      );
    }

    // Prepare the payload
    const payload = {
      userId,
      fullName: formData.name,
      companyName: formData.companyName,
      country: formData.country,
      registrationNumber: formData.registrationNumber,
      industryType: formData.industry,
      companySize: formData.companySize,
      description: formData.companyDescription,
      tracksEmissions: formData.hasEmissionsHistory,
      emissionSources: formData.primaryEmissionSources || [],
      sustainabilityCertifications: formData.sustainabilityPrograms || [],
      priorOffsetting: formData.offsettingExperience === "extensive",
      contactEmail: formData.contactEmail,
      websiteUrl: formData.websiteUrl,
      acceptedTerms: formData.acceptedTerms || false,
    };

    // Send the POST request to the backend with JWT token
    const response = await axios.post(
      `${API_BASE_URL}/admin/organizations`,
      payload,
      getAuthHeaders()
    );

    return {
      success: true,
      message: "Organization created successfully.",
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to create organization.",
      error: error.response?.data || error.message,
    };
  }
};

/**
 * Fetches all organizations (admin only).
 * @returns The list of organizations or an error response.
 */
export const getAllOrganizations = async (): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/organizations`,
      getAuthHeaders()
    );

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch organizations.",
    };
  }
};

/**
 * Gets organization from user profile.
 * Note: The organization is linked to the user, so we get it via the user profile.
 * @returns The organization data or an error response.
 */
export const getOrganization = async (): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> => {
  try {
    // Get user profile which includes organization info
    const response = await axios.get(
      `${API_BASE_URL}/user/profile`,
      getAuthHeaders()
    );

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch organization.",
    };
  }
};