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

// Define initial state with multiple variables
const initialState = {
  accountId: 0,
  accountName: "",
  defaultAccountId: 0,
  running: 0,
  profileName: "",
  isAuthenticated: false,
  userRole: "guest",
  theme: "light",
};

// Create the global state
const { useGlobalState, getGlobalState, setGlobalState } =
  createGlobalState(initialState);

export { useGlobalState, getGlobalState, setGlobalState };
