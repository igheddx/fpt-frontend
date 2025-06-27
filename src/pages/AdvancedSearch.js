import React, { useState } from "react";
import {
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Switch,
  Table,
  Card,
  Typography,
  Spin,
  Tooltip,
  Modal,
  Descriptions,
  Empty,
  Tag,
  List,
} from "antd";
import {
  SearchOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useDarkMode } from "../config/DarkModeContext";
import { useApi } from "../hooks/useApi";
import "../styles/AdvancedSearch.css";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const getStatusColor = (status, isDarkMode) => {
  const statusColors = {
    approved: {
      bg: isDarkMode ? "rgba(82, 196, 26, 0.2)" : "rgba(82, 196, 26, 0.1)",
      text: isDarkMode ? "#73d13d" : "#389e0d",
    },
    rejected: {
      bg: isDarkMode ? "rgba(255, 77, 79, 0.2)" : "rgba(255, 77, 79, 0.1)",
      text: isDarkMode ? "#ff7875" : "#cf1322",
    },
    pending: {
      bg: isDarkMode ? "rgba(250, 173, 20, 0.2)" : "rgba(250, 173, 20, 0.1)",
      text: isDarkMode ? "#ffc069" : "#d48806",
    },
  };

  const normalizedStatus = (status || "pending").toLowerCase();
  return statusColors[normalizedStatus] || statusColors.pending;
};

// Helper function to get status color and display text
const getStatusTag = (status, isDarkMode) => {
  // Convert incoming status to lowercase for comparison
  const normalizedStatus = status?.toLowerCase() || "";

  let color;
  let text;

  switch (normalizedStatus) {
    case "complete":
      color = isDarkMode ? "#49aa19" : "green";
      text = "Completed";
      break;
    case "reject":
      color = isDarkMode ? "#dc4446" : "red";
      text = "Rejected";
      break;
    case "submitted":
      color = isDarkMode ? "#1668dc" : "blue";
      text = "Submitted";
      break;
    case "pending":
      color = isDarkMode ? "#d89614" : "orange";
      text = "Pending";
      break;
    default:
      color = isDarkMode ? "#666666" : "default";
      text = status || "Unknown";
  }

  return { color, text };
};

const AdvancedSearch = () => {
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [associatedResources, setAssociatedResources] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const { darkMode } = useDarkMode();
  const { apiCall } = useApi();

  // Preserve natural language search state for future use
  const [isNaturalLanguage, setIsNaturalLanguage] = useState(false);
  const [nlQuery, setNlQuery] = useState("");

  const getCategoryOptions = () => {
    switch (category) {
      case "resource":
        return ["EC2", "Lambda", "S3 Bucket", "Volume"];
      case "tags":
        return ["CostCenter", "Environment", "Owner"];
      case "all":
        return [];
      default:
        return [];
    }
  };

  const handleSearch = async () => {
    setSearchAttempted(true);
    if (!category) return;

    setIsSearching(true);
    setSelectedRecord(null);
    setDetailData(null);
    setAssociatedResources(null);

    try {
      let endpoint = "";
      let params = {};

      switch (category) {
        case "resource":
          endpoint = "/api/Resource/search";
          params = {
            q: searchText.trim().toLowerCase(),
            type:
              selectedOptions.length > 0
                ? selectedOptions.join(",").toLowerCase()
                : undefined,
          };
          break;
        case "tags":
          endpoint = "/api/ResourceTag/search";
          const searchTerm = searchText.trim().toLowerCase();
          params = {
            key: searchTerm,
          };
          break;
        case "approvalFlow":
          endpoint = "/api/ApprovalFlow/search";
          params = {
            name: searchText.trim().toLowerCase(),
          };
          break;
        case "policy":
          endpoint = "/api/Policy/search";
          params = {
            name: searchText.trim().toLowerCase(),
          };
          break;
        case "all":
          try {
            const searchTerm = searchText.trim().toLowerCase();

            const [
              resourceRes,
              tagKeyRes,
              tagValueRes,
              approvalRes,
              policyRes,
            ] = await Promise.all([
              apiCall({
                method: "GET",
                url: "/api/Resource/search",
                params: { q: searchTerm },
              }).catch(() => []),

              apiCall({
                method: "GET",
                url: "/api/ResourceTag/search",
                params: { key: searchTerm },
              }).catch(() => []),

              apiCall({
                method: "GET",
                url: "/api/ResourceTag/search",
                params: { value: searchTerm },
              }).catch(() => []),

              apiCall({
                method: "GET",
                url: "/api/ApprovalFlow/search",
                params: { name: searchTerm },
              }).catch(() => []),

              apiCall({
                method: "GET",
                url: "/api/Policy/search",
                params: { name: searchTerm },
              }).catch(() => []),
            ]);

            const allTagResults = [
              ...(tagKeyRes || []),
              ...(tagValueRes || []),
            ];
            const uniqueTagResults = allTagResults.filter(
              (tag, index, self) =>
                index === self.findIndex((t) => t.id === tag.id)
            );

            const formattedResults = [
              ...(resourceRes || []).map((r) => ({
                id: `res-${r.id}`,
                text: `${r.name} (${r.type})`,
                category: "Resource",
              })),
              ...uniqueTagResults.map((t) => ({
                id: `tag-${t.id}`,
                text: `${t.key}: ${t.value}`,
                category: "Tag",
                description: t.resourceCount
                  ? `${t.resourceCount} associated resources`
                  : undefined,
              })),
              ...(approvalRes || []).map((f) => ({
                id: `flow-${f.id}`,
                text: `${f.name} (${f.type})`,
                category: "Approval Flow",
              })),
              ...(policyRes || []).map((p) => ({
                id: `pol-${p.id}`,
                text: `${p.name} (${p.type})`,
                category: "Policy",
              })),
            ];

            setSearchResults(formattedResults);
            return;
          } catch (error) {
            console.error("Error in combined search:", error);
            return;
          }
        default:
          console.error("Unknown category:", category);
          return;
      }

      if (searchText.trim()) {
        let response;

        if (category === "tags") {
          const searchTerm = searchText.trim().toLowerCase();
          const [keyResults, valueResults] = await Promise.all([
            apiCall({
              method: "GET",
              url: endpoint,
              params: { key: searchTerm },
            }).catch(() => []),
            apiCall({
              method: "GET",
              url: endpoint,
              params: { value: searchTerm },
            }).catch(() => []),
          ]);

          const allResults = [...(keyResults || []), ...(valueResults || [])];
          response = allResults.filter(
            (tag, index, self) =>
              index === self.findIndex((t) => t.id === tag.id)
          );
        } else {
          response = await apiCall({
            method: "GET",
            url: endpoint,
            params,
          });
        }

        if (response) {
          let formattedResults = [];
          switch (category) {
            case "resource":
              formattedResults = response.map((r) => ({
                id: `res-${r.id}`,
                text: `${r.name} (${r.type})`,
                category: "Resource",
              }));
              break;
            case "tags":
              formattedResults = response.map((t) => ({
                id: `tag-${t.id}`,
                text: `${t.key}: ${t.value}`,
                category: "Tag",
                description: t.resourceCount
                  ? `${t.resourceCount} associated resources`
                  : undefined,
              }));
              break;
            case "approvalFlow":
              formattedResults = response.map((f) => ({
                id: `flow-${f.id}`,
                text: `${f.name} (${f.type})`,
                category: "Approval Flow",
              }));
              break;
            case "policy":
              formattedResults = response.map((p) => ({
                id: `pol-${p.id}`,
                text: `${p.name} (${p.type})`,
                category: "Policy",
              }));
              break;
          }

          setSearchResults(formattedResults);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchRecordDetails = async (recordId, type) => {
    try {
      let endpoint = "";
      let additionalEndpoints = [];
      const id = recordId.split("-")[1];

      switch (type) {
        case "res":
          endpoint = `/api/Resource/${id}`;
          break;
        case "tag":
          endpoint = `/api/ResourceTag/${id}`;
          break;
        case "flow":
          endpoint = `/api/ApprovalFlow/${id}`;
          additionalEndpoints = [
            `/api/ApprovalFlowParticipant?approvalId=${id}`,
            `/api/ApprovalFlowLog/search?approvalId=${id}`,
          ];
          break;
        case "pol":
          endpoint = `/api/Policy/${id}`;
          break;
        default:
          console.error("Unknown record type:", type);
          return;
      }

      const mainResponse = await apiCall({
        method: "GET",
        url: endpoint,
      });

      let additionalData = {};
      if (additionalEndpoints.length > 0) {
        const additionalResponses = await Promise.all(
          additionalEndpoints.map((endpoint) =>
            apiCall({
              method: "GET",
              url: endpoint,
            })
          )
        );

        if (type === "flow") {
          additionalData = {
            participants: additionalResponses[0] || [],
            resources: additionalResponses[1] || [],
          };
        }
      }

      setDetailData({
        type,
        data: {
          ...mainResponse,
          ...additionalData,
        },
      });
    } catch (error) {
      console.error("Error fetching record details:", error);
    }
  };

  const loadAssociatedResources = async (tagId) => {
    setIsLoadingResources(true);
    try {
      // First get the tag details to get the resourceId
      const tagResponse = await apiCall({
        method: "GET",
        url: `/api/ResourceTag/${tagId}`,
      });

      if (!tagResponse.resourceId) {
        throw new Error("No resource ID found for this tag");
      }

      // Then get all resources with this resourceId
      const response = await apiCall({
        method: "GET",
        url: `/api/Resource/${tagResponse.resourceId}`,
      });

      setAssociatedResources([response]); // Wrap in array since we're showing in a table
    } catch (error) {
      console.error("Error loading associated resources:", error);
    } finally {
      setIsLoadingResources(false);
    }
  };

  const handleRowClick = (record) => {
    setSelectedRecord(record);
    if (record.details) {
      setDetailData(record.details);
    } else {
      const [type, id] = record.id.split("-");
      fetchRecordDetails(record.id, type);
    }
  };

  const handleBackToResults = () => {
    setSelectedRecord(null);
    setDetailData(null);
  };

  const renderDetailView = () => {
    if (!detailData) return <Spin />;

    const data = detailData.data || detailData;
    const [type] = selectedRecord.id.split("-");

    switch (type) {
      case "res":
        return (
          <Card
            title={`Resource Details: ${data.name}`}
            style={{ backgroundColor: darkMode ? "#1f1f1f" : "#fff" }}
          >
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Resource ID" span={2}>
                {data.resourceId}
              </Descriptions.Item>
              <Descriptions.Item label="Name" span={2}>
                {data.name}
              </Descriptions.Item>
              <Descriptions.Item label="Type">{data.type}</Descriptions.Item>
              <Descriptions.Item label="Category">
                {data.category}
              </Descriptions.Item>
              <Descriptions.Item label="Region">
                {data.region}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {data.status}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {data.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="Account">
                {data.accountName}
              </Descriptions.Item>
              <Descriptions.Item label="Active">
                {data.isActive ? "Yes" : "No"}
              </Descriptions.Item>
              {data.cost && (
                <Descriptions.Item label="Cost">${data.cost}</Descriptions.Item>
              )}
              <Descriptions.Item label="Created Date">
                {data.createDateTime &&
                  new Date(data.createDateTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {data.updateDateTime &&
                  new Date(data.updateDateTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Tags" span={2}>
                {data.tags && Object.keys(data.tags).length > 0 ? (
                  <Table
                    dataSource={Object.entries(data.tags).map(
                      ([key, value]) => ({
                        key,
                        value,
                      })
                    )}
                    columns={[
                      { title: "Key", dataIndex: "key" },
                      { title: "Value", dataIndex: "value" },
                    ]}
                    pagination={false}
                    size="small"
                    style={{
                      backgroundColor: darkMode ? "#141414" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                    }}
                  />
                ) : (
                  "No tags"
                )}
              </Descriptions.Item>
              {data.metadata && (
                <Descriptions.Item label="Metadata" span={2}>
                  <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(data.metadata, null, 2)}
                  </pre>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        );

      case "flow":
        return (
          <Card
            title={`Approval Flow Details: ${data.name}`}
            style={{ backgroundColor: darkMode ? "#1f1f1f" : "#fff" }}
          >
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Approval ID" span={2}>
                {data.approvalId}
              </Descriptions.Item>
              <Descriptions.Item label="Name" span={2}>
                {data.name}
              </Descriptions.Item>
              <Descriptions.Item label="Type">{data.type}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag
                  color={getStatusTag(data.status, darkMode).color}
                  style={{
                    padding: "4px 12px",
                    fontSize: "14px",
                    borderRadius: "4px",
                    margin: "0",
                    minWidth: "90px",
                    textAlign: "center",
                    backgroundColor: darkMode
                      ? `${getStatusTag(data.status, darkMode).color}22`
                      : undefined,
                    border: darkMode
                      ? `1px solid ${getStatusTag(data.status, darkMode).color}`
                      : undefined,
                    color: darkMode
                      ? getStatusTag(data.status, darkMode).color
                      : undefined,
                  }}
                >
                  {getStatusTag(data.status, darkMode).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created Date">
                {data.createDateTime &&
                  new Date(data.createDateTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {data.updateDateTime &&
                  new Date(data.updateDateTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {data.description || "No description provided"}
              </Descriptions.Item>

              {/* Participants Section */}
              <Descriptions.Item label="Participants" span={2}>
                {data.participants && (
                  <Table
                    dataSource={data.participants}
                    columns={[
                      { title: "Profile ID", dataIndex: "profileId" },
                      { title: "Name", dataIndex: "name" },
                      { title: "Email", dataIndex: "email" },
                      {
                        title: "Status",
                        dataIndex: "status",
                        render: (status) => {
                          const { color, text } = getStatusTag(
                            status,
                            darkMode
                          );
                          return (
                            <Tag
                              color={color}
                              style={{
                                padding: "4px 12px",
                                fontSize: "14px",
                                borderRadius: "4px",
                                margin: "0",
                                minWidth: "90px",
                                textAlign: "center",
                                backgroundColor: darkMode
                                  ? `${color}22`
                                  : undefined,
                                border: darkMode
                                  ? `1px solid ${color}`
                                  : undefined,
                                color: darkMode ? color : undefined,
                              }}
                            >
                              {text}
                            </Tag>
                          );
                        },
                      },
                      {
                        title: "Created Date",
                        dataIndex: "createDateTime",
                        render: (date) =>
                          date && new Date(date).toLocaleString(),
                      },
                    ]}
                    pagination={false}
                    size="small"
                    style={{
                      backgroundColor: darkMode ? "#141414" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                    }}
                  />
                )}
              </Descriptions.Item>

              {/* Resources Section */}
              <Descriptions.Item label="Resources" span={2}>
                {data.resources && (
                  <Table
                    dataSource={data.resources}
                    columns={[
                      { title: "Resource ID", dataIndex: "resourceId" },
                      { title: "Name", dataIndex: "name" },
                      { title: "Type", dataIndex: "type" },
                      {
                        title: "Status",
                        dataIndex: "status",
                        render: (status) => {
                          const { color, text } = getStatusTag(
                            status,
                            darkMode
                          );
                          return (
                            <Tag
                              color={color}
                              style={{
                                padding: "4px 12px",
                                fontSize: "14px",
                                borderRadius: "4px",
                                margin: "0",
                                minWidth: "90px",
                                textAlign: "center",
                                backgroundColor: darkMode
                                  ? `${color}22`
                                  : undefined,
                                border: darkMode
                                  ? `1px solid ${color}`
                                  : undefined,
                                color: darkMode ? color : undefined,
                              }}
                            >
                              {text}
                            </Tag>
                          );
                        },
                      },
                      {
                        title: "Created Date",
                        dataIndex: "createDateTime",
                        render: (date) =>
                          date && new Date(date).toLocaleString(),
                      },
                    ]}
                    pagination={false}
                    size="small"
                    style={{
                      backgroundColor: darkMode ? "#141414" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                    }}
                  />
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        );

      case "pol":
        return (
          <Card
            title={`Policy Details: ${data.name}`}
            style={{ backgroundColor: darkMode ? "#1f1f1f" : "#fff" }}
          >
            <Descriptions bordered column={2}>
              {/* Primary Information */}
              <Descriptions.Item label="Policy ID" span={2}>
                {data.policyId}
              </Descriptions.Item>
              <Descriptions.Item label="Name" span={2}>
                {data.name}
              </Descriptions.Item>
              <Descriptions.Item label="Type">{data.type}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(data.status, darkMode)}>
                  {data.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {data.description || "No description provided"}
              </Descriptions.Item>

              {/* Ownership Information */}
              <Descriptions.Item label="Created By">
                {data.createdBy}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {data.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="Account">
                {data.accountName}
              </Descriptions.Item>

              {/* Timestamps */}
              <Descriptions.Item label="Created Date">
                {data.createDateTime &&
                  new Date(data.createDateTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {data.updateDateTime &&
                  new Date(data.updateDateTime).toLocaleString()}
              </Descriptions.Item>

              {/* Associated Resources */}
              <Descriptions.Item label="Associated Resources" span={2}>
                {data.resources?.length > 0 ? (
                  <Table
                    dataSource={data.resources}
                    columns={[
                      { title: "Resource ID", dataIndex: "resourceId" },
                      { title: "Name", dataIndex: "resourceName" },
                      { title: "Type", dataIndex: "resourceType" },
                      { title: "Status", dataIndex: "status" },
                    ]}
                    pagination={false}
                    size="small"
                    style={{
                      backgroundColor: darkMode ? "#141414" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                    }}
                  />
                ) : (
                  "No resources associated with this policy"
                )}
              </Descriptions.Item>

              {/* Policy Rules */}
              {data.rules && (
                <Descriptions.Item label="Policy Rules" span={2}>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      backgroundColor: darkMode ? "#141414" : "#f5f5f5",
                      padding: "12px",
                      borderRadius: "4px",
                      color: darkMode ? "#fff" : "#000",
                    }}
                  >
                    {JSON.stringify(data.rules, null, 2)}
                  </pre>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        );

      case "tag":
        return (
          <Card
            title={`Tag Details: ${data.key}: ${data.value}`}
            style={{ backgroundColor: darkMode ? "#1f1f1f" : "#fff" }}
          >
            <Descriptions bordered column={2}>
              {/* Tag Information */}
              <Descriptions.Item label="Key" span={2}>
                {data.key}
              </Descriptions.Item>
              <Descriptions.Item label="Value" span={2}>
                {data.value}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag
                  color={getStatusTag(data.status, darkMode).color}
                  style={{
                    padding: "4px 12px",
                    fontSize: "14px",
                    borderRadius: "4px",
                    margin: "0",
                    minWidth: "90px",
                    textAlign: "center",
                    backgroundColor: darkMode
                      ? `${getStatusTag(data.status, darkMode).color}22`
                      : undefined,
                    border: darkMode
                      ? `1px solid ${getStatusTag(data.status, darkMode).color}`
                      : undefined,
                    color: darkMode
                      ? getStatusTag(data.status, darkMode).color
                      : undefined,
                  }}
                >
                  {getStatusTag(data.status, darkMode).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created Date">
                {data.createDateTime &&
                  new Date(data.createDateTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {data.updateDateTime &&
                  new Date(data.updateDateTime).toLocaleString()}
              </Descriptions.Item>

              {/* Associated Resources Section */}
              <Descriptions.Item label="Associated Resources" span={2}>
                <div style={{ marginBottom: "16px" }}>
                  <Button
                    type="primary"
                    onClick={() => loadAssociatedResources(data.id)}
                    loading={isLoadingResources}
                  >
                    View all associated resources
                  </Button>
                </div>

                {isLoadingResources && (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Spin />
                  </div>
                )}

                {associatedResources && (
                  <Table
                    dataSource={associatedResources}
                    columns={[
                      { title: "Resource ID", dataIndex: "resourceId" },
                      { title: "Name", dataIndex: "name" },
                      { title: "Type", dataIndex: "type" },
                      {
                        title: "Status",
                        dataIndex: "status",
                        render: (status) => {
                          const { color, text } = getStatusTag(
                            status,
                            darkMode
                          );
                          return (
                            <Tag
                              color={color}
                              style={{
                                padding: "4px 12px",
                                fontSize: "14px",
                                borderRadius: "4px",
                                margin: "0",
                                minWidth: "90px",
                                textAlign: "center",
                                backgroundColor: darkMode
                                  ? `${color}22`
                                  : undefined,
                                border: darkMode
                                  ? `1px solid ${color}`
                                  : undefined,
                                color: darkMode ? color : undefined,
                              }}
                            >
                              {text}
                            </Tag>
                          );
                        },
                      },
                      {
                        title: "Created Date",
                        dataIndex: "createDateTime",
                        render: (date) =>
                          date && new Date(date).toLocaleString(),
                      },
                    ]}
                    pagination={false}
                    size="small"
                    style={{
                      backgroundColor: darkMode ? "#141414" : "#fff",
                      color: darkMode ? "#fff" : "#000",
                    }}
                  />
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        );

      default:
        return <Empty description="No details available" />;
    }
  };

  const exportToJson = async () => {
    setIsExporting(true);
    try {
      const jsonStr = JSON.stringify(searchResults, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "search-results.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to JSON:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCsv = async () => {
    setIsExporting(true);
    try {
      const csvContent = searchResults
        .map((item) => {
          const [type, id] = item.id.split("-");
          const category = item.category || "Unknown";
          const description = item.description || "";
          // Escape quotes in text and description
          const escapedText = `"${item.text.replace(/"/g, '""')}"`;
          const escapedDescription = `"${description.replace(/"/g, '""')}"`;
          return `${type},${id},${escapedText},${category},${escapedDescription}`;
        })
        .join("\n");
      const blob = new Blob(
        [`Type,ID,Text,Category,Description\n${csvContent}`],
        {
          type: "text/csv",
        }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "search-results.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="advanced-search-container">
      <Row>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <div style={{ padding: "0 24px" }}>
            <Title
              level={2}
              style={{
                color: darkMode ? "#fff" : "#000",
                marginBottom: "110px",
                marginTop: "0",
              }}
            >
              Search
            </Title>

            <div className="search-section">
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  placeholder="Enter search term..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onPressEnter={handleSearch}
                  style={{
                    height: "40px",
                    backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                    color: darkMode ? "#fff" : undefined,
                    width: "45%",
                  }}
                />
                <Select
                  placeholder="Select Category *"
                  status={!category && searchAttempted ? "error" : ""}
                  required
                  style={{
                    width: "15%",
                    marginLeft: "8px",
                    height: "40px",
                    backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                    color: darkMode ? "#fff" : "#000",
                  }}
                  onChange={(value) => {
                    setCategory(value);
                    setSelectedOptions([]);
                  }}
                  value={category}
                  dropdownStyle={{
                    backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                  }}
                  popupClassName={darkMode ? "dark-select-dropdown" : ""}
                >
                  <Option value="all">All</Option>
                  <Option value="resource">Resources</Option>
                  <Option value="tags">Tags</Option>
                  <Option value="approvalFlow">Approval Flow</Option>
                  <Option value="policy">Policies</Option>
                </Select>
                <Select
                  mode="multiple"
                  placeholder="Select Options"
                  style={{
                    width: "30%",
                    marginLeft: "8px",
                    height: "40px",
                    backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                    color: darkMode ? "#fff" : "#000",
                  }}
                  maxTagCount={2}
                  maxTagTextLength={12}
                  maxTagPlaceholder={(omittedValues) =>
                    `+ ${omittedValues.length} more...`
                  }
                  onChange={setSelectedOptions}
                  value={selectedOptions}
                  disabled={!category || category === "all"}
                  dropdownStyle={{
                    backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                  }}
                  popupClassName={darkMode ? "dark-select-dropdown" : ""}
                >
                  {getCategoryOptions().map((option) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Select>
                <Button
                  icon={<SearchOutlined />}
                  iconPosition="end"
                  onClick={handleSearch}
                  loading={isSearching}
                  style={{
                    marginLeft: "8px",
                    height: "40px",
                  }}
                >
                  Search
                </Button>
              </Space.Compact>
            </div>

            {/* Results Section */}
            {searchResults.length > 0 && !selectedRecord && (
              <div style={{ marginTop: "24px" }}>
                <div
                  style={{
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: darkMode ? "#fff" : "#000" }}>
                    Found {searchResults.length} results
                  </Text>
                  <Space>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={exportToJson}
                      loading={isExporting}
                      style={{
                        backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                        borderColor: darkMode ? "#333" : "#d9d9d9",
                        color: darkMode ? "#fff" : "#000",
                      }}
                    >
                      Export JSON
                    </Button>
                    <Button
                      icon={<FileExcelOutlined />}
                      onClick={exportToCsv}
                      loading={isExporting}
                      style={{
                        backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                        borderColor: darkMode ? "#333" : "#d9d9d9",
                        color: darkMode ? "#fff" : "#000",
                      }}
                    >
                      Export CSV
                    </Button>
                  </Space>
                </div>
                <List
                  dataSource={searchResults}
                  renderItem={(item) => (
                    <List.Item
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      style={{
                        cursor: "pointer",
                        backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                        padding: "12px",
                        borderRadius: "4px",
                        marginBottom: "8px",
                        border: darkMode
                          ? "1px solid #333"
                          : "1px solid #e8e8e8",
                      }}
                      className="search-result-item"
                    >
                      <List.Item.Meta
                        title={
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span style={{ color: darkMode ? "#fff" : "#000" }}>
                              {item.text}
                            </span>
                            {item.category && (
                              <Tag
                                color={
                                  item.category === "Resource"
                                    ? "blue"
                                    : item.category === "Tag"
                                    ? "green"
                                    : item.category === "Approval Flow"
                                    ? "orange"
                                    : item.category === "Policy"
                                    ? "purple"
                                    : "default"
                                }
                                style={{ fontSize: "12px" }}
                              >
                                {item.category}
                              </Tag>
                            )}
                          </div>
                        }
                        description={
                          <div>
                            <span
                              style={{
                                color: darkMode
                                  ? "rgba(255, 255, 255, 0.45)"
                                  : "rgba(0, 0, 0, 0.45)",
                              }}
                            >
                              ID: {item.id}
                            </span>
                            {item.description && (
                              <div
                                style={{
                                  color: darkMode
                                    ? "rgba(255, 255, 255, 0.65)"
                                    : "rgba(0, 0, 0, 0.65)",
                                  fontSize: "12px",
                                  marginTop: "4px",
                                }}
                              >
                                {item.description}
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Detail View */}
            {selectedRecord && !isSearching && (
              <>
                <Button
                  onClick={handleBackToResults}
                  style={{ marginBottom: "16px", marginTop: "24px" }}
                >
                  Back to Results
                </Button>
                {renderDetailView()}
              </>
            )}

            {/* No Results Message */}
            {searchAttempted && !isSearching && searchResults.length === 0 && (
              <Empty
                description={
                  <span style={{ color: darkMode ? "#fff" : undefined }}>
                    No results found
                  </span>
                }
                style={{ marginTop: "24px" }}
              />
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AdvancedSearch;
