import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Create the Account Context
const AccountContext = createContext();

// Custom hook to use the Account Context
export const useAccountContext = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error(
      "useAccountContext must be used within an AccountContextProvider"
    );
  }
  return context;
};

// Account Context Provider Component
export const AccountContextProvider = ({ children }) => {
  const [accountContext, setAccountContext] = useState(() => {
    // Initialize from sessionStorage on app load
    try {
      const saved = sessionStorage.getItem("accountContext");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error(
        "Error loading account context from session storage:",
        error
      );
      return null;
    }
  });

  // Function to switch account context
  const switchContext = (newContext) => {
    try {
      setAccountContext(newContext);
      // Save to sessionStorage for persistence across page refreshes
      if (newContext) {
        sessionStorage.setItem("accountContext", JSON.stringify(newContext));
      } else {
        sessionStorage.removeItem("accountContext");
      }
    } catch (error) {
      console.error("Error saving account context to session storage:", error);
    }
  };

  // Function to clear account context (logout)
  const clearContext = () => {
    setAccountContext(null);
    sessionStorage.removeItem("accountContext");
  };

  // Policy refresh event system
  const [policyRefreshListeners, setPolicyRefreshListeners] = useState([]);

  // Function to add a policy refresh listener
  const addPolicyRefreshListener = useCallback((listener) => {
    setPolicyRefreshListeners(prev => [...prev, listener]);
    
    // Return unsubscribe function
    return () => {
      setPolicyRefreshListeners(prev => prev.filter(l => l !== listener));
    };
  }, []);

  // Function to trigger policy refresh across all listening components
  const triggerPolicyRefresh = useCallback(() => {
    console.log("🔄 Triggering policy refresh for", policyRefreshListeners.length, "listeners");
    policyRefreshListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error("Error executing policy refresh listener:", error);
      }
    });
  }, [policyRefreshListeners]);

  // Helper function to check if user has specific permission
  const hasPermission = (permission) => {
    if (!permission) {
      return false;
    }

    // Special case: if no account context but user is authenticated as root or admin
    if (!accountContext) {
      // Check if user has root or admin access level from authentication
      const storedAccessLevel = sessionStorage.getItem("accessLevel");
      const accessLevelLower = storedAccessLevel?.toLowerCase();
      if (accessLevelLower === "root" || accessLevelLower === "admin") {
        // Root and admin users can access admin functionality even without account context
        const permissionLower = permission.toLowerCase();
        return ["dashboard", "admin", "settings"].includes(permissionLower);
      }
      return false;
    }

    const accessLevel = accountContext.accessLevel?.toLowerCase();
    const accountRole = accountContext.permissions?.toLowerCase(); // role from defaultAccount
    const permissionLower = permission.toLowerCase();

    // Check main navigation permissions based on accessLevel
    switch (accessLevel) {
      case "root":
        // Root has access to all main tabs
        if (["dashboard", "admin", "settings"].includes(permissionLower)) {
          return true;
        }
        // Review tab depends on account role
        if (permissionLower === "review") {
          return accountRole === "approver";
        }
        return false;

      case "admin":
        // Admin has access to dashboard, admin, settings
        if (["dashboard", "admin", "settings"].includes(permissionLower)) {
          return true;
        }
        // Review tab depends on account role
        if (permissionLower === "review") {
          return accountRole === "approver";
        }
        return false;

      default:
        // Other access levels - minimal permissions
        return ["dashboard"].includes(permissionLower);
    }
  };

  // Get available navigation items based on accessLevel and account role
  const getNavigationItems = () => {
    // Get user's role from multiple sources in order of priority:
    // 1. Current accountContext permissions (current account role)
    // 2. profileData.role (stored role from authentication)
    // 3. accountContext permissions from sessionStorage
    let userRole = null;

    const profileData = JSON.parse(
      sessionStorage.getItem("profileData") || "{}"
    );
    const storedAccountContext = JSON.parse(
      sessionStorage.getItem("accountContext") || "{}"
    );

    // Get role from different sources
    if (accountContext?.permissions) {
      userRole = accountContext.permissions.toLowerCase();
    } else if (profileData.role) {
      userRole = profileData.role.toLowerCase();
    } else if (storedAccountContext?.permissions) {
      userRole = storedAccountContext.permissions.toLowerCase();
    }

    // Debug logging
    console.log("Navigation Debug:", {
      userRole,
      profileData,
      accountContext,
      storedAccountContext,
      sessionAccessLevel: sessionStorage.getItem("accessLevel"),
    });

    // Special case: if no account context but user is authenticated as root or admin
    if (!accountContext) {
      // Check if user has root or admin access level from authentication
      const storedAccessLevel = sessionStorage.getItem("accessLevel");
      const accessLevelLower = storedAccessLevel?.toLowerCase();
      if (accessLevelLower === "root" || accessLevelLower === "admin") {
        const items = [
          { key: "dashboard", label: "Dashboard", path: "/dashboard" },
          { key: "admin", label: "Admin", path: "/admin" },
          { key: "settings", label: "Settings", path: "/settings" },
        ];

        // Add Review tab if user's role is approver
        if (userRole === "approver") {
          console.log(
            "Adding Review tab for no-context user with approver role"
          );
          items.push({ key: "review", label: "Review", path: "/review" });
        } else {
          console.log(
            "NOT adding Review tab for no-context user - userRole is:",
            userRole
          );
        }

        return items;
      }
      return [];
    }

    const accessLevel = accountContext.accessLevel?.toLowerCase();
    const accountRole = accountContext.permissions?.toLowerCase(); // role from defaultAccount
    const items = [];

    // Always include dashboard
    items.push({ key: "dashboard", label: "Dashboard", path: "/dashboard" });

    // Add Review tab if user's role is approver (regardless of access level)
    if (userRole === "approver") {
      console.log("Adding Review tab for user with approver role");
      items.push({ key: "review", label: "Review", path: "/review" });
    } else {
      console.log(
        "NOT adding Review tab - userRole is:",
        userRole,
        "Expected: approver"
      );
    }

    switch (accessLevel) {
      case "root":
        // Root gets all main tabs
        items.push({ key: "admin", label: "Admin", path: "/admin" });
        items.push({ key: "settings", label: "Settings", path: "/settings" });
        break;

      case "admin":
        // Admin gets dashboard, admin, settings
        items.push({ key: "admin", label: "Admin", path: "/admin" });
        items.push({ key: "settings", label: "Settings", path: "/settings" });
        break;

      default:
        // Other access levels get minimal permissions
        break;
    }

    console.log("Final navigation items:", items);
    return items;
  };

  // Debug effect to log context changes
  useEffect(() => {
    if (accountContext) {
      console.log("Account context updated:", {
        customer: accountContext.customerName,
        account: accountContext.accountName,
        accessLevel: accountContext.accessLevel,
        permissions: accountContext.permissions, // role from defaultAccount
        cloudType: accountContext.cloudType,
      });
    }
  }, [accountContext]);

  const contextValue = {
    // State
    accountContext,

    // Actions
    switchContext,
    clearContext,

    // Policy refresh system
    addPolicyRefreshListener,
    triggerPolicyRefresh,

    // Utilities
    hasPermission,
    getNavigationItems,

    // Computed properties
    isLoggedIn: !!accountContext,
    currentAccessLevel: accountContext?.accessLevel || null,
    currentPermissions: accountContext?.permissions || null, // role from defaultAccount
    currentCustomer: accountContext?.customerName || null,
    currentAccount: accountContext?.accountName || null,
    currentCloudType: accountContext?.cloudType || null,

    // Backwards compatibility
    currentRole: accountContext?.permissions || null, // Map to permissions for backwards compatibility
  };

  return (
    <AccountContext.Provider value={contextValue}>
      {children}
    </AccountContext.Provider>
  );
};

export default AccountContext;
