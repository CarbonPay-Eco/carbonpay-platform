import axios from "axios";
import type { OnboardingFormData } from "../../../types/onboarding";

const API_BASE_URL = "http://localhost:3000/api";

/**
 * Creates a new organization with the provided form data and wallet address.
 * @param formData - The onboarding form data for the organization.
 * @param walletId - The wallet address to associate with the organization.
 * @returns A success or error response with the created organization data.
 */
export const createOrganization = async (formData: OnboardingFormData, walletId: string) => {
    try {
      // Validate required fields
      if (!formData.name || !formData.companyName || !formData.country || !formData.registrationNumber) {
        throw new Error("Missing required fields: name, companyName, country, or registrationNumber.");
      }
  
      // Prepare the payload
      const payload = {
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
  
      // Send the POST request to the backend with the wallet address in the headers
      const response = await axios.post(`${API_BASE_URL}/organization`, payload, {
        headers: {
          "x-wallet-address": walletId, 
        },
      });
  
      return {
        success: true,
        message: "Organization created successfully.",
        data: response.data,
      };
    } catch (error: any) {
      // Return a structured error response
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create organization.",
        error: error.response?.data || error.message,
      };
    }
  };

/**
 * Fetches the organization associated with the given wallet address.
 * @param walletId - The wallet address to fetch the organization for.
 * @returns The organization data or an error response.
 */
export const getOrganization = async (walletId: string): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      // Send the GET request to the backend with the wallet address in the headers
      const response = await axios.get(`${API_BASE_URL}/organization/me`, {
        headers: {
          "x-wallet-address": walletId,
        },
      });
    
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {  
      // Return a structured error response
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch organization.",
      };
    }
  };