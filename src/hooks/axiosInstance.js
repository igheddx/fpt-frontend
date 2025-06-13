import axios from "axios";
import { setGlobalState, useGlobalState } from "../state/index";
const API_BASE_URL = "http://localhost:5000"; // Using backend API port

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  // Increase timeout for debugging
  timeout: 30000,
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Accept all status codes less than 500
  },
  // Explicitly configure CORS
  withCredentials: false,
  crossDomain: true,
});

// Function to retrieve the current API Key (with or without username)
const getApiKey = () => {
  const xApiKeyWithUserName = sessionStorage.getItem("xapikey"); // API key with username
  const xApiKeyDefault = sessionStorage.getItem("xapikeyNoAccessToken"); // Default API key without username

  return xApiKeyWithUserName || xApiKeyDefault;
};

// Request Interceptor: Attach Authorization Token & X-Api-Key
axiosInstance.interceptors.request.use(
  (config) => {
    // Check if this is an authentication request
    const isAuthRequest = config.url.includes("/api/Profile/authenticate");

    // Log for debugging
    console.log("Request Config:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
      isAuthRequest,
    });

    // For authentication request, only add API key
    if (isAuthRequest) {
      const xApiKey = getApiKey(); // Get the latest API key
      if (xApiKey) {
        config.headers["X-Api-Key"] = xApiKey;
      }
      return config;
    }

    // For all other requests, add authorization token and access level
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      // If no token is available and it's not an auth request, redirect to login
      window.location.href = "/";
      return Promise.reject("No access token available");
    }

    config.headers.Authorization = `Bearer ${token}`;

    // Add access level if available
    const accessLevel = sessionStorage.getItem("accessLevel");
    if (accessLevel) {
      config.headers["X-Access-Level"] = accessLevel;
    }

    return config;
  },
  (error) => {
    console.error("Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Expired Token (401)
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Response received:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    console.error("API Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
      },
    });

    // Check if error is due to token expiration and it's not an authentication request
    if (
      error.response?.status === 401 &&
      !error.config._retry &&
      !error.config.url.includes("/api/Profile/authenticate")
    ) {
      error.config._retry = true; // Mark this request as retried to prevent infinite loops
      console.log("Token expired! Attempting to refresh...");

      try {
        const refreshToken = sessionStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh token endpoint
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/api/Profile/refresh-token`,
          { refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (refreshResponse.data.token) {
          // Store new tokens
          const newAccessToken = refreshResponse.data.token;
          const newRefreshToken = refreshResponse.data.refreshToken;

          sessionStorage.setItem("accessToken", newAccessToken);
          sessionStorage.setItem("refreshToken", newRefreshToken);

          // Update authorization header
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;

          // Retry the original request
          return axiosInstance(error.config);
        } else {
          throw new Error("Failed to refresh token");
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);

        // Clear tokens and authentication state
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        setGlobalState("isAuthenticated", false);

        // Check if the error is due to refresh token expiration
        const isRefreshTokenExpired =
          refreshError.response?.status === 401 ||
          refreshError.response?.data?.message
            ?.toLowerCase()
            ?.includes("expired");

        // Store the error message in sessionStorage to display it on the login page
        if (isRefreshTokenExpired) {
          sessionStorage.setItem(
            "authError",
            "Your session has expired. Please log in again."
          );
        } else {
          sessionStorage.setItem(
            "authError",
            "Authentication failed. Please log in again."
          );
        }

        // Redirect to login page
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
