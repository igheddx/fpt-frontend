import { Route, Navigate } from "react-router-dom";
import { setGlobalState, useGlobalState } from "../state/index";
const PrivateRoute = ({ element }) => {
  const isAuthorize = useGlobalState("isAuthenticated");
  const isAuthenticated = () => {
    return isAuthorize !== null;
  };

  return isAuthenticated() ? element : <Navigate to="/" />;
};

export default PrivateRoute;
