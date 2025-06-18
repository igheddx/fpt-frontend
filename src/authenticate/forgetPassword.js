import React, { useState } from "react";
import { useDarkMode } from "../config/DarkModeContext";
import { useApi } from "../hooks/useApi";
import { Form, Input, Button, message, Card, Typography, Space } from "antd";
import { MailOutlined } from "@ant-design/icons";

const { Title } = Typography;

const ForgetPassword = () => {
  const [loading, setLoading] = useState(false);
  const { darkMode } = useDarkMode();
  const { apiCall } = useApi();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await apiCall({
        method: "POST",
        url: "/api/Auth/forgot-password",
        data: values,
      });
      message.success("Password reset instructions sent to your email");
    } catch (error) {
      console.error("❌ [ForgetPassword] Error:", error);
      message.error("Failed to send password reset instructions");
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
            Forgot Password
          </Title>
          <Form onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email"
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
                Send Reset Instructions
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default ForgetPassword;
