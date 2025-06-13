import axios from "axios";
import { setGlobalState, useGlobalState } from "../state/index";
const API_BASE_URL = "http://localhost:5000"; // Using backend API port

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
  // Increase timeout for debugging
  timeout: 30000,
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Accept all status codes less than 500
  },
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
    // Attach headers dynamically
    // Retrieve the current access token and API key
    const token = sessionStorage.getItem("accessToken");
    const xApiKey = getApiKey(); // Get the latest API key
    const accessLevel = sessionStorage.getItem("accessLevel");

    // Log for debugging
    console.log("Request Config:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
      token: token ? "present" : "missing",
      xApiKey: xApiKey ? "present" : "missing",
      accessLevel: accessLevel || "not set",
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (xApiKey) {
      config.headers["X-Api-Key"] = xApiKey;
    }
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

    if (error.response && error.response.status === 401) {
      console.log("Token expired! Attempting to refresh...");

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/api/profile/refreshtoken`,
          {
            refreshToken,
          }
        );

        if (refreshResponse.status === 200) {
          const newAccessToken = refreshResponse.data.accessToken;
          const newRefreshToken = refreshResponse.data.refreshToken;

          sessionStorage.setItem("accessToken", newAccessToken);
          sessionStorage.setItem("refreshToken", newRefreshToken);

          // Retry the original request with the new token
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(error.config);
        } else {
          console.error("Token refresh failed. Logging out...");
          setGlobalState("isAuthenticated", false);
          sessionStorage.removeItem("accessToken");
          sessionStorage.removeItem("refreshToken");
          window.location.href = "/"; // Redirect to login
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        setGlobalState("isAuthenticated", false);
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
