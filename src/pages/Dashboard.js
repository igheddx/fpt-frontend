import React, { useRef, useState, useEffect } from "react";
import { Card, Row, Col, Table, theme, Alert, Badge, Tag, Space } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  CloudOutlined,
  DatabaseOutlined,
  TagOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useDarkMode } from "../config/DarkModeContext";
import { useAccountContext } from "../contexts/AccountContext";
import { RoleBasedContent } from "../components/RoleBasedContent";
import { useApi } from "../hooks/useApi";

const Dashboard = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [uniqueResources, setUniqueResources] = useState([]);
  const [topTagResources, setTopTagResources] = useState([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  const {
    token: { colorBgContainer, colorTextBase },
  } = theme.useToken();

  const { darkMode } = useDarkMode();
  const { accountContext, currentRole } = useAccountContext();
  const tableRef = useRef(null);
  const { apiCall } = useApi();

  const orgs = [
    { name: "Org A", cloudAccounts: ["AWS-001", "GCP-002"] },
    { name: "Org B", cloudAccounts: ["Azure-003"] },
    { name: "Org C", cloudAccounts: ["AWS-004", "AWS-005"] },
    { name: "Org D", cloudAccounts: ["GCP-006"] },
    { name: "Org E", cloudAccounts: ["Azure-007", "AWS-008"] },
  ];

  const users = [
    { name: "Alice", org: "Org A" },
    { name: "Bob", org: "Org B" },
    { name: "Charlie", org: "Org C" },
    { name: "David", org: "Org D" },
    { name: "Eve", org: "Org E" },
  ];

  const cloudAccounts = [
    { account: "AWS-001", org: "Org A" },
    { account: "GCP-002", org: "Org A" },
    { account: "Azure-003", org: "Org B" },
    { account: "AWS-004", org: "Org C" },
    { account: "AWS-005", org: "Org C" },
    { account: "GCP-006", org: "Org D" },
    { account: "Azure-007", org: "Org E" },
    { account: "AWS-008", org: "Org E" },
    { account: "AWS-009", org: "Org E" },
    { account: "Azure-010", org: "Org E" },
  ];

  const resourceData = Array.from({ length: 10 }, (_, i) => ({
    name: `Resource ${i + 1}`,
    type: "VM",
    region: "us-east-1",
    policy: i < 5 ? "Tag Required" : "N/A",
  }));

  const barChartData = [
    { month: "Nov", organizations: 3, users: 5, cloudAccounts: 5 },
    { month: "Dec", organizations: 4, users: 6, cloudAccounts: 6 },
    { month: "Jan", organizations: 5, users: 7, cloudAccounts: 7 },
    { month: "Feb", organizations: 5, users: 8, cloudAccounts: 8 },
    { month: "Mar", organizations: 5, users: 8, cloudAccounts: 9 },
    { month: "Apr", organizations: 5, users: 8, cloudAccounts: 10 },
  ];

  const resourceChart = [
    { month: "Nov", resources: 10 },
    { month: "Dec", resources: 20 },
    { month: "Jan", resources: 40 },
    { month: "Feb", resources: 50 },
    { month: "Mar", resources: 70 },
    { month: "Apr", resources: 120 },
  ];

  // Fetch metrics when dashboard loads or when account context changes
  useEffect(() => {
    const fetchMetrics = async () => {
      // Only fetch if we have a valid account context
      if (!accountContext?.customerId || !accountContext?.accountId) {
        console.log("No account context available");
        return;
      }

      try {
        const response = await apiCall({
          method: "get",
          url: `/api/Metrics?customerId=${accountContext.customerId}&accountId=${accountContext.accountId}`,
        });

        console.log("Dashboard - API Response:", response);
        // if (!response.ok) {
        //   throw new Error("Failed to fetch metrics");
        // }
        //const data = await response.json();
        setMetrics(response);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
    };

    fetchMetrics();
  }, [accountContext]); // Re-fetch when account context changes

  const fetchUniqueResources = async () => {
    if (!accountContext?.customerId || !accountContext?.accountId) {
      console.log("No account context available");
      return;
    }

    setIsLoadingResources(true);
    try {
      const response = await apiCall({
        method: "GET",
        url: `/api/Resource/search?customerId=${accountContext.customerId}&accountId=${accountContext.accountId}`,
      });

      console.log("Unique Resources Response:", response);
      setUniqueResources(response || []);
    } catch (error) {
      console.error("Error fetching unique resources:", error);
    } finally {
      setIsLoadingResources(false);
    }
  };

  const fetchTopTagResources = async () => {
    if (!accountContext?.customerId || !accountContext?.accountId) {
      console.log("No account context available");
      return;
    }

    setIsLoadingResources(true);
    try {
      // First get the top tag from metrics
      const topTag = metrics.find((m) => m.id === "tagUsed")?.value;
      if (!topTag) {
        console.log("No top tag found in metrics");
        return;
      }

      // Get just the key part (assuming format is "key" or "key:value")
      const key = topTag.split(":")[0];

      // Fetch resources with this tag key
      const response = await apiCall({
        method: "GET",
        url: `/api/ResourceTag/search?key=${encodeURIComponent(
          key
        )}&customerId=${accountContext.customerId}&accountId=${
          accountContext.accountId
        }`,
      });

      console.log("Top Tag Resources Response:", response);
      setTopTagResources(response || []);
    } catch (error) {
      console.error("Error fetching top tag resources:", error);
    } finally {
      setIsLoadingResources(false);
    }
  };

  const fetchComplianceResources = async () => {
    if (!accountContext?.customerId || !accountContext?.accountId) {
      console.log("No account context available");
      return;
    }

    setIsLoadingResources(true);
    try {
      const response = await apiCall({
        method: "GET",
        url: `/api/Resource/search?customerId=${accountContext.customerId}&accountId=${accountContext.accountId}&tagCompliant=false`,
      });

      console.log("Non-Compliant Resources Response:", response);
      setTopTagResources(response || []);
    } catch (error) {
      console.error("Error fetching non-compliant resources:", error);
    } finally {
      setIsLoadingResources(false);
    }
  };

  const handleCardClick = async (cardType) => {
    setSelectedCard(cardType);
    if (cardType === "uniqueResources") {
      await fetchUniqueResources();
    } else if (cardType === "topTag") {
      await fetchTopTagResources();
    } else if (cardType === "complianceScore") {
      await fetchComplianceResources();
    }
  };

  useEffect(() => {
    if (selectedCard && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedCard]);

  const renderTable = () => {
    switch (selectedCard) {
      case "organizations":
        return (
          <Table
            columns={[
              { title: "Organization", dataIndex: "name", key: "name" },
              {
                title: "Cloud Accounts",
                dataIndex: "cloudAccounts",
                key: "cloudAccounts",
                render: (accounts) => accounts.join(", "),
              },
            ]}
            dataSource={orgs}
            rowKey="name"
            pagination={false}
          />
        );
      case "users":
        return (
          <Table
            columns={[
              { title: "User", dataIndex: "name", key: "name" },
              { title: "Organization", dataIndex: "org", key: "org" },
            ]}
            dataSource={users}
            rowKey="name"
            pagination={false}
          />
        );
      case "cloudAccounts":
        return (
          <Table
            columns={[
              { title: "Cloud Account", dataIndex: "account", key: "account" },
              { title: "Organization", dataIndex: "org", key: "org" },
            ]}
            dataSource={cloudAccounts}
            rowKey="account"
            pagination={false}
          />
        );
      case "totalResources":
      case "pendingApproval":
        return (
          <Table
            columns={[
              { title: "Name", dataIndex: "name", key: "name" },
              { title: "Type", dataIndex: "type", key: "type" },
              { title: "Region", dataIndex: "region", key: "region" },
            ]}
            dataSource={resourceData}
            rowKey="name"
            pagination={false}
          />
        );
      case "uniqueResources":
        return (
          <Table
            loading={isLoadingResources}
            columns={[
              {
                title: "Resource ID",
                dataIndex: "resourceId",
                key: "resourceId",
                width: "20%",
              },
              {
                title: "Name",
                dataIndex: "name",
                key: "name",
                width: "25%",
              },
              {
                title: "Type",
                dataIndex: "type",
                key: "type",
                width: "15%",
              },
              {
                title: "Category",
                dataIndex: "category",
                key: "category",
                width: "20%",
              },
              {
                title: "Region",
                dataIndex: "region",
                key: "region",
                width: "20%",
              },
            ]}
            dataSource={uniqueResources}
            rowKey="resourceId"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            style={{
              backgroundColor: darkMode ? "#141414" : "#fff",
              color: darkMode ? "#fff" : "#000",
            }}
          />
        );
      case "topTag":
        return (
          <Table
            loading={isLoadingResources}
            columns={[
              {
                title: "Tag Key/Value",
                key: "tag",
                render: (_, record) => `${record.key}: ${record.value}`,
                width: "20%",
              },
              {
                title: "Resource ID",
                dataIndex: "resourceId",
                key: "resourceId",
                width: "15%",
              },
              {
                title: "Name",
                dataIndex: "resourceName",
                key: "name",
                width: "20%",
              },
              {
                title: "Type",
                dataIndex: "resourceType",
                key: "type",
                width: "15%",
              },
              {
                title: "Category",
                dataIndex: "category",
                key: "category",
                width: "15%",
              },
              {
                title: "Region",
                dataIndex: "region",
                key: "region",
                width: "15%",
              },
            ]}
            dataSource={topTagResources}
            rowKey={(record) =>
              `${record.resourceId}-${record.key}-${record.value}`
            }
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            style={{
              backgroundColor: darkMode ? "#141414" : "#fff",
              color: darkMode ? "#fff" : "#000",
            }}
          />
        );
      case "complianceScore":
        return (
          <Table
            loading={isLoadingResources}
            columns={[
              {
                title: "Resource ID",
                dataIndex: "resourceId",
                key: "resourceId",
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
                title: "Category",
                dataIndex: "category",
                key: "category",
                width: "15%",
              },
              {
                title: "Region",
                dataIndex: "region",
                key: "region",
                width: "15%",
              },
              {
                title: "Missing Tags",
                dataIndex: "missingTags",
                key: "missingTags",
                width: "20%",
                render: (tags) => (
                  <Space wrap>
                    {(tags || []).map((tag) => (
                      <Tag key={tag} color="red">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                ),
              },
            ]}
            dataSource={topTagResources}
            rowKey="resourceId"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            style={{
              backgroundColor: darkMode ? "#141414" : "#fff",
              color: darkMode ? "#fff" : "#000",
            }}
          />
        );
      default:
        return null;
    }
  };

  const cardStyle = {
    cursor: "pointer",
    minHeight: 140,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 16,
    backgroundColor: darkMode ? "#1f1f1f" : colorBgContainer,
    color: colorTextBase,
    transition: "all 0.3s",
    "&:hover": {
      transform: "translateY(-3px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
  };

  const renderCards = () => {
    // Show metrics cards first - these are visible to everyone
    const metricsCards = (
      <>
        <Col span={8}>
          <Card
            style={cardStyle}
            className={darkMode ? "dark-mode-card" : ""}
            headStyle={{
              borderBottom: darkMode ? "1px solid #2d2d2d" : undefined,
            }}
            onClick={() => handleCardClick("uniqueResources")}
            hoverable
            title={
              <DatabaseOutlined
                style={{
                  color: darkMode ? "#fff" : "#fff",
                  backgroundColor: "rgba(153, 105, 199, 1)",
                  borderRadius: 20,
                  fontSize: 24,
                  padding: 8,
                }}
              />
            }
          >
            <h3>
              {metrics.find((m) => m.id === "uniqueResource")?.name ||
                "Unique Resources"}
            </h3>
            <p style={{ fontSize: 28, fontWeight: 600 }}>
              {metrics.find((m) => m.id === "uniqueResource")?.value || 0}
            </p>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            style={cardStyle}
            className={darkMode ? "dark-mode-card" : ""}
            headStyle={{
              borderBottom: darkMode ? "1px solid #2d2d2d" : undefined,
            }}
            onClick={() => handleCardClick("topTag")}
            hoverable
            title={
              <TagOutlined
                style={{
                  color: darkMode ? "#fff" : "#fff",
                  backgroundColor: "rgba(153, 105, 199, 1)",
                  borderRadius: 20,
                  fontSize: 24,
                  padding: 8,
                }}
              />
            }
          >
            <h3>
              {metrics.find((m) => m.id === "tagUsed")?.name || "Top Tag Used"}
            </h3>
            <p style={{ fontSize: 28, fontWeight: 600 }}>
              {metrics.find((m) => m.id === "tagUsed")?.value || "None"}
            </p>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            style={cardStyle}
            className={darkMode ? "dark-mode-card" : ""}
            headStyle={{
              borderBottom: darkMode ? "1px solid #2d2d2d" : undefined,
            }}
            onClick={() => handleCardClick("complianceScore")}
            hoverable
            title={
              <AuditOutlined
                style={{
                  color: darkMode ? "#fff" : "#fff",
                  backgroundColor: "rgba(153, 105, 199, 1)",
                  borderRadius: 20,
                  fontSize: 24,
                  padding: 8,
                }}
              />
            }
          >
            <h3>
              {metrics.find((m) => m.id === "complianceScore")?.name ||
                "Tag Compliance Score"}
            </h3>
            <p style={{ fontSize: 28, fontWeight: 600 }}>
              {`${
                metrics.find((m) => m.id === "complianceScore")?.value || 0
              }%`}
            </p>
          </Card>
        </Col>
      </>
    );

    return metricsCards;
  };

  return (
    <div
      style={{
        marginTop: "200px",
        // background: darkMode ? "#1e1e1e" : "#fff",
        // color: darkMode ? "#fff" : "#000",
        // borderRadius: "8px",
        // padding: "24px",
        // boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        // marginBottom: "16px",
      }}
    >
      {/* Account Context Display
      {accountContext && (
        <Alert
          message={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span>
                <strong>Current Context:</strong> {accountContext.customerName}{" "}
                - {accountContext.accountName}
              </span>
              <Badge
                color={
                  currentRole === "Admin"
                    ? "red"
                    : currentRole === "Approver"
                    ? "orange"
                    : "blue"
                }
                text={currentRole?.toUpperCase()}
              />
              <span style={{ color: "#666" }}>
                ({accountContext.cloudType})
              </span>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: "24px" }}
        />
      )} */}
      <h2>Dashboard</h2>
      <div
        style={{
          padding: 24,
          background: colorBgContainer,
          color: colorTextBase,
        }}
      >
        <></>
        <Row gutter={24} style={{ marginBottom: 24 }}>
          {renderCards()}
        </Row>

        {selectedCard && (
          <div ref={tableRef}>
            <Card
              title={
                selectedCard === "uniqueResources"
                  ? "Unique Resources List"
                  : selectedCard === "topTag"
                  ? "Top Tag Resources"
                  : selectedCard === "complianceScore"
                  ? "Non-Compliant Resources"
                  : "Details"
              }
              style={{ marginBottom: 24 }}
            >
              {renderTable()}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
