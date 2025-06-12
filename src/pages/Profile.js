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
} from "antd";

import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { useAccountContext } from "../contexts/AccountContext";

import { getDataAll } from "../hooks/axiosFakeInstance";
import { postAddSingleItem } from "../hooks/axiosFakeInstance";
import { updateDataById } from "../hooks/axiosFakeInstance";
import axiosInstance from "../hooks/axiosInstance";
import ReusableSearch from "../components/ReuseableSearch";
import { generateUniqueNumber } from "../utils/randomNumber";
import useApi from "../hooks/useApi";
import { useDarkMode } from "../config/DarkModeContext";

const { Option } = Select;

const Profile = ({ selectedOrganization, selectedCloudAccounts }) => {
  const { darkMode } = useDarkMode();
  const { switchContext } = useAccountContext();
  const [form] = Form.useForm();
  const apiCall = useApi();
  const tableRef = useRef(null);

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
      // Get profileId from session storage instead of hardcoding
      const profileId = getProfileIdFromSession();

      if (!profileId) {
        console.error("No profileId found in session storage");
        setAlert({
          type: "error",
          message: "No profile ID found. Please log in again.",
          visible: true,
        });
        return;
      }

      const profileResponse = await apiCall({
        method: "get",
        url: `/api/Profile/${profileId}`, // Use dynamic profileId
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

      // Fetch organization hierarchy right after getting profile data
      try {
        const orgResponse = await apiCall({
          method: "get",
          url: `/api/Profile/${profileResponse.id}/organizations`,
        });
        setOrgCustAccountForProfile(orgResponse);
      } catch (error) {
        console.error("Error fetching organization hierarchy:", error);
        setAlert({
          type: "error",
          message: "Failed to fetch organization hierarchy",
          visible: true,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setAlert({
        type: "error",
        message: "Failed to fetch profile data",
        visible: true,
      });
    }
  };

  // Fetch account context data
  const fetchAccountContextData = async () => {
    try {
      setAccountContextLoading(true);

      // Get profileId from session storage instead of hardcoding
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
        url: `/api/profile/${profileId}/organizations`, // Use dynamic profileId
      });

      // Transform the data to create dropdown options
      const dropdownOptions = [];
      response.organizations?.forEach((org) => {
        org.customers?.forEach((customer) => {
          customer.accounts?.forEach((account) => {
            dropdownOptions.push({
              key: `${org.orgId}-${customer.customerId}-${account.accountId}`,
              label: `${customer.name} -- ${account.name} - ${account.cloudType}`,
              value: {
                organizationId: org.orgId,
                organizationName: org.name,
                customerId: customer.customerId,
                customerName: customer.name,
                accountId: account.accountId,
                accountName: account.name,
                cloudType: account.cloudType,
                defaultAccount: account.defaultAccount,
                role: account.role || "viewer", // Include role from API response
              },
            });
          });
        });
      });

      setAccountContextData(dropdownOptions);

      // Check if there's already a saved account context from user's previous selection
      const existingContext = JSON.parse(
        sessionStorage.getItem("accountContext") || "{}"
      );

      // Only initialize with default account if no existing context or if the existing context
      // doesn't match any of the available accounts for this user
      let shouldUseDefault = !existingContext.accountId;

      if (existingContext.accountId) {
        // Check if the existing context account is still available for this user
        const existingAccountStillAvailable = dropdownOptions.some(
          (option) =>
            option.value.accountId === existingContext.accountId &&
            option.value.customerId === existingContext.customerId
        );

        if (existingAccountStillAvailable) {
          // Use the existing context - find the matching option and set it as selected
          const existingOption = dropdownOptions.find(
            (option) =>
              option.value.accountId === existingContext.accountId &&
              option.value.customerId === existingContext.customerId
          );
          if (existingOption) {
            setSelectedAccountContext(existingOption.value);

            // Also update the global context when restoring existing context
            const profileData = JSON.parse(
              sessionStorage.getItem("profileData") || "{}"
            );
            const accessLevel = sessionStorage.getItem("accessLevel");

            switchContext({
              // Profile-level properties (preserved from login)
              profileId: profileData.profileId,
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              email: profileData.email,
              accessLevel: accessLevel,

              // Account-level properties (from existing context)
              organizationId: existingOption.value.organizationId,
              organizationName: existingOption.value.organizationName,
              customerId: existingOption.value.customerId,
              customerName: existingOption.value.customerName,
              accountId: existingOption.value.accountId,
              accountName: existingOption.value.accountName,
              cloudType: existingOption.value.cloudType,
              permissions: existingOption.value.role || "viewer",
            });

            console.log(
              "Restored existing account context and updated global context:",
              existingOption.value
            );
            shouldUseDefault = false;
          }
        } else {
          console.log(
            "Previously selected account no longer available, using default"
          );
          shouldUseDefault = true;
        }
      }

      // Only set default account if no existing valid context
      if (shouldUseDefault) {
        const defaultAccount = dropdownOptions.find(
          (option) => option.value.defaultAccount === true
        );
        if (defaultAccount) {
          setSelectedAccountContext(defaultAccount.value);

          // INITIALIZE GLOBAL CONTEXT with default account
          // Preserve profile-level properties from session storage
          const profileData = JSON.parse(
            sessionStorage.getItem("profileData") || "{}"
          );
          const accessLevel = sessionStorage.getItem("accessLevel");

          switchContext({
            // Profile-level properties (preserved from login)
            profileId: profileData.profileId,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            email: profileData.email,
            accessLevel: accessLevel,

            // Account-level properties (from selected account)
            organizationId: defaultAccount.value.organizationId,
            organizationName: defaultAccount.value.organizationName,
            customerId: defaultAccount.value.customerId,
            customerName: defaultAccount.value.customerName,
            accountId: defaultAccount.value.accountId,
            accountName: defaultAccount.value.accountName,
            cloudType: defaultAccount.value.cloudType,
            permissions: defaultAccount.value.role || "viewer", // Use permissions instead of role
          });

          console.log(
            "Default account context initialized:",
            defaultAccount.value
          );
        }
      }
    } catch (error) {
      console.error("Error fetching account context data:", error);
    } finally {
      setAccountContextLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Fetch account context data on component mount
  useEffect(() => {
    fetchAccountContextData();
  }, []);

  // Preselect the organization and cloud accounts when the component mounts
  useEffect(() => {
    form.setFieldsValue({
      organizations: selectedOrganization ? [selectedOrganization] : [],
      cloudAccounts: selectedCloudAccounts || [],
    });
  }, [selectedOrganization, selectedCloudAccounts, form]);

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
    console.log("@@Updating profile with values:", values);
    console.log("@@selectedProfileId ==", selectedProfileId);
    console.log("@@selectedData.ProfileId ==", selectedData.ProfileId);

    if (!selectedData || !selectedProfileId) {
      setUpdateAlert({
        message: "No profile selected for update",
        type: "error",
        visible: true,
      });
      return;
    }

    try {
      // Show loading message
      setUpdateAlert({
        message: "Updating profile...",
        type: "info",
        visible: true,
      });

      // Only include fields that we want to update
      const updateData = {
        Id: selectedData.profileId,
        FirstName: values.firstName,
        LastName: values.lastName,
        AccessLevel: values.accessLevel,
        Email: values.email, // Email is required by the model
        // Only include IsConfirmed if it's specifically changed via the switch
        ...(values.active !== undefined && { IsConfirmed: values.active }),
      };

      // Validate required fields for update
      if (
        !updateData.FirstName ||
        !updateData.LastName ||
        !updateData.AccessLevel ||
        !updateData.Email
      ) {
        throw new Error("Missing required fields");
      }

      // Log the exact data being sent
      console.log("Sending update request with data:", updateData);

      // Update profile
      await apiCall({
        method: "put",
        url: `/api/Profile/${selectedData.profileId}`,
        data: updateData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("##selectedData.profileId =", selectedData.profileId);
      // Get updated profile data
      console.log("##selectedProfileId ==", selectedProfileId);
      const profileResponse = await apiCall({
        method: "get",
        url: `/api/Profile/${selectedData.profileId}`,
      });
      // Restructure the response to change Id to profileId
      const updatedProfile = {
        ...profileResponse,
        profileId: profileResponse.id,
      };
      delete updatedProfile.id;

      // Update states with restructured data
      setSelectedData(updatedProfile);

      console.log("Updated profile data:", JSON.stringify(profileResponse));
      setSelectedProfileId(profileResponse.id);

      // Get updated organization hierarchy
      const orgResponse = await apiCall({
        method: "get",
        url: `/api/Profile/${selectedProfileId}/organizations`,
      });

      setOrgCustAccountForProfile(orgResponse);
      console.log("##Updated organization hierarchy:", orgResponse);

      // Update form with new profile data
      form.setFieldsValue({
        firstName: profileResponse.firstName,
        lastName: profileResponse.lastName,
        email: profileResponse.email,
        //permission: profileResponse.permission,
        //organizations: profileResponse.orgId,
        //customers: profileResponse.custId,
        //cloudAccounts: profileResponse.cloudId,
        accessLevel: profileResponse.accessLevel,
        active: profileResponse.isConfirmed,
      });

      // Show success message
      setUpdateAlert({
        message: "Profile updated successfully",
        type: "success",
        visible: true,
      });

      // Clear alert after 3 seconds
      // setTimeout(() => {
      //   setUpdateAlert({
      //     visible: false,
      //     type: "",
      //     message: "",
      //   });
      // }, 3000);
    } catch (error) {
      console.error("Profile update error:", error);
      setUpdateAlert({
        message:
          "Error updating profile: " +
          (error.response?.data?.message || error.message || error),
        type: "error",
        visible: true,
      });
    }
  };

  const handleCreate = async (values) => {
    try {
      // Show loading message
      setCreateAlert({
        message: "Creating profile...",
        type: "info",
        visible: true,
      });

      // Prepare the create data
      const createData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        accessLevel: values.accessLevel,
        password: values.tempPassword,
        isConfirmed: false,
      };

      // Validate required fields
      if (
        !createData.firstName ||
        !createData.lastName ||
        !createData.accessLevel ||
        !createData.email ||
        !createData.password
      ) {
        throw new Error("Missing required fields");
      }

      // Create profile
      const response = await apiCall({
        method: "post",
        url: "http://localhost:5000/api/profile",
        data: createData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Show success message
      setCreateAlert({
        message: "Profile created successfully",
        type: "success",
        visible: true,
      });

      // Reset form
      form.resetFields();

      // Reset form
      form.resetFields();
    } catch (error) {
      console.error("Profile creation error:", error);
      setCreateAlert({
        message:
          "Error creating profile: " +
          (error.response?.data?.message || error.message || error),
        type: "error",
        visible: true,
      });
    }
  };

  const handlePasswordChange = async (values) => {
    try {
      // Check if selectedData exists
      if (!selectedData || !selectedData.profileId) {
        setPasswordAlert({
          message: "No profile selected for password change",
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

      setPasswordAlert({
        message: "Updating password...",
        type: "info",
        visible: true,
      });

      await apiCall({
        method: "put",
        url: `/api/Profile/${selectedData.profileId}/password`,
        data: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      setPasswordAlert({
        message: "Password updated successfully",
        type: "success",
        visible: true,
      });

      passwordForm.resetFields();
    } catch (error) {
      console.error("Password update error:", error);
      // Check if it's a "Current password is incorrect" error
      const errorMessage =
        error.response?.data?.message || error.message || error;
      setPasswordAlert({
        message: errorMessage,
        type: "error",
        visible: true,
      });
    }
  };

  const onFinish = async (values) => {
    if (isUpdate && selectedData) {
      await handleUpdate(values);
    } else {
      await handleCreate(values);
    }
    console.log("Record:", values);
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

  // Handle account context selection
  const handleAccountContextChange = (value) => {
    console.log("@@Account selected ==", value);
    const selectedAccount = accountContextData.find(
      (option) => option.key === value
    );

    if (selectedAccount) {
      console.log("@@orgId==", selectedAccount.value.organizationId);
      console.log("@@custgId==", selectedAccount.value.customerId);
      console.log("@@acctId==", selectedAccount.value.accountId);

      setSelectedAccountContext(selectedAccount.value);

      // Update global context - THIS IS THE KEY INTEGRATION
      // Preserve profile-level properties from session storage
      const profileData = JSON.parse(
        sessionStorage.getItem("profileData") || "{}"
      );
      const accessLevel = sessionStorage.getItem("accessLevel");

      console.log("@@profileId", profileData.profileId);
      const newContext = {
        // Profile-level properties (preserved from login)
        profileId: profileData.profileId,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        accessLevel: accessLevel,

        // Account-level properties (from selected account)
        organizationId: selectedAccount.value.organizationId,
        organizationName: selectedAccount.value.organizationName,
        customerId: selectedAccount.value.customerId,
        customerName: selectedAccount.value.customerName,
        accountId: selectedAccount.value.accountId,
        accountName: selectedAccount.value.accountName,
        cloudType: selectedAccount.value.cloudType,
        permissions: selectedAccount.value.role || "viewer", // Use permissions instead of role for account role
      };

      console.log("@@ newContext==", JSON.stringify(newContext));
      // Update global context
      switchContext(newContext);

      // Save the selected account context to sessionStorage for persistence
      sessionStorage.setItem(
        "accountContext",
        JSON.stringify(selectedAccount.value)
      );

      console.log("Selected account context:", selectedAccount.value);
      console.log("Global context updated and saved to sessionStorage!");
    }
  };

  // New method to update default account context
  const handleSetDefaultContext = async () => {
    if (!selectedAccountContext) {
      setDefaultContextAlert({
        visible: true,
        type: "error",
        message: "Please select an account context first",
      });
      return;
    }

    try {
      const profileId = getProfileIdFromSession();
      console.log("@@ Setting default context for profileId:", profileId);
      console.log("@@ Selected context:", selectedAccountContext);

      // Get all LOVs for this profile
      const lovResponse = await apiCall({
        method: "get",
        url: `/api/LOV/profile/${profileId}`,
      });
      console.log("@@ All LOVs for profile:", lovResponse);

      // Filter to find DEFAULT ACCOUNT LOV
      const existingLov = lovResponse
        ? lovResponse.find(
            (lov) =>
              lov.description === "DEFAULT ACCOUNT" &&
              lov.profileId === parseInt(profileId)
          )
        : null;
      console.log("@@ Found DEFAULT ACCOUNT LOV:", existingLov);

      if (!existingLov) {
        // Create new LOV record with "DEFAULT ACCOUNT"
        console.log("@@ Creating new LOV record");
        const newLovData = {
          description: "DEFAULT ACCOUNT",
          profileId: parseInt(profileId),
          organizationId: selectedAccountContext.organizationId,
          customerId: selectedAccountContext.customerId,
          accountId: selectedAccountContext.accountId,
          isActive: true,
        };
        console.log("@@ New LOV data:", newLovData);

        const newLovResponse = await apiCall({
          method: "POST",
          url: "/api/LOV",
          data: newLovData,
        });
        console.log("@@ New LOV created:", newLovResponse);
      } else {
        // Update existing LOV
        console.log("@@ Updating existing LOV:", existingLov.id);
        const updatedLovData = {
          ...existingLov,
          organizationId: selectedAccountContext.organizationId,
          customerId: selectedAccountContext.customerId,
          accountId: selectedAccountContext.accountId,
        };
        console.log("@@ Updating LOV with data:", updatedLovData);

        const updateResponse = await apiCall({
          method: "put",
          url: `/api/LOV/${existingLov.id}`,
          data: updatedLovData,
        });
        console.log("@@ LOV update response:", updateResponse);
      }

      setDefaultContextAlert({
        visible: true,
        type: "success",
        message: "Default account context updated successfully",
      });

      // Refresh the account context data to reflect the new default
      await fetchAccountContextData();

      // Keep the current selection
      const currentSelection = accountContextData.find(
        (option) =>
          option.value.organizationId ===
            selectedAccountContext.organizationId &&
          option.value.customerId === selectedAccountContext.customerId &&
          option.value.accountId === selectedAccountContext.accountId
      );
      if (currentSelection) {
        setSelectedAccountContext(currentSelection.value);
      }
    } catch (error) {
      console.error("Error updating default account context:", error);
      setDefaultContextAlert({
        visible: true,
        type: "error",
        message:
          "Failed to update default account context: " +
          (error.message || "Unknown error"),
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Change Account Context Section */}
      <div
        style={{
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ padding: "24px" }}>
          <h2>Change Account Context</h2>
          <div
            style={{
              background: darkMode ? "#29303d" : "#fff",
              borderRadius: "8px",
              padding: "24px",
              marginTop: "16px",
              border: darkMode ? "1px solid #434a56" : "1px solid #f0f0f0",
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                {defaultContextAlert.visible && (
                  <Alert
                    message={defaultContextAlert.message}
                    type={defaultContextAlert.type}
                    showIcon
                    closable
                    onClose={() => {
                      setDefaultContextAlert({
                        visible: false,
                        type: "",
                        message: "",
                      });
                    }}
                  />
                )}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Change Account Context"
                    onChange={handleAccountContextChange}
                    value={
                      selectedAccountContext
                        ? `${selectedAccountContext.customerName} - ${selectedAccountContext.accountName} - ${selectedAccountContext.cloudType}`
                        : undefined
                    }
                    loading={accountContextLoading}
                    size="large"
                    dropdownStyle={{
                      backgroundColor: darkMode ? "#141414" : "#ffffff",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    popupClassName={darkMode ? "dark-select-dropdown" : ""}
                  >
                    {accountContextData.map((option) => (
                      <Option
                        key={option.key}
                        value={option.key}
                        style={{
                          backgroundColor: darkMode ? "#141414" : "#ffffff",
                          color: darkMode ? "#ffffff" : "#000000",
                        }}
                        className={darkMode ? "dark-select-option" : ""}
                      >
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                  <PlusOutlined
                    onClick={handleSetDefaultContext}
                    style={{
                      fontSize: "18px",
                      color: darkMode ? "#ffffff" : "#000000",
                      cursor: "pointer",
                      padding: "4px",
                      transition: "color 0.3s",
                    }}
                    title="Set as Default Account Context"
                  />
                </div>
              </Space>
            </div>
          </div>
        </div>
      </div>

      {/* My Profile Section */}
      <div
        style={{
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ padding: "24px" }}>
          <h2>
            Welcome,{" "}
            {selectedData?.firstName + " " + selectedData?.lastName || "User"}{" "}
          </h2>
          {(createAlert.visible || updateAlert.visible) && (
            <Alert
              message={
                createAlert.visible ? createAlert.message : updateAlert.message
              }
              type={createAlert.visible ? createAlert.type : updateAlert.type}
              showIcon
              style={{
                marginBottom: 16,
                background: darkMode ? "#29303d" : undefined,
                color: darkMode ? "#fff" : undefined,
                border: darkMode ? "1px solid #434a56" : undefined,
              }}
            />
          )}

          <div
            style={{
              background: darkMode ? "#29303d" : "#fff",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "24px",
              border: darkMode ? "1px solid #434a56" : "1px solid #f0f0f0",
            }}
          >
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <div
                style={{ display: "flex", gap: "16px", marginBottom: "16px" }}
              >
                <Form.Item
                  name="firstName"
                  label="First Name"
                  rules={[{ required: true }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input size="large" />
                </Form.Item>

                <Form.Item
                  name="lastName"
                  label="Last Name"
                  rules={[{ required: true }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input size="large" />
                </Form.Item>
              </div>

              <div
                style={{ display: "flex", gap: "16px", marginBottom: "16px" }}
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, type: "email" }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input size="large" disabled />
                </Form.Item>

                <Form.Item
                  name="accessLevel"
                  label="Access Level"
                  rules={[{ required: true }]}
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Select
                    size="large"
                    placeholder="Select Access Level"
                    disabled
                    dropdownStyle={{
                      backgroundColor: darkMode ? "#333" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                    }}
                  >
                    <Option value="root">Root</Option>
                    <Option value="admin">Admin</Option>
                    <Option value="general">General</Option>
                  </Select>
                </Form.Item>
              </div>

              {isUpdate && (
                <div style={{ display: "flex", marginBottom: "16px" }}>
                  <Form.Item
                    name="active"
                    label="Account Status"
                    valuePropName="checked"
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Switch
                      checkedChildren="Active"
                      unCheckedChildren="Inactive"
                    />
                  </Form.Item>
                </div>
              )}

              {!isUpdate && (
                <div
                  style={{ display: "flex", gap: "16px", marginBottom: "16px" }}
                >
                  <Form.Item
                    name="tempPassword"
                    label="Temporary Password"
                    rules={[{ required: true }]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Input.Password size="large" />
                  </Form.Item>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "24px",
                  gap: "8px",
                }}
              >
                <Button type="primary" htmlType="submit" size="large">
                  Save
                </Button>
              </div>
            </Form>
          </div>

          {submittedData.length > 0 && (
            <div ref={tableRef} tabIndex={-1}>
              {showAlert && (
                <Alert
                  message={alertMessage}
                  type="success"
                  showIcon
                  style={{
                    marginBottom: 16,
                    backgroundColor: darkMode ? "#2a2a2a" : "#fff",
                    color: darkMode ? "#fff" : "#000",
                    border: darkMode ? "1px solid #444" : undefined,
                  }}
                />
              )}
              <Table
                dataSource={submittedData.map((item, index) => ({
                  ...item,
                  key: index,
                }))}
                columns={columns}
              />
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ padding: "24px" }}>
          <h2>Change Password</h2>
          {passwordAlert.visible && (
            <Alert
              message={passwordAlert.message}
              type={passwordAlert.type}
              showIcon
              style={{
                marginBottom: 16,
                background: darkMode ? "#29303d" : undefined,
                color: darkMode ? "#fff" : undefined,
                border: darkMode ? "1px solid #434a56" : undefined,
              }}
            />
          )}

          <div
            style={{
              background: darkMode ? "#29303d" : "#fff",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "24px",
              border: darkMode ? "1px solid #434a56" : "1px solid #f0f0f0",
            }}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
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
                        if (!value || getFieldValue("newPassword") === value) {
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
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "24px",
                  gap: "8px",
                }}
              >
                <Button type="primary" htmlType="submit" size="large">
                  Change Password
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      {orgCustAccountForProfile && (
        <div
          style={{
            background: darkMode ? "#1e1e1e" : "#fff",
            color: darkMode ? "#fff" : "#000",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2>My Organizations, Customers, Accounts - Permissions</h2>
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
                      rowExpandable: (record) => record.accounts?.length > 0,
                      expandRowByClick: true,
                    }}
                    pagination={false}
                    size="small"
                    rowKey={(record) => record.customerId}
                  />
                );
              },
              rowExpandable: (record) => record.customers?.length > 0,
              expandRowByClick: true,
            }}
            pagination={false}
            rowKey={(record) => record.orgId}
          />
        </div>
      )}
    </div>
  );
};

export default Profile;
