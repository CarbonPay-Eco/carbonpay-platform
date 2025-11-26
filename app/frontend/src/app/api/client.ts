import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const successNotificationMethods = new Set([
  "post",
  "put",
  "patch",
  "delete",
]);

const extractErrorMessage = (error: AxiosError): string => {
  const data = error.response?.data;

  if (data && typeof data === "object" && "message" in data) {
    return (data as { message?: string }).message || error.message || "Unexpected error";
  }

  if (typeof data === "string") {
    const preMatch = data.match(/<pre>([\s\S]*?)<\/pre>/i);
    const raw = preMatch ? preMatch[1] : data;
    return raw
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/&nbsp;/gi, " ")
      .replace(/<\/?[^>]+(>|$)/g, "")
      .trim() || error.message || "Unexpected error";
  }

  return error.message || "Unexpected error";
};

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && !config.headers?.Authorization) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    if (
      method &&
      successNotificationMethods.has(method) &&
      response.data?.message
    ) {
      toast.success(response.data.message);
    }
    return response;
  },
  (error) => {
    const formattedError = error as AxiosError;
    const message = extractErrorMessage(formattedError);

    // Handle 401 Unauthorized - token is invalid or expired
    if (formattedError.response?.status === 401) {
      // Clear invalid token from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        // Remove cookie
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes("/webapp/login")) {
          toast.error("Your session has expired. Please login again.");
          window.location.href = "/webapp/login";
        }
      }
    } else {
      toast.error(message);
    }
    
    return Promise.reject({ ...error, message });
  }
);


