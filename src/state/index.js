// import { createGlobalState } from "react-hooks-global-state";

// let accountsData = sessionStorage.getItem("cloundAccountData");
// accountsData = JSON.parse(accountsData);

// const { setGlobalState, useGlobalState } = createGlobalState({
//   accountId: 0,
//   accountName: "Test",
//   defaultAccountId: 0,
//   running: 0,
//   profileName: "",
//   isAuthenticcated: false,
//   userRole: "guest",
//   theme: "light",
// });

// export { useGlobalState, setGlobalState };

import { createGlobalState } from "react-hooks-global-state";

// Create a function to get the initial state
const getInitialState = () => {
  // Safely get and parse items from sessionStorage
  const getStorageItem = (key) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Error parsing ${key} from sessionStorage:`, error);
      return null;
    }
  };

  // Get authentication tokens
  const accessToken = sessionStorage.getItem("accessToken");
  const refreshToken = sessionStorage.getItem("refreshToken");
  const xapikey = sessionStorage.getItem("xapikey");
  const profileData = getStorageItem("profileData");

  // Check if we have valid auth tokens
  const isAuthenticated = !!(accessToken && refreshToken);

  // If we're authenticated, ensure we have all necessary data
  if (isAuthenticated) {
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("refreshToken", refreshToken);
    if (xapikey) {
      sessionStorage.setItem("xapikey", xapikey);
    }
    if (profileData) {
      sessionStorage.setItem("profileData", JSON.stringify(profileData));
    }
  }

  return {
    accountId: 0,
    accountName: "",
    defaultAccountId: 0,
    running: 0,
    profileName: sessionStorage.getItem("profileName") || "",
    isAuthenticated,
    userRole: profileData?.accessLevel || "guest",
    theme: "light",
    user: profileData || {},
    token: accessToken || null,
    refreshToken: refreshToken || null,
    apiKey: xapikey || null,
  };
};

// Create and export the global state instance
const globalState = createGlobalState(getInitialState());

// Export the hooks and functions
export const useGlobalState = globalState.useGlobalState;
export const getGlobalState = globalState.getGlobalState;
export const setGlobalState = globalState.setGlobalState;
