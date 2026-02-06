/**
 * Department layout + guard (component only). Wrong department → /unauthorized.
 * Otherwise: sidebar + TopNavbar + main content. Nav from config/navConfig.
 */
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AppSidebar from "@/components/layout/navigation/AppSidebar";
import TopNavbar from "@/components/layout/navigation/TopNavbar";
import { useDepartmentApp } from "@/hooks/useDepartmentApp";
import { useAuth } from "@/context/AuthContext";
import { designNavConfig, NAV_CONFIG_BY_PATH } from "@/config/navConfig";

const DepartmentLayout = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuth();
  const { departmentSlug, loginRedirectPath } = useDepartmentApp();

  // Extract department slug from pathname (e.g., "/design/profile" → "design", "/food/dashboard" → "food")
  const pathParts = pathname.split("/").filter(Boolean);
  const pathDepartmentSlug = pathParts[0] || null;

  // Check if user is trying to access a different department's routes
  // Only check if both user has a department and path has a department prefix
  if (user && departmentSlug && pathDepartmentSlug && pathDepartmentSlug !== "settings") {
    // Map department slugs to display names
    const departmentDisplayNames = {
      design: "Design",
      food: "Food",
    };

    const userDepartmentDisplayName = departmentDisplayNames[departmentSlug] || departmentSlug;
    const attemptedDepartmentDisplayName = departmentDisplayNames[pathDepartmentSlug] || pathDepartmentSlug;

    // If the path department doesn't match user's department, deny access
    if (pathDepartmentSlug !== departmentSlug) {
      return (
        <Navigate
          to="/unauthorized"
          replace
          state={{
            reason: "department",
            attemptedApp: attemptedDepartmentDisplayName,
            userApp: userDepartmentDisplayName,
            toDashboard: loginRedirectPath,
          }}
        />
      );
    }
  }

  // If user doesn't have a department but is trying to access department routes, deny access
  if (user && !departmentSlug && pathDepartmentSlug && pathDepartmentSlug !== "settings") {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{
          reason: "department",
          attemptedApp: pathDepartmentSlug,
          userApp: "No department assigned",
          toDashboard: "/",
        }}
      />
    );
  }

  const base = pathname.split("/")[1];
  const navConfig = NAV_CONFIG_BY_PATH[base] ?? designNavConfig;

  return (
    <div className="flex h-screen overflow-hidden bg-primary">
      <aside className="z-40 flex h-full w-52 shrink-0 flex-col overflow-hidden bg-white dark:bg-smallCard">
        <AppSidebar navConfig={navConfig} />
      </aside>
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto bg-primary">
          <div className="px-4 py-6 md:px-6 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DepartmentLayout;
