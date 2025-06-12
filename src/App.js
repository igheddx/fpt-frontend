import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./authenticate/login";
import ForgotPassword from "./authenticate/forgetPassword";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import MainLayout from "./components/MainLayout";
import Review from "./pages/Review";
import PrivateRoute from "./components/PrivateRoute"; // Assuming you have a PrivateRoute component
import SearchComp from "./components/Search";
import { DarkModeProvider, useDarkMode } from "./config/DarkModeContext";
import { AccountContextProvider } from "./contexts/AccountContext";
import { ConfigProvider } from "antd";
import { initializeLocalStorage } from "./utils/initLocalStorage";

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
        {/* Use MainLayout as the wrapper for all nested routes */}
        <Route element={<MainLayout />}>
          {/* Define your routes here */}
          {/* <Route path="/" element={<Navigate to="/dashboard" replace />} /> */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/review" element={<Review />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<SearchComp />} />
        </Route>

        {/* Add other routes, such as login */}
        <Route path="/" element={<Login />} />
        <Route path="/forgetPassword" element={<ForgotPassword />} />
      </Routes>
    </ConfigProvider>
  );
};

const App = () => (
  <DarkModeProvider>
    <AccountContextProvider>
      <ThemedApp />
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
