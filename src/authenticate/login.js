import React, { useState, useEffect } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import {
  Card,
  Input,
  Button,
  Checkbox,
  Typography,
  Form,
  Alert,
  Space,
  message,
} from "antd";

import { useAccountContext } from "../contexts/AccountContext";
import { useDarkMode } from "../config/DarkModeContext";
import useEncryptDecrypt from "../hooks/useEncryptDescrypt";
import axiosInstance from "../hooks/axiosInstance";
import { setGlobalState, useGlobalState } from "../state/index";
import { useNotification } from "../context/NotificationContext";
import { useApi } from "../hooks/useApi";
import logo from "../img/logo.png";

const { Title } = Typography;

// Password validation helper function
const validatePassword = (password, username, email) => {
  const errors = [];

  // Check minimum length
  if (password.length < 12) {
    errors.push("At least 12 characters");
  }

  // Check character types
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*]/.test(password);

  const characterTypesCount = [
    hasLowerCase,
    hasUpperCase,
    hasNumbers,
    hasSpecialChars,
  ].filter(Boolean).length;

  if (characterTypesCount < 3) {
    errors.push(
      "Must include at least 3 of: lowercase, uppercase, numbers, special characters (!@#$%^&*)"
    );
  }

  // Check for username/email presence
  const emailPrefix = email?.split("@")[0];
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    errors.push("Cannot contain username");
  }
  if (
    emailPrefix &&
    password.toLowerCase().includes(emailPrefix.toLowerCase())
  ) {
    errors.push("Cannot contain email prefix");
  }

  // Check common passwords
  const commonPasswords = ["password", "123456", "qwerty", "admin123"];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Cannot use a common password");
  }

  return errors;
};

const Login = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(location.state?.email || "");
  const [isPasswordReset, setIsPasswordReset] = useState(
    location.state?.passwordReset || false
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [incorrectLogin, setIncorrectLogin] = useState(false);
  const [isReauthenticate, setIsReauthenticate] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [position, setPosition] = useState("end");
  const [isDisabled, setIsDisabled] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const { switchContext } = useAccountContext();
  const [isAuthenticated] = useGlobalState("isAuthenticated");
  const [loadingStep, setLoadingStep] = useState(""); // Track which step is loading
  const { apiCall } = useApi();
  const { updateUnreadCount } = useNotification();
  const [authError, setAuthError] = useState(false);

  const { getEncryptDecryptNoUserName, getEncryptDecryptWithUserName } =
    useEncryptDecrypt();

  useEffect(() => {
    sessionStorage.removeItem("profileData");
    sessionStorage.removeItem("xapikey");
    sessionStorage.removeItem("xapikeyNoAccessToken");
    sessionStorage.removeItem("cloudAccountData");
    sessionStorage.removeItem("profileId");
    sessionStorage.removeItem("roleData");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    // Clear account context on login page load
    sessionStorage.removeItem("accountContext");
  }, []);

  // If user is already authenticated, redirect them
  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    const refreshToken = sessionStorage.getItem("refreshToken");

    if (isAuthenticated || (accessToken && refreshToken)) {
      // If we have tokens but not authenticated in state, update the state
      if (!isAuthenticated && accessToken && refreshToken) {
        setGlobalState("isAuthenticated", true);
        setGlobalState("token", accessToken);
        setGlobalState("refreshToken", refreshToken);
      }

      // Always redirect to dashboard on login
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Helper function to fetch unread notifications count
  const fetchUnreadCount = async (profileId) => {
    try {
      const count = await apiCall({
        method: "GET",
        url: `/api/Notification/unread-count?profileId=${profileId}`,
      });
      updateUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
    }
  };

  // Helper function to find and set default account context
  const setDefaultAccountContext = async (
    organizationsData,
    userAccessLevel
  ) => {
    try {
      console.log(
        "Setting default account context with access level:",
        userAccessLevel
      );
      console.log("Organizations data:", organizationsData);

      // Look through all organizations, customers, and accounts to find default
      for (const org of organizationsData.organizations || []) {
        for (const customer of org.customers || []) {
          for (const account of customer.accounts || []) {
            if (account.defaultAccount === true) {
              console.log("Found default account:", account);

              // Auto-set the account context
              const context = {
                organizationId: org.orgId,
                organizationName: org.name,
                customerId: customer.customerId,
                customerName: customer.name,
                accountId: account.accountId,
                accountName: account.name,
                cloudType: account.cloudType,
                accessLevel: userAccessLevel, // From profile
                permissions: account.role || "viewer", // Role from defaultAccount
              };
              console.log("Setting account context:", context);
              switchContext(context);

              // Fetch unread notifications count after setting context
              const profileId = sessionStorage.getItem("profileId");
              if (profileId) {
                await fetchUnreadCount(profileId);
              }

              console.log(
                "Auto-set account context for default account with accessLevel:",
                userAccessLevel,
                "and permissions:",
                account.role
              );
              return true; // Found and set default account
            }
          }
        }
      }

      console.log("No default account found in organizations data");
      return false;
    } catch (error) {
      console.error("Error setting default account context:", error);
      return false;
    }
  };

  // Handle navigation state
  useEffect(() => {
    // Check for auth error message from token expiration
    const authError = sessionStorage.getItem("authError");
    if (authError) {
      setError(authError);
      setIncorrectLogin(true);
      sessionStorage.removeItem("authError"); // Clear the error after displaying it
    }

    if (location.state?.email) {
      setEmail(location.state.email);
      form.setFieldsValue({ email: location.state.email });
    }
    if (location.state?.passwordReset) {
      setIsPasswordReset(true);
    }
  }, [location.state, form]);

  useEffect(() => {
    // Check backend connectivity on component mount
    const checkBackend = async () => {
      const isAccessible = await axiosInstance.ping();
      if (!isAccessible) {
        setError(
          "Unable to connect to server. Please check your connection or try again later."
        );
      }
    };
    checkBackend();
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location.state, form]);

  const authenticate = async (values) => {
    try {
      setLoadingStep("authenticating");
      setLoading(true);
      setError("");
      setAuthError(false); // Reset error state

      // Step 1: Get initial API key without username
      await getEncryptDecryptNoUserName();

      // Step 2: Authenticate with enhanced context
      const authResponse = await axiosInstance.post(
        "/api/Profile/authenticate-enhanced",
        {
          username: values.email,
          password: values.password,
        },
        {
          headers: {
            "X-Api-Key": sessionStorage.getItem("xapikeyNoAccessToken"),
          },
        }
      );

      if (!authResponse.data) {
        throw new Error("No data received from authentication request");
      }

      const authData = authResponse.data;
      console.log("Authentication response:", authData);

      if (!authData.success) {
        setAuthError(true); // Set error state on failed authentication
        throw new Error(authData.message || "Authentication failed");
      }

      // Step 3: Store authentication data
      const profileData = {
        profileId: authData.profileId,
        firstName: authData.firstName,
        lastName: authData.lastName,
        email: authData.email,
        accessLevel: authData.accessLevel,
      };

      sessionStorage.setItem("profileData", JSON.stringify(profileData));
      sessionStorage.setItem("accessLevel", authData.accessLevel);
      sessionStorage.setItem("profileId", authData.profileId);
      sessionStorage.setItem("accessToken", authData.token);
      sessionStorage.setItem("refreshToken", authData.refreshToken);

      // Step 4: Get API key with username
      await getEncryptDecryptWithUserName(values.email);

      // Step 5: Set up account context from enhanced auth response
      if (authData.defaultAccountContext) {
        console.log(
          "Setting default account context:",
          authData.defaultAccountContext
        );
        const context = {
          profileId: authData.profileId,
          firstName: authData.firstName,
          lastName: authData.lastName,
          email: authData.email,
          accessLevel: authData.accessLevel,
          organizationId: authData.defaultAccountContext.organizationId,
          organizationName: authData.defaultAccountContext.organizationName,
          customerId: authData.defaultAccountContext.customerId,
          customerName: authData.defaultAccountContext.customerName,
          accountId: authData.defaultAccountContext.accountId,
          accountName: authData.defaultAccountContext.accountName,
          cloudType: authData.defaultAccountContext.cloudType,
          permissions: authData.defaultAccountContext.role || "viewer",
        };

        // Set the context
        switchContext(context);
      } else {
        console.log(
          "No default account context found - user will need to select context manually"
        );
      }

      // Step 6: Set global authentication state
      setGlobalState("isAuthenticated", true);
      setGlobalState("token", authData.token);
      setGlobalState("refreshToken", authData.refreshToken);

      // Step 7: Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Authentication error:", error);
      setError(error.response?.data?.message || "Authentication failed");
      setIncorrectLogin(true);
      setAuthError(true); // Set error state on any error
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: darkMode ? "#141414" : "#f0f2f5",
      }}
    >
      <div
        style={{
          width: 400, // Match Card width
          display: "flex",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        <img src={logo} alt="Logo" style={{ height: 135, width: "auto" }} />
      </div>
      <Card
        style={{
          width: 400,
          background: darkMode ? "#2d2d2d" : "#fff",
          boxShadow: "none",
          border: "none",
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {authError && (
            <Alert
              message="Email or Password is incorrect."
              type="error"
              showIcon
              style={{
                backgroundColor: darkMode ? "#2a1215" : undefined,
                borderColor: darkMode ? "#5b2526" : undefined,
                color: darkMode ? "#fff" : undefined,
                marginBottom: "16px",
              }}
            />
          )}
          <Title
            level={2}
            style={{
              textAlign: "center",
              color: darkMode ? "#fff" : "#000",
            }}
          >
            Login
          </Title>
          {location.state?.message && (
            <Alert
              message={location.state.message}
              type="info"
              showIcon
              style={{
                backgroundColor: darkMode ? "#1e1e1e" : "#fff",
                borderColor: darkMode ? "#434343" : "#d9d9d9",
              }}
              className={darkMode ? "dark-mode-alert" : ""}
            />
          )}
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => authenticate(values)}
            initialValues={{ remember: true }}
          >
            <Form.Item
              name="email"
              rules={[
                {
                  required: true,
                  message: "Please input your email!",
                },
                {
                  type: "email",
                  message: "Please enter a valid email!",
                },
              ]}
            >
              <Input
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
                disabled={isDisabled}
                size="large"
                className={darkMode ? "dark-mode-input" : ""}
                style={{
                  height: "45px",
                  fontSize: "16px",
                  backgroundColor: darkMode ? "#141414" : "#fff",
                  color: darkMode ? "#fff" : "#000",
                }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: "Please input your password!",
                },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const errors = validatePassword(
                      value,
                      null,
                      form.getFieldValue("email")
                    );
                    return errors.length === 0
                      ? Promise.resolve()
                      : Promise.reject(errors.join(", "));
                  },
                },
              ]}
            >
              <Input.Password
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={darkMode ? "dark-mode-input" : ""}
                disabled={isDisabled}
                size="large"
                style={{
                  height: "45px",
                  fontSize: "16px",
                }}
              />
            </Form.Item>
            <div style={{ marginBottom: "16px" }}>
              <Checkbox onChange={(e) => setRemember(e.target.checked)}>
                Remember me
              </Checkbox>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={loading || isDisabled}
                block
                size="large"
                style={{
                  height: "45px",
                  backgroundColor: "#06923E",
                  borderColor: "#06923E",
                  color: "white",
                }}
              >
                {loading ? "Authenticating..." : "Login"}
              </Button>
            </Form.Item>

            <div style={{ textAlign: "center" }}>
              <Button
                type="link"
                onClick={() => navigate("/forgetPassword")}
                style={{
                  padding: 0,
                  height: "auto",
                  color: darkMode ? "#1890ff" : "#1890ff",
                }}
              >
                Forgot Password?
              </Button>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
