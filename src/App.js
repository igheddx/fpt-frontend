import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./authenticate/login";
import ForgotPassword from "./authenticate/forgetPassword";
import ChangePassword from "./authenticate/changePassword";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import MainLayout from "./components/MainLayout";
import Review from "./pages/Review";
import PrivateRoute from "./components/PrivateRoute"; // Assuming you have a PrivateRoute component
import SearchComp from "./components/Search";
import { DarkModeProvider, useDarkMode } from "./config/DarkModeContext";
import { AccountContextProvider } from "./contexts/AccountContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ConfigProvider } from "antd";
import { initializeLocalStorage } from "./utils/initLocalStorage";
import AdvancedSearch from "./pages/AdvancedSearch";

//test
const ThemedApp = () => {
  const { darkMode } = useDarkMode();

  useEffect(() => {
    initializeLocalStorage();
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: darkMode ? "#1e1e1e" : "#ffffff",
          colorTextBase: darkMode ? "#ffffff" : "#000000",
        },
        components: {
          Layout: {
            bodyBg: darkMode ? "#121212" : "#f0f2f5",
          },
        },
      }}
    >
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgetPassword" element={<ForgotPassword />} />
        <Route path="/changePassword" element={<ChangePassword />} />

        {/* Protected routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<PrivateRoute element={<Dashboard />} />} />
          <Route
            path="/dashboard"
            element={<PrivateRoute element={<Dashboard />} />}
          />
          <Route path="/admin" element={<PrivateRoute element={<Admin />} />} />
          <Route
            path="/review"
            element={<PrivateRoute element={<Review />} />}
          />
          <Route
            path="/profile"
            element={<PrivateRoute element={<Profile />} />}
          />
          <Route
            path="/search"
            element={<PrivateRoute element={<SearchComp />} />}
          />
          <Route
            path="/advanced-search"
            element={<PrivateRoute element={<AdvancedSearch />} />}
          />
        </Route>

        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ConfigProvider>
  );
};

const App = () => (
  <DarkModeProvider>
    <AccountContextProvider>
      <NotificationProvider>
        <ThemedApp />
      </NotificationProvider>
    </AccountContextProvider>
  </DarkModeProvider>
);
export default App;

/*const App = () => (
  <ConfigProvider
  theme={{
    token: {
      colorBgContainer: darkMode ? "#1e1e1e" : "#ffffff",
      colorTextBase: darkMode ? "#ffffff" : "#000000",
    },
    components: {
      Layout: {
        bodyBg: darkMode ? "#121212" : "#f0f2f5",
      },
    },
  }}
>
    <Routes>
      // {/* Use MainLayout as the wrapper for all nested routes */
//       <Route element={<MainLayout />}>
//         {/* Define your routes here */}
//         <Route path="/dashboard" element={<Dashboard />} />
//         <Route path="/admin" element={<Admin />} />
//         <Route path="/profile" element={<Profile />} />
//         <Route path="/search" element={<SearchComp />} />
//       </Route>

//       {/* Add other routes, such as login */}
//       <Route path="/login" element={<Login />} />
//     </Routes>
//   </ConfigProvider>
// );

// export default App;
