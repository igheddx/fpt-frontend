import React, { useState, useRef, useEffect } from "react";
import { Form, Input, Button, message, Table, Alert } from "antd";

import { useDarkMode } from "../config/DarkModeContext";

const Profile2 = ({ selectedOrganization, selectedCloudAccounts }) => {
  const [form] = Form.useForm();
  const [submittedData, setSubmittedData] = useState([]);
  const [isUpdate, setIsUpdate] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const tableRef = useRef(null);
  const { darkMode } = useDarkMode();

  //test
  const userData = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      organizations: ["Org1"],
      cloudAccount: "AWS | Acme Corp | 123456",
      role: "Admin",
      active: true,
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      organizations: ["Org2"],
      cloudAccount: "Azure | Beta Inc | 987654",
      role: "User",
      active: false,
    },
    {
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice@example.com",
      organizations: ["Org1", "Org3"],
      cloudAccount: "GCP | Gamma Ltd | 456789",
      role: "Editor",
      active: true,
    },
    {
      firstName: "Bob",
      lastName: "Lee",
      email: "bob@example.com",
      organizations: ["Org3"],
      cloudAccount: "AWS | Acme Corp | 123456",
      role: "Admin",
      active: true,
    },
  ];

  // Preselect the organization and cloud accounts when the component mounts
  useEffect(() => {
    form.setFieldsValue({
      organizations: selectedOrganization ? [selectedOrganization] : [],
      cloudAccounts: selectedCloudAccounts || [],
    });
  }, [selectedOrganization, selectedCloudAccounts, form]);

  const onFinish = (values) => {
    if (values.newPassword && values.newPassword !== values.confirmPassword) {
      message.error("Passwords do not match.");
      return;
    }
    if (
      values.newPassword &&
      !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(values.newPassword)
    ) {
      message.error(
        "Password must be at least 8 characters long, contain at least one number, one lowercase letter, and one uppercase letter."
      );
      return;
    }

    const record = { ...values, active: isUpdate ? values.active : true };
    if (isUpdate && currentRecord) {
      setSubmittedData((prev) => [
        ...prev.filter((item) => item.email !== currentRecord.email),
        record,
      ]);
      setAlertMessage("Record updated successfully!");
      setShowAlert(true);
      message.success("Record updated successfully!");
    } else {
      setSubmittedData((prev) => [...prev, record]);
      setAlertMessage("Record saved successfully!");
      setShowAlert(true);
      message.success("Record saved successfully!");
    }
    form.resetFields();
    setIsUpdate(false);
    setCurrentRecord(null);
    tableRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const columns = [
    {
      title: "Organization Name",
      dataIndex: "organizations",
      key: "organizations",
    },
    { title: "Cloud Account", dataIndex: "cloudAccount", key: "cloudAccount" },
    { title: "Access/Role", dataIndex: "role", key: "role" },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (val) => (val ? "Active" : "Inactive"),
    },
  ];

  return (
    <div>
      {/* Profile Form Section */}
      <div
        style={{
          marginTop: "50px",
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "16px",
        }}
      >
        {showAlert && (
          <Alert
            message={alertMessage}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <h2>My Profile</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ width: 400 }}
        >
          <Form.Item name="firstName" label="First Name" initialValue="John">
            <Input size="large" />
          </Form.Item>

          <Form.Item name="lastName" label="Last Name" initialValue="Doe">
            <Input size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            initialValue="john@example.com"
            rules={[{ required: true, type: "email" }]}
          >
            <Input size="large" disabled />
          </Form.Item>

          <Form.Item name="newPassword" label="New Password">
            <Input.Password size="large" />
          </Form.Item>

          <Form.Item name="confirmPassword" label="Confirm Password">
            <Input.Password size="large" />
          </Form.Item>

          <Form.Item>
            <div style={{ textAlign: "right" }}>
              <Button type="primary" htmlType="submit" size="large">
                Update
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>

      {/* My Access/Role Section */}
      <div
        style={{
          marginTop: "50px",
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "16px",
        }}
      >
        <h2>My Access/Role</h2>

        <Table
          dataSource={userData}
          columns={columns}
          rowKey={(record) => record.email}
        />
      </div>
    </div>
  );
};

export default Profile2;
