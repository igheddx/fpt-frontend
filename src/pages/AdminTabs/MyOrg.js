import React, { useState, useEffect, useRef } from "react";
import {
  Input,
  Button,
  Space,
  Select,
  Alert,
  Typography,
  Table,
  Modal,
  message,
} from "antd";
import {
  DeleteOutlined,
  UserOutlined,
  EditOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useDarkMode } from "../../config/DarkModeContext";
import { dummyOrganizations, dummyCloudAccounts } from "../../data/dummyData";
import { getItemByIdByText } from "../../hooks/axiosFakeInstance";
import { postUpdateOrg } from "../../hooks/axiosFakeInstance";
import { postAddOrg } from "../../hooks/axiosFakeInstance";
import { postAddProfileToCustomerCloud } from "../../hooks/axiosFakeInstance";
import { updateProfileAccessLevel } from "../../hooks/axiosFakeInstance";
import { deleteCustFromOrg } from "../../hooks/axiosFakeInstance";
import { getProfileForCustomerCloud } from "../../hooks/axiosFakeInstance";
import { deleteProfileFromCustomer } from "../../hooks/axiosFakeInstance";
import { generateUniqueNumber } from "../../utils/randomNumber";
import { type } from "@testing-library/user-event/dist/type";
import axios from "axios";
import useApi from "../../hooks/useApi";
const { Option } = Select;
const { Title } = Typography;

const dummyProfiles = [
  {
    id: 1,
    customerId: 1,
    cloudName: "AWS",
    fullName: "John Doe",
    accessLevel: "Admin",
  },
  {
    id: 2,
    customerId: 1,
    cloudName: "AWS",
    fullName: "Jane Smith",
    accessLevel: "Viewer",
  },
  {
    id: 3,
    customerId: 2,
    cloudName: "Azure",
    fullName: "Alice Johnson",
    accessLevel: "Approver",
  },
];

const MyOrg = () => {
  const { darkMode } = useDarkMode();
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState([]);
  const [currentSection, setCurrentSection] = useState("organization"); // 'organization' or 'profile'
  const [selectedCustomerCloud, setSelectedCustomerCloud] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [selectedCustId, setSelectedCustId] = useState(null);
  const [selectedCloudId, setSelectedCloudId] = useState(null);

  const [accessLevelChanges, setAccessLevelChanges] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [profileSearchText, setProfileSearchText] = useState("");
  const [searchResultsProfile, setSearchResultsProfile] = useState([]);
  // In your component state
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomers, setNewCustomers] = useState([]);
  const [newCustomerRow, setNewCustomerRow] = useState([]);

  const [filteredProfiles, setFilteredProfiles] = useState([]);

  const [profiles, setProfiles] = useState([]);

  const [orgMaster, setOrgMaster] = useState([]);
  const [orgs, setOrg] = useState("");
  const [custMaster, setCustMaster] = useState([]);
  const [cloudAccountMaster, setCloudAccountMaster] = useState([]);
  const [profileMaster, setProfileMaster] = useState([]);
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

  const [accessLevels, setAccessLevels] = useState({});
  const [role, setRole] = useState(""); // Add state for role
  const [selectedRoles, setSelectedRoles] = useState({}); // Add state for selected roles
  const [profileCloudCustomer, setProfileCloudCustomer] = useState([]); //store profile linked to customer
  const [selectedCustName, setSelectedCustName] = useState("");
  const [selectedCloudName, setSelectedCloudName] = useState("");

  const apiCall = useApi();

  useEffect(() => {
    setNewCustomers([]); //reset onload

    // Check if profiles already exist in localStorage
    // setOrgMaster(JSON.parse(localStorage.getItem("orgMaster")));
    // setOrg(JSON.parse(localStorage.getItem("organizations")));
    // setCustMaster(JSON.parse(localStorage.getItem("customers")));
    // setCloudAccountMaster(JSON.parse(localStorage.getItem("cloudAccounts")));
    // setProfileMaster(JSON.parse(localStorage.getItem("profiles")));
    // const storedProfiles = JSON.parse(localStorage.getItem("profiles"));
    // if (!storedProfiles) {
    //   // Store the default profiles in localStorage
    //   localStorage.setItem("profiles", JSON.stringify(dummyProfiles));
    //   // Set the profiles state with default profiles
    //   setProfiles(dummyProfiles);
    // } else {
    //   // If profiles exist in localStorage, load them into the state
    //   setProfiles(storedProfiles);
    // }
  }, []);

  // Ensure filteredProfiles is updated when selectedCustomerCloud changes
  useEffect(() => {
    console.log("Selected Customer Cloud useefect", selectedCustomerCloud);
    if (selectedCustomerCloud) {
      const customerProfiles = profiles.filter(
        (p) => p.customerId === selectedCustomerCloud
      );
      console.log("Filtered Profiles:", customerProfiles);
      setFilteredProfiles(customerProfiles); // Update filteredProfiles when selectedCustomerCloud changes
    }
  }, [selectedCustomerCloud, profiles]); // Dependency on selectedCustomerCloud and profiles

  // Ensure profiles are loaded from localStorage on initial render
  useEffect(() => {
    const storedProfiles = JSON.parse(localStorage.getItem("profiles"));
    if (storedProfiles) {
      setProfiles(storedProfiles); // Load profiles from localStorage
    }
  }, []);

  const loadProfilesFromLocalStorage = () => {
    const storedProfiles = JSON.parse(localStorage.getItem("profiles"));
    return storedProfiles || [];
  };

  useEffect(() => {
    const storedProfiles = loadProfilesFromLocalStorage();
    setProfiles(storedProfiles); // Assuming 'profiles' is your state for all profiles
  }, []);

  /*const [profiles, setProfiles] = useState([
    {
      id: 1,
      customerId: 1,
      cloudName: "AWS",
      fullName: "John Doe",
      accessLevel: "Admin",
    },
    {
      id: 2,
      customerId: 1,
      cloudName: "AWS",
      fullName: "Jane Smith",
      accessLevel: "Viewer",
    },
    {
      id: 3,
      customerId: 2,
      cloudName: "Azure",
      fullName: "Alice Johnson",
      accessLevel: "Approver",
    },
  ]);*/

  //REMOVE LATER
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    cloudAccountId: "",
  });

  const [newOrgName, setNewOrgName] = useState("");
  const [customers, setCustomers] = useState([
    { id: Date.now(), name: "", cloudAccountId: "", errors: {} },
  ]);

  const [organizationArray, setOrganizationArray] = useState([
    ...dummyOrganizations,
  ]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [orgNameError, setOrgNameError] = useState("");

  // const loadProfiles = async () => {
  //   setLoading(true);
  //   try {
  //     const result = await fetchFromLocalStorageFlexible(
  //       "profiles",
  //       null,
  //       "fullName",
  //       "Henry"
  //     );
  //     setProfiles(result.data); // Assuming `result.data` contains the filtered profiles
  //   } catch (error) {
  //     console.error("Error fetching profiles:", error);
  //   }
  //   setLoading(false);
  // };

  /*search org*/
  const handleSearchChange = async (value) => {
    setSearchValue(value);
    if (value.length >= 3) {
      try {
        const data = await apiCall({
          method: "get",
          url: "/api/Organizations/search-by-name",
          params: { name: value },
        });
        setSearchResults(data);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setSearchResults([]);
      }
    } else if (value.length === 0) {
      setSearchResults([]);
    }
  };

  //test
  const handleSelectOrg = async (org) => {
    console.log("Selected Organization:", org);
    setSelectedOrgId(org.organizationId);
    setNewCustomers([]);
    clearAlerts();

    const orgIdMaster = org.organizationId;

    try {
      const data = await apiCall({
        method: "get",
        url: `/api/customeraccount/org-details/${orgIdMaster}`,
      });
      setSelectedOrg(Array.isArray(data) ? data : [data]);
      console.log("setSelectedOrg Data:", JSON.stringify(data));

      setSearchResults([]);
      setSearchValue("");
    } catch (error) {
      console.error("Error fetching organization details:", error);
      setSelectedOrg([]);
      setSearchResults([]);
      setSearchValue("");
    }
  };

  const handleCustomerChange = (index, field, value) => {
    const updatedCustomers = [...customers];
    updatedCustomers[index][field] = value;
    updatedCustomers[index].errors[field] = ""; // clear error
    setCustomers(updatedCustomers);
  };

  const handleAddCustomer = () => {
    setSaveSuccess(false); //clear success message

    setCustomers([
      ...customers,
      {
        id: Date.now(),
        name: "",
        cloudAccountId: "",
        errors: {},
      },
    ]);
  };

  //delete customer association from organization
  const handleDeleteCustomer = async (orgId, custId) => {
    try {
      const result = await deleteCustFromOrg("organizations", orgId, custId);

      console.log("Selected Organization Data -M-:", JSON.stringify(result));
      //setSearchResults(result.data); // Assuming `result.data` contains the filtered organizations

      setSelectedOrg(Array.isArray(result) ? result : [result]);
      //setSearchResults(result);
      setUpdateAlert({
        type: "success",
        message: "Delete customer association was was successful. ",
        visible: true,
      });
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setSelectedOrg([]);
      setSearchResults([]);
      setSearchValue("");

      setUpdateAlert({
        type: "error",
        message: "Error deleting customer association: " + error,
        visible: true,
      });
    }

    // setSaveSuccess(false); //clear success message

    // const updatedCustomers = [...customers];
    // updatedCustomers.splice(index, 1);
    // setCustomers(updatedCustomers);
  };

  const handleSave = async () => {
    let hasError = false;
    setSaveSuccess(false);
    setOrgNameError("");

    if (!newOrgName.trim()) {
      setOrgNameError("Organization Name is required.");
      hasError = true;
    }

    // Validate all customers and their accounts
    const updatedCustomers = customers.map((cust) => {
      const errors = {};
      if (!cust.name || !cust.name.trim())
        errors.name = "Customer Name is required.";
      if (!cust.accounts || cust.accounts.length === 0)
        errors.accounts = "At least one account is required.";
      if (cust.accounts) {
        cust.accounts.forEach((acc, accIdx) => {
          if (!acc.name || !acc.name.trim()) {
            errors[`account_name_${accIdx}`] = "Account Name is required.";
          }
          if (!acc.cloudType || !acc.cloudType.trim()) {
            errors[`account_cloudType_${accIdx}`] =
              "Cloud Provider is required.";
          }
        });
      }
      if (Object.keys(errors).length > 0) hasError = true;
      return { ...cust, errors };
    });
    setCustomers(updatedCustomers);
    if (hasError) return;

    // Build payload for org-cascade-create
    const payload = {
      name: newOrgName,
      isActive: true,
      customers: customers.map((cust) => ({
        name: cust.name,
        isActive: true,
        accounts: (cust.accounts || []).map((acc) => ({
          name: acc.name,
          isActive: true,
          cloudType: acc.cloudType,
        })),
      })),
    };

    console.log("Payload for org-cascade-create:", JSON.stringify(payload));
    try {
      await apiCall({
        method: "POST",
        url: "/api/organizations/org-cascade-create",
        data: payload,
      });
      setNewCustomers([]);
      setNewOrgName("");
      setCustomers([
        {
          id: Date.now(),
          name: "",
          accounts: [{ name: "", cloudType: "" }],
          errors: {},
        },
      ]);
      setSaveSuccess(true);
      setCreateAlert({
        message: "New org was created successfully ",
        type: "success",
        visible: true,
      });
      // Refresh organization list after successful creation
      try {
        const orgList = await apiCall({
          method: "get",
          url: "/api/Organizations",
        });
        setOrgMaster(orgList);
      } catch (fetchError) {
        // Optionally handle fetch error
        console.error("Failed to refresh organization list:", fetchError);
      }
      // Optionally: fetch and update organization list here if you want to show the new org in the UI
    } catch (error) {
      setCreateAlert({
        message: "Error creating organization: " + (error?.message || error),
        type: "error",
        visible: true,
      });
    }
  };

  // Method to save new customer
  const handleAddNewCustomer = () => {
    if (
      !newCustomer.name ||
      !newCustomer.cloudAccountId ||
      !newCustomer.cloudProvider
    ) {
      message.error("Please complete all fields before adding.");
      return;
    }

    const newCust = {
      id: Date.now(), // Or use a better ID generator if needed
      name: newCustomer.name,
      cloudAccount: [
        {
          id: newCustomer.cloudAccountId,
          provider: newCustomer.cloudProvider,
        },
      ],
    };

    const updatedOrg = {
      ...selectedOrg,
      customer: [...selectedOrg.customer, newCust],
    };

    setSelectedOrg(updatedOrg);
    setAddingCustomer(false);
    setNewCustomer({ name: "", cloudAccountId: "", cloudProvider: "" });
    message.success("Customer added successfully!");
  };

  const handleUpdateOrgName = (value) => {
    //setSelectedOrg({ ...selectedOrg, name: value });
  };

  const handleUpdateCustomer = (index, field, value) => {
    const updatedCustomers = [...selectedOrg.customer];
    updatedCustomers[index][field] = value;
    setSelectedOrg({ ...selectedOrg, customer: updatedCustomers });
  };

  const handleUpdateCustomerCloudAccount = (index, cloudAccountId) => {
    const updatedCustomers = [...selectedOrg.customer];
    updatedCustomers[index].cloudAccount[0].id = cloudAccountId;
    updatedCustomers[index].cloudAccount[0].name =
      dummyCloudAccounts.find((ca) => ca.id === cloudAccountId)?.name || "";
    setSelectedOrg({ ...selectedOrg, customer: updatedCustomers });
  };

  const handleUpdateCustomerProvider = async (
    custIdx,
    accIdx,
    value,
    orgId,
    accountId
  ) => {
    try {
      // Get current customer data
      const customer = selectedOrg[0].customer[custIdx];
      const account = customer.accounts[accIdx];

      console.log("Current customer data:", {
        customer,
        account,
        newCloudType: value,
      });

      // Prepare payload for edit-cascade endpoint with correct structure
      const payload = {
        organizationId: orgId,
        customers: [
          {
            customerId: customer.customerId,
            name: customer.name.trim(), // Ensure name is trimmed
            isActive: true,
            accounts: [
              {
                id: accountId, // Use id instead of accountId if that's what your API expects
                accountId: accountId,
                name: account.name,
                isActive: true,
                cloudType: value,
                customerId: customer.customerId,
              },
            ],
          },
        ],
      };

      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      // Call edit-cascade endpoint which will:
      // 1. Check if customer name exists in customer table
      // 2. Update customer name if different and doesn't exist
      // 3. Update account's cloud provider using accountId
      // Make the update request
      const response = await apiCall({
        method: "POST",
        url: "/api/customeraccount/edit-cascade",
        data: payload,
      });

      console.log("Edit cascade response:", response);

      // Validate the response
      if (!response || response.error) {
        throw new Error(response?.error || "Failed to update customer data");
      }

      // Wait a short moment to ensure backend processing is complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh organization details to get latest data
      const updatedOrgData = await apiCall({
        method: "get",
        url: `/api/customeraccount/org-details/${orgId}`,
      });

      console.log("Updated org data:", updatedOrgData);

      // Update UI with fresh data from backend
      setSelectedOrg(
        Array.isArray(updatedOrgData) ? updatedOrgData : [updatedOrgData]
      );

      // Show success message
      setUpdateAlert({
        type: "success",
        message: response.message || "Update successful",
        visible: true,
      });
    } catch (error) {
      console.error("Error updating customer provider:", error);

      // Log more error details
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
      }

      setUpdateAlert({
        type: "error",
        message:
          "Error updating cloud provider: " +
          (error.response?.data || error.message || error),
        visible: true,
      });
    }
  };

  const handleUpdateCustomerAccount = (
    custIdx,
    accIdx,
    newName,
    orgId,
    accountId
  ) => {
    setSelectedOrg((prevOrgs) =>
      prevOrgs.map((org) => {
        if (org.organizationId !== orgId) return org;
        return {
          ...org,
          customer: org.customer.map((cust, idx) => {
            if (idx !== custIdx) return cust;
            return {
              ...cust,
              accounts: (cust.accounts || []).map((acc, idx) => {
                if (idx !== accIdx) return acc;
                return {
                  ...acc,
                  name: newName,
                };
              }),
            };
          }),
        };
      })
    );
  };

  // const highlightText = (text) => {
  //   const regex = new RegExp(`(${searchValue})`, "gi");
  //   return text.replace(regex, "<b>$1</b>");
  // };

  //move this into utils in the future
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const highlightText = (text) => {
    const escapedSearch = escapeRegExp(searchValue);
    const regex = new RegExp(`(${escapedSearch})`, "gi");
    return text.replace(regex, "<b>$1</b>");
  };

  const [customerAssociations, setCustomerAssociations] = useState([
    { id: 1, customerName: "Customer A", cloudName: "AWS" },
    { id: 2, customerName: "Customer B", cloudName: "Azure" },
  ]);

  const handleUpdateProfile = (profile) => {
    const newAccessLevel =
      accessLevelChanges[profile.id] || profile.accessLevel;

    const updatedProfiles = profiles.map((p) =>
      p.id === profile.id ? { ...p, accessLevel: newAccessLevel } : p
    );

    setProfiles(updatedProfiles);
    setSuccessMessage(
      `Successfully updated access level for ${profile.fullName}`
    );
    setTimeout(() => setSuccessMessage(""), 3000); // Hide message after 3 seconds
  };

  const handleAccessLevelChange = (profileId, value) => {
    setAccessLevelChanges((prev) => ({
      ...prev,
      [profileId]: value,
    }));
  };

  const handleConfirmAddCustomer = (idx, orgId) => {
    setSelectedOrg([]);
    const cust = newCustomers[idx];

    console.log("Selected Customer:", cust);
    if (!cust.name || !cust.cloudAccountId || !cust.cloudProvider) {
      message.error("Please complete all fields before adding.");
      return;
    }

    const newCust = {
      id: generateUniqueNumber(), //Date.now(), // Temporary ID
      name: cust.name,
      cloudAccount: [
        {
          id: cust.cloudAccountId,
          provider: cust.cloudProvider,
        },
      ],
    };

    console.log("New C:ustomer", newCust);

    console.log("Selected Org ID:", orgId);
    postUpdateOrg("organizations", orgId, newCust)
      .then((updatedData) => {
        console.log(
          "Organization updated with new customer:",
          JSON.stringify(updatedData)
        );
        console.log("the leng of updateDate ==", updatedData);
        //setSelectedOrg(updatedData);

        setNewCustomers([]);
        setSelectedOrg(
          Array.isArray(updatedData) ? updatedData : [updatedData]
        );
        setUpdateAlert({
          type: "success",
          message: "Update was successful",
          visible: true,
        });
      })
      .catch((error) => {
        console.error("Error updating organization:", error);
        setUpdateAlert({
          type: "error",
          message: "Error updating organization: " + error,
          visible: true,
        });
      });

    // const updatedOrg = {
    //   ...selectedOrg,
    //   customer: [...selectedOrg.customer, newCust],
    // };

    // setSelectedOrg(updatedOrg);

    // // Remove this row from draft newCustomers
    // const updatedNewCustomers = [...newCustomers];
    // updatedNewCustomers.splice(idx, 1);
    // setNewCustomers(updatedNewCustomers);

    // message.success("Customer added successfully!");
  };

  const removeCustomerAssociation = (id) => {
    Modal.confirm({
      title: "Are you sure you want to remove this customer association?",
      onOk: () => {
        setCustomerAssociations((prev) => prev.filter((ca) => ca.id !== id));
      },
    });
  };

  //this is for deleting customer from customer row when Adding
  const handleDeleteCustomerRow = (index) => {
    setSaveSuccess(false); //clear success message

    const updatedCustomers = [...customers];
    updatedCustomers.splice(index, 1);
    setCustomers(updatedCustomers);

    // console.log("Delete Customer Row:", index);
    // console.log("New Customers:", newCustomerRow);
    // const updated = [...newCustomerRow];
    // console.log("Updated Customers:", updated);
    // updated.splice(index, 1);
    // setNewCustomerRow(updated);
  };

  //this is for deleting customer from new customer row when Updating
  const handleDeleteNewCustomerRow = (index) => {
    setSaveSuccess(false); //clear success message

    const updatedCustomers = [...newCustomers];
    updatedCustomers.splice(index, 1);
    setNewCustomers(updatedCustomers);

    // console.log("Delete Customer Row:", index);
    // console.log("New Customers:", newCustomerRow);
    // const updated = [...newCustomerRow];
    // console.log("Updated Customers:", updated);
    // updated.splice(index, 1);
    // setNewCustomerRow(updated);
  };

  /*const viewProfiles = (record) => {
    console.log("Selected Customer Cloud:", record);
    setSelectedCustomerCloud(record); // Keep this
    setCurrentSection("profile"); // Keep this

    // Now filter profiles based on the selected record's id
    const filtered = profiles.filter((p) => p.customerId === record.id);
    console.log("Filtered Profiles:", filtered);
    setFilteredProfiles(filtered);
  };*/

  //clear all alerts
  const clearAlerts = () => {
    setCreateAlert({ visible: false, type: "success", message: "" });
    setUpdateAlert({ visible: false, type: "success", message: "" });
    setAlert({ visible: false, type: "success", message: "" });
  };

  const viewProfiles = (custId, cloudId, custName, cloudName) => {
    setSelectedCustId(custId);
    setSelectedCloudId(cloudId);
    setSelectedCustName(custName);
    setSelectedCloudName(cloudName);
    setSelectedCustomerCloud(custId);
    setCurrentSection("profile");

    // Call the linked-profiles endpoint
    apiCall({
      method: "get",
      url: "/api/customeraccountprofile/linked-profiles",
      params: {
        organizationId: selectedOrgId,
        customerId: custId,
        accountId: cloudId,
      },
    })
      .then((profiles) => {
        console.log("Linked profiles:", JSON.stringify(profiles));
        setProfileCloudCustomer(profiles);
      })
      .catch((error) => {
        console.error("Error fetching linked profiles:", error);
        setAlert({
          type: "error",
          message: "Something went wrong while getting profiles.",
          visible: true,
        });
      });
  };

  //general remove add new profile to customer - no api call
  const removeProfile = (profileId) => {
    Modal.confirm({
      title: "Are you sure you want to remove this profile?",
      onOk: () => {
        setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      },
    });
  };

  const customerColumns = [
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Cloud Provider",
      dataIndex: "cloudName",
      key: "cloudName",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeCustomerAssociation(record.id)}
          >
            Delete
          </Button>
          <Button icon={<UserOutlined />} onClick={() => viewProfiles(record)}>
            Profiles
          </Button>
        </Space>
      ),
    },
  ];

  const profileColumns = [
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
      render: (text, record) => (
        <Select
          value={selectedRoles[record.id] || ""}
          style={{ width: 120 }}
          onChange={(value) => {
            setSelectedRoles((prev) => ({
              ...prev,
              [record.id]: value,
            }));
          }}
          dropdownStyle={{
            backgroundColor: darkMode ? "#333" : "#fff",
            color: darkMode ? "#fff" : "#000",
          }}
        >
          <Option value="admin">Admin</Option>
          <Option value="viewer">Viewer</Option>
          <Option value="approver">Approver</Option>
        </Select>
      ),
    },

    // {
    //   title: "Access Level",
    //   dataIndex: "accessLevel",
    //   key: "accessLevel",
    //   render: (text, record) => (
    //     <Select
    //       value={accessLevels[record.id] ?? record.accessLevel}
    //       style={{ width: 120 }}
    //       onChange={(value) => {
    //         setAccessLevels((prev) => ({
    //           ...prev,
    //           [record.id]: value,
    //         }));
    //       }}
    //       dropdownStyle={{
    //         backgroundColor: darkMode ? "#333" : "#fff",
    //         color: darkMode ? "#fff" : "#000",
    //       }}
    //     >
    //       <Option value="Admin">Admin</Option>
    //       <Option value="Viewer">Viewer</Option>
    //       <Option value="Approver">Approver</Option>
    //     </Select>
    //   ),
    // },

    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button
            icon={<PlusOutlined />}
            type="text"
            onClick={() => {
              const selectedRole = selectedRoles[record.id];
              console.log("Selected Role:", selectedRole);
              handleAddProfileToCustomer(record.profileId, selectedRole);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            type="text"
            danger
            onClick={() => removeProfile(record.id)}
          />
        </>
      ),
    },
  ];

  const profileColumns2 = [
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
    // {
    //   title: "Role",
    //   dataIndex: "role",
    //   key: "role",
    // },

    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (_, record) => (
        <Select
          value={record.role}
          style={{ width: 120 }}
          onChange={(value) =>
            handleUpdateProfileInCustomer(record.profileId, value)
          }
          dropdownStyle={{
            backgroundColor: darkMode ? "#333" : "#fff",
            color: darkMode ? "#fff" : "#000",
          }}
        >
          <Option value="admin">Admin</Option>
          <Option value="viewer">Viewer</Option>
          <Option value="approver">Approver</Option>
        </Select>
      ),
    },

    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button
            icon={<DeleteOutlined />}
            type="text"
            danger
            onClick={() => handleRemoveProfileInCustomer(record.profileId)}
          />
          {/* <Button
            icon={<EditOutlined />}
            type="text"
            onClick={() => {
              const selectedAccessLevel =
                accessLevels[record.id] ?? record.accessLevel;
              console.log("Selected Access Level:", selectedAccessLevel);
              handleUpdateProfileInCustomer(record.id, selectedAccessLevel);
            }}
          />{" "} */}
        </>
      ),
    },
  ];
  const handleSelectProfile = (profile) => {
    // Perform the add logic
    addProfileToCustomer(selectedCustomerCloud.id, profile);

    // Clear search state
    setProfileSearchText("");
    setSearchResults([]);

    // Optionally refresh the profiles list
    refreshProfilesForCustomer(selectedCustomerCloud.id);
  };

  const addProfileToCustomer = (customerId, profile) => {
    // Find the customer and add the profile to it
    console.log(
      `Adding profile ${profile.fullName} to customer id ${customerId}`
    );

    // You can POST to your backend or update local state here
    message.success(`Profile ${profile.fullName} added successfully!`);
  };

  // Assuming you have profile data to add
  const handleAddProfileToCustomer = (id, role) => {
    console.log("role =", role);
    if (role == "" || role == undefined) {
      setAlert({
        type: "error",
        message: "Role is required before adding a profile.",
        visible: true,
      });
      return; // Exit early
    }

    console.log("profile Id =", id);
    //console.log("accessLevel =", accessLevel);
    console.log("orgId ==", selectedOrgId);
    console.log("custId ==", selectedCustId);
    console.log("cloud id ==", selectedCloudId);

    apiCall({
      method: "POST",
      url: "/api/customeraccountprofile/cascade-create",
      data: {
        organizationId: selectedOrgId,
        customerId: selectedCustId,
        accountId: selectedCloudId,
        profiles: [
          {
            profileId: id,
            role: role,
          },
        ],
      },
    })
      .then(async (updatedData) => {
        console.log(
          "Customer Updated with new profile:",
          JSON.stringify(updatedData)
        );
        setAlert({
          type: "success",
          message: "Profile was added successfully.",
          visible: true,
        });

        // Clear the search results and text
        //setSearchResultsProfile([]);
        setFilteredProfiles([]); // Clear filtered profiles
        setSearchValue("");
        //setProfileSearchText("");

        // Refresh organization details to get latest data
        try {
          const refreshedData = await apiCall({
            method: "get",
            url: `/api/customeraccount/org-details/${selectedOrgId}`,
          });

          // Update the organization data with fresh data
          setSelectedOrg(
            Array.isArray(refreshedData) ? refreshedData : [refreshedData]
          );
        } catch (refreshError) {
          console.error("Error refreshing organization data:", refreshError);
        }

        // Refresh the linked profiles list to show updated role
        try {
          const profiles = await apiCall({
            method: "get",
            url: "/api/customeraccountprofile/linked-profiles",
            params: {
              organizationId: selectedOrgId,
              customerId: selectedCustId,
              accountId: selectedCloudId,
            },
          });

          // Update customerAccountProfile with fresh data
          console.log("Refreshed linked profiles:", JSON.stringify(profiles));
          setProfileCloudCustomer(profiles);
        } catch (refreshError) {
          console.error("Error refreshing linked profile data:", refreshError);
        }

        // Check if "DEFAULT ACCOUNT" LOV record exists for this profile, create if not
        try {
          const existingLOVs = await apiCall({
            method: "get",
            url: `/api/LOV/profile/${id}`,
          });

          // Check if any existing LOV has DESCRIPTION = "DEFAULT ACCOUNT"
          const hasDefaultAccount = existingLOVs.some(
            (lov) => lov.description === "DEFAULT ACCOUNT"
          );

          if (!hasDefaultAccount) {
            // Create new LOV record with "DEFAULT ACCOUNT"
            await apiCall({
              method: "POST",
              url: "/api/LOV",
              data: {
                description: "DEFAULT ACCOUNT",
                profileId: id,
                organizationId: selectedOrgId,
                customerId: selectedCustId,
                accountId: selectedCloudId,
              },
            });
          }
        } catch (lovError) {
          console.error("Error handling LOV record:", lovError);
          setAlert({
            type: "error",
            message:
              "Profile was added but failed to create default LOV record.",
            visible: true,
          });
        }
      })
      .catch(async (error) => {
        setAlert({
          type: "error",
          message: "Something went wrong while adding profile.",
          visible: true,
        });
      });
  };

  // Update profile role in CustomerAccountProfile
  const handleUpdateProfileInCustomer = async (id, newRole) => {
    try {
      console.log("Updating profile with:", {
        organizationId: selectedOrgId,
        customerId: selectedCustId,
        accountId: selectedCloudId,
        profileId: id,
        role: newRole,
      });
      await apiCall({
        method: "PUT",
        url: "/api/customeraccountprofile/update-role",
        data: {
          organizationId: selectedOrgId,
          customerId: selectedCustId,
          accountId: selectedCloudId,
          profileId: id,
          role: newRole,
        },
      });

      // Refresh the linked profiles list to show updated role
      const profiles = await apiCall({
        method: "get",
        url: "/api/customeraccountprofile/linked-profiles",
        params: {
          organizationId: selectedOrgId,
          customerId: selectedCustId,
          accountId: selectedCloudId,
        },
      });

      setProfileCloudCustomer(profiles);

      setAlert({
        type: "success",
        message: "Profile role was updated successfully.",
        visible: true,
      });
    } catch (error) {
      console.error("Error updating profile role:", error);
      setAlert({
        type: "error",
        message: `Failed to update profile role: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`,
        visible: true,
      });
    }
  };

  //remove profile from customer association
  const handleRemoveProfileInCustomer = async (id) => {
    try {
      // Call the DELETE endpoint
      await apiCall({
        method: "DELETE",
        url: "/api/CustomerAccountProfile",
        params: {
          organizationId: selectedOrgId,
          customerId: selectedCustId,
          accountId: selectedCloudId,
          profileId: id,
        },
      });

      // On success, refresh the profile list
      const profiles = await apiCall({
        method: "get",
        url: "/api/customeraccountprofile/linked-profiles",
        params: {
          organizationId: selectedOrgId,
          customerId: selectedCustId,
          accountId: selectedCloudId,
        },
      });

      // Update the profile list in state
      setProfileCloudCustomer(profiles);

      // Show success message
      setAlert({
        type: "success",
        message: "Profile was deleted successfully.",
        visible: true,
      });
    } catch (error) {
      console.error("Error deleting profile:", error);
      setAlert({
        type: "error",
        message: "Something went wrong while deleting profile.",
        visible: true,
      });
    }
  };

  const handleProfileSelection = (profile) => {
    console.log("My profile ==", profile);
    console.log("currentSection==", currentSection);
    console.log("selectedCustomercloud==", selectedCustomerCloud);
    //currentSection === "profile" && selectedCustomerCloud

    setFilteredProfiles([profile]);
    setProfileSearchText("");
    setSearchResultsProfile([]);
  };

  const handleAttachProfileToCustomer = (profile) => {
    if (!selectedCustomerCloud) return;

    const newProfile = {
      ...profile,
      customerId: selectedCustomerCloud.id,
    };

    const updatedProfiles = [...profiles, newProfile];

    // Save to state
    setProfiles(updatedProfiles);

    // Save to localStorage
    localStorage.setItem("profiles", JSON.stringify(updatedProfiles));

    // Update filteredProfiles
    setFilteredProfiles(
      updatedProfiles.filter((p) => p.customerId === selectedCustomerCloud.id)
    );
  };

  const attachProfileToCustomer = (profile) => {
    // const profileIndex = dummyProfiles.findIndex((p) => p.id === profileId);
    // if (profileIndex !== -1) {
    //   const existingCustomerIds = dummyProfiles[profileIndex].customerIds || [];
    //   dummyProfiles[profileIndex].customerIds = [
    //     ...new Set([...existingCustomerIds, customerId]),
    //   ];
    // }

    if (!selectedCustomerCloud) return;

    const newProfile = {
      ...profile,
      customerId: selectedCustomerCloud.id,
    };

    const updatedProfiles = [...profiles, newProfile];

    // Save to state
    setProfiles(updatedProfiles);

    // Save to localStorage
    localStorage.setItem("profiles", JSON.stringify(updatedProfiles));

    // Update filteredProfiles
    setFilteredProfiles(
      updatedProfiles.filter((p) => p.customerId === selectedCustomerCloud.id)
    );
  };

  const handleSearchProfiles = async (searchText) => {
    if (!searchText.trim()) {
      setSearchResultsProfile([]);
      return;
    }

    if (searchText.length >= 3) {
      try {
        const data = await apiCall({
          method: "get",
          url: "/api/customeraccountprofile/available-profiles",
          params: {
            organizationId: selectedOrgId,
            customerId: selectedCustId,
            accountId: selectedCloudId,
            searchText: searchText,
          },
        });
        console.log("@@params values: orgId", selectedOrgId);
        console.log("@@params values: custId", selectedCustId);
        console.log("@@params values: accoId", selectedCloudId);
        console.log("@@params values: search", searchText);
        console.log("@@Search results data:", JSON.stringify(data));

        setSearchResultsProfile(Array.isArray(data) ? data : [data]);
      } catch (error) {
        console.error("Error searching profiles:", error);
        setSearchResultsProfile([]);
      }
    }
  };

  const refreshProfilesForCustomer = (customerId) => {
    if (!customerId) return;

    // Simulate fetching fresh profiles linked to this customer
    // For now we simulate it with dummyProfiles filtered
    const customerProfiles = dummyProfiles.filter((profile) =>
      profile.customerIds?.includes(customerId)
    );

    setFilteredProfiles(customerProfiles);
  };

  // Delete a customer-account relationship for an org/customer/account in edit mode
  const handleDeleteAccountFromCustomer = async (orgId, custId, acctId) => {
    try {
      // Confirm with user before deleting
      Modal.confirm({
        title:
          "Are you sure you want to delete this account from the customer?",
        content:
          "This will remove the account from the customer. If profiles are attached, you must delink them first.",
        okText: "Delete",
        okType: "danger",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            await apiCall({
              method: "DELETE",
              url: `/api/customeraccount/delete-relationship?organizationId=${orgId}&customerId=${custId}&accountId=${acctId}`,
            });
            setUpdateAlert({
              visible: true,
              type: "success",
              message: "Account relationship deleted successfully.",
            });
            // Refresh selectedOrg in-place to remove the deleted account
            setSelectedOrg((prevOrgs) => {
              if (!Array.isArray(prevOrgs)) return prevOrgs;
              return prevOrgs.map((org) => {
                if (org.organizationId !== orgId) return org;
                return {
                  ...org,
                  customer: org.customer
                    ? org.customer
                        .map((cust) => {
                          if (cust.customerId !== custId) return cust;
                          const updatedAccounts = (cust.accounts || []).filter(
                            (acct) => acct.accountId !== acctId
                          );
                          // Optionally, remove the customer if no accounts left
                          if (updatedAccounts.length === 0) return null;
                          return { ...cust, accounts: updatedAccounts };
                        })
                        .filter(Boolean)
                    : [],
                };
              });
            });
            // Optionally refresh org list or selected org here
            // await refreshOrganizations();
          } catch (err) {
            // If backend returns a 409 or specific error for profile mapping, show special message
            if (
              err?.response?.status === 409 ||
              (err?.response?.data &&
                typeof err.response.data === "string" &&
                err.response.data.toLowerCase().includes("profile"))
            ) {
              setUpdateAlert({
                visible: true,
                type: "error",
                message:
                  "Cannot delete: Profiles are attached to this account. Please delink all profiles before deleting.",
              });
            } else {
              setUpdateAlert({
                visible: true,
                type: "error",
                message: "Failed to delete account relationship.",
              });
            }
          }
        },
      });
    } catch (err) {
      setUpdateAlert({
        visible: true,
        type: "error",
        message: "Failed to initiate account deletion.",
      });
    }
  };

  // Handler to add an account to a customer in selectedOrg (edit org view)
  const handleAddAccountToCustomer = (orgId, customerId) => {
    setSelectedOrg((prevOrgs) =>
      prevOrgs.map((org) => {
        if (org.organizationId !== orgId) return org;
        return {
          ...org,
          customer: org.customer.map((cust) => {
            if (cust.customerId !== customerId) return cust;
            return {
              ...cust,
              accounts: [
                ...(Array.isArray(cust.accounts) ? cust.accounts : []),
                { name: "", cloudType: "", isNew: true },
              ],
            };
          }),
        };
      })
    );
  };

  // Handler to save a newly added account to the database
  const handleSaveNewAccount = async (orgId, custId, accIdx) => {
    try {
      // Find the organization, customer, and account in the state
      const org = selectedOrg.find((o) => o.organizationId === orgId);
      if (!org) {
        setUpdateAlert({
          visible: true,
          type: "error",
          message: "Organization not found.",
        });
        return;
      }

      const customer = org.customer.find((c) => c.customerId === custId);
      if (!customer || !customer.accounts || !customer.accounts[accIdx]) {
        setUpdateAlert({
          visible: true,
          type: "error",
          message: "Customer or account not found.",
        });
        return;
      }

      const account = customer.accounts[accIdx];

      // Validate the account data
      if (!account.name || !account.name.trim()) {
        setUpdateAlert({
          visible: true,
          type: "error",
          message: "Account name is required.",
        });
        return;
      }

      if (!account.cloudType || !account.cloudType.trim()) {
        setUpdateAlert({
          visible: true,
          type: "error",
          message: "Cloud provider is required.",
        });
        return;
      }

      // Prepare the payload for the API
      const payload = {
        organizationId: orgId,
        customers: [
          {
            customerId: custId,
            name: customer.name || "",
            isActive: true,
            accounts: [
              {
                accountId: null, // null for new account
                name: account.name,
                isActive: true,
                cloudType: account.cloudType,
              },
            ],
          },
        ],
      };

      console.log("Sending payload to API:", JSON.stringify(payload, null, 2));

      // Make the API call to add the account - using relative URL
      const response = await apiCall({
        method: "POST",
        url: "/api/customeraccount/edit-cascade",
        data: payload,
      });

      // Show success message
      setUpdateAlert({
        visible: true,
        type: "success",
        message: "Account added successfully.",
      });

      // Refresh the organization data to get the updated accounts
      const data = await apiCall({
        method: "get",
        url: `/api/customeraccount/org-details/${orgId}`,
      });

      setSelectedOrg(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error("Error adding new account:", error);
      setUpdateAlert({
        visible: true,
        type: "error",
        message: "Error adding account: " + (error?.message || error),
      });
    }
  };

  // This function handles saving changes to the organization, including new accounts
  const handleSaveOrgChanges = async (orgId) => {
    // Clone the selected org to avoid modifying state directly
    const orgToSave = JSON.parse(JSON.stringify(selectedOrg[0]));

    // Clean the data before sending to backend
    // Remove isNew flags from all accounts
    if (orgToSave && orgToSave.customer) {
      orgToSave.customer.forEach((cust) => {
        if (cust.accounts) {
          cust.accounts.forEach((acc) => {
            // Remove the isNew flag before saving
            delete acc.isNew;
          });
        }
      });
    }

    try {
      // Make API call to update organization
      await apiCall({
        method: "PUT",
        url: `/api/Organizations/${orgId}`,
        data: orgToSave,
      });

      // Show success message
      setUpdateAlert({
        type: "success",
        message: "Organization updated successfully!",
        visible: true,
      });

      // Refresh the organization data
      const updatedData = await apiCall({
        method: "get",
        url: `/api/customeraccount/org-details/${orgId}`,
      });

      setSelectedOrg(Array.isArray(updatedData) ? updatedData : [updatedData]);
    } catch (error) {
      console.error("Error updating organization:", error);
      setUpdateAlert({
        type: "error",
        message: "Error updating organization: " + error,
        visible: true,
      });
    }
  };

  return (
    <>
      {/* Search Organization Section */}
      <div
        style={{
          marginBottom: 24,
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          position: "relative",
        }}
      >
        <h3>Search Organization</h3>
        <div style={{ position: "relative", width: 400 }}>
          <Input.Search
            style={{ width: "100%" }}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              handleSearchChange(e.target.value);
            }}
            placeholder="Search by Organization Name or ID"
            enterButton
          />
          {searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "100%",
                maxHeight: "300px",
                overflowY: "auto",
                background: darkMode ? "#333" : "#fff",
                color: darkMode ? "#fff" : "#000",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                zIndex: 1000,
                borderRadius: 4,
                border: darkMode ? "1px solid #555" : "1px solid #ccc",
                marginTop: "4px",
              }}
            >
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: darkMode
                      ? "1px solid #555"
                      : "1px solid #ddd",
                  }}
                  onClick={() => handleSelectOrg(item)}
                  dangerouslySetInnerHTML={{ __html: highlightText(item.name) }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create New Organization Section */}
      <div
        style={{
          marginBottom: 24,
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "16px",
        }}
      >
        <h3>Create New Organization</h3>
        {createAlert.visible && (
          <Alert
            message={createAlert.message}
            type={createAlert.type}
            showIcon
            style={{
              marginBottom: 16,
              background: darkMode ? "#29303d" : undefined,
              color: darkMode ? "#fff" : undefined,
              border: darkMode ? "1px solid #434a56" : undefined,
            }}
          />
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Organization Name:
          </label>
          <Input
            style={{ width: 400 }}
            placeholder="Enter Organization Name"
            value={newOrgName}
            onChange={(e) => {
              setNewOrgName(e.target.value);
              setOrgNameError("");
            }}
          />
          {orgNameError && (
            <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
              {orgNameError}
            </div>
          )}
        </div>

        {customers.map((cust, idx) => (
          <div
            key={cust.id || idx}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              marginBottom: 16,
              padding: 16,
              background: darkMode ? "#23272f" : "#f9f9f9",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                marginBottom: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 220 }}>
                <label>Customer Name:</label>
                <Input
                  value={cust.name}
                  onChange={(e) => {
                    const updated = [...customers];
                    updated[idx].name = e.target.value;
                    setCustomers(updated);
                  }}
                  style={{ width: "100%", marginLeft: 8 }}
                />
                {cust.errors?.name && (
                  <div style={{ color: "red", fontSize: "12px" }}>
                    {cust.errors.name}
                  </div>
                )}
              </div>
            </div>
            {/* At least one Account row for new customer */}
            {(cust.accounts && cust.accounts.length > 0
              ? cust.accounts
              : [{}]
            ).map((account, accIdx) => (
              <div
                key={account.accountId || accIdx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 8,
                  marginLeft: 24,
                  background: darkMode ? "#181c22" : "#f4f6fa",
                  borderRadius: 6,
                  padding: "10px 12px",
                  boxShadow: darkMode
                    ? "0 1px 4px rgba(0,0,0,0.25)"
                    : "0 1px 4px rgba(0,0,0,0.07)",
                }}
              >
                {/* Account Name textbox */}
                <div style={{ flex: 2, minWidth: 180 }}>
                  <label style={{ fontWeight: 500, marginRight: 8 }}>
                    Account:
                  </label>
                  <Input
                    value={account.name || ""}
                    onChange={(e) => {
                      const updated = [...customers];
                      if (!updated[idx].accounts) updated[idx].accounts = [{}];
                      updated[idx].accounts[accIdx] = {
                        ...updated[idx].accounts[accIdx],
                        name: e.target.value,
                      };
                      setCustomers(updated);
                    }}
                    style={{
                      width: "100%",
                      background: darkMode ? "#23272f" : "#f5f5f5",
                    }}
                  />
                </div>
                {/* Cloud Provider dropdown */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 120,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <label style={{ fontWeight: 500, marginRight: 8 }}>
                    Cloud Provider:
                  </label>{" "}
                  <Select
                    value={account.cloudType || ""}
                    onChange={(value) => {
                      const updated = [...customers];
                      if (!updated[idx].accounts) updated[idx].accounts = [{}];
                      updated[idx].accounts[accIdx] = {
                        ...updated[idx].accounts[accIdx],
                        cloudType: value,
                      };
                      setCustomers(updated);
                    }}
                    dropdownStyle={{
                      backgroundColor: darkMode ? "#333" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                    }}
                    style={{ width: 140 }}
                  >
                    <Option value="AWS">AWS</Option>
                    <Option value="GCP">GCP</Option>
                    <Option value="Azure">Azure</Option>
                  </Select>
                  {/* Save button for new account */}
                  {account.isNew && (
                    <Button
                      icon={<SaveOutlined />}
                      type="text"
                      style={{ color: "#1890ff", marginLeft: 4 }}
                      onClick={() =>
                        handleSaveNewAccount(
                          selectedOrgId,
                          cust.customerId,
                          accIdx
                        )
                      }
                      title="Save this account to database"
                    />
                  )}
                  {/* Delete icon for account row */}
                  <Button
                    icon={<DeleteOutlined />}
                    type="text"
                    danger
                    onClick={() => {
                      // If account.accountId exists and it's not a new account, call handleDeleteAccountFromCustomer (persisted account)
                      // Otherwise, just remove the row from state (newly added, not yet saved)
                      if (account.accountId && !account.isNew) {
                        handleDeleteAccountFromCustomer(
                          selectedOrgId,
                          cust.customerId,
                          account.accountId
                        );
                      } else {
                        setSelectedOrg((prevOrgs) =>
                          prevOrgs.map((o) => {
                            if (o.organizationId !== selectedOrgId) return o;
                            return {
                              ...o,
                              customer: o.customer.map((c) => {
                                if (c.customerId !== cust.customerId) return c;
                                const newAccounts = (c.accounts || []).filter(
                                  (_, i) => i !== accIdx
                                );
                                return { ...c, accounts: newAccounts };
                              }),
                            };
                          })
                        );
                      }
                    }}
                    style={{ marginLeft: 4 }}
                  />
                </div>
              </div>
            ))}
            {/* + Add Account button at lower right */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              <Button
                type="dashed"
                onClick={() => {
                  const updated = [...customers];
                  if (!updated[idx].accounts) updated[idx].accounts = [{}];
                  updated[idx].accounts.push({ name: "", cloudType: "" });
                  setCustomers(updated);
                }}
                style={{ width: 150 }}
              >
                + Add Account
              </Button>
            </div>
            {/* Delete customer section button */}
            <Button
              icon={<DeleteOutlined />}
              type="text"
              danger
              onClick={() => handleDeleteCustomerRow(idx)}
              style={{ alignSelf: "flex-end", marginTop: 8 }}
            />
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button type="dashed" onClick={handleAddCustomer}>
            + Add Customer
          </Button>
          <Button type="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>

      {/* Update Organization Section */}
      {/* {console.log("ON TOP OF UPDATE ORG SECTION", JSON.stringify(selectedOrg))}
      {console.log("selectedOrg count ==", selectedOrg)}
      {console.log(
        "selectedOrg array",
        selectedOrg,
        Array.isArray(selectedOrg)
      )} */}
      {selectedOrg &&
        selectedOrg.length > 0 &&
        selectedOrg.map((org, index) => (
          <div
            key={org.organizationId}
            style={{
              marginBottom: 24,
              background: darkMode ? "#1e1e1e" : "#fff",
              color: darkMode ? "#fff" : "#000",
              borderRadius: "8px",
              padding: "24px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              marginBottom: "16px",
            }}
          >
            <h3>Update Organization - {org.name}</h3>
            {updateAlert.visible && (
              <Alert
                message={updateAlert.message}
                type={updateAlert.type}
                showIcon
                style={{
                  marginBottom: 16,
                  background: darkMode ? "#29303d" : undefined,
                  color: darkMode ? "#fff" : undefined,
                  border: darkMode ? "1px solid #434a56" : undefined,
                }}
              />
            )}

            <Space direction="vertical" style={{ width: "100%" }}>
              {/* Organization Name Update */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 4 }}>
                  Organization Name:
                </label>
                <Input
                  style={{ width: 400 }}
                  value={org.name}
                  onChange={(e) =>
                    handleUpdateOrgName(e.target.value, org.organizationId)
                  }
                />
              </div>

              {/* Existing Customers */}
              {org.customer &&
                org.customer.map((cust, custIdx) => (
                  <div
                    key={cust.customerId || custIdx}
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: 8,
                      marginBottom: 16,
                      padding: 16,
                      background: darkMode ? "#23272f" : "#f9f9f9",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 24,
                        marginBottom: 8,
                      }}
                    >
                      {" "}
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <label>Customer Name:</label>
                        <Input
                          value={cust.name}
                          onChange={(e) => {
                            // Update customer name in state without API call
                            setSelectedOrg((prevOrgs) =>
                              prevOrgs.map((org) => ({
                                ...org,
                                customer: org.customer.map((c, cIndex) =>
                                  cIndex === custIdx
                                    ? { ...c, name: e.target.value }
                                    : c
                                ),
                              }))
                            );
                          }}
                          style={{ width: "100%", marginLeft: 8 }}
                        />
                      </div>
                    </div>
                    {/* Accounts Section */}
                    {Array.isArray(cust.accounts) &&
                      cust.accounts.map((account, accIdx) => (
                        <div
                          key={account.accountId || accIdx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                            marginBottom: 8,
                            marginLeft: 24,
                            background: darkMode ? "#181c22" : "#f4f6fa",
                            borderRadius: 6,
                            padding: "10px 12px",
                            boxShadow: darkMode
                              ? "0 1px 4px rgba(0,0,0,0.25)"
                              : "0 1px 4px rgba(0,0,0,0.07)",
                          }}
                        >
                          {/* Account Name in textbox (disabled only if not new) */}
                          <div style={{ flex: 2, minWidth: 180 }}>
                            <label style={{ fontWeight: 500, marginRight: 8 }}>
                              Account:
                            </label>
                            <Input
                              value={account.name}
                              disabled={!account.isNew}
                              onChange={(e) => {
                                handleUpdateCustomerAccount(
                                  custIdx,
                                  accIdx,
                                  e.target.value,
                                  org.organizationId,
                                  account.accountId
                                );
                              }}
                              style={{
                                width: "100%",
                                background: darkMode ? "#23272f" : "#f5f5f5",
                              }}
                            />
                          </div>
                          {/* Cloud Provider dropdown */}
                          <div
                            style={{
                              flex: 1,
                              minWidth: 120,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <label style={{ fontWeight: 500, marginRight: 8 }}>
                              Cloud Provider:
                            </label>
                            <Select
                              value={account.cloudtype || ""}
                              onChange={(value) => {
                                // Update cloud provider in state without API call
                                setSelectedOrg((prevOrgs) =>
                                  prevOrgs.map((org) => ({
                                    ...org,
                                    customer: org.customer.map((c, cIndex) =>
                                      cIndex === custIdx
                                        ? {
                                            ...c,
                                            accounts: (c.accounts || []).map(
                                              (acc, aIndex) =>
                                                aIndex === accIdx
                                                  ? { ...acc, cloudtype: value }
                                                  : acc
                                            ),
                                          }
                                        : c
                                    ),
                                  }))
                                );
                              }}
                              dropdownStyle={{
                                backgroundColor: darkMode ? "#333" : "#fff",
                                color: darkMode ? "#fff" : "#000",
                              }}
                              style={{ width: 140 }}
                            >
                              <Option value="AWS">AWS</Option>
                              <Option value="GCP">GCP</Option>
                              <Option value="Azure">Azure</Option>
                            </Select>
                            {/* Save button for saving changes */}
                            <Button
                              icon={<SaveOutlined />}
                              type="text"
                              onClick={() => {
                                const customer = org.customer[custIdx];
                                const account = customer.accounts[accIdx];

                                handleUpdateCustomerProvider(
                                  custIdx,
                                  accIdx,
                                  account.cloudtype,
                                  org.organizationId,
                                  account.accountId
                                );
                              }}
                              style={{ marginLeft: 4 }}
                              title="Save changes"
                            />
                            <Button
                              icon={<DeleteOutlined />}
                              type="text"
                              danger
                              onClick={() => {
                                // If account.accountId exists, call handleDeleteAccountFromCustomer (persisted account)
                                // Otherwise, just remove the row from state (newly added, not yet saved)
                                if (account.accountId && !account.isNew) {
                                  handleDeleteAccountFromCustomer(
                                    org.organizationId,
                                    cust.customerId,
                                    account.accountId
                                  );
                                } else {
                                  setSelectedOrg((prevOrgs) =>
                                    prevOrgs.map((o) => {
                                      if (
                                        o.organizationId !== org.organizationId
                                      )
                                        return o;
                                      return {
                                        ...o,
                                        customer: o.customer.map(
                                          (c, cIndex) => {
                                            if (cIndex !== custIdx) return c;
                                            return {
                                              ...c,
                                              accounts: c.accounts.filter(
                                                (_, aIndex) => aIndex !== accIdx
                                              ),
                                            };
                                          }
                                        ),
                                      };
                                    })
                                  );
                                }
                              }}
                              style={{ marginLeft: 4 }}
                            />
                          </div>
                          {/* Action Buttons for each account */}
                          <div style={{ display: "flex", gap: 8 }}>
                            <Button
                              icon={<UserOutlined />}
                              type="text"
                              onClick={() =>
                                viewProfiles(
                                  cust.customerId,
                                  account.accountId,
                                  cust.name,
                                  account.name
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    {/* + Add Account button at lower right */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 8,
                      }}
                    >
                      <Button
                        type="dashed"
                        onClick={() =>
                          handleAddAccountToCustomer(
                            org.organizationId,
                            cust.customerId
                          )
                        }
                        style={{ width: 150 }}
                      >
                        + Add Account
                      </Button>
                    </div>
                  </div>
                ))}

              {/* Add New Customers */}

              {/* {console.log(
                "ON TOP OF UPDATE ORG SECTION -- ",
                JSON.stringify(newCustomers)
              )} */}
              {newCustomers.map((cust, idx) => (
                <div
                  key={`new-${idx}`}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    marginBottom: 16,
                    padding: 16,
                    background: darkMode ? "#23272f" : "#f9f9f9",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 24,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <label>Customer Name:</label>
                      <Input
                        value={cust.name}
                        onChange={(e) => {
                          const updated = [...newCustomers];
                          updated[idx].name = e.target.value;
                          setNewCustomers(updated);
                        }}
                        style={{ width: "100%", marginLeft: 8 }}
                      />
                    </div>
                  </div>
                  {/* At least one Account row for new customer */}
                  {(cust.accounts && cust.accounts.length > 0
                    ? cust.accounts
                    : [{}]
                  ).map((account, accIdx) => (
                    <div
                      key={account.accountId || accIdx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        marginBottom: 8,
                        marginLeft: 24,
                        background: darkMode ? "#181c22" : "#f4f6fa",
                        borderRadius: 6,
                        padding: "10px 12px",
                        boxShadow: darkMode
                          ? "0 1px 4px rgba(0,0,0,0.25)"
                          : "0 1px 4px rgba(0,0,0,0.07)",
                      }}
                    >
                      {/* Account Name textbox */}
                      <div style={{ flex: 2, minWidth: 180 }}>
                        <label style={{ fontWeight: 500, marginRight: 8 }}>
                          Account:
                        </label>
                        <Input
                          value={account.name || ""}
                          onChange={(e) => {
                            const updated = [...newCustomers];
                            if (!updated[idx].accounts)
                              updated[idx].accounts = [{}];
                            updated[idx].accounts[accIdx] = {
                              ...updated[idx].accounts[accIdx],
                              name: e.target.value,
                            };
                            setNewCustomers(updated);
                          }}
                          style={{
                            width: "100%",
                            background: darkMode ? "#23272f" : "#f5f5f5",
                          }}
                        />
                      </div>
                      {/* Cloud Provider dropdown */}
                      <div
                        style={{
                          flex: 1,
                          minWidth: 120,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <label style={{ fontWeight: 500, marginRight: 8 }}>
                          Cloud Provider:
                        </label>
                        <Select
                          value={account.cloudType || ""}
                          onChange={(value) => {
                            const updated = [...newCustomers];
                            if (!updated[idx].accounts)
                              updated[idx].accounts = [{}];
                            updated[idx].accounts[accIdx] = {
                              ...updated[idx].accounts[accIdx],
                              cloudType: value,
                            };
                            setNewCustomers(updated);
                          }}
                          dropdownStyle={{
                            backgroundColor: darkMode ? "#333" : "#fff",
                            color: darkMode ? "#fff" : "#000",
                          }}
                          style={{ width: 140 }}
                        >
                          <Option value="AWS">AWS</Option>
                          <Option value="GCP">GCP</Option>
                          <Option value="Azure">Azure</Option>
                        </Select>
                        {/* Delete icon for account row */}
                        <Button
                          icon={<DeleteOutlined />}
                          type="text"
                          danger
                          onClick={() => {
                            const updated = [...newCustomers];
                            if (
                              updated[idx].accounts &&
                              updated[idx].accounts.length > 1
                            ) {
                              updated[idx].accounts.splice(accIdx, 1);
                              setNewCustomers(updated);
                            }
                          }}
                          style={{ marginLeft: 4 }}
                        />
                      </div>
                    </div>
                  ))}
                  {/* + Add Account button at lower right */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 8,
                    }}
                  >
                    <Button
                      type="dashed"
                      onClick={() => {
                        const updated = [...newCustomers];
                        if (!updated[idx].accounts)
                          updated[idx].accounts = [{}];
                        updated[idx].accounts.push({ name: "", cloudType: "" });
                        setNewCustomers(updated);
                      }}
                      style={{ width: 150 }}
                    >
                      + Add Account
                    </Button>
                  </div>
                  {/* Save button below the card */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 8,
                    }}
                  >
                    <Button
                      type="primary"
                      loading={cust.saving}
                      onClick={async () => {
                        // Find the correct org for this customer card
                        const org = selectedOrg[index];
                        // Prepare correct payload for API
                        const payload = {
                          organizationId: org.organizationId,
                          customers: [
                            {
                              customerId: cust.customerId || undefined,
                              name: cust.name,
                              isActive: true,
                              accounts: (cust.accounts || []).map((a) => ({
                                accountId: a.accountId || undefined,
                                name: a.name,
                                isActive: true,
                                cloudType: a.cloudType || "",
                              })),
                            },
                          ],
                        };
                        // Set saving state
                        const updated = [...newCustomers];
                        updated[idx].saving = true;
                        setNewCustomers(updated);
                        try {
                          await apiCall({
                            method: "POST",
                            url: "/api/customeraccount/edit-cascade",
                            data: payload,
                          });
                          message.success(
                            "Customer and accounts saved successfully!"
                          );

                          // Refresh the organization data
                          const refreshedData = await apiCall({
                            method: "get",
                            url: `/api/customeraccount/org-details/${org.organizationId}`,
                          });

                          // Update the selectedOrg state with fresh data
                          setSelectedOrg(
                            Array.isArray(refreshedData)
                              ? refreshedData
                              : [refreshedData]
                          );

                          // Remove the saved customer from newCustomers
                          const afterSave = [...newCustomers];
                          afterSave.splice(idx, 1);
                          setNewCustomers(afterSave);
                        } catch (err) {
                          message.error(
                            "Failed to save customer: " +
                              (err?.message || "Unknown error")
                          );
                          const afterError = [...newCustomers];
                          afterError[idx].saving = false;
                          setNewCustomers(afterError);
                        }
                      }}
                      style={{ width: 120 }}
                    >
                      Save
                    </Button>
                  </div>
                  {/* Delete customer section button */}
                  <Button
                    icon={<DeleteOutlined />}
                    type="text"
                    danger
                    onClick={() => handleDeleteNewCustomerRow(idx)}
                    style={{ alignSelf: "flex-end", marginTop: 8 }}
                  />
                </div>
              ))}

              {/* Add New Customer Button */}
              <Button
                type="dashed"
                onClick={() =>
                  setNewCustomers([
                    ...newCustomers,
                    { name: "", accounts: [{ name: "", cloudType: "" }] },
                  ])
                }
                style={{ width: "150px", marginTop: "16px" }}
              >
                + Add Customer
              </Button>
            </Space>
          </div>
        ))}
      {/* 
      {selectedOrg.map((cust, index) => (
        <div key={index}>
          <div>orgname: {cust.name}</div>
          {cust.customer.map((customer, idx) => (
            <div key={idx}>
              <h4>Customer: {customer.name}</h4>
              <p>Cloud Account Id: {customer.cloudAccount[0].id}</p>
              <p>Cloud Provider: {customer.cloudAccount[0].provider}</p>
            </div>
          ))}
          {console.log("Selected Org:", JSON.stringify(selectedOrg.customer))}
        </div>
      ))} */}

      {/* Profile Section */}
      <div
        style={{
          marginBottom: 24,
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        {currentSection === "profile" && selectedCustId && (
          <>
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              onClick={() => setCurrentSection("organization")}
              style={{ marginBottom: 16 }}
            />
            {alert.visible && (
              <Alert
                message={alert.message}
                type={alert.type}
                showIcon
                style={{
                  marginBottom: 16,
                  background: darkMode ? "#29303d" : undefined,
                  color: darkMode ? "#fff" : undefined,
                  border: darkMode ? "1px solid #434a56" : undefined,
                }}
              />
            )}

            <h3>Profile Search</h3>
            {successMessage && (
              <Alert
                message={successMessage}
                type="success"
                showIcon
                style={{
                  marginBottom: 16,
                  background: darkMode ? "#29303d" : undefined,
                  color: darkMode ? "#fff" : undefined,
                  border: darkMode ? "1px solid #434a56" : undefined,
                }}
              />
            )}

            <>
              {/* Search Box when no profiles */}
              <div style={{ position: "relative", width: 400 }}>
                <Input.Search
                  placeholder="Search Profiles"
                  value={profileSearchText}
                  // onChange={(e) => setProfileSearchText(e.target.value); }
                  // onSearch={handleSearchProfiles}
                  onChange={(e) => {
                    setProfileSearchText(e.target.value);
                    handleSearchProfiles(e.target.value);
                  }}
                  enterButton
                />

                {/* Search Results */}
                {console.log(
                  "SearchResultsProfile data ==",
                  JSON.stringify(searchResultsProfile)
                )}
                {searchResultsProfile.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      width: "100%",
                      maxHeight: "300px",
                      overflowY: "auto",
                      background: darkMode ? "#333" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                      zIndex: 1000,
                      borderRadius: 4,
                      border: darkMode ? "1px solid #555" : "1px solid #ccc",
                      marginTop: "4px",
                    }}
                  >
                    {searchResultsProfile.map((profile) => (
                      <div
                        key={profile.profileId}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          borderBottom: darkMode
                            ? "1px solid #555"
                            : "1px solid #ddd",
                        }}
                        onClick={() => handleProfileSelection(profile)}
                        dangerouslySetInnerHTML={{
                          __html: highlightText(
                            `${profile.firstName + " " + profile.lastName} | ${
                              profile.email
                            } | ${profile.accessLevel}`
                          ),
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>

            {console.log("filteredProfiles ==", filteredProfiles)}

            {console.log("filteredProfiles count ==", filteredProfiles.length)}

            {filteredProfiles.length > 0 && (
              <>
                <div
                  style={{
                    marginTop: 20,
                  }}
                ></div>
                <h3>
                  Assign Profile to: {selectedCustName} / {selectedCloudName}
                </h3>
                <Table
                  dataSource={filteredProfiles}
                  columns={profileColumns}
                  rowKey="id"
                />
              </>
            )}

            {profileCloudCustomer.length > 0 && (
              <>
                <div
                  style={{
                    marginTop: 20,
                  }}
                ></div>
                <h3>
                  {" "}
                  Existing Profiles for: {selectedCustName} /{" "}
                  {selectedCloudName}
                </h3>
                <Table
                  dataSource={profileCloudCustomer}
                  columns={profileColumns2}
                  rowKey="id"
                />
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default MyOrg;
