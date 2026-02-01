/**
 * Department guard – redirects to correct app when user hits the "other" app's routes.
 * Food user on /design/* → /food/dashboard; non-Food user on /food/* → /design/dashboard.
 */
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDepartmentApp } from "@/hooks/useDepartmentApp";

const DepartmentGuard = () => {
  const location = useLocation();
  const { isFoodApp, loginRedirectPath } = useDepartmentApp();
  const pathname = location.pathname;

  if (isFoodApp && pathname.startsWith("/design")) {
    return <Navigate to={loginRedirectPath} replace />;
  }
  if (!isFoodApp && pathname.startsWith("/food")) {
    return <Navigate to={loginRedirectPath} replace />;
  }

  return <Outlet />;
};

export default DepartmentGuard;
