import { useCallback } from "react";
import axiosInstance from "./axiosInstance";

/**
 * useApi - Custom hook for making API calls with Axios
 * @returns {function} apiCall - (config) => Promise
 */
const useApi = () => {
  /**
   * apiCall - Makes an API call using the configured axiosInstance
   * @param {object} config - Axios request config (method, url, params, data, etc.)
   * @returns {Promise} - Axios response promise
   */
  const apiCall = useCallback(async (config) => {
    try {
      // Special handling for authentication requests
      if (config.url === "/api/Profile/authenticate") {
        if (config.data) {
          // Ensure proper casing for authentication fields
          config.data = {
            Username: config.data.Username || config.data.username,
            Password: config.data.Password || config.data.password,
          };
        }
      }

      console.log("Making API call:", {
        url: config.url,
        method: config.method,
        data: config.data,
      });

      const response = await axiosInstance({
        ...config,
        withCredentials: true,
        headers: {
          ...config.headers,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      return response.data;
    } catch (error) {
      // Log error details for debugging
      console.error("API Call Error:", {
        url: config.url,
        method: config.method,
        data: config.data,
        errorMessage: error.message,
        errorResponse: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });

      // If it's a CORS error, provide a more helpful message
      if (error.message === "Network Error" && !error.response) {
        throw new Error(
          "Unable to connect to the server. Please check if the server is running and try again."
        );
      }

      // If it's a validation error from the backend, show the specific error message
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        throw new Error(errorMessages.join(", "));
      }

      // If there's a specific error message from the backend, use it
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw error;
    }
  }, []);

  return apiCall;
};

export default useApi;
