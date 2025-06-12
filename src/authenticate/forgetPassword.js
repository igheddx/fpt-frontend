import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Input, Button, Card, Typography, Alert } from "antd";
import { useDarkMode } from "../config/DarkModeContext";
import useApi from "../hooks/useApi";

const { Title } = Typography;

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState(null); // Add profileId state
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const location = useLocation();
  const apiCall = useApi();

  useEffect(() => {
    console.log("Navigation state:", location.state);
    if (location.state?.email) {
      setEmail(location.state.email);
      form.setFieldsValue({ email: location.state.email });
    }
    if (location.state?.profileId) {
      setProfileId(location.state.profileId);
    }
  }, [location.state?.email, location.state?.profileId, form]);

  const handleEmailSubmit = () => {
    form
      .validateFields(["email"])
      .then((values) => {
        setEmail(values.email);
        // TODO: Send verification code to the provided email
        setStep(2);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleVerificationSubmit = () => {
    form
      .validateFields(["verificationCode"])
      .then((values) => {
        // TODO: Verify the code
        setStep(3);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };
  const handlePasswordReset = () => {
    setError("");
    setLoading(true);

    form
      .validateFields(["currentPassword", "newPassword", "confirmPassword"])
      .then(async (values) => {
        if (!profileId) {
          setError("Profile ID is missing. Please try again.");
          setLoading(false);
          return;
        }

        console.log("Resetting password for profileId:", profileId);
        if (values.newPassword !== values.confirmPassword) {
          setError("New password and confirm password do not match.");
          setLoading(false);
          return;
        }
        try {
          await apiCall({
            method: "put",
            url: `/api/profile/${profileId}/password`,
            data: {
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            },
          });

          // Password reset successful
          setLoading(false);
          navigate("/", {
            state: {
              email,
              passwordReset: true,
              message:
                "Your password has been changed successfully. Please login with your new password.",
            },
          });
        } catch (error) {
          setError(
            error.response?.data?.message ||
              error.message ||
              "Failed to reset password. Please try again."
          );
          setLoading(false);
        }
      })
      .catch((info) => {
        console.log("Validation Failed:", info);
        setLoading(false);
      });
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: darkMode ? "#121212" : "#f0f2f5", // 👈 add this line
        transition: "background-color 0.3s ease", // optional for smooth transition
      }}
    >
      <Card
        style={{
          width: 400,
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
        }}
      >
        {location.state?.message && (
          <Alert
            message={location.state.message}
            type="info"
            showIcon
            style={{
              marginBottom: 16,
              backgroundColor: darkMode ? "#2a2a2a" : "#fff",
              color: darkMode ? "#fff" : "#000",
            }}
          />
        )}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{
              marginBottom: 16,
              backgroundColor: darkMode ? "#2a2a2a" : "#fff",
              color: darkMode ? "#fff" : "#000",
            }}
          />
        )}
        <Title level={3} style={{ textAlign: "center" }}>
          {location.state?.isVerified === false
            ? "Account Verification"
            : "Change Password"}
        </Title>
        {step === 1 && (
          <Form
            form={form}
            layout="vertical"
            initialValues={{ email: location.state?.email }}
          >
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input disabled={location.state?.email} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleEmailSubmit} block>
                Continue
              </Button>
            </Form.Item>
          </Form>
        )}
        {step === 2 && (
          <Form form={form} layout="vertical">
            <Form.Item
              name="verificationCode"
              label="Verification Code"
              rules={[
                {
                  required: true,
                  message: "Please input the verification code!",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleVerificationSubmit} block>
                Verify
              </Button>
            </Form.Item>
          </Form>
        )}
        {step === 3 && (
          <Form form={form} layout="vertical">
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[
                {
                  required: true,
                  message: "Please input your current password!",
                },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: "Please input your new password!" },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
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
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                onClick={handlePasswordReset}
                loading={loading}
                disabled={loading}
                block
              >
                {loading ? "Resetting Password..." : "Continue"}
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
