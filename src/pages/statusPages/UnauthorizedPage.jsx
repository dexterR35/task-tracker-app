import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useDepartmentApp } from "@/hooks/useDepartmentApp";
import StatusPage from "@/components/ui/StatusPage";

/** Access denied: role (admin required) or department (wrong app). Uses shared StatusPage design. */
const UnauthorizedPage = () => {
  const { canAccess } = useAuth();
  const { loginRedirectPath } = useDepartmentApp();
  const location = useLocation();
  const state = location.state ?? {};
  const isDepartmentMismatch = state.reason === "department";
  const attemptedApp = state.attemptedApp;
  const userApp = state.userApp;
  const toDashboard = state.toDashboard ?? loginRedirectPath;
  const isAdmin = canAccess("admin");

  const title = "Access denied";
  const message = isDepartmentMismatch
    ? `This section is for the ${attemptedApp} department only. You're assigned to the ${userApp} department—use the button below to open your dashboard.`
    : isAdmin
      ? "You don't have permission to view this page. Contact your administrator if you think this is a mistake."
      : "You don't have permission to view this page. Check your role or go back to your dashboard.";
  const primaryLabel = isDepartmentMismatch ? "Go to my dashboard" : "Go to app home";

  return (
    <StatusPage
      variant="access-denied"
      title={title}
      message={message}
      primaryAction={{ to: toDashboard, label: primaryLabel, iconName: "home" }}
      secondaryAction={{ to: "/", label: "Go to Home", iconName: "back" }}
    >
      {!isDepartmentMismatch && (
        <p>If you believe this is an error, please contact your administrator.</p>
      )}
    </StatusPage>
  );
};

export default UnauthorizedPage;
