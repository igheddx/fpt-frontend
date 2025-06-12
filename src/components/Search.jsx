import React, { useEffect, useState, useRef } from "react";
import { Card, Table, Space, Input, Button, Skeleton, Spin } from "antd";
import { useLocation } from 'react-router-dom';
import useEncryptDecrypt from "../hooks/useEncryptDescrypt";
import axiosInstance from "../hooks/axiosInstance";
import FilterModal from './FilterModal';
import { SearchOutlined, LoadingOutlined } from "@ant-design/icons";
import ReusableSearch from "../components/ReuseableSearch";
const data = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 500 },
  { name: "Apr", value: 700 },
];

const students = [
    { id: 1, name: "John Doe", age: 20, grade: "A" },
    { id: 2, name: "Jane Smith", age: 22, grade: "B" },
    { id: 3, name: "Alice Johnson", age: 21, grade: "A" },
    { id: 4, name: "Bob Brown", age: 23, grade: "C" },
    { id: 5, name: "Charlie White", age: 19, grade: "B" },
  ];

const SearchComp = (props) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [results, setResults] = useState([]);

  const location = useLocation();
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState(location.state?.query || []);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({ resources: [], tags: [] });
  

  useEffect(() => {
    if (query != undefined) {
      setSearchResults([]);
   

      //setQuery(location.state?.query)
      console.log("MR RESULT data == ", location.state || [])
      let data = location.state || []

      //check if object has query property if query then it
      //  means search else display object from suggestion result
      if(Object.hasOwn(data, 'query')) {
        console.log("object has query")
        handleSearch(data.query);

        
      } else {
        console.log("data length == ", data.length)
        console.log("i need to call setSearchResult==", JSON.stringify(data))
        //setSearchResults(location.state || []);
        setLoading(false);
        setSearchResults(data);
        
      }
    }
      
      
 
    
  }, [location.state]); // Reacts to state changes


  const handleFiltersApplied = (newFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilteredInfo({});
  };
  const clearAll = () => {
    setFilteredInfo({});
    setSortedInfo({});
  };
  const setAgeSort = () => {
    setSortedInfo({
      order: 'descend',
      columnKey: 'age',
    });
  };

  const handleSortChange = (pagination, filters, sorter) => {
    console.log('Various parameters', pagination, filters, sorter);
    setFilteredInfo(filters);
    setSortedInfo(sorter);
  };

  const handleSearch = async (searchCriteria) => {

    setResults([]);
   
  
    if (searchCriteria) {
      setLoading(true);
       // Ensure searchCriteria is a string
      const searchTerm = typeof searchCriteria === 'string' ? searchCriteria : String(searchCriteria);

      console.log("my search term==", searchTerm)

      try {
        // Use AWS resource search endpoint with GET request
        const response = await axiosInstance.get("/api/aws/search", {
          params: {
            resourceName: searchTerm,
            // You can add resourceType parameter if needed
          }
        });

        console.log("Full AWS Response in Search:", response?.data);

        // The API returns {resources: [...], count: number, filters: {...}}
        const resources = response?.data?.resources || [];

        if (Array.isArray(resources)) {
    
          const exactMatchResults2 = resources.filter(
            (resource) =>
              resource.resourceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              resource.resourceId?.toLowerCase().includes(searchTerm.toLowerCase())
          );

          setSearchResults(exactMatchResults2);
    
        } else {
          setSearchResults([]);
          console.log(
            "Unexpected API response format:",
            response.data
          );
        }
      } catch (error) {
        console.log("Error fetching data:", error);
        setSearchResults([]);
      }
      setLoading(false);
    }
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
          onPressEnter={() => handleSearchColumn(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearchColumn(selectedKeys, confirm, dataIndex)}
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


  const columnsSearch = [
    { 
      title: "Resource ID", 
      dataIndex: "resourceId", 
      key: "resourceId", 
      sorter: (a, b) => a.resourceId?.length - b.resourceId?.length,
      sortOrder: sortedInfo.columnKey === 'resourceId' ? sortedInfo.order : null,
      ellipsis: true,
      ...getColumnSearchProps("resourceId"),
    },
    { 
      title: "Resource Name", 
      dataIndex: "name", 
      key: "name",
      sorter: (a, b) => a.name?.length - b.name?.length,
      sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
      ellipsis: true,
      ...getColumnSearchProps("name"),
    },
    { 
      title: "Resource Type", 
      dataIndex: "type", 
      key: "type",
      sorter: (a, b) => a.type?.length - b.type?.length,
      sortOrder: sortedInfo.columnKey === 'type' ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Region",
      dataIndex: "region",
      key: "region",
      sorter: (a, b) => a.region?.localeCompare(b.region),
      sortOrder: sortedInfo.columnKey === 'region' ? sortedInfo.order : null,
      ellipsis: true,
    },
    { 
      title: "Category", 
      dataIndex: "category", 
      key: "category",
      sorter: (a, b) => a.category?.localeCompare(b.category),
      sortOrder: sortedInfo.columnKey === 'category' ? sortedInfo.order : null,
      ellipsis: true,
    },
    { 
      title: "Status", 
      dataIndex: "status", 
      key: "status",
      sorter: (a, b) => a.status?.localeCompare(b.status),
      sortOrder: sortedInfo.columnKey === 'status' ? sortedInfo.order : null,
      ellipsis: true,
    },
  ];

  const handleSearchColumn = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
  //console.log("Data ==", searchData)
  return (
   
    <div>
       <div style={{ padding: 20, marginTop: "10px", }}>
       
    
      <FilterModal onApply={handleFiltersApplied} /> 

      <h3>Search Results</h3>
      {/* <p><strong>Resources:</strong> {filters.resources.join(', ') || 'All'}</p>
      <p><strong>Tags:</strong> {filters.tags.join(', ') || 'All'}</p> */}

      {/* You can now use `filters` to filter table data or API results */}
    </div>
      {loading && (
        <Space>
           <Spin indicator={antIcon} size="large"/>
           <span> ...processing</span>
        </Space>
      )}
      {searchResults.length > 0 && (
         <Table
            columns={columnsSearch}
            dataSource={searchResults}
            rowKey={(record) => `${record.resourceId}-${record.type}-${record.region || 'unknown'}`}
            onChange={handleSortChange}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} resources`,
            }}
          /> 

      ) }
       

    </div>
  );
};

export default SearchComp;
//title="Summary" style={{ marginBottom: 24, border: "none" }