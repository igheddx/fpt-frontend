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
        headers: {
          ...config.headers,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      return response.data;
    } catch (error) {
      // Let the axiosInstance interceptor handle 401 errors
      if (error.response?.status === 401) {
        throw error;
      }

      // Handle other errors
      console.error("API call failed:", error);
      throw error;
    }
  }, []);

  return apiCall;
};

export default useApi;
