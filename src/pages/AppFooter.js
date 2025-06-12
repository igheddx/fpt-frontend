import React, { useState } from "react";
import { Layout, ConfigProvider } from "antd";

const { Footer } = Layout;

const AppFooter = () => {
  const [darkMode, setDarkMode] = useState(true); // Dark mode toggle

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: darkMode ? "#1e1e1e" : "#ffffff",
          colorTextBase: darkMode ? "#fff" : "#000",
        },
      }}
    >
      <Footer
        style={{
          textAlign: "center",
          background: darkMode ? "#1e1e1e" : "#ffffff",
          color: darkMode ? "#fff" : "#000",
          marginTop: "auto", // Ensures footer stays at the bottom
          padding: "10px", // Adjust padding if needed
        }}
      >
        Finpromptu ©{new Date().getFullYear()} Created by Finpromptu
      </Footer>
    </ConfigProvider>
  );
};

export default AppFooter;
