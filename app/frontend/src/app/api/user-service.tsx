import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const registerUserDraft = async (data: {
  email: string;
  password: string;
  role?: string;
}) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/register`, {
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
    const response = await axios.patch(
      `${API_BASE_URL}/user/complete-registration`,
      data,
      config
    );
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
    const response = await axios.post(`${API_BASE_URL}/user/register`, data);
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
    const response = await axios.post(`${API_BASE_URL}/user/login`, data);
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
    const response = await axios.get(
      `${API_BASE_URL}/user/profile`,
      getAuthHeaders()
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to get user profile.",
      error: error.response?.data || error.message,
    };
  }
};
