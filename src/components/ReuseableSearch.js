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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const { darkMode, toggleTheme } = useDarkMode(); // ✅ use global context instead of local state
  const [searchQuery, setSearchQuery] = useState("");

  console.log("displayKey=", displayKey);
  console.log("isShowSearchButton=", isShowSearchButton);
  const debouncedSearch = useRef(
    debounce(async (text) => {
      if (text.length >= 3) {
        console.log("text i called data ==", text);
        setIsLoading(true);
        setError(null);
        try {
          const data = await fetchData(text);
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
        } catch (error) {
          console.error("Error in debounced search:", error);
          setError(error.message || "An error occurred while searching");
          setResults([]);
          setShowDropdown(false);
        } finally {
          setIsLoading(false);
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
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchData(query);
        console.log("data ==", data);
        setShowDropdown(false);
        onSearch?.(data);
      } catch (error) {
        console.error("Error in handleSearchClick:", error);
        setError(error.message || "An error occurred while searching");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    console.log("HandleSuggestionClick was clicked");
    onSelect?.(suggestion);
    setShowDropdown(false);
    setQuery("");
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
            onSearch={handleSearchClick}
            loading={isLoading}
          />
        ) : (
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
          />
        )}
        {error && (
          <div style={{ color: "red", marginTop: 4, fontSize: 12 }}>
            {error}
          </div>
        )}
        {showDropdown && results.length > 0 && (
          <div
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
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: darkMode ? "1px solid #555" : "1px solid #ddd",
                }}
                onClick={() => handleSuggestionClick(item)}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    marginBottom: "4px",
                    lineHeight: "1.2",
                  }}
                >
                  {item.firstName} {item.lastName}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: darkMode ? "#999" : "#666",
                    whiteSpace: "nowrap",
                    lineHeight: "1.2",
                  }}
                >
                  Email: {item.email} • Access Level: {item.accessLevel}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReusableSearch;
