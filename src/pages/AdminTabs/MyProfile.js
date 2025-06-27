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
} from "antd";

import { SearchOutlined } from "@ant-design/icons";

import { useDarkMode } from "../../config/DarkModeContext";
import { getDataByIdByText } from "../../hooks/axiosFakeInstance";
import { getDataAll } from "../../hooks/axiosFakeInstance";
import { postAddSingleItem } from "../../hooks/axiosFakeInstance";
import { updateDataById } from "../../hooks/axiosFakeInstance";
import axiosInstance from "../../hooks/axiosInstance";
import ReusableSearch from "../../components/ReuseableSearch";
import { generateUniqueNumber } from "../../utils/randomNumber";
import { useApi } from "../../hooks/useApi";
import { useAccountContext } from "../../contexts/AccountContext";

const { Option } = Select;

const MyProfile = ({ selectedOrganization, selectedCloudAccounts }) => {
  const { darkMode } = useDarkMode();
  const { switchContext } = useAccountContext();
  const [form] = Form.useForm();
  const { apiCall } = useApi();
  const [submittedData, setSubmittedData] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [orgCustAccountForProfile, setOrgCustAccountForProfile] =
    useState(null);
  const tableRef = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedData, setSelectedData] = useState(null);
  const [firstNameValue, setFirstNameValue] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cloudAccounts, setCloudAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
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
  const [resendAlert, setResendAlert] = useState({
    visible: false,
    type: "",
    message: "",
  });

  const isConfirmed = Form.useWatch("isConfirmed", form);

  console.log("darkmode  on myprofile ==", darkMode);
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
        isConfirmed: selectedData.isConfirmed,
      });
      setSelectedProfileId(selectedData.profileId);
      console.log("@selectedData ==", selectedData);
      console.log("@selectedProfileId ==", selectedData.profileId);

      console.log("isConfirmed ==", selectedData.isConfirmed);
      console.log("isConfirmed ==", JSON.stringify(selectedData.isConfirmed));

      setIsUpdate(true);
      setCurrentRecord(selectedData);

      if (isUpdate) {
        const fetchOrgHierarchy = async () => {
          try {
            const data = await apiCall({
              method: "get",
              url: `/api/Profile/${selectedData.profileId}/organizations`,
            });
            setOrgCustAccountForProfile(data);
          } catch (error) {
            console.error("Error fetching organization hierarchy:", error);
            setAlert({
              type: "error",
              message: "Failed to fetch organization hierarchy",
              visible: true,
            });
          }
        };
        console.log("#isUpdate ==", isUpdate);
        console.log("# new value of selectedData ==", selectedData);
        console.log(
          "# new value of selectedData.ProfileId ==",
          selectedData.ProfileId
        );

        fetchOrgHierarchy();
      }
    }
  }, [selectedData, form, apiCall]);

  useEffect(() => {
    const getOrgData = () => {
      getDataAll("organizations")
        .then((data) => {
          console.log("New or customer", JSON.stringify(data));
          console.log("new org customer==", data);
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
        const currentUserAccessLevel = sessionStorage.getItem("accessLevel");
        console.log("Current user access level:", currentUserAccessLevel);

        if (currentUserAccessLevel === "root") {
          console.log("Using unrestricted search endpoint for root user");
          const data = await apiCall({
            method: "get",
            url: "/api/Profile/search-unrestricted",
            params: {
              name: query,
              delimiter: ",",
            },
            headers: {
              "X-Access-Level": "root",
            },
          });
          console.log("Root user unrestricted profile search results:", data);
          setSearchResults(data);
          return data;
        }

        console.log(
          "Using standard search endpoint with unrestricted flag for admin"
        );

        try {
          const data = await apiCall({
            method: "GET",
            url: "/api/Profile/search-by-name",
            params: {
              name: query,
              delimiter: ",",
              ...(currentUserAccessLevel === "admin" && { unrestricted: true }),
            },
          });
          console.log("Profile search results:", data);
          setSearchResults(data);
          return data;
        } catch (error) {
          console.error("Error fetching Profile:", error);
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error searching profiles:", error);
        if (error.response) {
          console.error("Error response:", {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          });
        } else if (error.request) {
          console.error("No response received:", error.request);
        } else {
          console.error("Error setting up request:", error.message);
        }
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
        isConfirmed: user.isConfirmed,
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
    }
  };

  const handleSuggestionClick = (profile) => {
    const profileId = profile.profileId;
    setSelectedProfileId(profile.profileId);
    console.log("Selected profile ID:", profileId);
    setSuggestions([]);
  };

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
      setUpdateAlert({
        message: "Updating profile...",
        type: "info",
        visible: true,
      });

      const updateData = {
        Id: selectedData.profileId,
        FirstName: values.firstName,
        LastName: values.lastName,
        AccessLevel: values.accessLevel,

        Email: values.email,
        ...(values.isConfirmed !== undefined && {
          IsConfirmed: values.isConfirmed,
        }),
      };

      if (
        !updateData.FirstName ||
        !updateData.LastName ||
        !updateData.AccessLevel ||
        !updateData.Email
      ) {
        throw new Error("Missing required fields");
      }

      console.log("Sending update request with data:", updateData);

      await apiCall({
        method: "put",
        url: `/api/Profile/${selectedData.profileId}`,
        data: updateData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("##selectedData.profileId =", selectedData.profileId);
      console.log("##selectedProfileId ==", selectedProfileId);
      const profileResponse = await apiCall({
        method: "get",
        url: `/api/Profile/${selectedData.profileId}`,
      });
      const updatedProfile = {
        ...profileResponse,
        profileId: profileResponse.id,
      };
      delete updatedProfile.id;

      setSelectedData(updatedProfile);

      console.log("Updated profile data:", JSON.stringify(profileResponse));
      setSelectedProfileId(profileResponse.id);

      const orgResponse = await apiCall({
        method: "get",
        url: `/api/Profile/${selectedProfileId}/organizations`,
      });

      setOrgCustAccountForProfile(orgResponse);
      console.log("##Updated organization hierarchy:", orgResponse);

      form.setFieldsValue({
        firstName: profileResponse.firstName,
        lastName: profileResponse.lastName,
        email: profileResponse.email,
        accessLevel: profileResponse.accessLevel,
        isConfirmed: profileResponse.isConfirmed,
      });

      setUpdateAlert({
        message: "Profile updated successfully",
        type: "success",
        visible: true,
      });
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
      setCreateAlert({
        message: "Creating profile...",
        type: "info",
        visible: true,
      });

      const createData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        accessLevel: values.accessLevel,
        isConfirmed: false,
      };

      if (
        !createData.firstName ||
        !createData.lastName ||
        !createData.accessLevel ||
        !createData.email
      ) {
        throw new Error("Missing required fields");
      }

      const response = await apiCall({
        method: "post",
        url: "/api/profile",
        data: createData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      setCreateAlert({
        message:
          "Profile created successfully. A setup email has been sent to the user.",
        type: "success",
        visible: true,
      });

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

  const orgHierarchyColumns = [
    {
      title: "Organization",
      dataIndex: "orgName",
      key: "orgName",
      width: "50%",
    },
    {
      title: "Organization ID",
      dataIndex: "orgId",
      key: "orgId",
      width: "50%",
    },
  ];

  const customerColumns = [
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      width: "50%",
    },
    {
      title: "Customer ID",
      dataIndex: "customerId",
      key: "customerId",
      width: "50%",
    },
  ];

  const cloudAccountColumns = [
    {
      title: "Account Name",
      dataIndex: "accountName",
      key: "accountName",
      width: "40%",
    },
    {
      title: "Cloud Type",
      dataIndex: "cloudType",
      key: "cloudType",
      width: "30%",
    },
    {
      title: "Account ID",
      dataIndex: "accountId",
      key: "accountId",
      width: "30%",
    },
  ];

  const expandedRowRender = (record) => {
    return (
      <Table
        columns={cloudAccountColumns}
        dataSource={record.cloudAccounts}
        pagination={false}
        size="small"
      />
    );
  };

  const handleResendVerification = async () => {
    try {
      setResendAlert({
        visible: true,
        type: "info",
        message: "Sending verification email...",
      });

      console.log("@@Selected profile ID for verification:", selectedProfileId);
      if (!selectedProfileId) {
        throw new Error("No profile selected");
      }

      const formEmail = form.getFieldValue("email");
      if (!formEmail) {
        throw new Error("No email address found");
      }

      console.log("Sending verification to email:", formEmail);
      const response = await apiCall({
        method: "post",
        url: `/api/Profile/${selectedProfileId}/resend-verification`,
        data: { email: formEmail },
        isAuthRequest: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      setResendAlert({
        visible: true,
        type: "success",
        message: response.message || "Verification email sent successfully",
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      setResendAlert({
        visible: true,
        type: "error",
        message:
          error.response?.data?.message || "Failed to send verification email",
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
          <div style={{ position: "relative", width: 400, marginBottom: 24 }}>
            <ReusableSearch
              fetchData={fetchData}
              queryString={(qry) => setSearchQuery(qry)}
              onSelect={(data) => {
                setSelectedData(data);
                setSelectedProfileId(data.profileId);
              }}
              placeholder="Search..."
              displayKey={"firstName"}
              isShowSearchButton={true}
              disableSearchTrigger={true}
              inputStyle={{
                width: "400px",
                height: "35px",
                borderRadius: "8px",
              }}
            />
            {suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  background: darkMode ? "#333" : "#fff",
                  color: darkMode ? "#fff" : "#000",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  zIndex: 1,
                  width: "100%",
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {suggestions.map((s) => (
                  <div
                    key={s.profileId}
                    onClick={() => handleSuggestionClick(s)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: darkMode
                        ? "1px solid #555"
                        : "1px solid #ddd",
                    }}
                  >
                    {s.firstName} {s.lastName} ({s.email})
                  </div>
                ))}
              </div>
            )}
          </div>

          {(createAlert.visible ||
            updateAlert.visible ||
            resendAlert.visible) && (
            <Alert
              message={
                resendAlert.visible
                  ? resendAlert.message
                  : createAlert.visible
                  ? createAlert.message
                  : updateAlert.message
              }
              type={
                resendAlert.visible
                  ? resendAlert.type
                  : createAlert.visible
                  ? createAlert.type
                  : updateAlert.type
              }
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
                  <Input size="large" disabled={isUpdate} />
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
                    name="isConfirmed"
                    label="Account Confirmed"
                    valuePropName="checked"
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "24px",
                  gap: "8px",
                }}
              >
                <div>
                  {isUpdate && !isConfirmed && (
                    <Button
                      size="large"
                      style={{ backgroundColor: "#808080", color: "#fff" }}
                      onClick={handleResendVerification}
                    >
                      Resend Verification Email
                    </Button>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {isUpdate && (
                    <Button
                      color="default"
                      variant="outlined"
                      size="large"
                      onClick={() => {
                        setSelectedData(null);
                        setIsUpdate(false);
                        setOrgCustAccountForProfile(null);
                        setCreateAlert({
                          visible: false,
                          type: "",
                          message: "",
                        });
                        setUpdateAlert({
                          visible: false,
                          type: "",
                          message: "",
                        });
                        setResendAlert({
                          visible: false,
                          type: "",
                          message: "",
                        });
                        setAlert({ visible: false, type: "", message: "" });
                        form.resetFields();
                      }}
                    >
                      Exit Update
                    </Button>
                  )}
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
                    {isUpdate ? "Update" : "Save"}
                  </Button>
                </div>
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
                        record.cloudAccounts?.length > 0,
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

export default MyProfile;
