/**
 * Redirects authenticated user to their app home (Design → /design/dashboard, Food → /food/dashboard).
 * Use for protected index route.
 */
import React from "react";
import { Navigate } from "react-router-dom";
import { useDepartmentApp } from "@/hooks/useDepartmentApp";

const RedirectToAppHome = () => {
  const { loginRedirectPath } = useDepartmentApp();
  return <Navigate to={loginRedirectPath} replace />;
};

export default RedirectToAppHome;
