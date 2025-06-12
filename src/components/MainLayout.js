import React from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom"; // ✅ Import Outlet
import AppHeader from "../pages/AppHeader";
import AppFooter from "../pages/AppFooter";

const { Content, Footer } = Layout;
const MainLayout = () => (
  <Layout
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      margin: 0,
    }}
  >
    {" "}
    {/* Prevent any overflow */}
    <AppHeader />
    <Content
      style={{
        padding: "24px",
        marginTop: "-760px", // Ensures content starts below the header
        flex: 1, // Ensures content takes remaining space
        overflowY: "auto", // Enables vertical scrolling if content overflows
        position: "relative",
      }}
    >
      {/* Outlet will render the content of the current route */}
      <Outlet />
    </Content>
    <AppFooter />
  </Layout>
);

export default MainLayout;
