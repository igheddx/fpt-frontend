import React from "react";
import { Tabs, Alert } from "antd";
import MyProfile from "./AdminTabs/MyProfile";
import MyOrg from "./AdminTabs/MyOrg";
import MyPolicy from "./AdminTabs/MyPolicy";
import MySubmissions from "./AdminTabs/MySubmissions";
import MyProcess from "./AdminTabs/MyProcess";
import { useDarkMode } from "../config/DarkModeContext";
import { useAccountContext } from "../contexts/AccountContext";
import RoleBasedContent from "../components/RoleBasedContent";

const { TabPane } = Tabs;

//no change bodyBg: darkMode ? "#121212" : "#f0f2f5", this the base bgcolore

const Admin = () => {
  //const { darkMode } = useDarkMode();
  const { darkMode } = useDarkMode();
  const { accountContext, hasPermission } = useAccountContext();

  // Debug logging
  console.log("Admin component - accountContext:", accountContext);
  console.log(
    "Admin component - hasPermission('admin'):",
    hasPermission("admin")
  );

  return (
    <div
      style={{
        marginTop: "10px",
        background: darkMode ? "#121212" : "#f0f2f5",
        color: darkMode ? "#fff" : "#000",
        padding: "20px",
      }}
    >
      <RoleBasedContent requiredPermission="admin">
        <h2>Admin Panel</h2>

        {/* Context Display */}
        {/* {accountContext && (
          <Alert
            message={`Admin Panel - ${
              accountContext.accountName
            } (${accountContext.currentRole?.toUpperCase()})`}
            type="info"
            style={{
              marginBottom: "20px",
              background: darkMode ? "#29303d" : undefined,
              color: darkMode ? "#fff" : undefined,
              border: darkMode ? "1px solid #434a56" : undefined,
            }}
          />
        )} */}

        <Tabs defaultActiveKey="1">
          <TabPane tab="Organization" key="1">
            <MyOrg />
          </TabPane>

          <TabPane tab="Profile" key="2">
            <MyProfile />
          </TabPane>
          <TabPane tab="Policy" key="3">
            <MyPolicy />
          </TabPane>
          <TabPane tab="Submission" key="4">
            <MySubmissions />
          </TabPane>
          <TabPane tab="Process" key="5">
            <MyProcess />
          </TabPane>
        </Tabs>
      </RoleBasedContent>
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
