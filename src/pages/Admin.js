import React, { useState, useEffect } from "react";
import { Tabs, Alert } from "antd";
import MyProfile from "./AdminTabs/MyProfile";
import MyOrg from "./AdminTabs/MyOrg";
import MyPolicy from "./AdminTabs/MyPolicy";
import MySubmissions from "./AdminTabs/MySubmissions";
import MyProcess from "./AdminTabs/MyProcess";
import { useDarkMode } from "../config/DarkModeContext";
import RoleBasedContent from "../components/RoleBasedContent";

const Admin = () => {
  const { darkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState("1");
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const accessLevel = sessionStorage.getItem("accessLevel")?.toLowerCase();
    setHasAccess(accessLevel === "root" || accessLevel === "admin");
    console.log("Access level:", accessLevel); // Debug log
  }, []);

  const onChange = (key) => {
    setActiveTab(key);
  };

  if (!hasAccess) {
    return (
      <div style={{ padding: "20px" }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to view this content. Required: admin access"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: "10px",
        background: darkMode ? "#121212" : "#f0f2f5",
        color: darkMode ? "#fff" : "#000",
        padding: "20px",
      }}
    >
      <h2>Admin Panel</h2>
      <Tabs activeKey={activeTab} onChange={onChange}>
        <Tabs.TabPane tab="Organization" key="1">
          <MyOrg />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Profile" key="2">
          <MyProfile />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Policy" key="3">
          <MyPolicy />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Submission" key="4">
          <MySubmissions />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Process" key="5">
          <MyProcess />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default Admin;

/*
import React, { useState, useRef } from "react";
import { Table, Input, Button, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const Admin = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : false,
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  });

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "aga",
    },
    // Add other columns here
  ];

  const data = [
    {
      key: "1",
      name: "John Brown",
      age: 15,
      // Add other data fields here
    },
    {
      key: "2",
      name: "David Brown",
      age: 15,
      // Add other data fields here
    },
    {
      key: "3",
      name: "Adam Brown",
      age: 15,
      // Add other data fields here
    },
    {
      key: "4",
      name: "Carry Jones",
      age: 15,
      // Add other data fields here
    },
    {
      key: "5",
      name: "Allison Brown",
      age: 15,
      // Add other data fields here
    },

    // Add other data entries here
  ];

  return <Table columns={columns} dataSource={data} />;
};

export default Admin; */
