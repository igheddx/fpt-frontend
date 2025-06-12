// FilterModal.js
import React, { useState } from "react";
import { Modal, Button, Select, Row, Col } from "antd";
import filterIcon from "../img/filter.png"; // adjust the path if needed
import { useDarkMode } from "../config/DarkModeContext";
import "../index.css";

const { Option } = Select;

const FilterModal = ({ onApply }) => {
  const { isDarkMode } = useDarkMode(); // 👈 Access dark mode
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedResources, setSelectedResources] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const showModal = () => setIsModalVisible(true);
  const handleDone = () => {
    onApply?.({
      resources: selectedResources,
      tags: selectedTags,
    });
    setIsModalVisible(false);
  };

  return (
    <div style={{ padding: 1, marginTop: "10px" }}>
      {/* <img
        src={filterIcon}
        alt="Filter"
        onClick={showModal}
        className="filter-icon"
      /> */}

      <div
        onClick={showModal}
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <img
          src={filterIcon}
          alt="Filter"
          className="filter-icon" // dark mode styles handled in CSS
        />
        <span style={{ fontSize: 16 }}>Filter</span>
      </div>

      <Modal
        title="Filter Options"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="done" type="primary" onClick={handleDone}>
            Done
          </Button>,
        ]}
        className={isDarkMode ? "dark-modal" : ""}
        bodyStyle={{
          backgroundColor: isDarkMode ? "#1f1f1f" : "#fff",
          color: isDarkMode ? "#fff" : "#000",
        }}
      >
        <Row gutter={[0, 16]}>
          <Col span={24}>
            <label style={{ color: isDarkMode ? "#ccc" : "#000" }}>
              Resource Type
            </label>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Select resource types"
              onChange={setSelectedResources}
              value={selectedResources}
              dropdownStyle={{
                backgroundColor: isDarkMode ? "#1f1f1f" : "#fff",
                color: isDarkMode ? "#fff" : "#000",
              }}
            >
              {["Lambda", "Gateway", "Database", "EC2"].map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={24}>
            <label style={{ color: isDarkMode ? "#ccc" : "#000" }}>Tag</label>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Select tags"
              onChange={setSelectedTags}
              value={selectedTags}
              dropdownStyle={{
                backgroundColor: isDarkMode ? "#1f1f1f" : "#fff",
                color: isDarkMode ? "#fff" : "#000",
              }}
            >
              {["Tag1", "Tag2", "Tag3"].map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default FilterModal;
