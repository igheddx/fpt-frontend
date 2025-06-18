import React, { useState } from "react";
import { useDarkMode } from "../config/DarkModeContext";
import { useApi } from "../hooks/useApi";
import { Form, Input, Button, message, Card, Typography, Space } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import useEncryptDecrypt from "../hooks/useEncryptDescrypt";

const { Title } = Typography;

// Password validation helper function from login.js
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

const ChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const { darkMode } = useDarkMode();
  const { apiCall } = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const { getEncryptDecryptNoUserName } = useEncryptDecrypt();

  // Extract token from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  // Redirect if no token is present
  React.useEffect(() => {
    if (!token) {
      message.error("Invalid or missing token");
      navigate("/login");
    }
  }, [token, navigate]);

  const handleSubmit = async (values) => {
    if (!token) {
      message.error("Invalid or missing token");
      return;
    }

    setLoading(true);
    try {
      // Get API key before making the request
      await getEncryptDecryptNoUserName();
      const apiKey = sessionStorage.getItem("xapikeyNoAccessToken");

      if (!apiKey) {
        throw new Error("Failed to get API key");
      }

      await apiCall({
        method: "POST",
        url: "/api/PasswordSetup/set-password",
        data: {
          token: token,
          newPassword: values.newPassword,
        },
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
      });

      message.success("Password set successfully");
      navigate("/login", {
        state: {
          message:
            "Password has been set successfully. Please login with your new password.",
        },
      });
    } catch (error) {
      console.error("❌ [ChangePassword] Error:", error);
      message.error(error.response?.data?.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: darkMode ? "#1e1e1e" : "#f0f2f5",
      }}
    >
      <Card
        style={{
          width: 400,
          background: darkMode ? "#2d2d2d" : "#fff",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Title
            level={2}
            style={{
              textAlign: "center",
              color: darkMode ? "#fff" : "#000",
            }}
          >
            Set New Password
          </Title>
          <Form onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="newPassword"
              rules={[
                { required: true, message: "Please input your new password!" },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const errors = validatePassword(value);
                    return errors.length === 0
                      ? Promise.resolve()
                      : Promise.reject(errors.join(", "));
                  },
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="New Password"
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                {
                  required: true,
                  message: "Please confirm your new password!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("The two passwords do not match!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm New Password"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                Set Password
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default ChangePassword;
