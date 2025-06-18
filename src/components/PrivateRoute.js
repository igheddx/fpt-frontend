import { Navigate, useLocation } from "react-router-dom";
import { useGlobalState, setGlobalState } from "../state";
import { useEffect, useState } from "react";

const PrivateRoute = ({ element }) => {
  const [isAuthenticated] = useGlobalState("isAuthenticated");
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const accessToken = sessionStorage.getItem("accessToken");
      const refreshToken = sessionStorage.getItem("refreshToken");
      const xapikey = sessionStorage.getItem("xapikey");

      // If we have valid tokens but not authenticated in state, update the state
      if (!isAuthenticated && accessToken && refreshToken) {
        setGlobalState("isAuthenticated", true);
        setGlobalState("token", accessToken);
        setGlobalState("refreshToken", refreshToken);
        if (xapikey) {
          setGlobalState("apiKey", xapikey);
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [isAuthenticated]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  // Check both state and tokens
  const accessToken = sessionStorage.getItem("accessToken");
  const refreshToken = sessionStorage.getItem("refreshToken");

  if (!isAuthenticated && (!accessToken || !refreshToken)) {
    // Save the current location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return element;
};

export default PrivateRoute;
