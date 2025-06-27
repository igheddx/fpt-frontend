import React, { useState, useRef, useEffect } from "react";
import { Table, Button, Input, Modal, Alert, Space, message, Tag } from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  SearchOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useDarkMode } from "../../config/DarkModeContext";
import styles from "../../App.css";
import { useApi } from "../../hooks/useApi";
import { useAccountContext } from "../../contexts/AccountContext";

const initialPolicies = [
  {
    policyId: "P001",
    policyName: "Tagging Policy",
    submissionDate: "2025-04-01",
    submissionBy: "Alice",
    approvals: [
      { name: "John Doe", approvalStatus: "Pending", approvalDate: null },
      { name: "Jane Smith", approvalStatus: "Pending", approvalDate: null },
    ],
    resources: [
      { resourceId: "RES-101", resourceName: "VM-Alpha", resourceType: "VM" },
      {
        resourceId: "RES-102",
        resourceName: "Storage-Beta",
        resourceType: "Storage",
      },
    ],
  },
  {
    policyId: "P002",
    policyName: "Encryption Policy",
    submissionDate: "2025-03-28",
    submissionBy: "Bob",
    approvals: [
      { name: "Michael", approvalStatus: "Pending", approvalDate: null },
    ],
    resources: [
      { resourceId: "RES-201", resourceName: "VM-Gamma", resourceType: "VM" },
    ],
  },
];

const MyProcess = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [approvalFlows, setApprovalFlows] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cancelComment, setCancelComment] = useState("");
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isProcessModalVisible, setIsProcessModalVisible] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const { darkMode } = useDarkMode();
  const suggestionBoxRef = useRef(null);
  const { apiCall } = useApi();
  const { accountContext, addPolicyRefreshListener } = useAccountContext();
  const [participantsData, setParticipantsData] = useState({});
  const [resourcesData, setResourcesData] = useState({});

  // Centralized notification function
  const sendNotificationsToParticipants = async (
    flow,
    action,
    comment = ""
  ) => {
    try {
      console.log(
        `🔍 [MyProcess] Sending ${action} notifications for flow:`,
        flow.id
      );

      // Get all participants
      const allParticipants = await apiCall({
        method: "get",
        url: `/api/ApprovalFlowParticipant?approvalId=${flow.id}`,
      });

      // Get approval flow details
      const approvalFlow = await apiCall({
        method: "get",
        url: `/api/ApprovalFlow/${flow.id}`,
      });

      // Get submitter's profile
      const submitterProfile = await apiCall({
        method: "get",
        url: `/api/Profile/${approvalFlow.createdById}`,
      });

      // Send notifications and emails to all participants
      for (const participant of allParticipants) {
        try {
          let message, subject, body;

          if (action === "process") {
            message = `Approval flow "${flow.name}" has been processed and completed`;
            subject = `Approval Flow Completed: ${flow.name}`;
            body = `The approval flow "${
              flow.name
            }" has been processed and completed successfully.${
              comment ? `\n\nAdditional notes: ${comment}` : ""
            }`;
          } else if (action === "cancel") {
            message = `Approval flow "${flow.name}" has been cancelled`;
            subject = `Approval Flow Cancelled: ${flow.name}`;
            body = `The approval flow "${flow.name}" has been cancelled.${
              comment ? `\n\nReason: ${comment}` : ""
            }`;
          }

          // Create notification record
          await apiCall({
            method: "POST",
            url: "/api/Notification",
            data: {
              profileId: participant.profileId,
              generalId: flow.id,
              type: "approvalFlow",
              message: message,
              isViewed: false,
            },
          });

          // Send email
          await apiCall({
            method: "POST",
            url: "/api/Email/send",
            data: {
              to: participant.participantEmail,
              subject: subject,
              body: body,
            },
          });

          console.log(
            `✅ [MyProcess] Notification sent to participant ${participant.profileId}`
          );
        } catch (error) {
          console.error(
            `❌ [MyProcess] Error sending notification to participant ${participant.profileId}:`,
            error
          );
        }
      }

      // Send notification to submitter if different action
      if (submitterProfile && submitterProfile.id !== undefined) {
        try {
          let message, subject, body;

          if (action === "process") {
            message = `Your approval flow "${flow.name}" has been processed and completed`;
            subject = `Your Approval Flow Completed: ${flow.name}`;
            body = `Your approval flow "${
              flow.name
            }" has been processed and completed successfully.${
              comment ? `\n\nAdditional notes: ${comment}` : ""
            }`;
          } else if (action === "cancel") {
            message = `Your approval flow "${flow.name}" has been cancelled`;
            subject = `Your Approval Flow Cancelled: ${flow.name}`;
            body = `Your approval flow "${flow.name}" has been cancelled.${
              comment ? `\n\nReason: ${comment}` : ""
            }`;
          }

          // Create notification for submitter
          await apiCall({
            method: "POST",
            url: "/api/Notification",
            data: {
              profileId: submitterProfile.id,
              generalId: flow.id,
              type: "approvalFlow",
              message: message,
              isViewed: false,
            },
          });

          // Send email to submitter
          await apiCall({
            method: "POST",
            url: "/api/Email/send",
            data: {
              to: submitterProfile.email,
              subject: subject,
              body: body,
            },
          });

          console.log(
            `✅ [MyProcess] Notification sent to submitter ${submitterProfile.id}`
          );
        } catch (error) {
          console.error(
            `❌ [MyProcess] Error sending notification to submitter:`,
            error
          );
        }
      }
    } catch (error) {
      console.error(
        `❌ [MyProcess] Error in sendNotificationsToParticipants:`,
        error
      );
    }
  };

  // Function to fetch approval flows
  const fetchApprovalFlows = async () => {
    const userAccessLevel = sessionStorage.getItem("accessLevel");
    const profileId = getProfileIdFromSession();

    try {
      let response;
      if (userAccessLevel === "admin" || userAccessLevel === "root") {
        response = await apiCall({
          method: "GET",
          url: `/api/ApprovalFlow?createdById=${profileId}`,
        });
      } else {
        response = await apiCall({
          method: "GET",
          url: "/api/ApprovalFlow?status=Submitted",
        });
      }

      // Fetch participants and resources for each approval flow
      const flowsWithDetails = await Promise.all(
        response.map(async (flow) => {
          const participantsResponse = await apiCall({
            method: "GET",
            url: `/api/ApprovalFlowParticipant?approvalId=${flow.id}`,
          });
          const filteredParticipants = (participantsResponse || []).filter(
            (p) => p.approvalId === flow.id
          );

          const resourcesResponse = await apiCall({
            method: "GET",
            url: `/api/Resource/search?approvalId=${flow.id}`,
          });
          const filteredResources = (resourcesResponse || []).filter(
            (r) => r.approvalId === flow.id
          );

          return {
            ...flow,
            otherParticipants: filteredParticipants,
            resources: filteredResources,
          };
        })
      );

      setApprovalFlows(flowsWithDetails);
      setFilteredPolicies(flowsWithDetails);
    } catch (error) {
      console.error("❌ [MyProcess] Error fetching approval flows:", error);
      setApprovalFlows([]);
      setFilteredPolicies([]);
    }
  };

  useEffect(() => {
    fetchApprovalFlows();
  }, [apiCall]);

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

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowConfirmation(false);
    setFilteredPolicies([]);
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
  };

  // Handle the process flow for approvals
  const handleProcessFlow = async (flow) => {
    const loadingMessage = message.loading("Processing approval flow...", 0);
    try {
      console.log("🔍 [MyProcess] Starting process flow for:", flow);

      // Step 1: Update ApprovalFlow status to Complete
      try {
        console.log(
          "🔍 [MyProcess] Step 1: Updating ApprovalFlow status to Complete"
        );
        await apiCall({
          method: "put",
          url: `/api/ApprovalFlow/${flow.id}`,
          data: {
            ...flow,
            status: "Complete",
            completeDateTime: new Date().toISOString(),
          },
        });
        console.log("✅ [MyProcess] Successfully updated ApprovalFlow status");
      } catch (error) {
        console.error(
          "❌ [MyProcess] Error updating ApprovalFlow status:",
          error
        );
        throw error;
      }

      // Step 2: Handle policy type specific processing
      if (flow.type === "Add Tag") {
        await handleAddTagProcessing(flow);
      } else if (flow.type === "Delete Tag") {
        await handleDeleteTagProcessing(flow);
      }

      // Step 3: Update all ApprovalFlowLog records to Complete
      await updateApprovalFlowLogs(flow);

      // Step 4: Send notifications to all participants
      await sendNotificationsToParticipants(flow, "process");

      // Close loading message
      loadingMessage();

      // Show success message
      message.success("Approval flow processed successfully!");

      // Refresh the data
      await fetchApprovalFlows();
    } catch (error) {
      // Close loading message
      loadingMessage();
      console.error("❌ [MyProcess] Error in process flow:", error);

      // Show error message
      message.error(error.message || "Failed to process approval flow");
    }
  };

  // Handle Add Tag processing (existing logic)
  const handleAddTagProcessing = async (flow) => {
    console.log("🔍 [MyProcess] Step 2: Processing Add Tag type policy");

    try {
      // Get the policy record first to get correct customer and account context
      const policyResponse = await apiCall({
        method: "get",
        url: `/api/Policy/${flow.policyId}`,
      });

      if (!policyResponse) {
        throw new Error("Failed to fetch policy details");
      }

      console.log("🔍 [MyProcess] Policy details:", policyResponse);

      console.log("flow customer id", policyResponse.customerId);
      console.log("flow account id", policyResponse.accountId);
      console.log("flow generalId id", flow.id);

      // Get Key/Value pairs from LOVs using policy's customer and account context
      const lovsResponse = await apiCall({
        method: "get",
        url: `/api/LOV/search`,
        params: {
          description: "KEYVALUE",
          generalId: flow.id,
          customerId: policyResponse.customerId,
          accountId: policyResponse.accountId,
        },
      });

      console.log("🔍 [MyProcess] LOVs response:", lovsResponse);

      // Get resources from ApprovalFlowLogs
      const logsResponse = await apiCall({
        method: "get",
        url: `/api/ApprovalFlowLog/search?approvalId=${flow.id}`,
      });

      console.log("🔍 [MyProcess] ApprovalFlowLogs response:", logsResponse);

      // For each resource and key/value pair
      for (const log of logsResponse) {
        try {
          // Get the full resource details
          const resourceResponse = await apiCall({
            method: "get",
            url: `/api/Resource/${log.resourceId}`,
          });

          console.log("🔍 [MyProcess] Resource response:", resourceResponse);

          // For each key/value pair from LOVs
          for (const lov of lovsResponse) {
            try {
              // Create AWS Tag
              const tagPayload = {
                resourceId: resourceResponse.resourceId,
                resourceType:
                  resourceResponse.resourceType ||
                  resourceResponse.type ||
                  "EC2",
                region: resourceResponse.region || "us-east-2",
                tags: {
                  [lov.value1]: lov.value2,
                },
              };

              console.log(
                "🔍 [MyProcess] Attempting to create AWS tag with payload:",
                tagPayload
              );

              await apiCall({
                method: "post",
                url: "/api/AWS/tag",
                data: tagPayload,
              });

              console.log("✅ [MyProcess] AWS Tag created successfully");

              // Create ResourceTags record using policy's customer and account context
              const resourceTagData = {
                resourceId: log.resourceId,
                key: lov.value1,
                value: lov.value2,
                status: "Complete",
                approvalId: flow.id,
                customerId: policyResponse.customerId,
                accountId: policyResponse.accountId,
                isActive: true,
                createDateTime: new Date().toISOString(),
                updateDateTime: new Date().toISOString(),
                completeDateTime: new Date().toISOString(),
              };

              console.log(
                "🔍 [MyProcess] Creating ResourceTag with data:",
                resourceTagData
              );

              const resourceTagResponse = await apiCall({
                method: "post",
                url: "/api/ResourceTag",
                data: resourceTagData,
              });

              console.log(
                "✅ [MyProcess] ResourceTag record created:",
                resourceTagResponse
              );
            } catch (error) {
              console.error("❌ [MyProcess] Error processing tag:", error);
              throw error;
            }
          }
        } catch (error) {
          console.error("❌ [MyProcess] Error processing resource:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("❌ [MyProcess] Error in add tag processing:", error);
      throw error;
    }
  };

  // Handle Delete Tag processing (new functionality)
  const handleDeleteTagProcessing = async (flow) => {
    console.log("🔍 [MyProcess] Step 2: Processing Delete Tag type policy");

    try {
      // Get the policy record first to get correct customer and account context
      const policyResponse = await apiCall({
        method: "get",
        url: `/api/Policy/${flow.policyId}`,
      });

      if (!policyResponse) {
        throw new Error("Failed to fetch policy details");
      }

      console.log("🔍 [MyProcess] Policy details:", policyResponse);

      // Get Key/Value pairs for deletion from LOVs using KEYVALUEDELETE description
      console.log("🔍 [MyProcess] Searching for KEYVALUEDELETE LOV records...");

      const lovsResponse = await apiCall({
        method: "get",
        url: `/api/LOV/search`,
        params: {
          description: "KEYVALUEDELETE",
        },
      });

      console.log(
        "🔍 [MyProcess] All KEYVALUEDELETE LOVs found:",
        lovsResponse
      );

      // Filter the results locally to match the specific criteria
      const filteredLovs = lovsResponse
        ? lovsResponse.filter((lov) => {
            const matchesCustomer =
              !policyResponse.customerId ||
              lov.customerId === policyResponse.customerId;
            const matchesAccount =
              !policyResponse.accountId ||
              lov.accountId === policyResponse.accountId;
            const matchesOrg =
              !policyResponse.organizationId ||
              lov.orgId === policyResponse.organizationId ||
              lov.organizationId === policyResponse.organizationId;

            console.log(
              `🔍 [MyProcess] LOV ${lov.id} - Customer match: ${matchesCustomer}, Account match: ${matchesAccount}, Org match: ${matchesOrg}`
            );

            return matchesCustomer && matchesAccount && matchesOrg;
          })
        : [];

      console.log("🔍 [MyProcess] Filtered LOVs for deletion:", filteredLovs);

      if (!filteredLovs || filteredLovs.length === 0) {
        throw new Error("No tag key/value found for deletion");
      }

      // Get resources from ApprovalFlowLogs
      const logsResponse = await apiCall({
        method: "get",
        url: `/api/ApprovalFlowLog/search?approvalId=${flow.id}`,
      });

      console.log("🔍 [MyProcess] ApprovalFlowLogs response:", logsResponse);

      // For each key/value pair to delete
      for (const lov of filteredLovs) {
        try {
          // Prepare resources for the delete request
          const resources = [];

          for (const log of logsResponse) {
            // Get the full resource details
            const resourceResponse = await apiCall({
              method: "get",
              url: `/api/Resource/${log.resourceId}`,
            });

            resources.push({
              resourceId: resourceResponse.resourceId,
              resourceType:
                resourceResponse.resourceType || resourceResponse.type || "EC2",
              region: resourceResponse.region || "us-east-2",
            });
          }

          // Prepare the delete tag payload
          const deleteTagPayload = {
            key: lov.value1,
            value: lov.value2,
            resources: resources,
          };

          console.log(
            "🔍 [MyProcess] Attempting to delete AWS tags with payload:",
            deleteTagPayload
          );

          // Call the AWS tag delete endpoint
          await apiCall({
            method: "post",
            url: "/api/AwsTag/delete",
            data: deleteTagPayload,
          });

          console.log("✅ [MyProcess] AWS Tags deleted successfully");

          // Soft delete ResourceTags records (set isActive to false)
          console.log(
            "🔍 [MyProcess] Starting ResourceTags soft delete process..."
          );
          console.log("🔍 [MyProcess] Flow ID:", flow.id);
          console.log("🔍 [MyProcess] LOV Key:", lov.value1);
          console.log("🔍 [MyProcess] LOV Value:", lov.value2);
          console.log(
            "🔍 [MyProcess] Number of logs to process:",
            logsResponse.length
          );

          for (const log of logsResponse) {
            try {
              console.log(
                `🔍 [MyProcess] Processing log for resource ${log.resourceId}`
              );
              console.log(`🔍 [MyProcess] Log details:`, log);

              // Find existing ResourceTag records using the correct criteria:
              // - resourceId from ApprovalFlowLog
              // - customerId from ApprovalFlowLog
              // - accountId from ApprovalFlowLog
              // - key and value from LOV
              const searchParams = {
                resourceId: log.resourceId,
                customerId: log.customerId,
                accountId: log.accountId,
                key: lov.value1,
                value: lov.value2,
              };

              console.log(
                "🔍 [MyProcess] ResourceTag search parameters:",
                searchParams
              );

              let existingResourceTags = await apiCall({
                method: "get",
                url: `/api/ResourceTag/search`,
                params: searchParams,
              });

              console.log(
                "🔍 [MyProcess] ResourceTag search response:",
                existingResourceTags
              );
              console.log(
                "🔍 [MyProcess] Number of ResourceTags found:",
                existingResourceTags ? existingResourceTags.length : 0
              );

              // If no results found, try searching without approvalId (in case it was created by a different approval flow)
              if (!existingResourceTags || existingResourceTags.length === 0) {
                console.log(
                  "🔍 [MyProcess] No results with exact match, trying without approvalId..."
                );

                const broaderSearchParams = {
                  resourceId: log.resourceId,
                  customerId: log.customerId,
                  accountId: log.accountId,
                  key: lov.value1,
                  value: lov.value2,
                };

                console.log(
                  "🔍 [MyProcess] Broader search parameters:",
                  broaderSearchParams
                );

                existingResourceTags = await apiCall({
                  method: "get",
                  url: `/api/ResourceTag/search`,
                  params: broaderSearchParams,
                });

                console.log(
                  "🔍 [MyProcess] Broader search response:",
                  existingResourceTags
                );
              }

              if (!existingResourceTags || existingResourceTags.length === 0) {
                console.warn(
                  `⚠️ [MyProcess] No ResourceTag records found for resource ${log.resourceId} with key ${lov.value1} and value ${lov.value2}`
                );
                console.warn(
                  `⚠️ [MyProcess] Search criteria: resourceId=${log.resourceId}, customerId=${log.customerId}, accountId=${log.accountId}, key=${lov.value1}, value=${lov.value2}`
                );
                continue;
              }

              // Soft delete each matching ResourceTag
              for (const resourceTag of existingResourceTags) {
                console.log(
                  `🔍 [MyProcess] Updating ResourceTag ${resourceTag.id}:`,
                  resourceTag
                );

                const updateData = {
                  isActive: false,
                  status: "Complete",
                  updateDateTime: new Date().toISOString(),
                  completeDateTime: new Date().toISOString(),
                };

                console.log(
                  "🔍 [MyProcess] ResourceTag update data:",
                  updateData
                );

                const updateResponse = await apiCall({
                  method: "put",
                  url: `/api/ResourceTag/${resourceTag.id}`,
                  data: updateData,
                });

                console.log(
                  `✅ [MyProcess] ResourceTag ${resourceTag.id} update response:`,
                  updateResponse
                );
                console.log(
                  `✅ [MyProcess] ResourceTag ${resourceTag.id} soft deleted successfully`
                );
              }
            } catch (error) {
              console.error(
                `❌ [MyProcess] Error soft deleting ResourceTag for resource ${log.resourceId}:`,
                error
              );
              console.error(`❌ [MyProcess] Error details:`, {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                url: error.config?.url,
                method: error.config?.method,
              });
            }
          }

          console.log(
            "🔍 [MyProcess] ResourceTags soft delete process completed"
          );
        } catch (error) {
          console.error("❌ [MyProcess] Error processing delete tag:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("❌ [MyProcess] Error in delete tag processing:", error);
      throw error;
    }
  };

  // Update approval flow logs
  const updateApprovalFlowLogs = async (flow) => {
    console.log("🔍 [MyProcess] Step 3: Updating all ApprovalFlowLog records");
    console.log("%% step 3 - update all approvalflow log", flow.id);
    try {
      // Get all logs for this approval flow
      const logsResponse = await apiCall({
        method: "get",
        url: `/api/ApprovalFlowLog/search?approvalId=${flow.id}`,
      });

      if (!logsResponse || !logsResponse.length) {
        throw new Error("No ApprovalFlowLog records found to update");
      }

      console.log("🔍 [MyProcess] Found logs to update:", logsResponse);

      // Update each log individually
      const updatePromises = logsResponse.map(async (log) => {
        const updatePayload = {
          status: "Complete",
          completeDateTime: new Date().toISOString(),
        };

        console.log(
          `🔍 [MyProcess] Updating log ${log.id} with data:`,
          updatePayload
        );

        return apiCall({
          method: "put",
          url: `/api/ApprovalFlowLog/${log.id}`,
          data: updatePayload,
        });
      });

      await Promise.all(updatePromises);
      console.log(
        "✅ [MyProcess] Successfully updated all ApprovalFlowLog statuses"
      );

      // Verify the updates by fetching the logs again
      const verifyResponse = await apiCall({
        method: "get",
        url: `/api/ApprovalFlowLog/search?approvalId=${flow.id}`,
      });

      console.log(
        "🔍 [MyProcess] Verification - Updated logs:",
        verifyResponse
      );

      if (!verifyResponse || !verifyResponse.length) {
        throw new Error(
          "Failed to verify ApprovalFlowLog updates - no logs found"
        );
      }

      const incompleteLogs = verifyResponse.filter(
        (log) => log.status !== "Complete"
      );
      if (incompleteLogs.length > 0) {
        console.warn(
          "⚠️ [MyProcess] Some logs were not updated:",
          incompleteLogs
        );
        throw new Error(
          `${incompleteLogs.length} logs were not updated to Complete status`
        );
      }

      console.log(
        `✅ [MyProcess] Verified ${verifyResponse.length} logs updated to Complete status`
      );
    } catch (error) {
      console.error(
        "❌ [MyProcess] Error updating ApprovalFlowLog status:",
        error
      );
      throw error;
    }
  };

  const handleCancel = (flow) => {
    setSelectedPolicy(flow);
    setIsCancelModalVisible(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelComment.trim()) return;

    const loadingMessage = message.loading("Cancelling approval flow...", 0);

    try {
      console.log(
        "🔍 [MyProcess] Starting cancellation process for:",
        selectedPolicy
      );

      // Step 1: Update ApprovalFlow status to cancel with completeDateTime
      console.log(
        "🔍 [MyProcess] Step 1: Updating ApprovalFlow status to cancel"
      );
      await apiCall({
        method: "put",
        url: `/api/ApprovalFlow/${selectedPolicy.approvalId}`,
        data: {
          ...selectedPolicy,
          status: "cancel",
          comment: cancelComment,
          completeDateTime: new Date().toISOString(),
        },
      });
      console.log(
        "✅ [MyProcess] Successfully updated ApprovalFlow status to cancel"
      );

      // Step 2: Update ApprovalFlowLog records to cancel with completeDateTime
      console.log(
        "🔍 [MyProcess] Step 2: Updating ApprovalFlowLog records to cancel"
      );
      const logsResponse = await apiCall({
        method: "get",
        url: `/api/ApprovalFlowLog/search?approvalId=${selectedPolicy.approvalId}`,
      });

      if (logsResponse && logsResponse.length > 0) {
        console.log(
          "🔍 [MyProcess] Found logs to update:",
          logsResponse.length
        );

        const updatePromises = logsResponse.map(async (log) => {
          const updatePayload = {
            status: "cancel",
            completeDateTime: new Date().toISOString(),
          };

          console.log(
            `🔍 [MyProcess] Updating log ${log.id} with data:`,
            updatePayload
          );

          return apiCall({
            method: "put",
            url: `/api/ApprovalFlowLog/${log.id}`,
            data: updatePayload,
          });
        });

        await Promise.all(updatePromises);
        console.log(
          "✅ [MyProcess] Successfully updated all ApprovalFlowLog statuses to cancel"
        );
      } else {
        console.warn(
          "⚠️ [MyProcess] No ApprovalFlowLog records found to update"
        );
      }

      // Step 3: Update resources status (existing functionality)
      await apiCall({
        method: "put",
        url: `/api/ApprovalFlow/${selectedPolicy.approvalId}/resources/status`,
        data: { status: "cancel" },
      });
      console.log("✅ [MyProcess] Successfully updated resources status");

      // Step 4: Send notifications to all participants about cancellation
      await sendNotificationsToParticipants(
        selectedPolicy,
        "cancel",
        cancelComment
      );
      console.log(
        "✅ [MyProcess] Successfully sent cancellation notifications"
      );

      // Close loading message
      loadingMessage();

      // Show success message
      message.success("Approval flow cancelled successfully!");

      // Close modal and reset state
      setIsCancelModalVisible(false);
      setCancelComment("");
      setShowConfirmation(true);

      // Refresh the data
      const response = await apiCall({
        method: "get",
        url: "/api/ApprovalFlow?status=Submitted",
      });
      setApprovalFlows(response || []);
      setFilteredPolicies(response || []);
    } catch (error) {
      // Close loading message
      loadingMessage();
      console.error("❌ [MyProcess] Error in cancel flow:", error);
      message.error("Failed to cancel approval flow");
    }
  };

  const handleSearchButtonClick = () => {
    const lowerVal = searchTerm.toLowerCase();
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

  const allParticipantsComplete = (flow) => {
    return (
      flow.participants &&
      flow.participants.length > 0 &&
      flow.participants.every(
        (p) => p.status && ["Complete", "Reject"].includes(p.status)
      )
    );
  };

  // Handle showing the process confirmation modal
  const handleProcessClick = (flow) => {
    setSelectedFlow(flow);
    setIsProcessModalVisible(true);
  };

  // Handle process modal cancel
  const handleProcessModalCancel = () => {
    setIsProcessModalVisible(false);
    setSelectedFlow(null);
  };

  // Handle process modal confirmation
  const handleProcessModalConfirm = async () => {
    if (!selectedFlow) return;

    setIsProcessModalVisible(false);
    await handleProcessFlow(selectedFlow);
    setSelectedFlow(null);
  };

  const baseColumns = [
    {
      title: "Approval ID",
      dataIndex: "approvalId",
      key: "approvalId",
      width: "15%",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: "20%",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: "15%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "15%",
      render: (status) => {
        const statusValue = status || "Pending";

        if (statusValue === "Submitted") {
          return (
            <Tag
              color={darkMode ? undefined : "blue"}
              style={{
                minWidth: "90px",
                textAlign: "center",
                backgroundColor: darkMode ? "#1668dc22" : undefined,
                border: darkMode ? "1px solid #1668dc" : undefined,
                color: darkMode ? "#1668dc" : undefined,
              }}
            >
              Submitted
            </Tag>
          );
        } else if (statusValue === "Reject") {
          return (
            <Tag
              color={darkMode ? undefined : "red"}
              style={{
                minWidth: "90px",
                textAlign: "center",
                backgroundColor: darkMode ? "#dc444622" : undefined,
                border: darkMode ? "1px solid #dc4446" : undefined,
                color: darkMode ? "#dc4446" : undefined,
              }}
            >
              Rejected
            </Tag>
          );
        } else if (statusValue === "Complete") {
          return (
            <Tag
              color={darkMode ? undefined : "green"}
              style={{
                minWidth: "90px",
                textAlign: "center",
                backgroundColor: darkMode ? "#49aa1922" : undefined,
                border: darkMode ? "1px solid #49aa19" : undefined,
                color: darkMode ? "#49aa19" : undefined,
              }}
            >
              Completed
            </Tag>
          );
        } else if (statusValue === "Pending") {
          return (
            <Tag
              color={darkMode ? undefined : "orange"}
              style={{
                minWidth: "90px",
                textAlign: "center",
                backgroundColor: darkMode ? "#fa8c1622" : undefined,
                border: darkMode ? "1px solid #fa8c16" : undefined,
                color: darkMode ? "#fa8c16" : undefined,
              }}
            >
              Pending
            </Tag>
          );
        } else if (statusValue === "Ready") {
          return (
            <Tag
              icon={<ClockCircleOutlined />}
              color={darkMode ? undefined : "default"}
              style={{
                minWidth: "90px",
                textAlign: "center",
                backgroundColor: darkMode ? "#66666622" : undefined,
                border: darkMode ? "1px solid #666666" : undefined,
                color: darkMode ? "#666666" : undefined,
              }}
            >
              Ready
            </Tag>
          );
        } else {
          return (
            <Tag
              color={darkMode ? undefined : "orange"}
              style={{
                minWidth: "90px",
                textAlign: "center",
                backgroundColor: darkMode ? "#fa8c1622" : undefined,
                border: darkMode ? "1px solid #fa8c16" : undefined,
                color: darkMode ? "#fa8c16" : undefined,
              }}
            >
              Pending
            </Tag>
          );
        }
      },
    },
    {
      title: "Created Date",
      dataIndex: "createDateTime",
      key: "createDateTime",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.status === "Ready" ? (
          <>
            <Button type="link" onClick={() => handleProcessClick(record)}>
              Process
            </Button>
            <Button type="link" danger onClick={() => handleCancel(record)}>
              Cancel
            </Button>
          </>
        ) : (
          <span style={{ color: "#999" }}>No actions available</span>
        ),
    },
  ];

  const columns = baseColumns;

  const handleViewParticipants = async (approvalId) => {
    console.log("### approvalId===", approvalId);
    setParticipantsData((prev) => ({
      ...prev,
      [approvalId]: { loading: true, data: [] },
    }));
    try {
      const response = await apiCall({
        method: "get",
        url: `/api/ApprovalFlowParticipant?approvalId=${approvalId}`,
      });
      setParticipantsData((prev) => ({
        ...prev,
        [approvalId]: { loading: false, data: response || [] },
      }));
    } catch (error) {
      setParticipantsData((prev) => ({
        ...prev,
        [approvalId]: { loading: false, data: [] },
      }));
    }
  };

  const handleViewResources = async (approvalId) => {
    setResourcesData((prev) => ({
      ...prev,
      [approvalId]: { loading: true, data: [] },
    }));
    try {
      // Call ApprovalFlowLog search endpoint for a hard match on approvalId
      const response = await apiCall({
        method: "get",
        url: `/api/ApprovalFlowLog/search?approvalId=${approvalId}`,
      });
      // Extract resource info from the logs where approvalId matches
      const resources = (response || [])
        .filter((log) => log.approvalId === approvalId)
        .map((log) => ({
          resourceId: log.resourceId,
          resourceName: log.resourceName,
          resourceType: log.resourceType || log.type, // fallback if needed
          status: log.status,
        }));
      setResourcesData((prev) => ({
        ...prev,
        [approvalId]: { loading: false, data: resources },
      }));
    } catch (error) {
      setResourcesData((prev) => ({
        ...prev,
        [approvalId]: { loading: false, data: [] },
      }));
    }
  };

  const expandedRowRender = (record) => {
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
        render: (status) => {
          const statusValue = status || "Pending";

          if (statusValue === "Submitted") {
            return (
              <Tag
                color={darkMode ? undefined : "blue"}
                style={{
                  minWidth: "90px",
                  textAlign: "center",
                  backgroundColor: darkMode ? "#1668dc22" : undefined,
                  border: darkMode ? "1px solid #1668dc" : undefined,
                  color: darkMode ? "#1668dc" : undefined,
                }}
              >
                Submitted
              </Tag>
            );
          } else if (statusValue === "Reject") {
            return (
              <Tag
                color={darkMode ? undefined : "red"}
                style={{
                  minWidth: "90px",
                  textAlign: "center",
                  backgroundColor: darkMode ? "#dc444622" : undefined,
                  border: darkMode ? "1px solid #dc4446" : undefined,
                  color: darkMode ? "#dc4446" : undefined,
                }}
              >
                Rejected
              </Tag>
            );
          } else if (statusValue === "Complete") {
            return (
              <Tag
                color={darkMode ? undefined : "green"}
                style={{
                  minWidth: "90px",
                  textAlign: "center",
                  backgroundColor: darkMode ? "#49aa1922" : undefined,
                  border: darkMode ? "1px solid #49aa19" : undefined,
                  color: darkMode ? "#49aa19" : undefined,
                }}
              >
                Completed
              </Tag>
            );
          } else if (statusValue === "Pending") {
            return (
              <Tag
                color={darkMode ? undefined : "orange"}
                style={{
                  minWidth: "90px",
                  textAlign: "center",
                  backgroundColor: darkMode ? "#fa8c1622" : undefined,
                  border: darkMode ? "1px solid #fa8c16" : undefined,
                  color: darkMode ? "#fa8c16" : undefined,
                }}
              >
                Pending
              </Tag>
            );
          } else if (statusValue === "Ready") {
            return (
              <Tag
                icon={<ClockCircleOutlined />}
                color={darkMode ? undefined : "default"}
                style={{
                  minWidth: "90px",
                  textAlign: "center",
                  backgroundColor: darkMode ? "#66666622" : undefined,
                  border: darkMode ? "1px solid #666666" : undefined,
                  color: darkMode ? "#666666" : undefined,
                }}
              >
                Ready
              </Tag>
            );
          } else {
            return (
              <Tag
                color={darkMode ? undefined : "orange"}
                style={{
                  minWidth: "90px",
                  textAlign: "center",
                  backgroundColor: darkMode ? "#fa8c1622" : undefined,
                  border: darkMode ? "1px solid #fa8c16" : undefined,
                  color: darkMode ? "#fa8c16" : undefined,
                }}
              >
                Pending
              </Tag>
            );
          }
        },
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
        dataIndex: "updateDateTime",
        key: "updateDateTime",
        render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
      },
    ];

    const resourceColumns = [
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
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const statusValue = status || "pending";

          if (statusValue === "Submitted") {
            return (
              <Tag
                color={darkMode ? undefined : "blue"}
                style={{
                  minWidth: "90px",
                  textAlign: "center",
                  backgroundColor: darkMode ? "#1668dc22" : undefined,
                  border: darkMode ? "1px solid #1668dc" : undefined,
                  color: darkMode ? "#1668dc" : undefined,
                }}
              >
                Submitted
              </Tag>
            );
          } else if (statusValue === "Reject") {
            return (
              <Tag
                color={darkMode ? undefined : "red"}
                style={{
                  minWidth: "90px",
                  textAlign: "center",
                  backgroundColor: darkMode ? "#dc444622" : undefined,
                  border: darkMode ? "1px solid #dc4446" : undefined,
                  color: darkMode ? "#dc4446" : undefined,
                }}
              >
                Rejected
              </Tag>
            );
          } else if (statusValue === "Complete") {
            return (
              <Tag
                color={darkMode ? undefined : "green"}
                style={{
                  minWidth: "90px",
                  textAlign: "center",
                  backgroundColor: darkMode ? "#49aa1922" : undefined,
                  border: darkMode ? "1px solid #49aa19" : undefined,
                  color: darkMode ? "#49aa19" : undefined,
                }}
              >
                Completed
              </Tag>
            );
          } else if (statusValue === "Pending" || statusValue === "pending") {
            return (
              <Tag
                color={darkMode ? undefined : "orange"}
                style={{
                  minWidth: "90px",
                  textAlign: "center",
                  backgroundColor: darkMode ? "#fa8c1622" : undefined,
                  border: darkMode ? "1px solid #fa8c16" : undefined,
                  color: darkMode ? "#fa8c16" : undefined,
                }}
              >
                Pending
              </Tag>
            );
          } else if (statusValue === "Ready") {
            return (
              <Tag
                icon={<ClockCircleOutlined />}
                color={darkMode ? undefined : "default"}
                style={{
                  minWidth: "90px",
                  textAlign: "center",
                  backgroundColor: darkMode ? "#66666622" : undefined,
                  border: darkMode ? "1px solid #666666" : undefined,
                  color: darkMode ? "#666666" : undefined,
                }}
              >
                Ready
              </Tag>
            );
          } else {
            return (
              <Tag
                color={darkMode ? undefined : "orange"}
                style={{
                  minWidth: "90px",
                  textAlign: "center",
                  backgroundColor: darkMode ? "#fa8c1622" : undefined,
                  border: darkMode ? "1px solid #fa8c16" : undefined,
                  color: darkMode ? "#fa8c16" : undefined,
                }}
              >
                Pending
              </Tag>
            );
          }
        },
      },
    ];

    const participants = participantsData[record.id]?.data || [];
    const participantsLoading = participantsData[record.id]?.loading;
    const resources = resourcesData[record.id]?.data || [];
    const resourcesLoading = resourcesData[record.id]?.loading;

    return (
      <>
        <Button type="link" onClick={() => handleViewParticipants(record.id)}>
          View Participants (Approvers)
        </Button>
        {participantsLoading && <div>Loading participants...</div>}
        {participants.length > 0 && (
          <Table
            columns={participantColumns}
            dataSource={participants}
            rowKey={(participant) =>
              `${participant.profileId}-${participant.id}`
            }
            pagination={false}
            style={{ marginBottom: 24 }}
            size="small"
            locale={{ emptyText: "No participants assigned" }}
          />
        )}
        <Button type="link" onClick={() => handleViewResources(record.id)}>
          View Resources
        </Button>
        {resourcesLoading && <div>Loading resources...</div>}
        {resources.length > 0 && (
          <Table
            columns={resourceColumns}
            dataSource={resources}
            rowKey={(resource) => `${resource.resourceId}-${resource.id}`}
            pagination={false}
            size="small"
          />
        )}
      </>
    );
  };

  return (
    <div style={{ padding: "0px" }}>
      <h2 style={{ marginBottom: 16 }}>Search Approval Flows</h2>
      <div style={{ position: "relative", width: 400, marginBottom: 24 }}>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by Flow ID, Name, Type, or Status"
          />
          <Button icon={<SearchOutlined />} onClick={handleSearchButtonClick} />
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
            }}
          >
            {suggestions.map((s) => (
              <div
                key={s.approvalId}
                onClick={() => handleSuggestionClick(s)}
                style={{
                  padding: 8,
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
              >
                {s.approvalId} - {s.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfirmation && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ maxWidth: 400 }}>
            <Alert
              message="Action completed successfully!"
              type="success"
              showIcon
              closable
              onClose={() => setShowConfirmation(false)}
              style={{ marginBottom: "16px" }}
            />
          </div>
          {selectedPolicy && (
            <div style={{ marginTop: 12 }}>
              <div>
                <strong>Flow ID:</strong> {selectedPolicy.approvalId}
              </div>
              <div>
                <strong>Policy Name:</strong> {selectedPolicy.name}
              </div>
              <div>
                <strong>Status:</strong> Running
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        title="Process Approval Flow"
        visible={isProcessModalVisible}
        onOk={handleProcessModalConfirm}
        onCancel={handleProcessModalCancel}
        okText="Process"
        cancelText="Cancel"
        className={darkMode ? "dark-theme" : ""}
        okButtonProps={{
          style: {
            backgroundColor: "#06923E",
            borderColor: "#06923E",
            color: "white",
          },
        }}
        styles={{
          content: {
            background: darkMode ? "#141414" : "#fff",
          },
          header: {
            background: darkMode ? "#141414" : "#fff",
            color: darkMode ? "#fff" : "rgba(0, 0, 0, 0.88)",
          },
          body: {
            background: darkMode ? "#141414" : "#fff",
            color: darkMode ? "#fff" : "rgba(0, 0, 0, 0.88)",
          },
          footer: {
            background: darkMode ? "#141414" : "#fff",
          },
        }}
      >
        <p>Are you sure you want to execute these changes?</p>
        {selectedFlow && (
          <div
            style={{
              marginTop: 16,
              color: darkMode ? "#fff" : "rgba(0, 0, 0, 0.88)",
            }}
          >
            <div>
              <strong>Flow ID:</strong> {selectedFlow.id}
            </div>
            <div>
              <strong>Policy Name:</strong> {selectedFlow.name}
            </div>
            <div>
              <strong>Policy Type:</strong> {selectedFlow.type}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Cancel Approval Flow"
        visible={isCancelModalVisible}
        onOk={handleCancelConfirm}
        onCancel={() => setIsCancelModalVisible(false)}
        okButtonProps={{
          disabled: !cancelComment.trim(),
          style: {
            backgroundColor: "#06923E",
            borderColor: "#06923E",
            color: "white",
          },
        }}
        className={darkMode ? "dark-theme" : ""}
        styles={{
          content: {
            background: darkMode ? "#141414" : "#fff",
          },
          header: {
            background: darkMode ? "#141414" : "#fff",
            color: darkMode ? "#fff" : "rgba(0, 0, 0, 0.88)",
          },
          body: {
            background: darkMode ? "#141414" : "#fff",
            color: darkMode ? "#fff" : "rgba(0, 0, 0, 0.88)",
          },
          footer: {
            background: darkMode ? "#141414" : "#fff",
          },
        }}
      >
        <Input.TextArea
          value={cancelComment}
          onChange={(e) => setCancelComment(e.target.value)}
          placeholder="Please provide a reason for cancellation"
          rows={4}
        />
      </Modal>

      <h2 style={{ marginBottom: 16 }}>Approval Flows for Review</h2>
      <Table
        columns={columns}
        dataSource={filteredPolicies}
        rowKey="id"
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default MyProcess;
