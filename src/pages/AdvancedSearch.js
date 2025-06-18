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
const { Title } = Typography;

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

const AdvancedSearch = () => {
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("all"); // Default to "all"
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isNaturalLanguage, setIsNaturalLanguage] = useState(false);
  const [nlQuery, setNlQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { darkMode } = useDarkMode();
  const { apiCall } = useApi();

  // Options for the second dropdown based on category
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

  const fetchRecordDetails = async (recordId, type) => {
    try {
      let endpoint = "";
      const id = recordId.split("-")[1]; // Remove the prefix (e.g., "res-123" -> "123")

      switch (type) {
        case "res":
          endpoint = `/api/Resource/${id}`;
          break;
        case "tag":
          endpoint = `/api/ResourceTag/${id}`;
          break;
        case "flow":
          endpoint = `/api/ApprovalFlow/${id}`;
          break;
        case "pol":
          endpoint = `/api/Policy/${id}`;
          break;
        default:
          console.error("Unknown record type:", type);
          return;
      }

      const response = await apiCall({
        method: "GET",
        url: endpoint,
      });

      setDetailData({ type, data: response });
    } catch (error) {
      console.error("Error fetching record details:", error);
    }
  };

  const handleRowClick = (record) => {
    setSelectedRecord(record);
    const [type] = record.id.split("-");
    fetchRecordDetails(record.id, type);
  };

  const handleBackToResults = () => {
    setSelectedRecord(null);
    setDetailData(null);
  };

  const handleNaturalLanguageToggle = (checked) => {
    setIsNaturalLanguage(checked);
    setSearchResults([]);
    setSelectedRecord(null);
    setDetailData(null);
    setSearchText("");
    setNlQuery("");
    setSearchAttempted(false);
  };

  const handleSearch = async () => {
    setSearchAttempted(true);

    if (!searchText.trim() || !category) {
      return;
    }

    setIsSearching(true);
    try {
      let endpoint = "";
      let params = {};

      if (isNaturalLanguage) {
        // Natural language search is not implemented in backend yet
        console.log("Natural language search:", nlQuery);
        return;
      }

      // Set endpoint and params based on category
      switch (category) {
        case "resource":
          endpoint = "/api/Resource/search";
          params = { q: searchText.toLowerCase() };
          if (selectedOptions.length > 0) {
            params.type = selectedOptions.join(",").toLowerCase();
          }
          break;

        case "tags":
          endpoint = "/api/ResourceTag/search";
          params = {
            key:
              selectedOptions.length > 0
                ? selectedOptions.join(",").toLowerCase()
                : undefined,
            value: searchText.toLowerCase(),
          };
          break;

        case "approvalFlow":
          endpoint = "/api/ApprovalFlow/search";
          params = {
            name: searchText.toLowerCase(),
          };
          break;

        case "policy":
          endpoint = "/api/Policy/search";
          params = {
            name: searchText.toLowerCase(),
          };
          break;

        case "all":
          try {
            const [resourceRes, tagRes, approvalRes, policyRes] =
              await Promise.all([
                apiCall({
                  method: "GET",
                  url: "/api/Resource/search",
                  params: { q: searchText.toLowerCase() },
                }),
                apiCall({
                  method: "GET",
                  url: "/api/ResourceTag/search",
                  params: { value: searchText.toLowerCase() },
                }),
                apiCall({
                  method: "GET",
                  url: "/api/ApprovalFlow/search",
                  params: { name: searchText.toLowerCase() },
                }),
                apiCall({
                  method: "GET",
                  url: "/api/Policy/search",
                  params: { name: searchText.toLowerCase() },
                }),
              ]);

            const allResults = [
              ...(resourceRes || []).map((r) => ({
                id: `res-${r.id}`,
                text: `Resource: ${r.name} (${r.type}) - ${r.resourceId}`,
              })),
              ...(tagRes || []).map((t) => ({
                id: `tag-${t.id}`,
                text: `Tag: ${t.key}=${t.value} - ${
                  t.resourceName || "Unknown Resource"
                }`,
              })),
              ...(approvalRes || []).map((a) => ({
                id: `flow-${a.id}`,
                text: `Approval Flow: ${a.name} (${a.type}) - ${a.status}${
                  a.participants && a.participants.length > 0
                    ? ` | Approvers: ${a.participants
                        .map((p) => `${p.userName} (${p.status || "Pending"})`)
                        .join(", ")}`
                    : " | No approvers"
                }`,
              })),
              ...(policyRes || []).map((p) => ({
                id: `pol-${p.id}`,
                text: `Policy: ${p.name} (${p.type})`,
              })),
            ];

            setSearchResults(allResults);
            return;
          } catch (error) {
            console.error("Error in combined search:", error);
            return;
          }
          break;

        default:
          console.error("Invalid category selected");
          return;
      }

      const response = await apiCall({
        method: "GET",
        url: endpoint,
        params,
      });

      let formattedResults = [];
      if (response) {
        switch (category) {
          case "resource":
            formattedResults = response.map((r) => ({
              id: `res-${r.id}`,
              text: `${r.name} (${r.type}) - ${r.resourceId}`,
            }));
            break;

          case "tags":
            formattedResults = response.map((t) => ({
              id: `tag-${t.id}`,
              text: `${t.key}=${t.value} - ${
                t.resourceName || "Unknown Resource"
              }`,
            }));
            break;

          case "approvalFlow":
            formattedResults = response.map((a) => ({
              id: `flow-${a.id}`,
              text: `${a.name} (${a.type}) - ${a.status}`,
            }));
            break;

          case "policy":
            formattedResults = response.map((p) => ({
              id: `pol-${p.id}`,
              text: `${p.name} (${p.type})`,
            }));
            break;
        }
      }

      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const exportToJson = async () => {
    setIsExporting(true);
    try {
      const detailedResults = await Promise.all(
        searchResults.map(async (item) => {
          const [type, id] = item.id.split("-");
          let endpoint = "";

          switch (type) {
            case "res":
              endpoint = `/api/Resource/${id}`;
              break;
            case "tag":
              endpoint = `/api/ResourceTag/${id}`;
              break;
            case "flow":
              endpoint = `/api/ApprovalFlow/${id}`;
              break;
            case "pol":
              endpoint = `/api/Policy/${id}`;
              break;
          }

          try {
            const details = await apiCall({
              method: "GET",
              url: endpoint,
            });
            return {
              id: item.id,
              type,
              summary: item.text,
              details,
            };
          } catch (error) {
            console.error(`Error fetching details for ${item.id}:`, error);
            return {
              id: item.id,
              type,
              summary: item.text,
              details: null,
              error: "Failed to fetch details",
            };
          }
        })
      );

      const jsonString = JSON.stringify(detailedResults, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "search-results-detailed.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      const formatValue = (value) => {
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        return stringValue.includes(",") ||
          stringValue.includes("\n") ||
          stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      };

      const detailedResults = await Promise.all(
        searchResults.map(async (item) => {
          const [type, id] = item.id.split("-");
          let endpoint = "";

          switch (type) {
            case "res":
              endpoint = `/api/Resource/${id}`;
              break;
            case "tag":
              endpoint = `/api/ResourceTag/${id}`;
              break;
            case "flow":
              endpoint = `/api/ApprovalFlow/${id}`;
              break;
            case "pol":
              endpoint = `/api/Policy/${id}`;
              break;
          }

          try {
            return await apiCall({
              method: "GET",
              url: endpoint,
            });
          } catch (error) {
            console.error(`Error fetching details for ${item.id}:`, error);
            return null;
          }
        })
      );

      let rows = [];

      // Group results by type
      const groupedResults = detailedResults.reduce((acc, result, index) => {
        if (!result) return acc;
        const type = searchResults[index].id.split("-")[0];
        if (!acc[type]) acc[type] = [];
        acc[type].push(result);
        return acc;
      }, {});

      // Generate CSV sections for each type
      Object.entries(groupedResults).forEach(([type, items]) => {
        rows.push([`${type.toUpperCase()} Records`], []);

        switch (type) {
          case "res":
            rows.push([
              "ID",
              "Name",
              "Type",
              "Resource ID",
              "Status",
              "Region",
              "Category",
              "Created Date",
              "Last Modified",
              "Description",
              "Tags",
            ]);
            items.forEach((item) => {
              rows.push([
                formatValue(item.id),
                formatValue(item.name),
                formatValue(item.type),
                formatValue(item.resourceId),
                formatValue(item.status),
                formatValue(item.region),
                formatValue(item.category),
                formatValue(item.createdDate),
                formatValue(item.lastModifiedDate),
                formatValue(item.description),
                formatValue(
                  item.tags
                    ? item.tags.map((t) => `${t.key}=${t.value}`).join("; ")
                    : ""
                ),
              ]);
            });
            break;

          case "flow":
            rows.push([
              "ID",
              "Name",
              "Type",
              "Status",
              "Created By",
              "Policy",
              "Description",
              "Participants",
            ]);
            items.forEach((item) => {
              rows.push([
                formatValue(item.id),
                formatValue(item.name),
                formatValue(item.type),
                formatValue(item.status),
                formatValue(item.createdByName),
                formatValue(item.policyName),
                formatValue(item.description),
                formatValue(
                  item.participants
                    ? item.participants
                        .map(
                          (p) =>
                            `${p.userName} (${p.role}, ${p.status}, Order: ${p.order})`
                        )
                        .join("; ")
                    : ""
                ),
              ]);
            });
            break;

          case "tag":
            rows.push(["ID", "Key", "Value", "Resource Name", "Status"]);
            items.forEach((item) => {
              rows.push([
                formatValue(item.id),
                formatValue(item.key),
                formatValue(item.value),
                formatValue(item.resourceName),
                formatValue(item.status),
              ]);
            });
            break;

          case "pol":
            rows.push(["ID", "Name", "Type", "Value 1", "Value 2", "Status"]);
            items.forEach((item) => {
              rows.push([
                formatValue(item.id),
                formatValue(item.name),
                formatValue(item.type),
                formatValue(item.value1),
                formatValue(item.value2),
                formatValue(item.isActive ? "Active" : "Inactive"),
              ]);
            });
            break;
        }
        rows.push([], []); // Add spacing between sections
      });

      const csvContent = rows.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "search-results-detailed.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Render detail view based on record type
  const renderDetailView = () => {
    if (!detailData) return null;

    const { type, data } = detailData;

    return (
      <Card
        style={{
          background: darkMode ? "#1f1f1f" : "#fff",
          color: darkMode ? "#fff" : "#000",
          border: `1px solid ${darkMode ? "#434343" : "#d9d9d9"}`,
          boxShadow: `0 2px 8px ${
            darkMode ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.1)"
          }`,
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {type === "res" && (
            <>
              <Title level={4} style={{ color: darkMode ? "#fff" : "#000" }}>
                Resource Details
              </Title>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <strong>Name:</strong> {data.name || "N/A"}
                </Col>
                <Col span={12}>
                  <strong>Type:</strong> {data.type || "N/A"}
                </Col>
                <Col span={12}>
                  <strong>Resource ID:</strong> {data.resourceId || "N/A"}
                </Col>
                <Col span={12}>
                  <strong>Status:</strong> {data.status || "Unknown"}
                </Col>
                <Col span={12}>
                  <strong>Region:</strong> {data.region || "Not specified"}
                </Col>
                <Col span={12}>
                  <strong>Category:</strong> {data.category || "Uncategorized"}
                </Col>
                <Col span={12}>
                  <strong>Created Date:</strong>{" "}
                  {data.createdDate
                    ? new Date(data.createdDate).toLocaleDateString()
                    : "N/A"}
                </Col>
                <Col span={12}>
                  <strong>Last Modified:</strong>{" "}
                  {data.lastModifiedDate
                    ? new Date(data.lastModifiedDate).toLocaleDateString()
                    : "N/A"}
                </Col>
                <Col span={24}>
                  <strong>Description:</strong>{" "}
                  {data.description || "No description available"}
                </Col>
                {data.tags && data.tags.length > 0 && (
                  <Col span={24}>
                    <strong>Tags:</strong>{" "}
                    {data.tags
                      .map((tag) => `${tag.key}=${tag.value}`)
                      .join(", ")}
                  </Col>
                )}
              </Row>
            </>
          )}

          {type === "tag" && (
            <>
              <Title level={4} style={{ color: darkMode ? "#fff" : "#000" }}>
                Tag Details
              </Title>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <strong>Key:</strong> {data.key}
                </Col>
                <Col span={12}>
                  <strong>Value:</strong> {data.value}
                </Col>
                <Col span={12}>
                  <strong>Resource Name:</strong> {data.resourceName}
                </Col>
                <Col span={12}>
                  <strong>Status:</strong> {data.status}
                </Col>
              </Row>
            </>
          )}

          {type === "flow" && (
            <>
              <Title level={4} style={{ color: darkMode ? "#fff" : "#000" }}>
                Approval Flow Details
              </Title>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <strong>Name:</strong> {data.name || "N/A"}
                </Col>
                <Col span={12}>
                  <strong>Type:</strong> {data.type || "N/A"}
                </Col>
                <Col span={12}>
                  <strong>Status:</strong> {data.status || "Unknown"}
                </Col>
                <Col span={12}>
                  <strong>Created By:</strong> {data.createdByName || "N/A"}
                </Col>
                <Col span={24}>
                  <strong>Policy:</strong> {data.policyName || "N/A"}
                </Col>
                <Col span={24}>
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      backgroundColor: darkMode ? "#141414" : "#f5f5f5",
                      borderRadius: "8px",
                      border: `1px solid ${darkMode ? "#434343" : "#d9d9d9"}`,
                    }}
                  >
                    <Title
                      level={5}
                      style={{
                        color: darkMode ? "#fff" : "#000",
                        marginTop: 0,
                        marginBottom: "16px",
                      }}
                    >
                      Approval Participants
                    </Title>
                    {data.participants && data.participants.length > 0 ? (
                      <Row gutter={[16, 16]}>
                        {data.participants.map((participant, index) => (
                          <Col span={24} key={index}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px 16px",
                                backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                                borderRadius: "4px",
                                border: `1px solid ${
                                  darkMode ? "#434343" : "#d9d9d9"
                                }`,
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontWeight: "500",
                                    color: darkMode ? "#fff" : "#000",
                                  }}
                                >
                                  {participant.userName || "Unknown User"}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: darkMode ? "#999" : "#666",
                                    marginTop: "4px",
                                  }}
                                >
                                  {participant.role || "No role specified"}
                                  {participant.order &&
                                    ` • Order: ${participant.order}`}
                                </div>
                              </div>
                              <div
                                style={{
                                  padding: "4px 12px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  backgroundColor: getStatusColor(
                                    participant.status,
                                    darkMode
                                  ).bg,
                                  color: getStatusColor(
                                    participant.status,
                                    darkMode
                                  ).text,
                                  fontWeight: "500",
                                }}
                              >
                                {participant.status || "Pending"}
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <div
                        style={{
                          color: darkMode ? "#999" : "#666",
                          textAlign: "center",
                          padding: "16px",
                        }}
                      >
                        No participants assigned to this approval flow
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            </>
          )}

          {type === "pol" && (
            <>
              <Title level={4} style={{ color: darkMode ? "#fff" : "#000" }}>
                Policy Details
              </Title>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <strong>Name:</strong> {data.name}
                </Col>
                <Col span={12}>
                  <strong>Type:</strong> {data.type}
                </Col>
                <Col span={12}>
                  <strong>Value 1:</strong> {data.value1}
                </Col>
                <Col span={12}>
                  <strong>Value 2:</strong> {data.value2}
                </Col>
                <Col span={12}>
                  <strong>Status:</strong>{" "}
                  {data.isActive ? "Active" : "Inactive"}
                </Col>
              </Row>
            </>
          )}
        </Space>
      </Card>
    );
  };

  // Table columns with built-in filtering
  const columns = [
    {
      title: "Search Results",
      dataIndex: "text",
      key: "text",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filter results"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Filter
            </Button>
            <Button
              onClick={() => clearFilters()}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        record.text.toString().toLowerCase().includes(value.toLowerCase()),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      render: (text) => (
        <div style={{ color: darkMode ? "#fff" : "#000" }}>{text}</div>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
        background: darkMode ? "#141414" : "#f0f2f5",
        minHeight: "100vh",
      }}
    >
      <Row justify="center">
        <Col xs={24} sm={24} md={20} lg={16} xl={12}>
          <div style={{ marginTop: "60px" }}>
            {/* Search Controls */}
            <div style={{ marginBottom: "24px" }}>
              {isNaturalLanguage ? (
                <TextArea
                  placeholder="Enter your search query in natural language..."
                  value={nlQuery}
                  onChange={(e) => setNlQuery(e.target.value)}
                  style={{
                    backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                    borderColor: darkMode ? "#434343" : undefined,
                    color: darkMode ? "#fff" : undefined,
                    height: "100px",
                  }}
                />
              ) : (
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Search..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    status={
                      !searchText.trim() && searchAttempted ? "error" : ""
                    }
                    required
                    style={{
                      height: "40px",
                      backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                      borderColor: darkMode ? "#434343" : undefined,
                      color: darkMode ? "#fff" : undefined,
                      width: "60%",
                    }}
                  />
                  <Select
                    placeholder="Select Category *"
                    status={!category && searchAttempted ? "error" : ""}
                    required
                    style={{
                      width: "20%",
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
                      width: "40%",
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
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                    disabled={!searchText.trim() || !category}
                    title={
                      !searchText.trim()
                        ? "Please enter search text"
                        : !category
                        ? "Please select a category"
                        : ""
                    }
                    style={{
                      height: "40px",
                      marginLeft: "8px",
                      width: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                </Space.Compact>
              )}
            </div>

            {/* Natural Language Toggle */}
            <div
              style={{
                marginBottom: "24px",
                padding: "16px",
                background: darkMode ? "#1f1f1f" : "#fff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Space align="center" size="large">
                <span
                  style={{
                    color: darkMode ? "#fff" : "#000",
                    fontSize: "14px",
                  }}
                >
                  Search with natural language
                </span>
                <Switch
                  checked={isNaturalLanguage}
                  onChange={handleNaturalLanguageToggle}
                  style={{ marginLeft: "8px" }}
                />
              </Space>
            </div>

            {/* Results Section */}
            {(searchResults.length > 0 || isSearching) && (
              <div style={{ marginTop: "24px", position: "relative" }}>
                {isSearching && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 1000,
                      backgroundColor: darkMode
                        ? "rgba(0,0,0,0.65)"
                        : "rgba(255,255,255,0.65)",
                      padding: "20px",
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Spin
                      indicator={
                        <LoadingOutlined style={{ fontSize: 24 }} spin />
                      }
                    />
                    <span style={{ color: darkMode ? "#fff" : "#000" }}>
                      Searching...
                    </span>
                  </div>
                )}
                {selectedRecord ? (
                  <>
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={handleBackToResults}
                      style={{ marginBottom: "16px" }}
                    >
                      Back to Results
                    </Button>
                    {renderDetailView()}
                  </>
                ) : (
                  <>
                    {searchResults.length > 0 && (
                      <Space
                        style={{
                          marginBottom: "16px",
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <Tooltip title="Export as JSON">
                          <Button
                            icon={<FileTextOutlined />}
                            onClick={exportToJson}
                            loading={isExporting}
                            style={{
                              backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                              borderColor: darkMode ? "#434343" : undefined,
                              color: darkMode ? "#fff" : undefined,
                            }}
                          >
                            JSON
                          </Button>
                        </Tooltip>
                        <Tooltip title="Export as CSV">
                          <Button
                            icon={<FileExcelOutlined />}
                            onClick={exportToCsv}
                            loading={isExporting}
                            style={{
                              backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                              borderColor: darkMode ? "#434343" : undefined,
                              color: darkMode ? "#fff" : undefined,
                            }}
                          >
                            CSV
                          </Button>
                        </Tooltip>
                      </Space>
                    )}
                    <Table
                      columns={columns}
                      dataSource={searchResults}
                      rowKey="id"
                      onRow={(record) => ({
                        onClick: () => handleRowClick(record),
                        style: { cursor: "pointer" },
                      })}
                      style={{
                        backgroundColor: darkMode ? "#1f1f1f" : "#fff",
                        color: darkMode ? "#fff" : "#000",
                        opacity: isSearching ? 0.6 : 1,
                      }}
                      className={`search-results-table ${
                        darkMode ? "dark" : "light"
                      }`}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                      }}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AdvancedSearch;
