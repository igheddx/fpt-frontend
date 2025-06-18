import { useState, useCallback } from "react";
import axiosInstance from "./axiosInstance";

/**
 * useApi - Custom hook for making API calls with Axios
 * @returns {object} - An object containing apiCall, authenticate, loading, and error
 */
export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * apiCall - Makes an API call using the configured axiosInstance
   * @param {object} config - The request configuration object
   * @returns {Promise} - Axios response promise
   */
  const apiCall = useCallback(async (config) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosInstance(config);
      return response.data;
    } catch (error) {
      // Format error message based on error type
      let errorMessage = "An unexpected error occurred";

      if (error.code === "ECONNABORTED") {
        errorMessage = `Request timed out. Please try again.`;
      } else if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "No response received from server";
      } else {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticate = async (email, password) => {
    try {
      const response = await apiCall({
        method: "POST",
        url: "/api/Profile/authenticate",
        data: {
          username: email,
          password,
        },
      });

      if (response) {
        // Store tokens in session storage
        sessionStorage.setItem("token", response.token);
        sessionStorage.setItem("refreshToken", response.refreshToken);
        sessionStorage.setItem("apiKey", response.apiKey);

        // Store user info
        sessionStorage.setItem("user", JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  };

  return {
    apiCall,
    authenticate,
    isLoading,
    error,
  };
};

export default useApi;
