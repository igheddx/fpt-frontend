import React, { useState, useEffect, useRef } from "react";
import { Input, List } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import debounce from "lodash.debounce";
import { useDarkMode } from "../config/DarkModeContext"; // Import the provider
const { Search } = Input;

const ReusableSearch = ({
  fetchData,
  queryString,
  onSelect,
  onSearch,
  displayKey,
  isShowSearchButton,
  placeholder = "Search...",
  disableSearchTrigger,
  inputStyle = {}, // 👈 new prop
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);
  const { darkMode, toggleTheme } = useDarkMode(); // ✅ use global context instead of local state
  const [searchQuery, setSearchQuery] = useState("");

  console.log("displayKey=", displayKey);
  console.log("isShowSearchButton=", isShowSearchButton);
  const debouncedSearch = useRef(
    debounce(async (text) => {
      if (text.length >= 3) {
        console.log("text i called data ==", text);
        const data = await fetchData(text);
        //console.log("data ==", data);

        console.log("Data from resusabe search ==", data);
        // Full safety net
        if (Array.isArray(data)) {
          setResults(data.slice(0, 10));
          setShowDropdown(true);
        } else {
          console.warn("fetchData did not return an array:", data);
          setResults([]);
          setShowDropdown(false);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300)
  ).current;

  useEffect(() => {
    console.log("Query changed:", query);
    debouncedSearch(query);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const highlightText = (text) => {
    console.log("highlightText was called");
    if (!text) return "";
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, `<b>$1</b>`);
  };

  const handleSearchClick = async () => {
    console.log("handleSearchClick was called");
    if (disableSearchTrigger) {
      console.log("disableSearchTrigger was called");
      // Only run queryString
      queryString?.(query);
      return;
    }

    if (query.length >= 3) {
      console.log("query greater than 3 d");
      const data = await fetchData(query);
      console.log("data ==", data);
      setShowDropdown(false);
      onSearch?.(data);
      //queryString?.(query);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    console.log("HandleSuggestionClick was clicked");
    //setSearchQuery(suggestion.arn);
    //setHideSuggestionDiv(true);
    //setSuggestions([]);
    //console.log(" handleSuggestion Click before I get to search isSuggestionSelected ==",isSuggestionSelected);

    console.log("NOAH");
    //navigate("/search", { state: [suggestion], key: Date.now().toString() });

    // handleSearch(suggestion.arn);
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", marginRight: 64, ...inputStyle }}
    >
      <div style={{ position: "relative" }}>
        {isShowSearchButton ? (
          <Search
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
            onSearch={(value) => {
              handleSearchClick(value);
            }}
            //enterButton={<SearchOutlined />}
          />
        ) : (
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
          />
        )}
        {/* {suggestions.map((item) => item.arn)} */}
        {showDropdown && results.length > 0 && (
          <div
            //ref={suggestionsRef}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "900px",
              maxHeight: "300px",
              overflowY: "auto",
              background: darkMode ? "#333" : "#fff",
              color: darkMode ? "#fff" : "#000",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              zIndex: 1000,
              borderRadius: 4,
              border: darkMode ? "1px solid #555" : "1px solid #ccc",
            }}
          >
            {results.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: "2px 12px",
                  cursor: "pointer",
                  borderBottom: darkMode ? "1px solid #555" : "1px solid #ddd",
                }}
                onClick={() => {
                  onSelect?.(item);
                  setShowDropdown(false);
                  setQuery("");
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    marginBottom: "1px",
                    lineHeight: "1.2",
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: darkMode ? "#999" : "#666",
                    whiteSpace: "nowrap",
                    lineHeight: "1.2",
                  }}
                >
                  Type: {item.type || "N/A"} • Category:{" "}
                  {item.category || "N/A"} • Region: {item.region || "N/A"} •
                  Status: {item.status || "N/A"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* <Input.Search
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        enterButton={<SearchOutlined />}
        onSearch={handleSearchClick}
        style={inputStyle} // 👈 apply here
      /> */}

      {/* {showDropdown && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: inputStyle?.height ? parseInt(inputStyle.height) + 10 : 40,
            width: inputStyle?.width || "100%",
            background: darkMode ? "#333" : "#fff",
            color: darkMode ? "#fff" : "#000",
            border: "1px solid #ddd",
            zIndex: 1000,
            maxHeight: 300,
            overflowY: "auto",
            borderRadius: 4,
          }}
        >
          <List
            itemLayout="horizontal"
            dataSource={results}
            renderItem={(item) => (
              <List.Item
                onClick={() => {
                  onSelect?.(item);
                  setShowDropdown(false);
                  setQuery("");
                }}
                style={{ cursor: "pointer" }}
              >
                {item.name || item.label || item.title}
              </List.Item>
            )}
          />
        </div> */}
      {/* )} */}
    </div>
  );
};

export default ReusableSearch;
