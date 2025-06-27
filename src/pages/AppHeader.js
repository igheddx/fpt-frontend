import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import {
  Layout,
  Menu,
  Input,
  Badge,
  Avatar,
  Drawer,
  List,
  ConfigProvider,
  Table,
  Divider,
  Button,
} from "antd";
import {
  BellOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import Dashboard from "./Dashboard";
import Admin from "./Admin";
//import Profile from "./Profile";
import { useAccountContext } from "../contexts/AccountContext";
import RoleBasedNavigation from "../components/RoleBasedNavigation";
import logo from "../img/logo.png";
import Login from "../authenticate/login";
import SearchComp from "../components/Search";
import Review from "../pages/Review";
import ForgotPassword from "../authenticate/forgetPassword";
import "../index.css";
import { useDarkMode } from "../config/DarkModeContext"; // Import the provider
import { render } from "@testing-library/react";
import { useGlobalState, setGlobalState } from "../state";
import axiosInstance from "../hooks/axiosInstance";
import ReusableSearch from "../components/ReuseableSearch";
import { useApi } from "../hooks/useApi";
import { useNotification } from "../context/NotificationContext";
import { useNotifications } from "../hooks/useNotifications";

const { Header, Content, Footer } = Layout;
const { Search } = Input;

const students = [
  { id: 1, name: "John Doe", age: 20, grade: "A" },
  { id: 2, name: "Jane Smith", age: 22, grade: "B" },
  { id: 3, name: "Alice Johnson", age: 21, grade: "A" },
  { id: 4, name: "Bob Brown", age: 23, grade: "C" },
  { id: 5, name: "Charlie White", age: 19, grade: "B" },
];

const AppHeader = () => {
  const isAuthenticated = useGlobalState("isAuthenticated");
  const { accountContext, getNavigationItems: getContextNavigationItems } =
    useAccountContext(); // Add context integration
  const [settingsOpen, setSettingsOpen] = useState(false); // Settings drawer state
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { unreadCount } = useNotification();
  const { notifications, loading, markAsViewed } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults1, setSearchResults1] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [hideSuggestionDiv, setHideSuggestionDiv] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const { darkMode, toggleTheme } = useDarkMode();
  const { apiCall } = useApi();
  const inputRef = useRef(null); // Ref for input field
  const suggestionsRef = useRef(null);

  const showDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);
  const showSettingsDrawer = () => setSettingsOpen(true);
  const closeSettingsDrawer = () => setSettingsOpen(false);

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
  };

  const fetchSearchDataOld = async (query) => {
    try {
      console.log("Fetching users with query:", query);

      //console.log(JSON.stringify(existingCloudAccounts));
      //const res = await axiosInstance.get(`/api/users/search?q=${query}`);
      return []; //existingCloudAccounts;
      //return res.data;
    } catch (err) {
      console.error("Search error:", err);
      return [];
    }
  };

  const fetchData = async (query) => {
    setSuggestions([]);
    setHideSuggestionDiv(false);
    console.log("@@QUERY@@==", query);

    try {
      const response = await apiCall({
        method: "GET",
        url: "/api/resource/search",
        params: { q: query },
      });

      console.log("Full Resource Search Response:", response);

      // The API returns an array of resources
      const resources = response || [];
      console.log("Resource Table Results:", resources);
      console.log("Number of Resource Table Results:", resources.length);

      if (Array.isArray(resources) && resources.length > 0) {
        // Optionally filter or map results for suggestions
        const suggestionMatchResults = resources.filter(
          (resource) =>
            resource.name?.toLowerCase().includes(query.toLowerCase()) ||
            resource.type?.toLowerCase().includes(query.toLowerCase()) ||
            resource.category?.toLowerCase().includes(query.toLowerCase()) ||
            resource.region?.toLowerCase().includes(query.toLowerCase()) ||
            resource.status?.toLowerCase().includes(query.toLowerCase())
        );

        console.log("Filtered suggestion results:", suggestionMatchResults);
        console.log(
          "Number of filtered results:",
          suggestionMatchResults.length
        );

        if (suggestionMatchResults.length > 0) {
          console.log(
            "Returning suggestions:",
            suggestionMatchResults.slice(0, 10)
          );
          return suggestionMatchResults.slice(0, 10); // Limit to 10 results
        }
      }

      return [];
    } catch (error) {
      console.error("Error searching resources:", error);
      return [];
    }
  };

  const handleSearch = (value) => {
    console.log("search was clicked==", value);
    if (value) {
      setHideSuggestionDiv(true);
      const searchTerm = value; // The data you want to pass
      navigate("/search", { state: { query: searchTerm } });
    }
  };

  const handleSuggestionClick = (suggestion) => {
    console.log("HandleSuggestionClick was clicked");
    //setSearchQuery(suggestion.arn);
    setHideSuggestionDiv(true);
    setSuggestions([]);
    //console.log(" handleSuggestion Click before I get to search isSuggestionSelected ==",isSuggestionSelected);

    console.log("NOAH");
    navigate("/search", { state: [suggestion], key: Date.now().toString() });

    // handleSearch(suggestion.arn);
  };

  const handleSelectStudent = (student) => {
    setSelectedData(student);
    const searchTerm = "example"; // The data you want to pass
    navigate("/search", { state: [student] });
    //navigate("/search");
    setSearchResults([]);
  };

  const handleLogout = () => {
    console.log("logout was called");

    // First clear all session storage items
    sessionStorage.clear(); // This will clear everything including token and apiKey

    // Then update the global state
    setGlobalState("isAuthenticated", false);
    setGlobalState("user", {});
    setGlobalState("token", null);
    setGlobalState("apiKey", null);

    // Close any open drawers
    setSettingsOpen(false);

    // Navigate to login page
    navigate("/login");
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isViewed) {
      await markAsViewed(notification.id);
    }
  };

  // Use the context version instead
  const items = getContextNavigationItems();

  const highlightText = (text) => {
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return text.replace(regex, `<b>$1</b>`);
  };
  return (
    <ConfigProvider
      theme={{
        components: {
          Layout: {
            headerBg: darkMode ? "#001529" : "#001529",
            headerColor: "#fff",
          },
        },
      }}
    >
      <Layout style={{ minHeight: "100vh", margin: 0 }}>
        <Header
          style={{
            position: "sticky",
            top: 0,
            left: 0,
            zIndex: 1000,
            width: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            margin: 0,
            background: "#1e1e1e", //"#001529", // Header always dark
            color: "#fff",
            height: "64px", // Ensure a fixed height for the header
            boxSizing: "border-box", // Prevent any border/padding issues
          }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{
              height: 135,
              width: "auto",
              marginRight: 24,
              cursor: "pointer",
            }}
            onClick={() => navigate("/dashboard")}
          />
          {isAuthenticated ? (
            <>
              <Button
                icon={<SearchOutlined style={{ fontSize: "20px" }} />}
                type="text"
                style={{
                  color: "#fff",
                  marginRight: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => navigate("/advanced-search")}
              />
              <div style={{ position: "relative" }}>
                {/* <Search
                  placeholder="Search..."
                  style={{ width: 250, padding: 10, marginRight: 64 }}
                  onChange={handleSearchChange}
                  onSearch={handleSearch}
                  value={searchQuery}
                /> */}

                {/* <ReusableSearch
                  fetchData={fetchData}
                  queryString={(qry) => setSearchQuery(qry)}
                  onSelect={(data) => {
                    setSelectedData(data);
                    // Navigate to search page when user selects an item
                    if (data && Object.keys(data).length > 0) {
                      navigate("/search", {
                        state: [data],
                        key: Date.now().toString(),
                      });
                    }
                  }}
                  placeholder="Search..."
                  displayKey={"name"}
                  isShowSearchButton={true}
                  disableSearchTrigger={true}
                  inputStyle={{
                    width: "300px",
                    height: "40px", // Match large size height
                    borderRadius: "8px",
                  }}
                /> */}

                {/* {suggestions.map((item) => item.arn)} */}

                {/* {suggestions.length > 0 && !hideSuggestionDiv && (
                  <div
                    ref={suggestionsRef}
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      width: "100%",
                      maxHeight: "300px",
                      overflowY: "auto",
                      background: darkMode ? "#333" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                      zIndex: 1000,
                      borderRadius: 4,
                      //overflow: "hidden",
                      border: darkMode ? "1px solid #555" : "1px solid #ccc",
                    }}
                  >
                    {suggestions.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "4px 6px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          //whiteSpace: "normal",
                          wordBreak: "break-word",
                          borderBottom: darkMode
                            ? "1px solid #555"
                            : "1px solid #ddd",
                          fontSize: "14px",
                        }}
                        onClick={() => handleSuggestionClick(item)}
                        dangerouslySetInnerHTML={{
                          __html: highlightText(item.arn),
                        }} // Only this, no children
                      />
                    ))}
                  </div>
                )} */}
              </div>
              {/* Account Context Display
              {accountContext && (
                <div
                  style={{
                    marginLeft: "16px",
                    marginRight: "16px",
                    padding: "4px 12px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "#fff",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>
                    {accountContext.accountName}
                  </div>
                  <div style={{ opacity: 0.8 }}>
                    {accountContext.currentRole?.toUpperCase()} •{" "}
                    {accountContext.cloudType}
                  </div>
                </div>
              )} */}
              <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[window.location.pathname]}
                items={items.map((item, index) => ({
                  key: item.path,
                  label: (
                    <div
                      key={index}
                      style={{ width: 120, textAlign: "center" }}
                    >
                      {item.label}
                    </div>
                  ),
                }))}
                onClick={({ key }) => navigate(key)}
                style={{ flex: 1, minWidth: 0, background: "transparent" }}
              />
              <Badge count={unreadCount} style={{ marginRight: 20 }}>
                <BellOutlined
                  style={{ fontSize: 24, color: "#fff", cursor: "pointer" }}
                  onClick={showDrawer}
                />
              </Badge>
              <Avatar
                icon={<UserOutlined />}
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/profile")}
              />
              <SettingOutlined
                style={{
                  fontSize: 24,
                  color: "#fff",
                  cursor: "pointer",
                  marginLeft: 20,
                }}
                onClick={showSettingsDrawer}
              />
            </>
          ) : (
            ""
          )}
        </Header>

        <Drawer
          title="Notifications"
          placement="right"
          onClose={closeDrawer}
          open={open}
          style={{
            background: darkMode ? "#000000" : "#ffffff",
            zIndex: 2000,
          }}
          styles={{
            header: {
              background: darkMode ? "#000000" : "#ffffff",
              color: darkMode ? "#ffffff" : "#000000",
              borderBottom: darkMode ? "1px solid #333" : "1px solid #f0f0f0",
            },
            body: {
              background: darkMode ? "#000000" : "#ffffff",
              color: darkMode ? "#ffffff" : "#000000",
            },
            content: {
              background: darkMode ? "#000000" : "#ffffff",
            },
            wrapper: {
              background: darkMode ? "#000000" : "#ffffff",
            },
          }}
        >
          <List
            loading={loading}
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleNotificationClick(item)}
                style={{
                  cursor: "pointer",
                  backgroundColor: !item.isViewed
                    ? darkMode
                      ? "#1a1a1a"
                      : "#f0f5ff"
                    : "transparent",
                  color: darkMode ? "#ffffff" : "#000000",
                  borderBottom: darkMode
                    ? "1px solid #333"
                    : "1px solid #f0f0f0",
                }}
              >
                <List.Item.Meta
                  title={
                    <span style={{ color: darkMode ? "#ffffff" : "#000000" }}>
                      {item.type}
                    </span>
                  }
                  description={
                    <>
                      <div style={{ color: darkMode ? "#cccccc" : "#666666" }}>
                        {item.message}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: darkMode ? "#888888" : "#666666",
                        }}
                      >
                        {new Date(item.createDateTime).toLocaleString()}
                      </div>
                    </>
                  }
                />
              </List.Item>
            )}
            locale={{
              emptyText: (
                <span style={{ color: darkMode ? "#888888" : "#666666" }}>
                  No notifications
                </span>
              ),
            }}
          />
        </Drawer>

        <Drawer
          title="Settings"
          placement="right"
          onClose={closeSettingsDrawer}
          open={settingsOpen}
          style={{
            background: darkMode ? "#000000" : "#ffffff",
            zIndex: 2000,
          }}
          styles={{
            header: {
              background: darkMode ? "#000000" : "#ffffff",
              color: darkMode ? "#ffffff" : "#000000",
              borderBottom: darkMode ? "1px solid #333" : "1px solid #f0f0f0",
            },
            body: {
              background: darkMode ? "#000000" : "#ffffff",
              color: darkMode ? "#ffffff" : "#000000",
            },
            content: {
              background: darkMode ? "#000000" : "#ffffff",
            },
            wrapper: {
              background: darkMode ? "#000000" : "#ffffff",
            },
          }}
        >
          <List>
            <List.Item
              onClick={toggleTheme}
              style={{
                cursor: "pointer",
                color: darkMode ? "#ffffff" : "#000000",
                borderBottom: darkMode ? "1px solid #333" : "1px solid #f0f0f0",
              }}
            >
              {darkMode ? (
                <SunOutlined style={{ color: "#ffffff", marginRight: "8px" }} />
              ) : (
                <MoonOutlined
                  style={{ color: "#000000", marginRight: "8px" }}
                />
              )}
              Toggle Dark Mode
            </List.Item>

            <List.Item
              onClick={handleLogout}
              style={{
                cursor: "pointer",
                color: darkMode ? "#ffffff" : "#000000",
                borderBottom: darkMode ? "1px solid #333" : "1px solid #f0f0f0",
              }}
            >
              <LogoutOutlined
                style={{
                  color: darkMode ? "#ffffff" : "#000000",
                  marginRight: "8px",
                }}
              />
              Logout
            </List.Item>
          </List>
        </Drawer>
      </Layout>
    </ConfigProvider>
  );
};

export default AppHeader;
