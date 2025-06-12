import React, { useState, useRef, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Table,
  Alert,
  AutoComplete,
  Switch,
} from "antd";
import { useDarkMode } from "../../config/DarkModeContext";
import { useAccountContext } from "../../contexts/AccountContext";
import useApi from "../../hooks/useApi";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
const { Option } = Select;

const MyPolicy = ({ selectedOrganization, selectedCloudAccounts }) => {
  const [form] = Form.useForm();
  const [submittedData, setSubmittedData] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success"); // "success", "error", "info"
  const [policyType, setPolicyType] = useState("");
  const tableRef = useRef(null);
  const { darkMode } = useDarkMode();
  const { accountContext, triggerPolicyRefresh } = useAccountContext();
  const apiCall = useApi();

  // Add state for account context data
  const [allAccountsData, setAllAccountsData] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  // State for tracking if we're editing an existing policy
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);

  // State for managing policies from database
  const [policies, setPolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Debug: Log account context data
  useEffect(() => {
    console.log("MyPolicy - accountContext:", accountContext);
    if (accountContext) {
      console.log(
        "MyPolicy - accountContext structure:",
        JSON.stringify(accountContext, null, 2)
      );
    }
  }, [accountContext]);

  // Add effect to set default status when creating new policy
  useEffect(() => {
    if (!isEditMode) {
      form.setFieldValue("status", "Active");
    }
  }, [form, isEditMode]);

  // Transform the data to create dropdown options
  const transformAccountData = (response) => {
    const dropdownOptions = [];
    response.organizations?.forEach((org) => {
      org.customers?.forEach((customer) => {
        customer.accounts?.forEach((account) => {
          const label = `${customer.name} -- ${account.name} - ${account.cloudType}`;
          dropdownOptions.push({
            key: `${org.orgId}-${customer.customerId}-${account.accountId}`,
            label: label,
            value: label, // Use the label as the value for the Select component
            data: {
              // Store the full data object separately
              organizationId: org.orgId,
              organizationName: org.name,
              customerId: customer.customerId,
              customerName: customer.name,
              accountId: account.accountId,
              accountName: account.name,
              cloudType: account.cloudType,
              defaultAccount: account.defaultAccount,
              role: account.role || "viewer",
            },
          });
        });
      });
    });
    return dropdownOptions;
  };

  // Modify the fetchAllAccountsData function
  const fetchAllAccountsData = async () => {
    try {
      setAccountsLoading(true);

      const getProfileIdFromSession = () => {
        try {
          const profileData = JSON.parse(
            sessionStorage.getItem("profileData") || "{}"
          );
          return profileData.profileId;
        } catch (error) {
          console.error(
            "Error parsing profile data from session storage:",
            error
          );
          return null;
        }
      };

      const profileId = getProfileIdFromSession();

      if (!profileId) {
        console.error(
          "No profileId found in session storage for account context"
        );
        setAccountsLoading(false);
        return;
      }

      const response = await apiCall({
        method: "get",
        url: `/api/profile/${profileId}/organizations`,
      });

      console.log("MyPolicy - API Response:", response);

      const dropdownOptions = transformAccountData(response);
      console.log("MyPolicy - Dropdown Options:", dropdownOptions);
      setAllAccountsData(dropdownOptions);
    } catch (error) {
      console.error("Error fetching account context data:", error);
    } finally {
      setAccountsLoading(false);
    }
  };

  // Fetch account data on component mount
  useEffect(() => {
    fetchAllAccountsData();
  }, []);

  // Fetch policies after account data is loaded
  useEffect(() => {
    if (allAccountsData.length > 0) {
      fetchPolicies();
    }
  }, [allAccountsData]);

  // Fetch all policies from database
  const fetchPolicies = async () => {
    try {
      setPoliciesLoading(true);
      const response = await apiCall({
        method: "get",
        url: "/api/Policy",
      });

      console.log("Policies from API:", response);
      setPolicies(response || []);

      // Also update submitted data for table display
      const transformedPolicies = await Promise.all(
        (response || []).map(async (policy) => {
          console.log("Transforming policy:", policy);

          // Find matching account data to get cloud type
          let customerAccountDisplay = "Unknown -- Unknown";

          if (policy.customerName && policy.accountName) {
            // Try to find matching account to get cloud type
            const matchingAccount = allAccountsData.find((acc) => {
              const accountData = acc.data;
              return (
                accountData.customerId === policy.customerId &&
                accountData.accountId === policy.accountId
              );
            });

            if (matchingAccount) {
              customerAccountDisplay = `${policy.customerName} -- ${policy.accountName} - ${matchingAccount.data.cloudType}`;
            } else {
              // Fallback without cloud type
              customerAccountDisplay = `${policy.customerName} -- ${policy.accountName}`;
            }
          }

          console.log("Customer Account Display:", customerAccountDisplay);

          // For Tag policies, fetch key-value pairs from LOVs table
          let tagKeyValue = { key: policy.value1, value: policy.value2 };
          let totalTags = 0;
          if (policy.type === "Tag") {
            try {
              const lovResponse = await apiCall({
                method: "get",
                url: `/api/LOV/search?description=KEYVALUE&generalId=${policy.id}`,
              });

              totalTags = lovResponse?.length || 0;

              // Get the first tag pair for table display
              if (lovResponse && lovResponse.length > 0) {
                tagKeyValue = {
                  key: lovResponse[0].value1,
                  value: lovResponse[0].value2,
                };
              } else {
                // No LOV entries found, show placeholder
                tagKeyValue = {
                  key: "No tags",
                  value: "defined",
                };
              }
            } catch (error) {
              console.error("Error fetching tag key-value pairs:", error);
              // Show error state in UI
              tagKeyValue = {
                key: "Error",
                value: "loading tags",
              };
            }
          }

          return {
            policyType: policy.type,
            policyName: policy.name,
            tagKey: tagKeyValue.key,
            tagValue: tagKeyValue.value,
            totalTags,
            isActive: policy.isActive,
            cloudAccounts: customerAccountDisplay,
            id: policy.id,
            customerId: policy.customerId,
            accountId: policy.accountId,
          };
        })
      );

      console.log("Transformed policies:", transformedPolicies);
      setSubmittedData(transformedPolicies);
    } catch (error) {
      console.error("Error fetching policies:", error);
      message.error("Failed to fetch policies");
    } finally {
      setPoliciesLoading(false);
    }
  };

  // Debug: Log when accounts data changes
  useEffect(() => {
    console.log("MyPolicy - allAccountsData updated:", allAccountsData);
    console.log("MyPolicy - allAccountsData length:", allAccountsData.length);
  }, [allAccountsData]);

  // Policy search states
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      cloudAccounts: selectedCloudAccounts || [],
    });
  }, [selectedCloudAccounts, form]);

  // State for table search (different from form search)
  const [tableSearchValue, setTableSearchValue] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (tableSearchValue) {
      const filtered = submittedData.filter((item) =>
        item.policyName.toLowerCase().includes(tableSearchValue.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(submittedData);
    }
  }, [tableSearchValue, submittedData]);

  const scrollToTable = () => {
    setTimeout(() => {
      if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: "smooth" });
        tableRef.current.focus({ preventScroll: true });
      }
    }, 100);
  };

  // Search for existing policies (for AutoComplete)
  const searchPolicies = async (searchTerm) => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiCall({
        method: "get",
        url: "/api/Policy/search",
        params: {
          name: searchTerm,
        },
      });

      console.log("Policy search response:", response);
      setSearchResults(response || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error searching policies:", error);
      message.error("Failed to search policies");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change (for AutoComplete)
  const handleSearchChange = (value) => {
    setSearchValue(value);
    if (value) {
      searchPolicies(value);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  // Handle policy selection from search results
  const handlePolicySelect = (value, option) => {
    const selectedPolicy = searchResults.find(
      (policy) => `${policy.name} (${policy.type})` === value
    );

    if (selectedPolicy) {
      console.log("Selected Policy Full Object:", selectedPolicy);

      // Find matching account in dropdown options using customerName and accountName
      let matchingAccountLabel = null;

      if (selectedPolicy.customerName && selectedPolicy.accountName) {
        matchingAccountLabel = allAccountsData.find((accountOption) => {
          const labelParts = accountOption.label.split(" -- ");
          const customerName = labelParts[0];
          const accountPart = labelParts[1];
          const accountName = accountPart ? accountPart.split(" - ")[0] : "";

          return (
            customerName === selectedPolicy.customerName &&
            accountName === selectedPolicy.accountName
          );
        });
      }

      console.log("Matching Account Label:", matchingAccountLabel?.label);

      // Populate form with selected policy data
      form.setFieldsValue({
        policyType: selectedPolicy.type,
        policyName: selectedPolicy.name,
        tagKey: selectedPolicy.value1,
        tagValue: selectedPolicy.value2,
        cloudAccounts: matchingAccountLabel ? [matchingAccountLabel.label] : [],
        isActive:
          selectedPolicy.isActive !== undefined
            ? selectedPolicy.isActive
            : true,
      });

      setPolicyType(selectedPolicy.type);
      setIsEditMode(true);
      setSelectedPolicyId(selectedPolicy.id);
      setSearchValue("");
      setShowSuggestions(false);
      setSearchResults([]);

      if (matchingAccountLabel) {
        message.success(`Policy "${selectedPolicy.name}" loaded for editing`);
      } else {
        message.warning(
          `Policy "${selectedPolicy.name}" loaded, but no matching account found. Please select account manually.`
        );
      }
    }
  };

  // Format search results for AutoComplete
  const searchOptions = searchResults.map((policy) => ({
    value: `${policy.name} (${policy.type})`,
    label: (
      <div style={{ padding: "4px 0" }}>
        <div style={{ fontWeight: "bold" }}>{policy.name}</div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          Type: {policy.type} | Customer: {policy.customerName || "N/A"} |
          Account: {policy.accountName || "N/A"}
        </div>
      </div>
    ),
  }));

  // Helper function to show alert
  const showAlertMessage = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);

    // Auto-hide success messages after 5 seconds
    if (type === "success") {
      setTimeout(() => {
        setShowAlert(false);
      }, 5000);
    }
  };

  // Helper function to hide alert
  const hideAlert = () => {
    setShowAlert(false);
  };

  const onFinish = async (values) => {
    try {
      setSavingPolicy(true);
      hideAlert(); // Hide any existing alert
      console.log("Form values:", values);

      // Validate tag values for Tag policies
      if (values.policyType === "Tag") {
        if (!values.tags || values.tags.length === 0) {
          showAlertMessage(
            "At least one tag key-value pair is required",
            "error"
          );
          return;
        }

        const validTags = values.tags.filter(
          (tag) => tag?.tagKey && tag?.tagValue
        );
        if (validTags.length === 0) {
          showAlertMessage(
            "At least one complete tag key-value pair is required",
            "error"
          );
          return;
        }
      }

      // Extract selected account information
      const selectedAccount = allAccountsData.find(
        (acc) => acc.label === values.cloudAccounts
      );
      const accountData = selectedAccount ? selectedAccount.data : null;

      if (!accountData) {
        showAlertMessage("No valid accounts selected", "error");
        return;
      }

      // Create the base policy without value1/value2 for Tag type
      const basePolicy = {
        type: values.policyType,
        name: values.policyName,
        value1: values.policyType === "Tag" ? null : values.value1 || "",
        value2: values.policyType === "Tag" ? null : values.value2 || "",
        isActive: values.status === "Active",
        organizationId: accountData.organizationId,
        organizationName: accountData.organizationName,
        customerId: accountData.customerId,
        customerName: accountData.customerName,
        accountId: accountData.accountId,
        accountName: accountData.accountName,
        cloudType: accountData.cloudType,
      };

      // Create the policy first
      const policyResponse = await apiCall({
        method: isEditMode ? "put" : "post",
        url: isEditMode ? `/api/Policy/${selectedPolicyId}` : "/api/Policy",
        data: basePolicy,
      });

      console.log("Policy created:", policyResponse);

      // If it's a Tag policy, save the key-value pairs to LOVs table
      if (
        values.policyType === "Tag" &&
        values.tags?.length > 0 &&
        policyResponse?.id
      ) {
        const validTags = values.tags.filter(
          (tag) => tag?.tagKey && tag?.tagValue
        );
        console.log("Valid tags to save:", validTags);

        try {
          const lovPromises = validTags.map((tag) =>
            apiCall({
              method: "post",
              url: "/api/LOV",
              data: {
                description: "KEYVALUE",
                generalId: policyResponse.id,
                value1: tag.tagKey.trim(),
                value2: tag.tagValue.trim(),
                isActive: true,
                organizationId: accountData.organizationId,
                customerId: accountData.customerId,
                accountId: accountData.accountId,
                createDateTime: new Date().toISOString(),
              },
            }).catch((error) => {
              console.error("Error creating LOV entry:", error);
              return null; // Return null for failed requests
            })
          );

          const results = await Promise.all(lovPromises);
          const failedCount = results.filter((r) => r === null).length;
          const successCount = results.filter((r) => r !== null).length;

          if (failedCount > 0) {
            if (successCount === 0) {
              showAlertMessage(
                `Policy created but failed to save any tag pairs`,
                "error"
              );
            } else {
              showAlertMessage(
                `Policy created but failed to save ${failedCount} tag pair(s)`,
                "warning"
              );
            }
          } else {
            showAlertMessage(
              isEditMode
                ? "Policy and tags updated successfully"
                : "Policy and tags created successfully"
            );
          }

          // Reset form and update UI
          form.resetFields();
          setPolicyType("");
          setIsEditMode(false);
          setSelectedPolicyId(null);
          setTagRows([{ key: 0, tagKey: "", tagValue: "" }]);
          await fetchPolicies();

          // Trigger policy refresh in parent components
          if (triggerPolicyRefresh) {
            triggerPolicyRefresh();
          }
        } catch (error) {
          console.error("Error saving tag key-value pairs:", error);
          showAlertMessage("Failed to save tag key-value pairs", "error");
        }
      } else {
        // Reset form and update UI for non-tag policies
        form.resetFields();
        setPolicyType("");
        setIsEditMode(false);
        setSelectedPolicyId(null);
        await fetchPolicies();

        showAlertMessage(
          isEditMode
            ? "Policy updated successfully"
            : "Policy created successfully"
        );

        // Trigger policy refresh in parent components
        if (triggerPolicyRefresh) {
          triggerPolicyRefresh();
        }
      }
    } catch (error) {
      console.error("Error saving policy:", error);
      showAlertMessage(
        isEditMode ? "Failed to update policy" : "Failed to create policy",
        "error"
      );
    } finally {
      setSavingPolicy(false);
    }
  };

  // Delete policy function
  const handleDeletePolicy = async (policyId, policyName) => {
    try {
      // Find the policy to check its type
      const policy = policies.find((p) => p.id === policyId);
      if (!policy) {
        showAlertMessage("Policy not found", "error");
        return;
      }

      // If it's a Tag policy, delete associated LOV entries first
      if (policy.type === "Tag") {
        try {
          const lovResponse = await apiCall({
            method: "get",
            url: `/api/LOV/search?description=KEYVALUE&generalId=${policyId}`,
          });

          // Delete each LOV entry
          await Promise.all(
            lovResponse.map((lov) =>
              apiCall({
                method: "delete",
                url: `/api/LOV/${lov.id}`,
              })
            )
          );
        } catch (error) {
          console.error("Error deleting LOV entries:", error);
          showAlertMessage(
            "Failed to delete some tag key-value pairs",
            "error"
          );
        }
      }

      // Delete the policy
      await apiCall({
        method: "delete",
        url: `/api/Policy/${policyId}`,
      });

      showAlertMessage(`Policy "${policyName}" deleted successfully`);
      await fetchPolicies();

      // Trigger policy refresh in parent components
      if (triggerPolicyRefresh) {
        triggerPolicyRefresh();
      }
    } catch (error) {
      console.error("Error deleting policy:", error);
      showAlertMessage(`Failed to delete policy "${policyName}"`, "error");
    }
  };

  // Edit policy function
  const handleEditPolicy = async (record) => {
    try {
      setIsEditMode(true);
      setSelectedPolicyId(record.id);
      setPolicyType(record.policyType);

      // Find the matching account in allAccountsData
      const matchingAccount = allAccountsData.find((acc) => {
        const accountData = acc.data;
        return (
          accountData.customerId === record.customerId &&
          accountData.accountId === record.accountId
        );
      });

      // Set initial form values
      const initialValues = {
        policyName: record.policyName,
        policyType: record.policyType,
        status: record.isActive ? "Active" : "Inactive",
        cloudAccounts: matchingAccount ? matchingAccount.label : undefined,
      };

      // For Tag policies, fetch and set tag values
      if (record.policyType === "Tag") {
        try {
          const lovResponse = await apiCall({
            method: "get",
            url: `/api/LOV/search?description=KEYVALUE&generalId=${record.id}`,
          });

          if (lovResponse && lovResponse.length > 0) {
            const tagRows = lovResponse.map((lov, index) => ({
              key: index,
              tagKey: lov.value1,
              tagValue: lov.value2,
            }));
            setTagRows(tagRows);
            initialValues.tags = tagRows;
          } else {
            // No tags found, set default empty row
            setTagRows([{ key: 0, tagKey: "", tagValue: "" }]);
          }
        } catch (error) {
          console.error("Error fetching tag key-value pairs:", error);
          message.error("Failed to fetch tag values");
          setTagRows([{ key: 0, tagKey: "", tagValue: "" }]);
        }
      } else {
        // For non-tag policies, set value1/value2
        initialValues.value1 = record.value1 || "";
        initialValues.value2 = record.value2 || "";
      }

      form.setFieldsValue(initialValues);
      scrollToTable();
    } catch (error) {
      console.error("Error setting up edit mode:", error);
      message.error("Failed to load policy for editing");
    }
  };

  const columns = [
    { title: "Policy Type", dataIndex: "policyType", key: "policyType" },
    { title: "Policy Name", dataIndex: "policyName", key: "policyName" },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <span
          style={{
            color: isActive ? "#52c41a" : "#ff4d4f",
            fontWeight: "500",
          }}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Customer/Account",
      dataIndex: "cloudAccounts",
      key: "cloudAccounts",
    },
    {
      title: "Tag Key-Value Pairs",
      key: "tagPairs",
      render: (_, record) => {
        if (record.policyType !== "Tag") {
          return "-";
        }
        return (
          <div>
            <div>
              {record.tagKey} = {record.tagValue}
            </div>
            {record.totalTags > 1 && (
              <div
                style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}
              >
                +{record.totalTags - 1} more pairs
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            type="link"
            size="small"
            onClick={() => handleEditPolicy(record)}
            style={{ padding: "0 4px" }}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => {
              if (
                window.confirm(
                  `Are you sure you want to delete policy "${record.policyName}"?`
                )
              ) {
                handleDeletePolicy(record.id, record.policyName);
              }
            }}
            style={{ padding: "0 4px" }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const [tagRows, setTagRows] = useState([
    { key: 0, tagKey: "", tagValue: "" },
  ]);

  // Add a function to handle adding new tag rows
  const addTagRow = () => {
    setTagRows([...tagRows, { key: tagRows.length, tagKey: "", tagValue: "" }]);
  };

  // Add a function to handle deleting tag rows
  const deleteTagRow = (index) => {
    const newRows = tagRows.filter((_, i) => i !== index);
    setTagRows(newRows);
  };

  // Add a function to handle tag input changes
  const handleTagChange = (index, field, value) => {
    const newRows = [...tagRows];
    newRows[index][field] = value;
    setTagRows(newRows);
  };

  // Add effect to reset tag rows when policy type changes
  useEffect(() => {
    if (policyType === "Tag") {
      setTagRows([{ key: 0, tagKey: "", tagValue: "" }]);
    } else {
      setTagRows([]);
    }
  }, [policyType]);

  return (
    <div style={{ padding: "0px" }}>
      {/* Search Section */}
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
          Search Existing Policies
        </h3>
        <AutoComplete
          value={searchValue}
          options={searchOptions}
          onSearch={handleSearchChange}
          onSelect={handlePolicySelect}
          placeholder="Type 3+ characters to search for existing policies..."
          size="large"
          style={{ width: "100%" }}
          dropdownStyle={{
            backgroundColor: darkMode ? "#333" : "#fff",
            color: darkMode ? "#fff" : "#000",
          }}
          filterOption={false}
          notFoundContent={
            isSearching ? (
              <div style={{ padding: "8px", textAlign: "center" }}>
                Searching...
              </div>
            ) : searchValue.length > 0 && searchValue.length < 3 ? (
              <div
                style={{
                  padding: "8px",
                  textAlign: "center",
                  color: "#666",
                }}
              >
                Type at least 3 characters to search
              </div>
            ) : searchValue.length >= 3 && searchResults.length === 0 ? (
              <div
                style={{
                  padding: "8px",
                  textAlign: "center",
                  color: "#666",
                }}
              >
                No policies found
              </div>
            ) : null
          }
        />
      </div>

      {/* Form Section */}
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
          {isEditMode ? "Update Policy" : "Create Policy"}
        </h3>

        {/* Alert Message */}
        {showAlert && (
          <Alert
            message={alertMessage}
            type={alertType}
            showIcon
            closable
            onClose={hideAlert}
            style={{
              marginBottom: "16px",
              background: darkMode ? "#29303d" : undefined,
              color: darkMode ? "#fff" : undefined,
              border: darkMode ? "1px solid #434a56" : undefined,
            }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* First Row */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <Form.Item
              name="policyType"
              label="Policy Type"
              rules={[
                { required: true, message: "Please select a policy type" },
              ]}
              style={{ flex: 1 }}
            >
              <Select
                size="large"
                placeholder="Select policy type"
                onChange={(value) => setPolicyType(value)}
                dropdownStyle={{
                  backgroundColor: darkMode ? "#333" : "#fff",
                  color: darkMode ? "#fff" : "#000",
                }}
              >
                <Option value="Tag">Tag</Option>
                <Option value="Underutilize Resources">
                  Underutilize Resources
                </Option>
                <Option value="Orphan Records">Orphan Records</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="policyName"
              label="Policy Name"
              rules={[
                { required: true, message: "Please enter a policy name" },
              ]}
              style={{ flex: 1 }}
            >
              <Input size="large" />
            </Form.Item>
          </div>

          {/* Add the tag input section with increased spacing */}
          {policyType === "Tag" && (
            <div style={{ marginBottom: 32 }}>
              {tagRows.map((row, index) => (
                <div
                  key={row.key}
                  style={{ display: "flex", marginBottom: 8, gap: 8 }}
                >
                  <Form.Item
                    style={{ flex: 1, marginBottom: 0 }}
                    name={["tags", index, "tagKey"]}
                    rules={[{ required: true, message: "Key is required" }]}
                  >
                    <Input
                      placeholder="Tag Key"
                      size="large"
                      onChange={(e) =>
                        handleTagChange(index, "tagKey", e.target.value)
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    style={{ flex: 1, marginBottom: 0 }}
                    name={["tags", index, "tagValue"]}
                    rules={[{ required: true, message: "Value is required" }]}
                  >
                    <Input
                      placeholder="Tag Value"
                      size="large"
                      onChange={(e) =>
                        handleTagChange(index, "tagValue", e.target.value)
                      }
                    />
                  </Form.Item>
                  {index > 0 && (
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => deleteTagRow(index)}
                      style={{ marginTop: 4 }}
                    />
                  )}
                </div>
              ))}
              <Button
                type="dashed"
                onClick={addTagRow}
                style={{ width: "100%", marginTop: 8 }}
                icon={<PlusOutlined />}
              >
                Add Tag
              </Button>
            </div>
          )}

          {/* Status and Account selection with increased top margin */}
          <div style={{ marginTop: policyType === "Tag" ? 32 : 16 }}>
            <Form.Item
              name="status"
              label="Status"
              initialValue="Active"
              rules={[{ required: true, message: "Please select a status" }]}
            >
              <Select size="large">
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="cloudAccounts"
              label="Customer/Account/Cloud Type"
              rules={[{ required: true, message: "Please select an account" }]}
            >
              <Select
                size="large"
                placeholder="Select an account"
                loading={accountsLoading}
                filterOption={(input, option) =>
                  option?.label?.toLowerCase().includes(input.toLowerCase())
                }
                options={allAccountsData}
              />
            </Form.Item>
          </div>

          {/* Save Button - Lower Right */}
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}
          >
            {isEditMode && (
              <Button
                size="large"
                onClick={() => {
                  form.resetFields();
                  setPolicyType("");
                  setIsEditMode(false);
                  setSelectedPolicyId(null);
                  message.info("Edit cancelled");
                }}
              >
                Cancel Edit
              </Button>
            )}
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={savingPolicy}
              disabled={savingPolicy}
              onClick={() => {
                // Additional validation for Tag type
                if (policyType === "Tag") {
                  const formValues = form.getFieldsValue();
                  const tags = formValues.tags || [];
                  const hasValidTag = tags.some(
                    (tag) => tag?.tagKey && tag?.tagValue
                  );

                  if (!hasValidTag) {
                    message.error(
                      "Please complete at least one Key-Value pair for the Tag policy"
                    );
                    return;
                  }
                }
                form.submit();
              }}
            >
              {savingPolicy ? "Saving..." : "Save Policy"}
            </Button>
          </div>
        </Form>
      </div>

      {(submittedData.length > 0 || policiesLoading) && (
        <div
          style={{
            background: darkMode ? "#1e1e1e" : "#fff",
            color: darkMode ? "#fff" : "#000",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Policies
            <Button
              type="text"
              size="small"
              onClick={fetchPolicies}
              loading={policiesLoading}
              style={{
                marginLeft: "12px",
                fontSize: "14px",
                color: darkMode ? "#1890ff" : "#1890ff",
              }}
            >
              Refresh
            </Button>
          </h3>
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="Search by policy name"
              value={tableSearchValue}
              onChange={(e) => setTableSearchValue(e.target.value)}
              size="large"
              style={{
                borderRadius: "4px",
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
              disabled={policiesLoading}
            />
          </div>
          <div ref={tableRef} tabIndex={-1} style={{ marginTop: 16 }}>
            {showAlert && (
              <Alert
                message={alertMessage}
                type="success"
                showIcon
                style={{
                  marginBottom: 16,
                  background: darkMode ? "#29303d" : undefined,
                  color: darkMode ? "#fff" : undefined,
                  border: darkMode ? "1px solid #434a56" : undefined,
                }}
                closable
                onClose={() => setShowAlert(false)}
              />
            )}
            <Table
              dataSource={filteredData.map((item, index) => ({
                ...item,
                key: item.id || index,
              }))}
              columns={columns}
              loading={policiesLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} policies`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPolicy;
