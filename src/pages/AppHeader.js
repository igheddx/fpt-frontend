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
} from "antd";
import {
  BellOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  SettingOutlined,
  LogoutOutlined,
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
import { setGlobalState, useGlobalState } from "../state/index";
import axiosInstance from "../hooks/axiosInstance";
import ReusableSearch from "../components/ReuseableSearch";

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

  const [searchResults1, setSearchResults1] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const showDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);
  const showSettingsDrawer = () => setSettingsOpen(true);
  const closeSettingsDrawer = () => setSettingsOpen(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedData, setSelectedData] = useState(null);
  const [hideSuggestionDiv, setHideSuggestionDiv] = useState(false);
  const inputRef = useRef(null); // Ref for input field
  const suggestionsRef = useRef(null);

  const { darkMode, toggleTheme } = useDarkMode(); // ✅ use global context instead of local state

  // useEffect(() => {
  //   if (searchQuery.length > 2) {
  //     fetchSuggestions();
  //   } else {
  //     setSuggestions([]);
  //   }
  // }, [searchQuery]);

  // Side effect to control body overflow
  // useEffect(() => {
  //   if (open || settingsOpen) {
  //     document.body.style.overflow = "hidden"; // Disable scrolling when drawers are open
  //   } else {
  //     document.body.style.overflow = "auto"; // Enable scrolling when drawers are closed
  //   }

  //   return () => {
  //     document.body.style.overflow = "auto"; // Clean up when component unmounts
  //   };
  // }, [open, settingsOpen]);

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
  };

  // Close suggestions when clicking outside
  // useEffect(() => {
  //   const handleClickAway = (event) => {
  //     if (
  //       inputRef.current?.input &&       !inputRef.current?.input.contains(event.target) &&
  //       suggestionsRef.current &&!suggestionsRef.current.contains(event.target)
  //     ) {
  //       setSuggestions([]);
  //     }
  //   };

  //   setHideSuggestionDiv(true);
  //   document.addEventListener("mousedown", handleClickAway); // Listen for clicks outside
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickAway); // Cleanup on unmount
  //   };
  // }, [suggestionsRef]);

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

  // Remove automatic navigation effects - only navigate on explicit user actions
  // useEffect(() => {
  //   // Only navigate if selectedData exists and is not null/undefined
  //   if (selectedData && Object.keys(selectedData).length > 0) {
  //     console.log("ENDING Selected data changed:", JSON.stringify(selectedData));
  //     navigate("/search", { state: [selectedData], key: Date.now().toString() });
  //   }
  // }, [selectedData]);

  // useEffect(() => {
  //   // Only navigate if searchResults1 has actual results
  //   if (searchResults1 && searchResults1.length > 0) {
  //     console.log("ENDING Selected data changed:", JSON.stringify(searchResults1));
  //     navigate("/search", {
  //       state: searchResults1,
  //       key: Date.now().toString(),
  //     });
  //   }
  // }, [searchResults1]);

  // useEffect(() => {
  //   // Only navigate if searchQuery is not empty and user actually searched
  //   if (searchQuery && searchQuery.trim().length > 0) {
  //     navigate("/search", { state: { query: searchQuery } });
  //   }
  // }, [searchQuery]);

  const fetchData = async (query) => {
    setSuggestions([]);
    setHideSuggestionDiv(false);
    console.log("@@QUERY@@==", query);

    try {
      // Use GET request to the new resource search endpoint
      const response = await axiosInstance.get("/api/resource/search", {
        params: {
          q: query,
        },
      });

      console.log("Full Resource Search Response:", response?.data);

      // The API returns an array of resources
      const resources = response?.data || [];
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
        } else {
          console.log("no record found after filtering");
          return [];
        }
      } else {
        console.log("No resources found or resources is not an array");
        return [];
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);

      // Log Axios error details
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
      }

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
    setSelectedStudent(student);
    const searchTerm = "example"; // The data you want to pass
    navigate("/search", { state: [student] });
    //navigate("/search");
    setSearchResults([]);
  };

  // const toggleTheme = () => {
  //   setDarkMode(!darkMode);
  // };

  const handleLogout = () => {
    console.log("logout was called");
    setSettingsOpen(false);
    setGlobalState("isAuthenticated", false);
    //setGlobalState("isAuthenticated", false);
    /*clear sessions*/
    sessionStorage.removeItem("profileData");
    sessionStorage.removeItem("xapikey");
    sessionStorage.removeItem("xapikeyNoAccessToken");
    sessionStorage.removeItem("cloudAccountData");
    sessionStorage.removeItem("profileId");
    sessionStorage.removeItem("roleData");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");

    // Clear account context from session storage
    sessionStorage.removeItem("accountContext");

    navigate("/");
  };

  const notifications = [
    { title: "New Message", description: "You have received a new message" },
    { title: "System Alert", description: "Scheduled maintenance at 10 PM" },
  ];

  // Use the context version instead
  const items = getContextNavigationItems();

  const highlightText = (text) => {
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return text.replace(regex, `<b>$1</b>`);
  };
  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: darkMode ? "#1e1e1e" : "#ffffff",
          colorTextBase: darkMode ? "#fff" : "#000",
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
          <img src={logo} alt="Logo" style={{ height: 40, marginRight: 64 }} />
          {console.log("isAuthenticated==", JSON.stringify(selectedData))}
          {isAuthenticated ? (
            <>
              <div style={{ position: "relative" }}>
                {/* <Search
                  placeholder="Search..."
                  style={{ width: 250, padding: 10, marginRight: 64 }}
                  onChange={handleSearchChange}
                  onSearch={handleSearch}
                  value={searchQuery}
                /> */}

                <ReusableSearch
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
                />

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
              <Badge count={notifications.length} style={{ marginRight: 20 }}>
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
                style={{ fontSize: 24, color: "#fff", cursor: "pointer" }}
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
          style={{ background: darkMode ? "#001529" : "#ffffff", zIndex: 2000 }}
        >
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.title}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </Drawer>

        <Drawer
          title="Settings"
          placement="right"
          onClose={closeSettingsDrawer}
          open={settingsOpen}
          style={{ background: darkMode ? "#001529" : "#ffffff", zIndex: 2000 }}
        >
          <List>
            <List.Item
              onClick={toggleTheme}
              style={{ cursor: "pointer", color: darkMode ? "#fff" : "#000" }}
            >
              {darkMode ? (
                <SunOutlined style={{ color: "#fff" }} />
              ) : (
                <MoonOutlined style={{ color: "#000" }} />
              )}{" "}
              Toggle Dark Mode
            </List.Item>

            <List.Item
              onClick={handleLogout}
              style={{ cursor: "pointer", color: darkMode ? "#fff" : "#000" }}
            >
              <LogoutOutlined style={{ color: darkMode ? "#fff" : "#000" }} />{" "}
              Logout
            </List.Item>
          </List>
        </Drawer>
      </Layout>
    </ConfigProvider>
  );
};

export default AppHeader;
