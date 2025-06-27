import React, { useState, useEffect } from "react";
import { useDarkMode } from "../../config/DarkModeContext";
import { useAccountContext } from "../../contexts/AccountContext";
import { useApi } from "../../hooks/useApi";
import {
  Table,
  Input,
  Button,
  Space,
  Select,
  Alert,
  Row,
  Col,
  message,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { Search } = Input;

const MySubmissions = () => {
  const [searchText, setSearchText] = useState("");
  const [filteredResources, setFilteredResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const { darkMode } = useDarkMode();
  const { accountContext, addPolicyRefreshListener } = useAccountContext();
  const { apiCall } = useApi();

  // Policy type state
  const [policyTypes, setPolicyTypes] = useState({});

  // Fetch policy types from LOVs
  const fetchPolicyTypes = async () => {
    try {
      const response = await apiCall({
        method: "GET",
        url: "/api/LOV/search",
        params: {
          description: "POLICY TYPE",
          isActive: true,
        },
      });

      if (response && Array.isArray(response)) {
        const typeMap = {};
        response.forEach((lov) => {
          if (lov.value1) {
            typeMap[lov.id] = {
              name: lov.value1,
              numberOfApprovers: parseInt(lov.value2, 10) || 0,
            };
          }
        });
        setPolicyTypes(typeMap);
      }
    } catch (error) {
      console.error("Error fetching policy types:", error);
    }
  };

  // Get policy type display name
  const getPolicyTypeName = (type) => {
    return policyTypes[type]?.name || `Unknown Type (${type})`;
  };

  // Fetch policy types on component mount
  useEffect(() => {
    fetchPolicyTypes();
  }, []);

  // Policy-related state
  const [policies, setPolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  // Resource-related state
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // Approver-related state
  const [approverSearchText, setApproverSearchText] = useState("");
  const [availableApprovers, setAvailableApprovers] = useState([]);
  const [approversLoading, setApproversLoading] = useState(false);

  // Helper function to get profileId from session storage
  const getProfileIdFromSession = () => {
    try {
      const profileData = JSON.parse(
        sessionStorage.getItem("profileData") || "{}"
      );
      return profileData.profileId;
    } catch (error) {
      console.error("Error parsing profile data from session storage:", error);
      return null;
    }
  };

  // Fetch policies from the API and filter by current account context
  const fetchPolicies = async () => {
    try {
      setPoliciesLoading(true);

      if (!accountContext?.customerId || !accountContext?.accountId) {
        console.log("No account context available");
        setPolicies([]);
        return;
      }

      console.log("🔍 [MySubmissions] Fetching policies for context:", {
        customerId: accountContext.customerId,
        accountId: accountContext.accountId,
      });

      // First, fetch policy types from LOVs
      const lovResponse = await apiCall({
        method: "GET",
        url: "/api/LOV/search",
        params: {
          description: "POLICY TYPE",
          isActive: true,
        },
      });

      console.log("Policy types from LOV:", lovResponse);

      // Create a map of policy types using id as the key
      const policyTypeMap = {};
      if (lovResponse && Array.isArray(lovResponse)) {
        lovResponse.forEach((lov) => {
          if (lov.value1) {
            policyTypeMap[lov.id] = {
              name: lov.value1,
              numberOfApprovers: parseInt(lov.value2, 10) || 0,
            };
          }
        });
      }

      console.log("Policy type map:", policyTypeMap);

      // Add query parameters for filtering policies
      const params = new URLSearchParams({
        customerId: accountContext.customerId,
        accountId: accountContext.accountId,
        isActive: true,
      });

      const response = await apiCall({
        method: "GET",
        url: `/api/Policy?${params.toString()}`,
      });

      console.log("Raw policies from API:", response);

      if (response && Array.isArray(response)) {
        // Map policy types to their names using the numeric type value
        const policiesWithNames = response.map((policy) => ({
          ...policy,
          typeName:
            policyTypeMap[policy.type]?.name || `Unknown Type (${policy.type})`,
          numberOfApprovers: policyTypeMap[policy.type]?.numberOfApprovers || 0,
        }));

        console.log("Final policies with names:", policiesWithNames);
        setPolicies(policiesWithNames);
      } else {
        console.log("🔍 [MySubmissions] No policies available");
        setPolicies([]);
      }
    } catch (error) {
      console.error("❌ [MySubmissions] Error fetching policies:", error);
      message.error("Failed to load policies");
      setPolicies([]);
    } finally {
      setPoliciesLoading(false);
    }
  };

  // Load account data on component mount (no longer needed since we use global AccountContext)
  useEffect(() => {
    // fetchAllAccountsData(); // Removed - now using global AccountContext
  }, []);

  // Fetch policies when account context changes
  useEffect(() => {
    if (accountContext) {
      fetchPolicies();
    }
  }, [accountContext]);

  // Add policy refresh listener
  useEffect(() => {
    if (addPolicyRefreshListener) {
      addPolicyRefreshListener(fetchPolicies);
    }
  }, [addPolicyRefreshListener]);

  // Auto-search resources when searchText reaches minimum length
  useEffect(() => {
    if (searchText.trim().length >= 3) {
      const timeoutId = setTimeout(() => {
        fetchResources(searchText);
      }, 500); // Debounce search by 500ms

      return () => clearTimeout(timeoutId);
    } else if (searchText.trim().length === 0) {
      // Clear search results when text is completely cleared
      setFilteredResources([]);
    }
  }, [searchText]);

  // Auto-search approvers when approverSearchText reaches minimum length
  useEffect(() => {
    if (approverSearchText.trim().length >= 3) {
      const timeoutId = setTimeout(() => {
        fetchApprovers(approverSearchText);
      }, 500); // Debounce search by 500ms

      return () => clearTimeout(timeoutId);
    } else if (approverSearchText.trim().length === 0) {
      // Clear search results when text is completely cleared
      setAvailableApprovers([]);
    }
  }, [approverSearchText]);

  // Clear and refetch resources/approvers when account context changes
  useEffect(() => {
    if (accountContext) {
      // Only clear search results and available options, NOT selected items
      // This allows users to keep their selections when switching contexts
      setFilteredResources([]);
      setAvailableApprovers([]);

      // Only clear selected items if switching to a completely different context
      // For now, we'll preserve selections to improve UX
      // setSelectedResources([]);
      // setSelectedApprovers([]);
      // setSelectedPolicy(null);

      // Refetch resources if there's an active search with minimum 3 characters
      if (searchText.trim().length >= 3) {
        fetchResources(searchText);
      }

      // Refetch approvers if there's an active search with minimum 3 characters
      if (approverSearchText.trim().length >= 3) {
        fetchApprovers(approverSearchText);
      }
    }
  }, [accountContext]); // Remove searchText and approverSearchText from dependencies

  // Fetch approvers from the API with search filters
  const fetchApprovers = async (searchName = "") => {
    if (!searchName.trim()) {
      setAvailableApprovers([]);
      return;
    }

    // Only search if we have at least 3 characters
    if (searchName.trim().length < 3) {
      setAvailableApprovers([]);
      return;
    }

    try {
      setApproversLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (searchName.trim()) {
        params.append("searchText", searchName.trim());
      }

      // Add current account context filtering
      if (accountContext) {
        params.append("customerId", accountContext.customerId);
        params.append("accountId", accountContext.accountId);
      }

      const response = await apiCall({
        method: "GET",
        url: `/api/Profile/search-approvers?${params.toString()}`,
      });

      console.log("@@Approvers from API:", response);
      console.log("@@Current context for approvers:", {
        customerId: accountContext?.customerId,
        accountId: accountContext?.accountId,
      });

      if (response && Array.isArray(response)) {
        // Filter out already selected approvers
        const selectedApproverIds = selectedApprovers.map(
          (approver) => approver.profileId
        );
        const filteredApprovers = response.filter(
          (approver) => !selectedApproverIds.includes(approver.profileId)
        );

        setAvailableApprovers(filteredApprovers);
      } else {
        setAvailableApprovers([]);
      }
    } catch (error) {
      console.error("Error fetching approvers:", error);
      message.error("Failed to search approvers");
      setAvailableApprovers([]);
    } finally {
      setApproversLoading(false);
    }
  };

  // Handle approver search
  const handleApproverSearch = () => {
    if (approverSearchText.trim().length >= 3) {
      fetchApprovers(approverSearchText);
    } else {
      setAvailableApprovers([]);
    }
  };

  // Handle approver search on Enter key press
  const handleApproverSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleApproverSearch();
    }
  };

  // Handle adding approver to selected list
  const handleAddApprover = (approver) => {
    setSelectedApprovers([...selectedApprovers, approver]);
    // Remove from available list
    setAvailableApprovers(
      availableApprovers.filter((item) => item.profileId !== approver.profileId)
    );
  };

  // Handle removing approver from selected list
  const handleRemoveApprover = (approver) => {
    setSelectedApprovers(
      selectedApprovers.filter((item) => item.profileId !== approver.profileId)
    );
    // Optionally re-run search to add back to available if still matches search
    if (approverSearchText.trim()) {
      fetchApprovers(approverSearchText);
    }
  };

  // Fetch resources from the API with search filters
  const fetchResources = async (searchName = "", searchType = "") => {
    if (!searchName.trim() && !searchType.trim()) {
      setFilteredResources([]);
      return;
    }

    // Only search if we have at least 3 characters
    if (searchName.trim().length < 3 && !searchType.trim()) {
      setFilteredResources([]);
      return;
    }

    try {
      setResourcesLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (searchName.trim()) {
        params.append("q", searchName.trim());
      }
      if (searchType.trim()) {
        params.append("type", searchType.trim());
      }

      const response = await apiCall({
        method: "get",
        url: `/api/Resource/search?${params.toString()}`,
      });

      console.log("Resources from API:", response);

      if (response && Array.isArray(response)) {
        let filteredResources = response;

        // Filter resources based on current account context
        if (accountContext) {
          const currentCustomerId = accountContext.customerId;
          const currentAccountId = accountContext.accountId;

          // Strict filtering: only show resources from the current account context
          filteredResources = response.filter(
            (resource) =>
              resource.customerId === currentCustomerId &&
              resource.accountId === currentAccountId
          );

          console.log("Current account context:", {
            customerId: currentCustomerId,
            accountId: currentAccountId,
          });
          console.log("Raw API response:", response);
          console.log("After context filtering:", filteredResources);
        }

        // Filter out already selected resources to avoid duplicates
        const selectedResourceIds = selectedResources.map(
          (resource) => resource.resourceId
        );
        filteredResources = filteredResources.filter(
          (resource) => !selectedResourceIds.includes(resource.resourceId)
        );

        // Transform API response to match table structure
        const transformedResources = filteredResources.map((resource) => ({
          id: resource.id,
          resourceId: resource.resourceId,
          resourceName: resource.name,
          resourceType: resource.type,
          customerId: resource.customerId,
          accountId: resource.accountId,
          customerName: resource.customerName,
          accountName: resource.accountName,
          isActive: resource.isActive,
          category: resource.category || "Unknown",
          region: resource.region || "Unknown",
          status: resource.status || "Unknown",
        }));

        console.log("Transformed resources:", transformedResources);
        // Only set filteredResources, no need to set resources
        setFilteredResources(transformedResources);
      } else {
        setFilteredResources([]);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
      message.error("Failed to search resources");
      setFilteredResources([]);
    } finally {
      setResourcesLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchText.trim().length >= 3) {
      fetchResources(searchText);
    } else {
      setFilteredResources([]);
    }
  };

  // Add Enter key support for search
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleAddResource = (resource) => {
    if (
      !selectedResources.some((item) => item.resourceId === resource.resourceId)
    ) {
      setSelectedResources((prev) => [...prev, resource]);
      setFilteredResources((prev) =>
        prev.filter((item) => item.resourceId !== resource.resourceId)
      ); // Remove from search results
    }
  };

  const handleRemoveResource = (resourceId) => {
    const removedResource = selectedResources.find(
      (item) => item.resourceId === resourceId
    );

    setSelectedResources((prev) =>
      prev.filter((item) => item.resourceId !== resourceId)
    );

    // Re-add removed resource to search results if it matches current search/filter criteria
    if (removedResource && searchText.trim()) {
      const matchesSearch =
        removedResource.resourceName
          .toLowerCase()
          .includes(searchText.toLowerCase()) ||
        removedResource.resourceId
          .toLowerCase()
          .includes(searchText.toLowerCase());

      if (matchesSearch) {
        setFilteredResources((prev) => [...prev, removedResource]);
      }
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedPolicy) {
      message.error("Please select a policy");
      return;
    }
    if (selectedResources.length === 0) {
      message.error("Please select at least one resource");
      return;
    }
    if (selectedApprovers.length === 0) {
      message.error("Please select at least one approver");
      return;
    }

    console.log("Selected policy:", selectedPolicy);
    console.log(
      "Number of approvers required:",
      selectedPolicy.numberOfApprovers
    );
    console.log("Number of approvers selected:", selectedApprovers.length);
    console.log("Policy numberOfApprovers:", selectedPolicy.numberOfApprovers);
    console.log("Policy object:", selectedPolicy);

    // Validate number of approvers against policy requirement - must be at least the required number
    if (selectedPolicy.numberOfApprovers > selectedApprovers.length) {
      console.log("VALIDATION FAILED: Not enough approvers selected");
      message.error(
        `This policy requires at least ${selectedPolicy.numberOfApprovers} approver(s). You have selected ${selectedApprovers.length} approver(s). Please select at least ${selectedPolicy.numberOfApprovers} approver(s).`
      );
      return;
    }
    console.log("VALIDATION PASSED: Sufficient approvers selected");

    // Get current user's profileId
    const currentProfileId = getProfileIdFromSession();
    console.log("Current profileId from session:", currentProfileId);
    console.log(
      "Session storage profileData:",
      sessionStorage.getItem("profileData")
    );

    if (!currentProfileId) {
      message.error("Unable to get current user profile. Please log in again.");
      return;
    }

    // Set loading state
    const loadingMessage = message.loading("Submitting approval request...", 0);

    try {
      // Step 1: Create ApprovalFlow
      const approvalFlowData = {
        policyId: selectedPolicy.id,
        name: `${selectedPolicy.name} - ${new Date().toLocaleDateString()}`,
        type: selectedPolicy.type,
        status: "Submitted", // Fixed: Capitalized to match expected format
        createdById: currentProfileId, // Add the missing createdById field
        isActive: true,
      };

      // Add key/value for tag policies
      if (
        selectedPolicy.type === "Tag" &&
        selectedPolicy.key &&
        selectedPolicy.value
      ) {
        approvalFlowData.key = selectedPolicy.key;
        approvalFlowData.value = selectedPolicy.value;
      }

      console.log("Creating ApprovalFlow with data:", approvalFlowData);

      const approvalFlowResponse = await apiCall({
        method: "post",
        url: "/api/ApprovalFlow",
        data: approvalFlowData,
      });

      if (!approvalFlowResponse || !approvalFlowResponse.id) {
        throw new Error("Failed to create approval flow - no ID returned");
      }

      const approvalFlowId = approvalFlowResponse.id;
      console.log("ApprovalFlow created with ID:", approvalFlowId);

      // Step 2: Create ApprovalFlowParticipant records for each approver
      // Process one participant at a time to ensure emails are sent
      for (const approver of selectedApprovers) {
        const participantData = {
          approvalId: approvalFlowId,
          profileId: approver.profileId,
          status: "Pending", // Fixed: Capitalized to match valid values
        };

        console.log(
          "Creating ApprovalFlowParticipant with data:",
          participantData
        );

        try {
          // Create participant and wait for it to complete
          const participant = await apiCall({
            method: "post",
            url: "/api/ApprovalFlowParticipant",
            data: participantData,
          });

          console.log("Participant created:", participant);

          // Create notification for this approver
          await apiCall({
            method: "POST",
            url: "/api/Notification",
            data: {
              profileId: approver.profileId,
              generalId: approvalFlowResponse.id,
              type: "approvalFlow",
              message:
                "You are an approver in a new approval flow. Please review and approve/reject",
            },
          });

          console.log("Notification created for approver:", approver.profileId);
        } catch (error) {
          console.error("Error creating participant or notification:", error);
          // Continue with other approvers even if one fails
        }
      }

      // Step 3: Create ApprovalFlowLog records for each resource
      const logPromises = selectedResources.map(async (resource) => {
        const logData = {
          approvalId: approvalFlowId,
          customerId: parseInt(resource.customerId, 10),
          accountId: parseInt(resource.accountId, 10),
          resourceId: resource.id, // Use the primary key ID, not the string resourceId
          status: "Pending", // Fixed: Capitalized to match valid values
        };

        console.log("Creating ApprovalFlowLog with data:", logData);
        console.log("Resource object:", resource);

        return await apiCall({
          method: "post",
          url: "/api/ApprovalFlowLog",
          data: logData,
        });
      });

      const logResults = await Promise.all(logPromises);
      console.log("ApprovalFlowLog records created:", logResults);

      // After successful creation of approval flow, participants, and resources
      // Create notifications for each approver
      for (const approver of selectedApprovers) {
        try {
          await apiCall({
            method: "POST",
            url: "/api/Notification",
            data: {
              profileId: approver.profileId,
              generalId: approvalFlowResponse.id, // The ID from the created approval flow
              type: "approvalFlow",
              message:
                "You are an approver in a new approval flow. Please review and approve/reject",
            },
          });
        } catch (error) {
          console.error("Error creating notification for approver:", error);
          // Don't throw error here, continue with other approvers
        }
      }

      // Close loading message
      loadingMessage();

      // Show success message
      message.success(
        `Approval request submitted successfully! ${selectedResources.length} resources sent to ${selectedApprovers.length} approvers.`
      );

      // Show success alert at the top
      setShowSuccessAlert(true);

      // Reset form state
      setSelectedPolicy(null);
      setSelectedResources([]);
      setSelectedApprovers([]);
      setFilteredResources([]);
      setAvailableApprovers([]);
      setSearchText("");
      setApproverSearchText("");
      setSubmitted(true);
    } catch (error) {
      // Close loading message and show error
      loadingMessage();
      console.error("Error submitting approval request:", error);

      let errorMessage = "Failed to submit approval request. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        errorMessage = JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  };

  const handlePolicyChange = (policyId) => {
    const selectedPolicyData = policies.find((p) => p.id === policyId);
    console.log("Selected policy data:", selectedPolicyData);
    console.log(
      "Number of approvers required:",
      selectedPolicyData?.numberOfApprovers
    );
    console.log("Current selected approvers:", selectedApprovers.length);

    // Clear selected approvers if the number of required approvers has changed
    if (
      selectedApprovers.length > 0 &&
      selectedPolicyData?.numberOfApprovers > selectedApprovers.length
    ) {
      message.warning(
        `This policy requires ${selectedPolicyData.numberOfApprovers} approvers. Your current selection will be cleared.`
      );
      setSelectedApprovers([]);
    }

    setSelectedPolicy(selectedPolicyData);

    if (selectedPolicyData && resources.length > 0) {
      // Filter resources based on selected policy type
      if (selectedPolicyData.type === 1) {
        // Tag
        setFilteredResources(resources.filter((resource) => resource.isTagged));
      } else if (selectedPolicyData.type === 2) {
        // Delete Tag
        setFilteredResources(resources);
      } else if (selectedPolicyData.type === 3) {
        // Terminate
        setFilteredResources(resources);
      } else if (selectedPolicyData.type === 4) {
        // Stop
        setFilteredResources(resources);
      } else if (selectedPolicyData.type === 5) {
        // Start
        setFilteredResources(resources);
      } else if (selectedPolicyData.type === 6) {
        // Reboot
        setFilteredResources(resources);
      } else {
        setFilteredResources(resources);
      }
    } else if (!selectedPolicyData) {
      setFilteredResources(resources);
    }
  };

  // Define table columns
  const resourceColumns = [
    {
      title: "Resource ID",
      dataIndex: "resourceId",
      key: "resourceId",
      render: (text) => (
        <span style={{ color: darkMode ? "#fff" : "#000" }}>{text}</span>
      ),
    },
    {
      title: "Name",
      dataIndex: "resourceName",
      key: "resourceName",
      render: (text) => (
        <span style={{ color: darkMode ? "#fff" : "#000" }}>{text}</span>
      ),
    },
    {
      title: "Type",
      dataIndex: "resourceType",
      key: "resourceType",
      render: (text) => (
        <span style={{ color: darkMode ? "#fff" : "#000" }}>{text}</span>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (text) => (
        <span style={{ color: darkMode ? "#fff" : "#000" }}>
          {text || "Unknown"}
        </span>
      ),
    },
    {
      title: "Region",
      dataIndex: "region",
      key: "region",
      render: (text) => (
        <span style={{ color: darkMode ? "#fff" : "#000" }}>
          {text || "Unknown"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => (
        <span style={{ color: darkMode ? "#fff" : "#000" }}>
          {text || "Unknown"}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          variant="outlined"
          onClick={() => handleAddResource(record)}
          style={{
            borderColor: "#06923E",
            color: "#06923E",
          }}
        >
          Add
        </Button>
      ),
    },
  ];

  const selectedColumns = [
    {
      title: "Resource ID",
      dataIndex: "resourceId",
      key: "resourceId",
    },
    {
      title: "Resource Name",
      dataIndex: "resourceName",
      key: "resourceName",
    },
    {
      title: "Resource Type",
      dataIndex: "resourceType",
      key: "resourceType",
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Account",
      dataIndex: "accountName",
      key: "accountName",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button onClick={() => handleRemoveResource(record.resourceId)} danger>
          Delete
        </Button>
      ),
    },
  ];

  // Define columns for approver tables
  const approverColumns = [
    {
      title: "Profile ID",
      dataIndex: "profileId",
      key: "profileId",
    },
    {
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Access Level",
      dataIndex: "accessLevel",
      key: "accessLevel",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          onClick={() => handleAddApprover(record)}
          variant="outlined"
          style={{
            borderColor: "#06923E",
            color: "#06923E",
          }}
        >
          Add
        </Button>
      ),
    },
  ];

  const selectedApproverColumns = [
    {
      title: "Profile ID",
      dataIndex: "profileId",
      key: "profileId",
    },
    {
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Access Level",
      dataIndex: "accessLevel",
      key: "accessLevel",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button onClick={() => handleRemoveApprover(record)} danger>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "0px" }}>
      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert
          message="Approval Request Submitted Successfully!"
          description="Your approval request has been successfully submitted and is now pending review."
          type="success"
          showIcon
          closable
          onClose={() => setShowSuccessAlert(false)}
          style={{
            marginBottom: "16px",
            background: darkMode ? "#222" : undefined,
            color: darkMode ? "#fff" : undefined,
            border: darkMode ? "1px solid #444" : undefined,
          }}
        />
      )}

      {/* Policy Selection Section */}
      <div
        style={{
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}
        >
          Select Policy
        </h3>

        <Select
          placeholder={
            policiesLoading
              ? "Loading policies..."
              : `Select a policy (${policies.length} available)`
          }
          value={selectedPolicy?.id}
          onChange={handlePolicyChange}
          loading={policiesLoading}
          style={{ width: "100%" }}
          size="large"
          dropdownStyle={{
            backgroundColor: darkMode ? "#333" : "#fff",
            color: darkMode ? "#fff" : "#000",
          }}
          notFoundContent={
            policiesLoading
              ? "Loading policies..."
              : accountContext
              ? "No policies available for current context"
              : "Please select an account context first"
          }
          optionLabelProp="label"
        >
          {policies.map((policy) => (
            <Select.Option
              key={policy.id}
              value={policy.id}
              label={policy.name}
            >
              <div style={{ padding: "4px 0", lineHeight: "1.2" }}>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    marginBottom: "2px",
                  }}
                >
                  {policy.name}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: darkMode ? "#999" : "#666",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {policy.typeName || `Unknown Type (${policy.type})`} •{" "}
                  {policy.customerName || "N/A"} • {policy.accountName || "N/A"}{" "}
                  •{" "}
                  {policy.numberOfApprovers > 0
                    ? `${policy.numberOfApprovers} approver${
                        policy.numberOfApprovers > 1 ? "s" : ""
                      } required`
                    : "No approvers required"}
                </div>
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* Search Resources Section */}
      <div
        style={{
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}
        >
          Search Resources
        </h3>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearchKeyPress}
            placeholder="Search for Resource ID or Name"
            size="large"
          />
          <Button
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={resourcesLoading}
            size="large"
          />
        </Space.Compact>
      </div>

      {/* Display the resource table only after search results */}
      {filteredResources.length > 0 && (
        <div
          style={{
            background: darkMode ? "#1e1e1e" : "#fff",
            color: darkMode ? "#fff" : "#000",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Available Resources ({filteredResources.length} found)
          </h3>
          <Table
            columns={resourceColumns}
            dataSource={filteredResources}
            rowKey={(record) =>
              `${record.customerId}-${record.accountId}-${record.resourceId}`
            }
            loading={resourcesLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} resources`,
            }}
          />
        </div>
      )}

      {/* Display message when search is performed but no results found */}
      {searchText.trim() &&
        !resourcesLoading &&
        filteredResources.length === 0 && (
          <div
            style={{
              background: darkMode ? "#1e1e1e" : "#fff",
              color: darkMode ? "#fff" : "#000",
              borderRadius: "8px",
              padding: "24px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, color: darkMode ? "#999" : "#666" }}>
              No resources found for "{searchText}". Try a different search
              term.
            </p>
          </div>
        )}

      {/* Display Selected Resources table only when at least one resource is selected */}
      {selectedResources.length > 0 && (
        <div
          style={{
            background: darkMode ? "#1e1e1e" : "#fff",
            color: darkMode ? "#fff" : "#000",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Selected Resources
          </h3>
          <Table
            columns={selectedColumns}
            dataSource={selectedResources}
            rowKey={(record) =>
              `${record.customerId}-${record.accountId}-${record.resourceId}`
            }
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} selected`,
            }}
          />
        </div>
      )}

      {/* Search Approvers Section */}
      <div
        style={{
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}
        >
          Search Approvers
        </h3>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={approverSearchText}
            onChange={(e) => setApproverSearchText(e.target.value)}
            onPressEnter={handleApproverSearchKeyPress}
            placeholder="Search for approvers by name or email"
            size="large"
          />
          <Button
            icon={<SearchOutlined />}
            onClick={handleApproverSearch}
            loading={approversLoading}
            size="large"
          />
        </Space.Compact>
      </div>

      {/* Display the available approvers table only after search results */}
      {availableApprovers.length > 0 && (
        <div
          style={{
            background: darkMode ? "#1e1e1e" : "#fff",
            color: darkMode ? "#fff" : "#000",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Available Approvers ({availableApprovers.length} found)
          </h3>
          <Table
            columns={approverColumns}
            dataSource={availableApprovers}
            rowKey="profileId"
            loading={approversLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} approvers`,
            }}
          />
        </div>
      )}

      {/* Display message when search is performed but no results found */}
      {approverSearchText.trim() &&
        !approversLoading &&
        availableApprovers.length === 0 && (
          <div
            style={{
              background: darkMode ? "#1e1e1e" : "#fff",
              color: darkMode ? "#fff" : "#000",
              borderRadius: "8px",
              padding: "24px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, color: darkMode ? "#999" : "#666" }}>
              No approvers found for "{approverSearchText}". Try a different
              search term.
            </p>
          </div>
        )}

      {/* Display Selected Approvers table only when at least one approver is selected */}
      {selectedApprovers.length > 0 && (
        <div
          style={{
            background: darkMode ? "#1e1e1e" : "#fff",
            color: darkMode ? "#fff" : "#000",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Selected Approvers
          </h3>
          {selectedPolicy && selectedPolicy.numberOfApprovers > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <Alert
                type={
                  selectedPolicy.numberOfApprovers > selectedApprovers.length
                    ? "warning"
                    : "success"
                }
                message={
                  selectedPolicy.numberOfApprovers > selectedApprovers.length
                    ? `This policy requires at least ${selectedPolicy.numberOfApprovers} approver(s). You have selected ${selectedApprovers.length} approver(s). Please select at least ${selectedPolicy.numberOfApprovers} approver(s).`
                    : `Required number of approvers (${selectedPolicy.numberOfApprovers}) has been met. You can select additional approvers if needed.`
                }
                showIcon
              />
            </div>
          )}
          <Table
            columns={selectedApproverColumns}
            dataSource={selectedApprovers}
            rowKey="profileId"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} selected`,
            }}
          />
        </div>
      )}

      {/* Submit Section */}
      <div
        style={{
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          type="primary"
          onClick={handleSubmit}
          size="large"
          style={{
            backgroundColor: "#06923E",
            borderColor: "#06923E",
            color: "white",
          }}
          disabled={
            selectedResources.length === 0 ||
            selectedApprovers.length === 0 ||
            !selectedPolicy ||
            (selectedPolicy &&
              selectedPolicy.numberOfApprovers > selectedApprovers.length)
          }
        >
          Submit
        </Button>
      </div>

      {submitted && (
        <Alert
          message="Submission Successful"
          description="Your resources have been submitted successfully!"
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
    </div>
  );
};

export default MySubmissions;
