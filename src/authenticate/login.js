import React, { useState, useEffect } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { Card, Input, Button, Checkbox, Typography, Form, Alert } from "antd";

import useEncryptDecrypt from "../hooks/useEncryptDescrypt";
import axiosInstance from "../hooks/axiosInstance";
import useApi from "../hooks/useApi";
import { setGlobalState, useGlobalState } from "../state/index";
import { useDarkMode } from "../config/DarkModeContext";
import { useAccountContext } from "../contexts/AccountContext";

const { Title } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const apiCall = useApi();

  const [remember, setRemember] = useState(false);
  const isAuthenticated = useGlobalState("isAuthenticated");
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

  const {
    data: encryptDecryptDataWithUserName,
    getEncryptDecryptWithUserName,
  } = useEncryptDecrypt();
  const { data: encryptDecryptDataNoUserName, getEncryptDecryptNoUserName } =
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

  // Helper function to find and set default account context
  const setDefaultAccountContext = (organizationsData, userAccessLevel) => {
    try {
      // Look through all organizations, customers, and accounts to find default
      for (const org of organizationsData.organizations || []) {
        for (const customer of org.customers || []) {
          for (const account of customer.accounts || []) {
            if (account.defaultAccount === true) {
              console.log("Found default account:", account);

              // Auto-set the account context
              switchContext({
                organizationId: org.orgId,
                organizationName: org.name,
                customerId: customer.customerId,
                customerName: customer.name,
                accountId: account.accountId,
                accountName: account.name,
                cloudType: account.cloudType,
                accessLevel: userAccessLevel, // From profile
                permissions: account.role || "viewer", // Role from defaultAccount
              });

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

  /* authenticate users */
  const authenticate = async () => {
    setIsPasswordReset(false);
    setLoading(true);
    setError("");
    setIsDisabled(true);

    console.log("Username==", email);
    console.log("password==", password);
    console.log("encrypt ==", encryptDecryptDataNoUserName);
    try {
      const response = await axiosInstance.post("/api/profile/authenticate", {
        username: email,
        password: password,
      });

      let isSuccessful = response.data.success;
      let statusCode = response.status;
      let isVerified = response.data.isVerified;
      let data = response.data;
      let profileData = null;
      let roleData = null;
      let cloudAccountData = [];

      if (response.status == 200 && isSuccessful) {
        sessionStorage.setItem("accessToken", data.token);
        sessionStorage.setItem("refreshToken", data.refreshToken);
        sessionStorage.setItem("accessLevel", data.accessLevel);

        sessionStorage.setItem(
          "profileName",
          data.firstName + " " + data.lastName
        );
        //sessionStorage.setItem("isAuthenticated", true);
        setGlobalState("isAuthenticated", true);
        let isCustomerAdmin = false;
        let role = "";

        /*check to see if the role has "customer" which is equla to customer admin
        if role is customer, then we present admin view... if the myrole is nul then
        access dedault role array...*/
        data.role.reduce((result, current, i) => {
          if (current.role == "Customer") {
            //result.push(<div>DOMINIC {current}</div>);

            isCustomerAdmin = true;
            role = "Customer";
            console.log("Here 1==", role);
          } else {
            role = current.role;
            console.log("here 2==", role);
          }
          return result;
        }, []);

        profileData = {
          rofileUuid: data.profileUuid,
          customerId: data.customerId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: role,
          isCustomerAdmin: isCustomerAdmin,
          accessLevel: data.accessLevel,
        };

        /*do this if defaultAccountId is not 5 - use the 1 account as the default*/
        if (data.accounts.length == 1) {
          data.accounts.map((acct, key) => {
            let isMyDefaultAccount = false;

            isMyDefaultAccount = true;
            setGlobalState("defaultAccountId", acct.accountId); //this is where I am setting the defaultAccountId

            cloudAccountData.push({
              id: acct.accountId,
              label: acct.cloudProviderName + " - " + acct.cloudAccountId,
              success: acct.success,
              isDefaultAccount: isMyDefaultAccount,
            });
          });
        } else {
          data.accounts.map((acct, key) => {
            let isMyDefaultAccount = false;
            if (acct.accountId == 5) {
              isMyDefaultAccount = true;
              setGlobalState("defaultAccountId", acct.accountId); //this is where I am setting the defaultAccountId
            }

            /*accounts that you have access to*/
            cloudAccountData.push({
              id: acct.accountId,
              label: acct.cloudProviderId + " - " + acct.cloudAccountId,
              success: acct.success,
              isDefaultAccount: isMyDefaultAccount,
            });
          });
        }

        /*store reusable data in session */
        sessionStorage.setItem("profileData", JSON.stringify(profileData));
        sessionStorage.setItem("roleData", role);
        sessionStorage.setItem(
          "cloundAccountData",
          JSON.stringify(cloudAccountData)
        );

        console.log("authenciation was successful", isSuccessful);
        console.log("success", response.status);

        getEncryptDecryptWithUserName(email); //get new x-api-key with username
        sessionStorage.removeItem("xapikeyNoAccessToken");
        //return <Navigate replace to="/Dashboard" />;
        setLoading(false);
        setIsDisabled(false);
        navigate("/dashboard");
      } else {
        sessionStorage.setItem("isAuthenticate", false);
        setIncorrectLogin(true);
        setLoading(false);
        setIsDisabled(false);
        setError(response.data.errorMessage);
        navigate("/");
      }

      console.log("MY PROFILE DATA ==", JSON.stringify(response.data));
    } catch (error) {
      setLoading(false);
      setIsDisabled(false);
      setError(
        `Hmm... something went wrong with your login. Please try again later \n${error}`
      );
    }

    setLoading(false); // Stop loading suggestions after data is fetched
    setIsDisabled(false);
  };

  /* authenticate2 - validates credentials and handles account confirmation status */
  const authenticate2 = async (email, password) => {
    setIsPasswordReset(false);
    setLoading(true);
    setError("");
    setIsDisabled(true);

    try {
      console.log("Attempting authentication with:", { email });
      const response = await apiCall({
        method: "post",
        url: "/api/Profile/authenticate",
        data: {
          Username: email,
          Password: password,
        },
      });

      console.log("Authentication response:", response);

      if (!response) {
        throw new Error("Server response was empty");
      }

      const { success, isVerified, profileId, accessLevel, ...profileData } =
        response;

      console.log("Profile Data:", profileData);
      console.log("Profile ID:", profileId);
      console.log("Access Level:", accessLevel);
      console.log("Is Verified:", isVerified);

      if (!success) {
        setError("Invalid email or password");
        setIncorrectLogin(true);
        setLoading(false);
        setIsDisabled(false);
        return;
      }

      // Check if the account is verified
      if (!isVerified) {
        navigate("/forgetPassword", {
          state: {
            email: email,
            message: "Please confirm your account to continue",
            isVerified: false,
            profileId: parseInt(profileId),
          },
        });
        return;
      }

      // Store authentication data
      sessionStorage.setItem("accessToken", profileData.token);
      sessionStorage.setItem("refreshToken", profileData.refreshToken);
      sessionStorage.setItem("tokenExpiration", profileData.tokenExpiration);
      sessionStorage.setItem(
        "refreshTokenExpiration",
        profileData.refreshTokenExpiration
      );
      sessionStorage.setItem(
        "profileName",
        `${profileData.firstName} ${profileData.lastName}`
      );
      setGlobalState("isAuthenticated", true);

      // Prepare profile data
      const userProfile = {
        profileId: profileId,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        accessLevel: accessLevel,
      };

      // Fetch organization data and auto-set default account context
      try {
        console.log("Fetching organizations for profile:", profileId);
        const orgResponse = await apiCall({
          method: "get",
          url: `/api/Profile/${profileId}/organizations`,
        });

        console.log("Organizations response:", orgResponse);

        // Store organizations data in session storage
        sessionStorage.setItem("organizations", JSON.stringify(orgResponse));

        // Auto-set default account context with accessLevel
        const defaultSet = setDefaultAccountContext(orgResponse, accessLevel);
        if (!defaultSet) {
          console.log(
            "No default account found - user will need to manually select context"
          );
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
        // Don't prevent login if organizations fetch fails
      }

      // Store user profile data and access level
      sessionStorage.setItem("profileData", JSON.stringify(userProfile));
      sessionStorage.setItem("accessLevel", accessLevel);

      setLoading(false);
      setIsDisabled(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("Authentication error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: error.config,
      });
      setLoading(false);
      setIsDisabled(false);
      setError(
        `Authentication failed. Please try again. \n${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  /* authenticate2 - validates credentials and handles account confirmation status */
  const authenticateOLD_OLD2 = async (email, password) => {
    setIsPasswordReset(false);
    setLoading(true);
    setError("");
    setIsDisabled(true);

    try {
      const response = await apiCall({
        method: "post",
        url: "/api/Profile/authenticate", // Note the capital P in Profile
        data: {
          username: email,
          password: password,
        },
      });

      // apiCall returns response.data directly
      if (!response) {
        throw new Error("Server response was empty");
      }

      const { success, isVerified, ...profileData } = response;

      if (!success) {
        setError("Invalid email or password");
        setIncorrectLogin(true);
        return;
      }

      if (!isVerified) {
        navigate("/forgetPassword", {
          state: {
            email: email,
            message:
              "Please confirm your account to continue. You can use the forgot password feature to set up your account.",
          },
        });
        return;
      }

      // Store authentication data
      sessionStorage.setItem("accessToken", profileData.token);
      sessionStorage.setItem("refreshToken", profileData.refreshToken);
      sessionStorage.setItem(
        "profileName",
        `${profileData.firstName} ${profileData.lastName}`
      );
      setGlobalState("isAuthenticated", true);

      // Process roles
      let isCustomerAdmin = false;
      let role = "";
      profileData.role.forEach((r) => {
        if (r.role === "Customer") {
          isCustomerAdmin = true;
          role = "Customer";
        } else {
          role = r.role;
        }
      });

      // Prepare profile data
      const userProfile = {
        profileUuid: profileData.profileUuid,
        customerId: profileData.customerId,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        role: role,
        isCustomerAdmin: isCustomerAdmin,
      };

      // Process cloud accounts
      const cloudAccountData = profileData.accounts.map((acct) => ({
        id: acct.accountId,
        label: `${acct.cloudProviderName} - ${acct.cloudAccountId}`,
        success: acct.success,
        isDefaultAccount:
          acct.accountId === 5 || profileData.accounts.length === 1,
      }));

      // Set default account
      if (profileData.accounts.length === 1) {
        setGlobalState("defaultAccountId", profileData.accounts[0].accountId);
      } else {
        const defaultAccount = profileData.accounts.find(
          (acct) => acct.accountId === 5
        );
        if (defaultAccount) {
          setGlobalState("defaultAccountId", defaultAccount.accountId);
        }
      }

      // Store data in session
      sessionStorage.setItem("profileData", JSON.stringify(userProfile));
      sessionStorage.setItem("roleData", role);
      sessionStorage.setItem(
        "cloudAccountData",
        JSON.stringify(cloudAccountData)
      );

      // Get encrypted API key with username
      getEncryptDecryptWithUserName(email);
      sessionStorage.removeItem("xapikeyNoAccessToken");

      setLoading(false);
      setIsDisabled(false);
      navigate("/dashboard");
    } catch (error) {
      setLoading(false);
      setIsDisabled(false);
      setError(
        `Authentication failed. Please try again. \n${
          error.response?.data?.message || error.message
        }`
      );
    }
  };
  const handleSubmit = (values) => {
    if (remember) {
      sessionStorage.setItem("username", values.email);
      sessionStorage.setItem("password", values.password);
    }
    //sessionStorage.setItem("isAuthenticated", true);
    navigate("/");
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100vw",
        height: "100vh",
        backgroundColor: darkMode ? "#121212" : "#f0f2f5", // 👈 add this line
        transition: "background-color 0.3s ease", // optional for smooth transition
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 384, // Match the Card's width

          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          //background: "#fff",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "16px",
        }}
      >
        {/* Alert Component */}
        {error && (
          <Alert
            message="Error"
            //description={`Hmm... something went wrong. Please try again later.\n${error}`}
            description={error}
            type="error"
            showIcon
            style={{
              marginBottom: 16,
              backgroundColor: darkMode ? "#2a2a2a" : "#fff",
              color: darkMode ? "#fff" : "#000",
              //border: darkMode ? "1px solid #444" : undefined,
            }}
          />
        )}

        {isPasswordReset && (
          <Alert
            message="Success"
            description={`Your password has been changed. \n please login with your email address
            to proceed.`}
            type="success"
            showIcon
            style={{
              marginBottom: 16,
              backgroundColor: darkMode ? "#2a2a2a" : "#fff",
              color: darkMode ? "#fff" : "#000",
              //border: darkMode ? "1px solid #444" : undefined,
            }}
          />
        )}

        <Card
          className="p-6 shadow-lg rounded-2xl bg-gray-800 w-[100px]"
          style={{ width: "100%" }}
        >
          <Title level={3} className="text-center text-white">
            Login
          </Title>
          <Form
            form={form}
            onFinish={(values) => authenticate2(values.email, values.password)}
            initialValues={{ email: location.state?.email || "" }}
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: "Please input your email!" }]}
            >
              <Input
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
                disabled={isDisabled}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                disabled={isDisabled}
              />
            </Form.Item>
            <div className="flex items-center justify-between">
              <Checkbox onChange={(e) => setRemember(e.target.checked)}>
                Remember me
              </Checkbox>
              <Button type="link" onClick={() => navigate("/forgetPassword")}>
                Forgot Password?
              </Button>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={loading || isDisabled}
                block
              >
                {loading ? "Authenticating..." : "Login"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
