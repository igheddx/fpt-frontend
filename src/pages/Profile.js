import React, { useState, useRef, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Table,
  AutoComplete,
  Switch,
  Alert,
  Space,
  Row,
  Col,
  Tabs,
} from "antd";

import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { useAccountContext } from "../contexts/AccountContext";

import { getDataAll } from "../hooks/axiosFakeInstance";
import { postAddSingleItem } from "../hooks/axiosFakeInstance";
import { updateDataById } from "../hooks/axiosFakeInstance";
import axiosInstance from "../hooks/axiosInstance";
import ReusableSearch from "../components/ReuseableSearch";
import { generateUniqueNumber } from "../utils/randomNumber";
import { useApi } from "../hooks/useApi";
import { useDarkMode } from "../config/DarkModeContext";
import useEncryptDescrypt from "../hooks/useEncryptDescrypt";

const { Option } = Select;

const Profile = ({ selectedOrganization, selectedCloudAccounts }) => {
  const { darkMode } = useDarkMode();
  const { switchContext } = useAccountContext();
  const [form] = Form.useForm();
  const { apiCall, isLoading, error } = useApi();
  const tableRef = useRef(null);
  const [activeTab, setActiveTab] = useState("myProfile");

  // Initialize all state variables before any useEffects
  const [selectedData, setSelectedData] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [isUpdate, setIsUpdate] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [passwordForm] = Form.useForm();
  const [passwordAlert, setPasswordAlert] = useState({
    visible: false,
    type: "",
    message: "",
  });
  const [orgCustAccountForProfile, setOrgCustAccountForProfile] =
    useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cloudAccounts, setCloudAccounts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [submittedData, setSubmittedData] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  // Alert states
  const [createAlert, setCreateAlert] = useState({
    visible: false,
    type: "",
    message: "",
  });
  const [updateAlert, setUpdateAlert] = useState({
    visible: false,
    type: "",
    message: "",
  });
  const [alert, setAlert] = useState({
    visible: false,
    type: "",
    message: "",
  });

  // Account context state variables
  const [accountContextData, setAccountContextData] = useState([]);
  const [selectedAccountContext, setSelectedAccountContext] = useState(null);
  const [accountContextLoading, setAccountContextLoading] = useState(false);

  const [defaultContextAlert, setDefaultContextAlert] = useState({
    visible: false,
    type: "",
    message: "",
  });

  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);

  // Add the encryption hook at component level
  const { getEncryptDecryptNoUserName } = useEncryptDescrypt();

  // Helper function to get profileId from session storage
  const getProfileIdFromSession = () => {
    try {
      const profileData = JSON.parse(
        sessionStorage.getItem("profileData") || "{}"
      );
      return profileData.profileId || null;
    } catch (error) {
      console.error("Error parsing profile data from session storage:", error);
      return null;
    }
  };

  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const profileId = getProfileIdFromSession();

      if (!profileId) {
        console.log("No profile ID found. Please log in again.");
        setAlert({
          type: "error",
          message: "No profile ID found. Please log in again.",
          visible: true,
        });
        return;
      }

      const profileResponse = await apiCall({
        method: "GET",
        url: `/api/Profile/${profileId}`,
      });

      const updatedProfile = {
        ...profileResponse,
        profileId: profileResponse.id,
      };
      delete updatedProfile.id;

      setSelectedData(updatedProfile);
      form.setFieldsValue({
        firstName: profileResponse.firstName,
        lastName: profileResponse.lastName,
        email: profileResponse.email,
        accessLevel: profileResponse.accessLevel,
        active: profileResponse.isConfirmed,
      });

      // Fetch organization hierarchy
      await fetchOrgHierarchy(profileResponse.id);
    } catch (error) {
      let errorMessage = "Failed to fetch profile data";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Profile data request timed out. Please try again.";
        console.log("Profile data request timed out. Please try again.");
      }
      setAlert({
        type: "error",
        message: errorMessage,
        visible: true,
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchOrgHierarchy = async (profileId) => {
    try {
      setOrgLoading(true);
      const orgResponse = await apiCall({
        method: "get",
        url: `/api/Profile/${profileId}/organizations`,
      });
      setOrgCustAccountForProfile(orgResponse);
    } catch (error) {
      let errorMessage = "Failed to fetch organization hierarchy";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Organization data request timed out. Please try again.";
      }
      setAlert({
        type: "error",
        message: errorMessage,
        visible: true,
      });
    } finally {
      setOrgLoading(false);
    }
  };

  // Fetch account context data
  const fetchAccountContextData = async () => {
    try {
      setAccountContextLoading(true);
      const profileId = getProfileIdFromSession();

      if (!profileId) {
        console.error(
          "No profileId found in session storage for account context"
        );
        setAccountContextLoading(false);
        return;
      }

      const response = await apiCall({
        method: "get",
        url: `/api/profile/${profileId}/organizations`,
      });

      // Transform the data to create dropdown options
      const dropdownOptions = [];
      response.organizations?.forEach((org) => {
        org.customers?.forEach((customer) => {
          customer.accounts?.forEach((account) => {
            const optionKey = `${org.orgId}-${customer.customerId}-${account.accountId}`;
            const optionValue = {
              organizationId: org.orgId,
              organizationName: org.name,
              customerId: customer.customerId,
              customerName: customer.name,
              accountId: account.accountId,
              accountName: account.name,
              cloudType: account.cloudType,
              defaultAccount: account.defaultAccount,
              role: account.role || "viewer",
            };

            dropdownOptions.push({
              key: optionKey,
              label: `${customer.name} -- ${account.name} - ${account.cloudType}`,
              value: optionValue,
            });

            // If this is the default account, set it as selected
            if (account.defaultAccount) {
              setSelectedAccountContext(optionValue);
            }
          });
        });
      });

      setAccountContextData(dropdownOptions);

      // Check for existing context in session storage
      const existingContext = JSON.parse(
        sessionStorage.getItem("accountContext") || "{}"
      );

      // If there's an existing context, find and select it
      if (existingContext.accountId) {
        const existingOption = dropdownOptions.find(
          (option) =>
            option.value.accountId === existingContext.accountId &&
            option.value.customerId === existingContext.customerId &&
            option.value.organizationId === existingContext.organizationId
        );
        if (existingOption) {
          setSelectedAccountContext(existingOption.value);
        }
      } else {
        // If no existing context, find and select the default account
        const defaultOption = dropdownOptions.find(
          (option) => option.value.defaultAccount === true
        );
        if (defaultOption) {
          setSelectedAccountContext(defaultOption.value);
        }
      }
    } catch (error) {
      console.error("Error fetching account context data:", error);
      setDefaultContextAlert({
        visible: true,
        type: "error",
        message: "Failed to load account context data. Please try again.",
      });
    } finally {
      setAccountContextLoading(false);
    }
  };

  const handleAccountContextChange = (selectedKey) => {
    const selectedOption = accountContextData.find(
      (option) => option.key === selectedKey
    );
    if (selectedOption) {
      setSelectedAccountContext(selectedOption.value);
      // Update session storage with the new context
      sessionStorage.setItem(
        "accountContext",
        JSON.stringify(selectedOption.value)
      );
      // Call the context switch function
      switchContext(selectedOption.value);
    }
  };

  const handleSetDefaultContext = async () => {
    if (!selectedAccountContext) {
      setDefaultContextAlert({
        visible: true,
        type: "warning",
        message: "Please select an account context first",
      });
      return;
    }

    try {
      const profileId = getProfileIdFromSession();
      if (!profileId) {
        throw new Error("No profile ID found");
      }

      await apiCall({
        method: "post",
        url: `/api/profile/${profileId}/defaultContext`,
        data: selectedAccountContext,
      });

      setDefaultContextAlert({
        visible: true,
        type: "success",
        message: "Default account context updated successfully",
      });

      // Refresh the account context data
      await fetchAccountContextData();
    } catch (error) {
      console.error("Error setting default context:", error);
      setDefaultContextAlert({
        visible: true,
        type: "error",
        message: "Failed to set default account context. Please try again.",
      });
    }
  };

  // Add useEffect to fetch account context data on component mount
  useEffect(() => {
    fetchAccountContextData();
  }, []);

  useEffect(() => {
    if (selectedData) {
      form.setFieldsValue({
        firstName: selectedData.firstName,
        lastName: selectedData.lastName,
        email: selectedData.email,
        permission: selectedData.permission,
        organizations: selectedData.orgId,
        customers: selectedData.custId,
        cloudAccounts: selectedData.cloudId,
        accessLevel: selectedData.accessLevel,
        active: selectedData.isConfirmed,
      });
      setSelectedProfileId(selectedData.profileId);
      setIsUpdate(true);
      setCurrentRecord(selectedData);
    }
  }, [selectedData, form]);

  useEffect(() => {
    const getOrgData = () => {
      // Save to localStorage
      getDataAll("organizations")
        .then((data) => {
          console.log("New or customer", JSON.stringify(data));
          console.log("new org customer==", data);
          //setSelectedOrg(updatedData);
          setOrganizations(data);
        })
        .catch((error) => {
          console.error("Error updating organization:", error);
        });
    };

    getOrgData();
  }, []);

  const fetchData = async (query) => {
    console.log("QUERY ==", query);
    if (query.length >= 3) {
      try {
        // Check if current user is root or admin to allow unrestricted search
        const currentUserAccessLevel = sessionStorage.getItem("accessLevel");
        console.log("Current user access level:", currentUserAccessLevel);

        const data = await apiCall({
          method: "get",
          url: "/api/Profile/search-by-name",
          params: {
            name: query,
            delimiter: ",",
            // Add flag for root/admin users to bypass restrictions if needed
            ...((currentUserAccessLevel === "root" ||
              currentUserAccessLevel === "admin") && { unrestricted: true }),
          },
        });
        console.log("Profile search results:", data);
        setSearchResults(data);
        return data;
      } catch (error) {
        console.error("Error searching profiles:", error);
        return [];
      }
    }
    return [];
  };

  console.log("selectedCloudAccount ==", selectedCloudAccounts);
  const userData = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      organizations: ["Org1"],
      role: "Admin",
      active: true,
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      organizations: ["Org2"],
      role: "User",
      active: false,
    },
    {
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice@example.com",
      organizations: ["Org1", "Org3"],
      role: "Editor",
      active: true,
    },
    {
      firstName: "Bob",
      lastName: "Lee",
      email: "bob@example.com",
      organizations: ["Org3"],
      role: "Admin",
      active: true,
    },
    {
      firstName: "Charlie",
      lastName: "Brown",
      email: "charlie@example.com",
      organizations: ["Org2", "Org3"],
      role: "Viewer",
      active: false,
    },
  ];

  const handleSearch = (value) => {
    if (value) {
      const filtered = userData
        .filter((user) =>
          `${user.firstName} ${user.lastName}`
            .toLowerCase()
            .includes(value.toLowerCase())
        )
        .slice(0, 5);
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const onSelectSearchResult = (value, option) => {
    const user = searchResults.find(
      (u) => `${u.firstName} ${u.lastName}` === value
    );
    if (user) {
      form.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organizations: user.organizations,
        role: user.role,
        active: user.active,
      });
      setIsUpdate(true);
      setCurrentRecord(user);
      setSearchResults([]);
    }
  };

  const placeholderMessage = () => {
    console.log("Sending update message...");
  };

  const scrollToTable = () => {
    setTimeout(() => {
      if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: "smooth" });
        tableRef.current.focus({ preventScroll: true });
      }
    }, 100);
  };

  const handleSearchButtonClick = () => {
    const lowerVal = searchTerm.toLowerCase();
    const matches = userData.filter(
      (p) =>
        p.firstName.toLowerCase().includes(lowerVal) ||
        p.lastName.toLowerCase().includes(lowerVal) ||
        p.email.toLowerCase().includes(lowerVal) ||
        (p.role && p.role.toLowerCase().includes(lowerVal))
    );

    // const user = searchResults.find(
    //   (u) => `${u.firstName} ${u.lastName}` === value
    // );
    if (matches) {
      form.setFieldsValue({
        firstName: matches.firstName,
        lastName: matches.lastName,
        email: matches.email,
        organizations: matches.organizations,
        role: matches.role,
        active: matches.active,
      });
      setIsUpdate(true);
      setCurrentRecord(matches);
      setSearchResults([]);
      setSuggestions([]);
      //setFilteredUsers(matches);
    }

    //setShowConfirmation(false);
  };

  const handleSuggestionClick = (profile) => {
    const profileId = profile.profileId;
    setSelectedProfileId(profile.profileId);
    console.log("Selected profile ID:", profileId);
    //setFilteredPolicies([policy]);
    //setSearchTerm(policy.policyName);
    setSuggestions([]);
  };

  // const highlightText = (text) => {
  //   console.log("highlightText was called");
  //   if (!text) return "";
  //   const regex = new RegExp(`(${query})`, "gi");
  //   return text.replace(regex, `<b>$1</b>`);
  // };

  const handleOrganizationChange = (orgId) => {
    console.log("orgid ==", orgId);
    const org = organizations.find((o) => o.id === orgId);
    console.log("org ==", org);
    setCustomers(org ? org.customer : []);
    setCloudAccounts([]);
    form.setFieldsValue({ customers: undefined, cloudAccounts: undefined });
  };

  const handleCustomerChange = (custId) => {
    const customer = customers.find((c) => c.id === custId);
    console.log("customer ==", customer);
    setCloudAccounts(customer ? customer.cloudAccount : []);
    form.setFieldsValue({ cloudAccount: undefined });
  };

  const handleUpdate = async (values) => {
    try {
      if (!selectedData?.profileId) {
        throw new Error("No profile selected for update");
      }

      // Show loading message
      setUpdateAlert({
        message: "Updating profile...",
        type: "info",
        visible: true,
      });

      // Only include fields that we want to update
      const updateData = {
        id: selectedData.profileId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: selectedData.email, // Keep existing email
        accessLevel: selectedData.accessLevel, // Keep existing access level
        isConfirmed: selectedData.isConfirmed, // Keep existing confirmation status
      };

      const response = await apiCall({
        method: "put",
        url: `/api/Profile/${selectedData.profileId}`,
        data: updateData,
      });

      if (response) {
        setUpdateAlert({
          visible: true,
          type: "success",
          message: "Profile updated successfully",
        });
        await fetchProfileData(); // Refresh profile data
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setUpdateAlert({
        visible: true,
        type: "error",
        message:
          "Failed to update profile: " + (error.message || "Unknown error"),
      });
    }
  };

  const handleCreate = async (values) => {
    try {
      const profileId = getProfileIdFromSession();
      if (!profileId) {
        throw new Error("No profile ID found");
      }

      const response = await apiCall({
        method: "post",
        url: "/api/Profile",
        data: {
          ...values,
          isConfirmed: true,
        },
      });

      if (response) {
        setCreateAlert({
          visible: true,
          type: "success",
          message: "Profile created successfully",
        });
        form.resetFields();
        await fetchProfileData();
      }
    } catch (error) {
      setCreateAlert({
        visible: true,
        type: "error",
        message:
          "Failed to create profile: " + (error.message || "Unknown error"),
      });
    }
  };

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

  const handlePasswordChange = async (values) => {
    try {
      // Get the current user's email from session storage
      const profileData = JSON.parse(sessionStorage.getItem("profileData"));
      if (!profileData?.email) {
        setPasswordAlert({
          message: "User email not found",
          type: "error",
          visible: true,
        });
        return;
      }

      // Check if passwords match
      if (values.newPassword !== values.confirmPassword) {
        setPasswordAlert({
          message: "New password and confirm password do not match",
          type: "error",
          visible: true,
        });
        return;
      }

      // Validate password requirements
      const passwordErrors = validatePassword(
        values.newPassword,
        null,
        profileData.email
      );
      if (passwordErrors.length > 0) {
        setPasswordAlert({
          message: `Password validation failed: ${passwordErrors.join(", ")}`,
          type: "error",
          visible: true,
        });
        return;
      }

      // Get API key
      await getEncryptDecryptNoUserName();
      const apiKey = sessionStorage.getItem("xapikeyNoAccessToken");

      if (!apiKey) {
        throw new Error("Failed to get API key");
      }

      // Make the API call to update password using axiosInstance
      const response = await axiosInstance.post(
        "/api/Profile/update-password",
        {
          email: profileData.email,
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }
      );

      // Show success alert and clear form
      setPasswordAlert({
        message: "Password updated successfully",
        type: "success",
        visible: true,
      });

      // Clear the password fields
      passwordForm.setFieldsValue({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordAlert({
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update password",
        type: "error",
        visible: true,
      });
    }
  };

  const onFinish = async (values) => {
    try {
      if (isUpdate) {
        await handleUpdate(values);
      } else {
        await handleCreate(values);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  const columns = [
    { title: "First Name", dataIndex: "firstName", key: "firstName" },
    { title: "Last Name", dataIndex: "lastName", key: "lastName" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Temporary Password",
      dataIndex: "tempPassword",
      key: "tempPassword",
    },
    {
      title: "Organizations",
      dataIndex: "organizations",
      key: "organizations",
      render: (orgs) => orgs.join(", "),
    },
    { title: "Role", dataIndex: "role", key: "role" },
    {
      title: "Active",
      dataIndex: "active",
      key: "active",
      render: (val) => (val ? "Yes" : "No"),
    },
  ];

  // Columns for the organization hierarchy table
  const orgHierarchyColumns = [
    {
      title: "Organization",
      dataIndex: "name",
      key: "name",
      width: "50%",
    },
    {
      title: "Organization ID",
      dataIndex: "orgId",
      key: "orgId",
      width: "50%",
    },
  ];

  // Columns for the customer table (middle level)
  const customerColumns = [
    {
      title: "Customer",
      dataIndex: "name",
      key: "name",
      width: "50%",
    },
    {
      title: "Customer ID",
      dataIndex: "customerId",
      key: "customerId",
      width: "50%",
    },
  ];

  // Columns for the cloud accounts table (lowest level)
  const cloudAccountColumns = [
    {
      title: "Account Name",
      dataIndex: "name",
      key: "name",
      width: "40%",
    },
    {
      title: "Cloud Type",
      dataIndex: "cloudType",
      key: "cloudType",
      width: "30%",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: "30%",
    },
    {
      title: "Account ID",
      dataIndex: "accountId",
      key: "accountId",
      width: "30%",
    },
  ];

  // Render function for cloud accounts (lowest level)
  const expandedRowRender = (record) => {
    return (
      <Table
        columns={cloudAccountColumns}
        dataSource={record.accounts}
        pagination={false}
        size="small"
      />
    );
  };

  // Add useEffect to fetch profile data on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Add useEffect to fetch account context data on component mount
  useEffect(() => {
    fetchAccountContextData();
  }, []);

  return (
    <div
      className={`profile-container ${darkMode ? "dark" : ""}`}
      style={{ padding: "24px", marginTop: "175px" }}
    >
      {/* Show loading states */}
      {(profileLoading || orgLoading) && (
        <Alert
          message="Loading..."
          type="info"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Show error state */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      <div className="account-context-section">
        <h2 style={{ marginBottom: "16px" }}>Change Account Context</h2>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Select
                style={{ width: "100%" }}
                placeholder="Select Account Context"
                onChange={handleAccountContextChange}
                loading={accountContextLoading}
                value={
                  selectedAccountContext
                    ? `${selectedAccountContext.customerName} -- ${selectedAccountContext.accountName} - ${selectedAccountContext.cloudType}`
                    : undefined
                }
                disabled={accountContextLoading}
              >
                {accountContextData.map((option) => (
                  <Option
                    key={option.key}
                    value={option.key}
                    style={{
                      backgroundColor: darkMode ? "#141414" : "#ffffff",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                  >
                    {option.label}
                  </Option>
                ))}
              </Select>
              <Button
                icon={<PlusOutlined />}
                onClick={handleSetDefaultContext}
                title="Set as Default Account Context"
                style={{
                  backgroundColor: darkMode ? "#141414" : "#ffffff",
                  borderColor: darkMode ? "#303030" : undefined,
                  color: darkMode ? "#ffffff" : undefined,
                }}
              />
            </div>
          </Col>
        </Row>
        {defaultContextAlert.visible && (
          <Alert
            message={defaultContextAlert.message}
            type={defaultContextAlert.type}
            showIcon
            closable
            onClose={() =>
              setDefaultContextAlert({ ...defaultContextAlert, visible: false })
            }
            style={{ marginTop: "10px" }}
          />
        )}
      </div>

      <Tabs
        type="card"
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        className={`profile-tabs ${darkMode ? "dark" : ""}`}
        style={{ marginTop: "24px" }}
      >
        <Tabs.TabPane tab="My Profile" key="myProfile">
          <div className="welcome-section">
            <h2>
              Welcome, {selectedData?.firstName} {selectedData?.lastName}!
            </h2>

            {/* Profile Information Section */}
            <div className="profile-info-section">
              <div
                style={{
                  background: darkMode ? "#1f1f1f" : "#ffffff",
                  padding: "24px",
                  borderRadius: "8px",
                  border: `1px solid ${darkMode ? "#303030" : "#d9d9d9"}`,
                  marginTop: "16px",
                }}
              >
                <h3 style={{ marginBottom: "16px" }}>Profile Information</h3>
                {/* Profile Update Alert */}
                {updateAlert.visible && (
                  <Alert
                    message={updateAlert.message}
                    type={updateAlert.type}
                    showIcon
                    style={{
                      marginBottom: "16px",
                      backgroundColor: darkMode ? "#1f1f1f" : undefined,
                      border: darkMode ? "1px solid #303030" : undefined,
                    }}
                  />
                )}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdate}
                  initialValues={{
                    firstName: selectedData?.firstName,
                    lastName: selectedData?.lastName,
                    email: selectedData?.email,
                    accessLevel: selectedData?.accessLevel,
                    active: selectedData?.isConfirmed,
                  }}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        label="First Name"
                        name="firstName"
                        rules={[
                          {
                            required: true,
                            message: "Please enter your first name",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Last Name"
                        name="lastName"
                        rules={[
                          {
                            required: true,
                            message: "Please enter your last name",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item label="Email" name="email">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Access Level" name="accessLevel">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        label="Account Status"
                        name="active"
                        valuePropName="checked"
                      >
                        <Switch
                          disabled
                          style={{
                            backgroundColor: "#06923E",
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row>
                    <Col
                      span={24}
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "16px",
                      }}
                    >
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        style={{
                          backgroundColor: "#06923E",
                          borderColor: "#06923E",
                          color: "white",
                        }}
                      >
                        Save
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </div>
            </div>

            {/* Change Password Section */}
            <div
              className="change-password-section"
              style={{ marginTop: "24px" }}
            >
              <div
                style={{
                  background: darkMode ? "#1f1f1f" : "#ffffff",
                  padding: "24px",
                  borderRadius: "8px",
                  border: `1px solid ${darkMode ? "#303030" : "#d9d9d9"}`,
                }}
              >
                <h3 style={{ marginBottom: "16px" }}>Change Password</h3>
                {/* Password Change Alert */}
                {passwordAlert.visible && (
                  <Alert
                    message={passwordAlert.message}
                    type={passwordAlert.type}
                    showIcon
                    style={{
                      marginBottom: "16px",
                      backgroundColor: darkMode ? "#1f1f1f" : undefined,
                      border: darkMode ? "1px solid #303030" : undefined,
                    }}
                  />
                )}
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordChange}
                >
                  <Form.Item
                    name="currentPassword"
                    label="Current Password"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your current password",
                      },
                    ]}
                  >
                    <Input.Password size="large" />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label="New Password"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your new password",
                      },
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
                    <Input.Password size="large" />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    dependencies={["newPassword"]}
                    rules={[
                      {
                        required: true,
                        message: "Please confirm your new password",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (
                            !value ||
                            getFieldValue("newPassword") === value
                          ) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("The two passwords do not match")
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password size="large" />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      style={{
                        backgroundColor: "#06923E",
                        borderColor: "#06923E",
                        color: "white",
                      }}
                    >
                      Change Password
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </div>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="My Access" key="myAccess">
          <div style={{ padding: "20px" }}>
            <h2>Access Management</h2>
            {/* Organizations, Customers, Accounts Section */}
            <div
              style={{
                background: darkMode ? "#1f1f1f" : "#ffffff",
                padding: "24px",
                borderRadius: "8px",
                border: `1px solid ${darkMode ? "#303030" : "#d9d9d9"}`,
                marginTop: "16px",
              }}
            >
              <h3 style={{ marginBottom: "16px" }}>
                My Organizations, Customers, Accounts - Permissions
              </h3>
              {orgCustAccountForProfile && (
                <Table
                  dataSource={orgCustAccountForProfile.organizations}
                  columns={orgHierarchyColumns}
                  expandable={{
                    expandedRowRender: (record) => {
                      return (
                        <Table
                          columns={customerColumns}
                          dataSource={record.customers}
                          expandable={{
                            expandedRowRender: expandedRowRender,
                            rowExpandable: (record) =>
                              record.accounts?.length > 0,
                            expandRowByClick: true,
                          }}
                          pagination={false}
                          size="small"
                          rowKey={(record) => record.customerId}
                          style={{
                            backgroundColor: darkMode ? "#141414" : "#ffffff",
                          }}
                        />
                      );
                    },
                    rowExpandable: (record) => record.customers?.length > 0,
                    expandRowByClick: true,
                  }}
                  pagination={false}
                  rowKey={(record) => record.orgId}
                  style={{
                    backgroundColor: darkMode ? "#141414" : "#ffffff",
                  }}
                />
              )}
            </div>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="My Dashboard" key="myDashboard">
          <div style={{ padding: "20px" }}>
            <h2>Dashboard</h2>
            <p>Dashboard content will be implemented here.</p>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="My Settings" key="mySettings"></Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default Profile;
