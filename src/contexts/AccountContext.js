import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

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
      const profileData = sessionStorage.getItem("profileData");

      if (saved && profileData) {
        const context = JSON.parse(saved);
        const profile = JSON.parse(profileData);

        // Merge profile data with account context
        return {
          ...context,
          profileId: profile.profileId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          accessLevel: sessionStorage.getItem("accessLevel"),
        };
      }
      return null;
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
      if (!newContext) {
        setAccountContext(null);
        sessionStorage.removeItem("accountContext");
        return;
      }

      // Validate required fields
      const requiredFields = [
        "organizationId",
        "customerId",
        "accountId",
        "profileId",
        "accessLevel",
      ];

      const missingFields = requiredFields.filter(
        (field) => !newContext[field]
      );
      if (missingFields.length > 0) {
        console.error("Missing required fields in context:", missingFields);
        return;
      }

      setAccountContext(newContext);

      // Save only account-specific data to sessionStorage
      const accountData = {
        organizationId: newContext.organizationId,
        organizationName: newContext.organizationName,
        customerId: newContext.customerId,
        customerName: newContext.customerName,
        accountId: newContext.accountId,
        accountName: newContext.accountName,
        cloudType: newContext.cloudType,
        permissions: newContext.permissions,
        defaultAccount: newContext.defaultAccount,
      };

      sessionStorage.setItem("accountContext", JSON.stringify(accountData));
    } catch (error) {
      console.error("Error saving account context:", error);
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
    setPolicyRefreshListeners((prev) => [...prev, listener]);

    // Return unsubscribe function
    return () => {
      setPolicyRefreshListeners((prev) => prev.filter((l) => l !== listener));
    };
  }, []);

  // Function to trigger policy refresh across all listening components
  const triggerPolicyRefresh = useCallback(() => {
    console.log(
      "🔄 Triggering policy refresh for",
      policyRefreshListeners.length,
      "listeners"
    );
    policyRefreshListeners.forEach((listener) => {
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

    // Check main navigation permissions based on accessLevel and role
    switch (permissionLower) {
      case "review":
        // Review permission is based on the approver role
        return accountRole === "approver";

      case "dashboard":
        // Everyone can access dashboard
        return true;

      case "admin":
      case "settings":
        // Admin and settings require root or admin access level
        return accessLevel === "root" || accessLevel === "admin";

      default:
        return false;
    }
  };

  // Get available navigation items based on accessLevel and account role
  const getNavigationItems = () => {
    const userRole = accountContext?.permissions?.toLowerCase();
    const items = [];

    // Always include dashboard
    items.push({ key: "dashboard", label: "Dashboard", path: "/dashboard" });

    // Add Review tab if user's role is approver
    if (userRole === "approver") {
      items.push({ key: "review", label: "Review", path: "/review" });
    }

    // Add admin and settings for root/admin users
    const accessLevel = accountContext?.accessLevel?.toLowerCase();
    if (accessLevel === "root" || accessLevel === "admin") {
      items.push({ key: "admin", label: "Admin", path: "/admin" });
      items.push({ key: "settings", label: "Settings", path: "/settings" });
    }

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
