import React, { useState } from "react";
import { useDarkMode } from "../config/DarkModeContext";
import useEncryptDecrypt from "../hooks/useEncryptDescrypt";
import axiosInstance from "../hooks/axiosInstance";
import { Form, Input, Button, message, Card, Typography, Space } from "antd";
import { MailOutlined, SafetyOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ForgetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState("email"); // "email" or "verification"
  const [userEmail, setUserEmail] = useState("");
  const { darkMode } = useDarkMode();
  const { getEncryptDecryptNoUserName } = useEncryptDecrypt();

  const handleEmailSubmit = async (values) => {
    setLoading(true);
    try {
      // Generate API key for public endpoints
      await getEncryptDecryptNoUserName();

      // Use the correct endpoint for requesting verification code by email
      const response = await axiosInstance.post(
        "/api/Verification/request-code-by-email",
        {
          email: values.email,
        },
        {
          headers: {
            "X-Api-Key": sessionStorage.getItem("xapikeyNoAccessToken"),
          },
        }
      );

      // Store email and transition to verification step
      setUserEmail(values.email);
      setCurrentStep("verification");
      message.success(
        "If the email exists, a verification code has been sent to your email"
      );
    } catch (error) {
      console.error("❌ [ForgetPassword] Error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to send password reset instructions";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (values) => {
    setLoading(true);
    try {
      // Generate API key for public endpoints
      await getEncryptDecryptNoUserName();

      // Use the password reset endpoint
      const response = await axiosInstance.post(
        "/api/PasswordSetup/reset-password",
        {
          email: userEmail,
          verificationCode: values.verificationCode,
          newPassword: values.newPassword,
        },
        {
          headers: {
            "X-Api-Key": sessionStorage.getItem("xapikeyNoAccessToken"),
          },
        }
      );

      message.success(
        "Password reset successfully! You can now log in with your new password."
      );
      // Optionally redirect to login page
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.error("❌ [PasswordReset] Error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to reset password";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setCurrentStep("email");
    setUserEmail("");
  };

  const renderEmailStep = () => (
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
          Forgot Password
        </Title>
        <Text
          style={{ textAlign: "center", color: darkMode ? "#ccc" : "#666" }}
        >
          Enter your email address and we'll send you a verification code to
          reset your password.
        </Text>
        <Form onFinish={handleEmailSubmit} layout="vertical">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                backgroundColor: "#06923E",
                borderColor: "#06923E",
                color: "white",
              }}
            >
              Send Reset Instructions
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );

  const renderVerificationStep = () => (
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
          Reset Password
        </Title>
        <Text
          style={{ textAlign: "center", color: darkMode ? "#ccc" : "#666" }}
        >
          Enter the verification code sent to <strong>{userEmail}</strong> and
          your new password.
        </Text>
        <Form onFinish={handlePasswordReset} layout="vertical">
          <Form.Item
            name="verificationCode"
            rules={[
              {
                required: true,
                message: "Please input the verification code!",
              },
            ]}
          >
            <Input
              prefix={<SafetyOutlined />}
              placeholder="Verification Code"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: "Please input your new password!" },
              {
                min: 8,
                message: "Password must be at least 8 characters long!",
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
              { required: true, message: "Please confirm your new password!" },
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
              style={{
                backgroundColor: "#06923E",
                borderColor: "#06923E",
                color: "white",
              }}
            >
              Reset Password
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              type="link"
              onClick={handleBackToEmail}
              block
              style={{
                color: darkMode ? "#1890ff" : "#1890ff",
              }}
            >
              Back to Email Entry
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );

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
      {currentStep === "email" ? renderEmailStep() : renderVerificationStep()}
    </div>
  );
};

export default ForgetPassword;
