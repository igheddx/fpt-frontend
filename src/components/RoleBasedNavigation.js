import React from "react";
import { Menu, Badge, Tooltip } from "antd";
import {
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  AuditOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccountContext } from "../contexts/AccountContext";

const RoleBasedNavigation = ({ style, mode = "horizontal" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accountContext, getNavigationItems, hasPermission } =
    useAccountContext();

  // If no account context, don't render navigation
  if (!accountContext) {
    return null;
  }

  const navigationItems = getNavigationItems();

  // Icon mapping for navigation items
  const iconMap = {
    dashboard: <DashboardOutlined />,
    admin: <TeamOutlined />,
    review: <AuditOutlined />,
    settings: <SettingOutlined />,
  };

  // Convert navigation items to Ant Design Menu items
  const menuItems = navigationItems.map((item) => ({
    key: item.key,
    icon: iconMap[item.key] || <UserOutlined />,
    label: item.label,
    onClick: () => navigate(item.path),
  }));

  // Get current selected key based on pathname
  const getSelectedKey = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/dashboard")) return "dashboard";
    if (path.includes("/admin")) return "admin";
    if (path.includes("/review")) return "review";
    if (path.includes("/settings")) return "settings";
    return "dashboard"; // Default selection
  };

  return (
    <div style={style}>
      {/* Account Context Display */}
      <div
        style={{
          marginBottom: mode === "vertical" ? 16 : 8,
          padding: "8px 12px",
          background: "#f5f5f5",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <div>
          <strong>{accountContext.customerName}</strong> -{" "}
          {accountContext.accountName}
        </div>
        <div>
          <Badge
            color={
              accountContext.role === "Admin"
                ? "red"
                : accountContext.role === "Approver"
                ? "orange"
                : "blue"
            }
            text={accountContext.role?.toUpperCase()}
          />
          <span style={{ marginLeft: 8, color: "#999" }}>
            {accountContext.cloudType}
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <Menu
        mode={mode}
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        style={{ border: "none" }}
      />
    </div>
  );
};

export default RoleBasedNavigation;
