import React from "react";
import { Alert, Result } from "antd";
import { useAccountContext } from "../contexts/AccountContext";

// Higher-order component for role-based access control
export const withRoleAccess = (WrappedComponent, requiredPermission) => {
  return function RoleProtectedComponent(props) {
    const { hasPermission, accountContext } = useAccountContext();

    if (!accountContext) {
      return (
        <Result
          status="403"
          title="Access Denied"
          subTitle="Please select an account context to continue."
        />
      );
    }

    if (!hasPermission(requiredPermission)) {
      return (
        <Result
          status="403"
          title="Access Denied"
          subTitle={`You don't have permission to access this section. Required permission: ${requiredPermission}`}
          extra={
            <Alert
              message={`Current Access Level: ${accountContext.accessLevel} | Account Role: ${accountContext.permissions}`}
              description="Contact your administrator to request additional permissions."
              type="info"
              showIcon
            />
          }
        />
      );
    }

    return <WrappedComponent {...props} />;
  };
};

// Component for conditionally rendering content based on role
export const RoleBasedContent = ({
  children,
  requiredPermission,
  allowedRoles = null,
  fallback = null,
  showAccessDenied = false,
}) => {
  const { hasPermission, accountContext } = useAccountContext();

  // For admin permission, check access level
  if (requiredPermission === "admin") {
    const accessLevel = sessionStorage.getItem("accessLevel")?.toLowerCase();
    const hasAccess = accessLevel === "root" || accessLevel === "admin";

    if (!hasAccess) {
      return (
        fallback ||
        (showAccessDenied ? (
          <Alert
            message="Access Denied"
            description="You don't have permission to view this content. Required: admin access"
            type="error"
            showIcon
          />
        ) : null)
      );
    }
  }

  // If no account context, show fallback or nothing
  if (!accountContext) {
    return (
      fallback ||
      (showAccessDenied ? (
        <Alert
          message="No Account Context"
          description="Please select an account context to view this content."
          type="warning"
          showIcon
        />
      ) : null)
    );
  }

  // Check access based on allowedRoles if provided
  if (allowedRoles && Array.isArray(allowedRoles)) {
    const userRole = accountContext.permissions?.toLowerCase();
    const userAccessLevel = accountContext.accessLevel?.toLowerCase();

    // Check if user's role or access level is in allowed roles (case-insensitive)
    const hasAllowedRole = allowedRoles.some(
      (role) =>
        role.toLowerCase() === userRole ||
        role.toLowerCase() === userAccessLevel
    );

    if (!hasAllowedRole) {
      return (
        fallback ||
        (showAccessDenied ? (
          <Alert
            message="Access Denied"
            description={`You don't have permission to view this content. Required roles: ${allowedRoles.join(
              ", "
            )}`}
            type="error"
            showIcon
          />
        ) : null)
      );
    }

    return children;
  }

  // Check access based on requiredPermission if provided
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      fallback ||
      (showAccessDenied ? (
        <Alert
          message="Access Denied"
          description={`You don't have permission to view this content. Required: ${requiredPermission}`}
          type="error"
          showIcon
        />
      ) : null)
    );
  }

  return children;
};

// Hook for conditional rendering based on multiple permissions
export const useRolePermissions = () => {
  const { hasPermission, accountContext } = useAccountContext();

  const checkPermissions = {
    canViewDashboard: () => hasPermission("dashboard"),
    canViewAdmin: () => hasPermission("admin"),
    canViewReview: () => hasPermission("review"),
    canViewSettings: () => hasPermission("settings"),

    // Combined permission checks
    isAdmin: () => accountContext?.accessLevel?.toLowerCase() === "admin",
    isApprover: () => accountContext?.permissions?.toLowerCase() === "approver",
    isViewer: () => accountContext?.permissions?.toLowerCase() === "viewer",

    // Permission level checks
    hasAdminAccess: () => hasPermission("admin"),
    hasApprovalAccess: () => hasPermission("review") || hasPermission("admin"),
    hasViewAccess: () => hasPermission("dashboard"),
  };

  return {
    ...checkPermissions,
    accountContext,
    currentRole: accountContext?.permissions || null, // Account role from permissions
    currentAccessLevel: accountContext?.accessLevel || null, // Profile access level
  };
};

export default RoleBasedContent;
