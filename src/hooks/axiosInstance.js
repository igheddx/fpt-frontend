import axios from "axios";

const API_BASE_URL = "http://localhost:5000"; // Using backend API port

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get API key from session storage
    const apiKey =
      sessionStorage.getItem("xapikeyNoAccessToken") ||
      sessionStorage.getItem("xapikey");

    // Log request details
    console.log("Making request to:", config.url);
    console.log("Request method:", config.method);
    console.log("API Key present:", !!apiKey);
    console.log("Request headers:", config.headers);

    if (apiKey) {
      config.headers["X-Api-Key"] = apiKey;
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Response received:", {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
    });
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED" && error.message.includes("timeout")) {
      console.error("Request timed out:", {
        url: error.config.url,
        method: error.config.method,
        timeout: error.config.timeout,
        headers: error.config.headers,
        data: error.config.data,
      });
      error.message = `Request timed out after ${
        error.config.timeout / 1000
      } seconds`;
    } else if (error.response) {
      console.error("Response error:", {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers,
        config: error.config,
      });
    } else if (error.request) {
      console.error("Request error (no response):", {
        request: error.request,
        config: error.config,
      });
    } else {
      console.error("Error message:", error.message);
    }
    return Promise.reject(error);
  }
);

// Add a ping method to test backend connectivity
axiosInstance.ping = async () => {
  try {
    const response = await axiosInstance.get("/api/health", { timeout: 5000 });
    console.log("Backend is accessible:", response.data);
    return true;
  } catch (error) {
    console.error("Backend is not accessible:", error.message);
    return false;
  }
};

export default axiosInstance;
