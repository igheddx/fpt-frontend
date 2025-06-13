import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Alert,
  Space,
  message,
  Typography,
} from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  SearchOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useDarkMode } from "../config/DarkModeContext";
import { useAccountContext } from "../contexts/AccountContext";
import useApi from "../hooks/useApi";
import RoleBasedContent from "../components/RoleBasedContent";

const { TextArea } = Input;
const { Link } = Typography;

const Review = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { darkMode } = useDarkMode();
  const { accountContext } = useAccountContext();
  const apiCall = useApi();

  // New state for approval flows and rejection modal
  const [approvalFlows, setApprovalFlows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRejectionModalVisible, setIsRejectionModalVisible] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");
  const [selectedApprovalFlow, setSelectedApprovalFlow] = useState(null);
  const [showApprovalSuccessAlert, setShowApprovalSuccessAlert] =
    useState(false);
  const [isSearching, setIsSearching] = useState(false); // Track if user is actively searching

  // New state for approval comment modal
  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");

  // New state for expanded sections and loading data
  const [expandedSections, setExpandedSections] = useState({});
  const [loadingData, setLoadingData] = useState({});
  const [participantsData, setParticipantsData] = useState({});
  const [resourcesData, setResourcesData] = useState({});

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

  // Fetch approval flows for the current user
  const fetchApprovalFlows = useCallback(async () => {
    const profileId = getProfileIdFromSession();
    if (!profileId) {
      message.error("Unable to get current user profile. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      console.log(
        "🔍 [Review] Fetching approval flows for profileId:",
        profileId
      );

      const response = await apiCall({
        method: "get",
        url: `/api/ApprovalFlow/approver/${profileId}`,
      });

      console.log("🔍 [Review] Approval flows response:", response);

      if (response && Array.isArray(response)) {
        // Always store all flows for search functionality
        setApprovalFlows(response);

        if (!isSearching) {
          // DEFAULT VIEW: Show only pending approvals automatically on page load
          const pendingFlows = response.filter((flow) => {
            // Check the current user's status using ApproverStatus field
            return flow.approverStatus?.toLowerCase() === "pending";
          });
          console.log(
            "🔍 [Review] Showing pending approvals on page load:",
            pendingFlows.length,
            "out of",
            response.length
          );
          console.log(
            "🔍 [Review] Sample flow data for debugging:",
            response[0]
          );
          setFilteredPolicies(pendingFlows);
        } else {
          // SEARCH VIEW: This will be handled by search functions independently
          // Don't modify filteredPolicies here when searching
        }
      } else {
        console.log("🔍 [Review] No approval flows found");
        setApprovalFlows([]);
        setFilteredPolicies([]);
      }
    } catch (error) {
      console.error("❌ [Review] Error fetching approval flows:", error);
      message.error("Failed to load approval flows for review");
      setApprovalFlows([]);
      setFilteredPolicies([]);
    } finally {
      setLoading(false);
    }
  }, [apiCall, isSearching]);
  const suggestionBoxRef = useRef(null);

  // Load approval flows on component mount
  useEffect(() => {
    fetchApprovalFlows();
  }, [fetchApprovalFlows]);

  // Refresh approval flows when account context changes
  useEffect(() => {
    if (accountContext) {
      fetchApprovalFlows();
    }
  }, [accountContext, fetchApprovalFlows]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowConfirmation(false);
    setFilteredPolicies([]);

    // Update search state
    setIsSearching(value.trim().length > 0);

    const lowerVal = value.toLowerCase();
    const matches = approvalFlows.filter(
      (flow) =>
        flow.approvalId?.toString().toLowerCase().includes(lowerVal) ||
        flow.name?.toLowerCase().includes(lowerVal) ||
        flow.type?.toLowerCase().includes(lowerVal) ||
        flow.status?.toLowerCase().includes(lowerVal)
    );
    setSuggestions(matches);
  };

  const handleSuggestionClick = (flow) => {
    setFilteredPolicies([flow]);
    setSearchTerm(flow.name || flow.approvalId?.toString() || "");
    setSuggestions([]);
    setIsSearching(true); // User is actively searching
  };

  const handleApprove = (flow) => {
    setSelectedApprovalFlow(flow);
    setApprovalComment("");
    setIsApprovalModalVisible(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedApprovalFlow) return;

    const profileId = getProfileIdFromSession();

    console.log("@@selected profileId==", profileId);

    if (!profileId) {
      message.error("Unable to get current user profile. Please log in again.");
      return;
    }

    // Show loading message
    const loadingMessage = message.loading("Processing approval...", 0);

    try {
      console.log(
        "🔍 [Review] Starting approval process for flow:",
        selectedApprovalFlow
      );
      console.log("🔍 [Review] Current user profileId:", profileId);
      console.log(
        "🔍 [Review] Current user approver status:",
        selectedApprovalFlow.approverStatus
      );
      console.log("🔍 [Review] Approval comment:", approvalComment);

      // Step 1: Check if current user can approve (status should be pending)
      if (selectedApprovalFlow.approverStatus?.toLowerCase() !== "pending") {
        throw new Error(
          `Cannot approve - current status is: ${selectedApprovalFlow.approverStatus}`
        );
      }

      // Step 2: Get all participants for this approval flow to find current user's participant ID
      const allParticipantsResponse = await apiCall({
        method: "get",
        url: `/api/ApprovalFlowParticipant`,
      });

      console.log(
        "@@allParticipantsResponse ==",
        JSON.stringify(allParticipantsResponse)
      );

      console.log("@@#selectedApprovalFlow==", selectedApprovalFlow.approvalId);
      console.log("@@#profileId - next to selectedApprovalFlow==", profileId);

      // Find the current user's participant record
      const currentUserParticipant = allParticipantsResponse?.find(
        (participant) =>
          Number(participant.approvalId) ===
            Number(selectedApprovalFlow.approvalId) &&
          Number(participant.profileId) === Number(profileId)
      );

      console.log("@@currentUserParticipant==", currentUserParticipant);
      if (!currentUserParticipant) {
        throw new Error("Current user participant record not found");
      }

      console.log(
        "🔍 [Review] Current user participant from DB:",
        currentUserParticipant
      );

      // Step 3: Update ApprovalFlowParticipant status with comment
      const participantUpdateData = {
        approvalId: currentUserParticipant.approvalId,
        profileId: currentUserParticipant.profileId,
        status: "Complete",
        comment: approvalComment.trim() || null, // Include the comment
        completeDateTime: new Date().toISOString(),
        createDateTime: currentUserParticipant.createDateTime,
        updateDateTime: new Date().toISOString(),
      };

      await apiCall({
        method: "put",
        url: `/api/ApprovalFlowParticipant/${currentUserParticipant.id}`,
        data: participantUpdateData,
      });

      console.log(
        "🔍 [Review] Updated participant status to Complete with comment"
      );

      // Step 4: Make a fresh query to get the latest status of all participants
      const latestParticipantsResponse = await apiCall({
        method: "get",
        url: `/api/ApprovalFlowParticipant?approvalId=${selectedApprovalFlow.approvalId}`,
      });

      console.log(
        "🔍 [Review] Latest participants status after update:",
        latestParticipantsResponse
      );

      // Check if all participants have approved
      const allApproved = latestParticipantsResponse?.every(
        (participant) => participant.status === "Complete"
      );

      console.log("🔍 [Review] All participants approved:", allApproved);

      // Step 5: If all participants approved, update ApprovalFlow status
      if (allApproved) {
        const approvalFlowUpdateData = {
          name: selectedApprovalFlow.name,
          type: selectedApprovalFlow.type,
          status: "Ready",
          key: selectedApprovalFlow.key,
          value: selectedApprovalFlow.value,
          isActive: selectedApprovalFlow.isActive,
          completeDateTime: new Date().toISOString(),
        };

        await apiCall({
          method: "put",
          url: `/api/ApprovalFlow/${selectedApprovalFlow.approvalId}`,
          data: approvalFlowUpdateData,
        });

        console.log("🔍 [Review] Updated approval flow status to ready");
      }

      // Close loading message
      loadingMessage();

      // Show success message
      if (allApproved) {
        message.success(
          "Policy approved successfully! All approvals complete - policy is now ready."
        );
      } else {
        message.success("Your approval has been recorded successfully!");
      }

      // Show success alert
      setShowApprovalSuccessAlert(true);

      // Close modal and reset state
      setIsApprovalModalVisible(false);
      setSelectedApprovalFlow(null);
      setApprovalComment("");

      // Refresh data to reflect changes
      await fetchApprovalFlows();
    } catch (error) {
      // Close loading message
      loadingMessage();
      console.error("❌ [Review] Error approving policy:", error);

      let errorMessage = "Failed to approve policy. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  };

  const handleApprovalCancel = () => {
    setIsApprovalModalVisible(false);
    setSelectedApprovalFlow(null);
    setApprovalComment("");
  };

  const handleProcess = (flow) => {
    // Legacy function - redirect to new approve function
    handleApprove(flow);
  };

  const handleModalOk = async () => {
    // Legacy function - kept for compatibility
    if (!selectedPolicy) return;

    setIsModalVisible(false);
    await handleApprove(selectedPolicy);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedPolicy(null);
  };

  // Handle rejection button click
  const handleReject = (flow) => {
    setSelectedApprovalFlow(flow);
    setRejectionComment("");
    setIsRejectionModalVisible(true);
  };

  // Handle rejection modal submission
  const handleRejectionSubmit = async () => {
    if (!rejectionComment.trim()) {
      message.error("Please provide a reason for rejection");
      return;
    }

    if (rejectionComment.trim().length > 150) {
      message.error("Rejection reason cannot exceed 150 characters");
      return;
    }

    if (!selectedApprovalFlow) return;

    const profileId = getProfileIdFromSession();
    if (!profileId) {
      message.error("Unable to get current user profile. Please log in again.");
      return;
    }

    // Show loading message
    const loadingMessage = message.loading("Processing rejection...", 0);

    try {
      console.log(
        "🔍 [Review] Starting comprehensive rejection process for flow:",
        selectedApprovalFlow
      );

      // Use the new comprehensive rejection endpoint
      const rejectionData = {
        profileId: profileId,
        comment: rejectionComment.trim(),
      };

      const response = await apiCall({
        method: "post",
        url: `/api/ApprovalFlow/reject/${selectedApprovalFlow.approvalId}`,
        data: rejectionData,
      });

      console.log("🔍 [Review] Rejection response:", response);

      // Close loading message
      loadingMessage();

      // Show success message with details
      const successMessage = `Policy rejected successfully! ${response.affectedParticipants} participants notified, ${response.affectedResources} resources updated.`;
      message.success(successMessage);

      // Close modal and reset state
      setIsRejectionModalVisible(false);
      setSelectedApprovalFlow(null);
      setRejectionComment("");

      // Refresh data to reflect changes
      await fetchApprovalFlows();
    } catch (error) {
      // Close loading message
      loadingMessage();
      console.error("❌ [Review] Error rejecting policy:", error);

      let errorMessage = "Failed to reject policy. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  };

  // Handle rejection modal cancel
  const handleRejectionCancel = () => {
    setIsRejectionModalVisible(false);
    setSelectedApprovalFlow(null);
    setRejectionComment("");
  };

  const handleSearchButtonClick = () => {
    const lowerVal = searchTerm.toLowerCase();
    setIsSearching(searchTerm.trim().length > 0); // Update search state

    const matches = approvalFlows.filter(
      (flow) =>
        flow.approvalId?.toString().toLowerCase().includes(lowerVal) ||
        flow.name?.toLowerCase().includes(lowerVal) ||
        flow.type?.toLowerCase().includes(lowerVal) ||
        flow.status?.toLowerCase().includes(lowerVal)
    );
    setSuggestions([]);
    setFilteredPolicies(matches);
    setShowConfirmation(false);
  };

  // Define base columns
  const baseColumns = [
    {
      title: "Flow ID",
      dataIndex: "approvalId",
      key: "approvalId",
      render: (approvalId) => approvalId || "N/A",
    },
    { title: "Policy Name", dataIndex: "name", key: "name" },
    { title: "Policy Type", dataIndex: "type", key: "type" },
    {
      title: "Created Date",
      dataIndex: "createDateTime",
      key: "createDateTime",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
    },
    {
      title: "Flow Status",
      dataIndex: "status",
      key: "status",
      render: (text) => text || "Pending",
    },
    {
      title: "Approval Status",
      dataIndex: "approverStatus",
      key: "approverStatus",
      render: (status) => status || "Pending",
    },
  ];

  // Actions column (conditionally added)
  const actionsColumn = {
    title: "Actions",
    key: "actions",
    render: (_, record) => {
      const approverStatus = record.approverStatus?.toLowerCase();
      if (approverStatus === "complete") {
        return null;
      }
      return (
        <>
          <Button type="link" onClick={() => handleApprove(record)}>
            Approve
          </Button>
          <Button type="link" danger onClick={() => handleReject(record)}>
            Reject
          </Button>
        </>
      );
    },
  };

  // Determine if Actions column should be shown for any record
  const shouldShowActionsColumn = filteredPolicies.some((record) => {
    const approverStatus = record.approverStatus?.toLowerCase();
    return approverStatus !== "approve" && approverStatus !== "reject";
  });

  // Combine columns conditionally
  const columns = shouldShowActionsColumn
    ? [...baseColumns, actionsColumn]
    : baseColumns;

  // Add new functions for fetching data
  const fetchParticipants = async (approvalId) => {
    try {
      setLoadingData((prev) => ({
        ...prev,
        [`participants-${approvalId}`]: true,
      }));
      const response = await apiCall({
        method: "get",
        url: `/api/ApprovalFlowParticipant?approvalId=${approvalId}`,
      });
      console.log("🔍 [Review] Participants Payload:", {
        approvalId,
        response,
      });
      setParticipantsData((prev) => ({
        ...prev,
        [approvalId]: response || [],
      }));
    } catch (error) {
      console.error("Error fetching participants:", error);
      message.error("Failed to load participants data");
    } finally {
      setLoadingData((prev) => ({
        ...prev,
        [`participants-${approvalId}`]: false,
      }));
    }
  };

  const fetchResources = async (approvalId) => {
    try {
      setLoadingData((prev) => ({
        ...prev,
        [`resources-${approvalId}`]: true,
      }));

      // Get resources from Resource endpoint
      const response = await apiCall({
        method: "get",
        //url: `/api/Resource/search?approvalId=${approvalId}`,
        url: `/api/ApprovalFlowLog/search?approvalId=${approvalId}`,
      });

      console.log("🔍 [Review] Resources Raw Payload:", {
        approvalId,
        response,
      });

      console.log("###Resource ==", JSON.stringify(response));
      console.log("###approvalId ==", approvalId);
      // Filter resources for the specific approvalId
      const transformedResources = (response || [])
        .filter((resource) => resource.approvalId === approvalId)
        .map((resource) => ({
          resourceId: resource.resourceId || "",
          resourceName: resource.resourceName || "",
          resourceType: resource.resourceType || "",
          category: resource.category || "",
          status: resource.status || "pending",
          id: resource.id, // Keep the numeric ID for reference
          createDateTime: resource.createDateTime,
          updateDateTime: resource.updateDateTime,
          completeDateTime: resource.completeDateTime,
        }));

      console.log("🔍 [Review] Resources Transformed Payload:", {
        approvalId,
        transformedResources,
      });

      setResourcesData((prev) => ({
        ...prev,
        [approvalId]: transformedResources || [],
      }));
    } catch (error) {
      console.error("Error fetching resources:", error);
      message.error("Failed to load resources data");
    } finally {
      setLoadingData((prev) => ({
        ...prev,
        [`resources-${approvalId}`]: false,
      }));
    }
  };

  const handleSectionToggle = async (approvalId, section) => {
    const sectionKey = `${section}-${approvalId}`;
    setExpandedSections((prev) => {
      const isCurrentlyExpanded = prev[sectionKey];
      return { ...prev, [sectionKey]: !isCurrentlyExpanded };
    });

    const isCurrentlyExpanded = expandedSections[sectionKey];
    if (!isCurrentlyExpanded) {
      if (section === "participants" && !participantsData[approvalId]) {
        await fetchParticipants(approvalId);
      } else if (section === "resources" && !resourcesData[approvalId]) {
        await fetchResources(approvalId);
      }
    }
  };

  const expandedRowRender = (record) => {
    // Columns for participants (approvers)
    const participantColumns = [
      {
        title: "Profile ID",
        dataIndex: "profileId",
        key: "profileId",
      },
      {
        title: "First Name",
        dataIndex: "participantFirstName",
        key: "participantFirstName",
      },
      {
        title: "Last Name",
        dataIndex: "participantLastName",
        key: "participantLastName",
      },
      {
        title: "Email",
        dataIndex: "participantEmail",
        key: "participantEmail",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => status || "Pending",
      },
      {
        title: "Comment",
        dataIndex: "comment",
        key: "comment",
        render: (comment) => comment || "—",
        width: 200,
        ellipsis: true,
      },
      {
        title: "Response Date",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
      },
    ];

    // Helper function to determine resource status based on approval flow final status
    const getResourceStatus = (
      resource,
      approvalFlowStatus,
      approverStatuses
    ) => {
      // If the resource already has a final status, return it
      if (
        resource.status &&
        ["approve", "reject", "abort"].includes(resource.status.toLowerCase())
      ) {
        return resource.status;
      }

      // Determine status based on approval flow completion
      if (approvalFlowStatus?.toLowerCase() === "ready") {
        // All participants approved - resources should be approved
        return "approve";
      } else if (approvalFlowStatus?.toLowerCase() === "rejected") {
        // Flow was rejected - resources should be rejected
        return "reject";
      } else if (approvalFlowStatus?.toLowerCase() === "aborted") {
        // Flow was aborted - resources should be aborted
        return "abort";
      } else {
        // Flow is still pending - resources remain pending
        return resource.status || "pending";
      }
    };

    // Columns for resources
    const resourceColumns = [
      {
        title: "Id",
        dataIndex: "resourceId",
        key: "resourceId",
      },
      {
        title: "Name",
        dataIndex: "resourceName",
        key: "resourceName",
      },
      {
        title: "Type",
        dataIndex: "resourceType",
        key: "resourceType",
      },
      {
        title: "Category",
        dataIndex: "category",
        key: "category",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status, resource) => {
          const finalStatus = getResourceStatus(
            resource,
            record.status,
            record.otherParticipants
          );
          return finalStatus || "pending";
        },
      },
      {
        title: "Created",
        dataIndex: "createDateTime",
        key: "createDateTime",
        render: (date) => (date ? new Date(date).toLocaleString() : "N/A"),
      },
      {
        title: "Last Updated",
        dataIndex: "updateDateTime",
        key: "updateDateTime",
        render: (date) => (date ? new Date(date).toLocaleString() : "N/A"),
      },
      {
        title: "Completed",
        dataIndex: "completeDateTime",
        key: "completeDateTime",
        render: (date) => (date ? new Date(date).toLocaleString() : "N/A"),
      },
    ];

    console.log("🔍 [Review] Expanded row data:", record);
    console.log("🔍 [Review] Resources:", record.resources);
    console.log("🔍 [Review] Other Participants:", record.otherParticipants);

    return (
      <>
        <div style={{ marginBottom: 16 }}>
          <Link
            onClick={() =>
              handleSectionToggle(record.approvalId, "participants")
            }
            style={{ fontSize: 16, fontWeight: 600 }}
          >
            Participants (Approvers){" "}
            {loadingData[`participants-${record.approvalId}`] && (
              <LoadingOutlined style={{ marginLeft: 8 }} />
            )}
          </Link>
        </div>
        {expandedSections[`participants-${record.approvalId}`] && (
          <Table
            columns={participantColumns}
            dataSource={participantsData[record.approvalId] || []}
            rowKey={(participant) =>
              `${record.approvalId}-${
                participant.id || participant.profileId || Math.random()
              }`
            }
            pagination={false}
            style={{ marginBottom: 24 }}
            size="small"
            locale={{ emptyText: "No participants assigned" }}
          />
        )}

        <div style={{ marginBottom: 16 }}>
          <Link
            onClick={() => handleSectionToggle(record.approvalId, "resources")}
            style={{ fontSize: 16, fontWeight: 600 }}
          >
            Resources{" "}
            {loadingData[`resources-${record.approvalId}`] && (
              <LoadingOutlined style={{ marginLeft: 8 }} />
            )}
          </Link>
        </div>
        {expandedSections[`resources-${record.approvalId}`] && (
          <Table
            columns={resourceColumns}
            dataSource={resourcesData[record.approvalId] || []}
            rowKey={(resource) =>
              `${record.approvalId}-${
                resource.resourceId || resource.id || Math.random()
              }`
            }
            pagination={false}
            size="small"
            locale={{ emptyText: "No resources found" }}
          />
        )}
      </>
    );
  };

  return (
    <div
      style={{
        marginTop: "50px",
      }}
    >
      <RoleBasedContent allowedRoles={["admin", "approver"]}>
        <h2>Review</h2>

        {/* Approval Success Alert */}
        {showApprovalSuccessAlert && (
          <div style={{ marginBottom: "16px" }}>
            <Alert
              message="Approval Successful"
              description="Your approval has been recorded successfully. The approval flow status has been updated."
              type="success"
              showIcon
              closable
              onClose={() => setShowApprovalSuccessAlert(false)}
              style={{
                backgroundColor: darkMode ? "#162312" : "#f6ffed",
                border: darkMode ? "1px solid #274916" : "1px solid #b7eb8f",
                color: darkMode ? "#fff" : "#000",
              }}
            />
          </div>
        )}

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
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Search Approval Flows
          </h3>
          <div style={{ position: "relative" }}>
            <Space.Compact style={{ width: "100%" }}>
              <Input
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search for approval flows by ID, policy name, type or status"
                size="large"
              />
              <Button
                icon={<SearchOutlined />}
                onClick={handleSearchButtonClick}
                size="large"
              />
            </Space.Compact>
            {suggestions.length > 0 && (
              <div
                ref={suggestionBoxRef}
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
                  marginTop: "4px",
                }}
              >
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSuggestionClick(s)}
                    style={{
                      padding: 8,
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {s.id} - {s.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showConfirmation && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ maxWidth: 400 }}>
              <Alert
                message="Your approval flow was successfully processed"
                type="success"
                showIcon
              />
            </div>
            {selectedPolicy && (
              <div style={{ marginTop: 12 }}>
                <div>
                  <strong>Flow ID:</strong> {selectedPolicy.id}
                </div>
                <div>
                  <strong>Policy Name:</strong> {selectedPolicy.name}
                </div>
                <div>
                  <strong>Status:</strong> {selectedPolicy.status}
                </div>
              </div>
            )}
          </div>
        )}

        {!showConfirmation && filteredPolicies.length > 0 && (
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
              Approval Flows for Review ({filteredPolicies.length} found)
            </h3>
            <Table
              columns={columns}
              dataSource={filteredPolicies}
              rowKey="approvalId"
              loading={loading}
              expandable={{
                expandedRowRender,
                expandedRowKeys,
                onExpand: (expanded, record) => {
                  setExpandedRowKeys(expanded ? [record.approvalId] : []);
                },
                expandIcon: ({ expanded, onExpand, record }) =>
                  expanded ? (
                    <MinusOutlined onClick={(e) => onExpand(record, e)} />
                  ) : (
                    <PlusOutlined onClick={(e) => onExpand(record, e)} />
                  ),
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} approval flows`,
              }}
            />
          </div>
        )}

        {/* Display message when search is performed but no results found */}
        {!showConfirmation &&
          searchTerm.trim() &&
          filteredPolicies.length === 0 && (
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
                No approval flows found for "{searchTerm}". Try a different
                search term.
              </p>
            </div>
          )}

        <Modal
          title="Confirm Policy Approval"
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          okText="Yes, Proceed"
          cancelText="Cancel"
          styles={{
            body: {
              backgroundColor: darkMode ? "#1e1e1e" : "#fff",
              color: darkMode ? "#fff" : "#000",
            },
            header: {
              backgroundColor: darkMode ? "#1e1e1e" : "#fff",
              borderBottom: darkMode
                ? "1px solid #434a56"
                : "1px solid #f0f0f0",
            },
            content: {
              backgroundColor: darkMode ? "#1e1e1e" : "#fff",
            },
          }}
        >
          <div style={{ color: darkMode ? "#fff" : "#000" }}>
            Would you like to proceed with approving this policy?
          </div>
        </Modal>

        {/* Rejection Modal */}
        <Modal
          title="Reject Policy"
          open={isRejectionModalVisible}
          onOk={handleRejectionSubmit}
          onCancel={handleRejectionCancel}
          okText="Reject"
          cancelText="Cancel"
          okButtonProps={{
            danger: true,
            disabled:
              !rejectionComment.trim() || rejectionComment.trim().length === 0,
          }}
          styles={{
            body: {
              backgroundColor: darkMode ? "#1e1e1e" : "#fff",
              color: darkMode ? "#fff" : "#000",
            },
            header: {
              backgroundColor: darkMode ? "#1e1e1e" : "#fff",
              borderBottom: darkMode
                ? "1px solid #434a56"
                : "1px solid #f0f0f0",
            },
            content: {
              backgroundColor: darkMode ? "#1e1e1e" : "#fff",
            },
          }}
        >
          <p style={{ color: darkMode ? "#fff" : "#000" }}>
            Please provide a reason for rejecting this policy (required):
          </p>
          <TextArea
            value={rejectionComment}
            onChange={(e) => setRejectionComment(e.target.value)}
            placeholder="Enter rejection reason... (max 150 characters)"
            rows={4}
            maxLength={150}
            showCount
            style={{
              marginTop: 8,
              backgroundColor: darkMode ? "#2a2a2a" : "#fff",
              color: darkMode ? "#fff" : "#000",
              borderColor: darkMode ? "#434a56" : "#d9d9d9",
            }}
          />
          {rejectionComment.length > 0 && (
            <div
              style={{
                marginTop: 8,
                fontSize: "12px",
                color: darkMode ? "#888" : "#666",
              }}
            >
              {rejectionComment.length}/150 characters
            </div>
          )}
        </Modal>

        {/* Approval Modal with Comment */}
        <Modal
          title="Approve Policy"
          open={isApprovalModalVisible}
          onOk={handleApprovalSubmit}
          onCancel={handleApprovalCancel}
          okText="Approve"
          cancelText="Cancel"
          okButtonProps={{ type: "primary" }}
          styles={{
            body: {
              backgroundColor: darkMode ? "#1e1e1e" : "#fff",
              color: darkMode ? "#fff" : "#000",
            },
            header: {
              backgroundColor: darkMode ? "#1e1e1e" : "#fff",
              borderBottom: darkMode
                ? "1px solid #434a56"
                : "1px solid #f0f0f0",
            },
            content: {
              backgroundColor: darkMode ? "#1e1e1e" : "#fff",
            },
          }}
        >
          <p style={{ color: darkMode ? "#fff" : "#000" }}>
            Would you like to proceed with approving this policy?
          </p>
          <p style={{ color: darkMode ? "#fff" : "#000", marginTop: 16 }}>
            Optional: Add a comment about your approval decision:
          </p>
          <TextArea
            value={approvalComment}
            onChange={(e) => setApprovalComment(e.target.value)}
            placeholder="Enter approval comment (optional)..."
            rows={3}
            style={{
              marginTop: 8,
              backgroundColor: darkMode ? "#2a2a2a" : "#fff",
              color: darkMode ? "#fff" : "#000",
              borderColor: darkMode ? "#434a56" : "#d9d9d9",
            }}
          />
        </Modal>
      </RoleBasedContent>

      <RoleBasedContent allowedRoles={["viewer"]} fallback>
        <Alert
          message="Access Denied"
          description="You don't have permission to access the Review Panel. Admin or Approver role required."
          type="warning"
          showIcon
          style={{
            background: darkMode ? "#29303d" : undefined,
            color: darkMode ? "#fff" : undefined,
            border: darkMode ? "1px solid #434a56" : undefined,
          }}
        />
      </RoleBasedContent>
    </div>
  );
};

export default Review;
