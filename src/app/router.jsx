
import React from "react";
import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useDepartmentApp } from "@/hooks/useDepartmentApp";
import DepartmentLayout from "@/components/layout/DepartmentLayout";
import { designRoutes } from "@/app/routes/designRoutes";
import { foodRoutes } from "@/app/routes/foodRoutes";
import Loader from "@/components/ui/Loader/Loader";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import HomePage from "@/pages/user/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import UsersPage from "@/pages/admin/UsersPage";
import UIShowcasePage from "@/pages/admin/UIShowcasePage";
import DepartmentsPage from "@/pages/department/DepartmentsPage";
import NotFoundPage from "@/pages/statusPages/NotFoundPage";
import UnauthorizedPage from "@/pages/statusPages/UnauthorizedPage";


const SimpleLoader = () => (
  <div className="min-h-screen flex-center bg-primary">
    <Loader size="lg" text="Initializing application..." variant="spinner" />
  </div>
);


const PublicRoute = ({ children }) => {
  const authState = useAuth();
  const { loginRedirectPath } = useDepartmentApp();

  // Show loading during initial auth check to prevent flash
  if (authState.isLoading || authState.isAuthChecking) {
    return <SimpleLoader />;
  }

  // If user is authenticated, redirect to their app home (Design → /design/dashboard, Food → /food/dashboard)
  if (authState.user) {
    return <Navigate to={loginRedirectPath} replace />;
  }

  // If user is not authenticated, show the public page
  return children;
};


const ProtectedRoute = ({ children, requiredRole = null }) => {
  const authState = useAuth();
  const { canAccess } = authState;
  const location = useLocation();

  // Show loading during initial auth check to prevent flash
  if (authState.isLoading || authState.isAuthChecking) {
    return <SimpleLoader />;
  }

  // Redirect state object for post-login redirect
  const redirectState = {
    from: location.pathname + location.search + location.hash
  };

  const errorState = {
    error: authState.error
  };

  // Handle authentication errors
  if (authState.error) {
    return <Navigate to="/login" replace state={errorState} />;
  }

  // Check if user is authenticated
  if (!authState.user) {
    return <Navigate to="/login" replace state={redirectState} />;
  }

  // Only check role for admin routes
  if (requiredRole === "admin" && !canAccess("admin")) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};


const AdminRoute = ({ children }) => {
  const authState = useAuth();
  const { canAccess } = authState;

  if (authState.isLoading || authState.isAuthChecking) {
    return <SimpleLoader />;
  }
  if (!canAccess("admin")) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

const ProtectedIndexRedirect = () => {
  const { loginRedirectPath } = useDepartmentApp();
  return <Navigate to={loginRedirectPath} replace />;
};

ProtectedRoute.displayName = "ProtectedRoute";



const RootLayout = () => {
  return (
    <ErrorBoundary componentName="RootLayout">
      <Outlet />
    </ErrorBoundary>
  );
};


export const createRouter = () => {
  return createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
      // ========================================
      // PUBLIC ROUTES (No authentication required)
      // ========================================
      {
        path: "login",
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },
      {
        index: true,
        element: (
          <PublicRoute>
            <HomePage />
          </PublicRoute>
        ),
      },
      // ========================================
      // PROTECTED ROUTES (2-apps-in-1: /design/* and /food/*, shared /settings/*)
      // Index → loginRedirectPath (design/dashboard or food/dashboard). Admin-only: settings/users, settings/departments, settings/ui-showcase.
      // ========================================
      {
        element: (
          <ProtectedRoute>
            <ErrorBoundary componentName="ProtectedApp">
              <Outlet />
            </ErrorBoundary>
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <ProtectedIndexRedirect />,
          },
          {
            path: "design",
            element: (
              <ErrorBoundary componentName="DesignLayout">
                <DepartmentLayout />
              </ErrorBoundary>
            ),
            children: designRoutes,
          },
          {
            path: "food",
            element: (
              <ErrorBoundary componentName="FoodLayout">
                <DepartmentLayout />
              </ErrorBoundary>
            ),
            children: foodRoutes,
          },
          {
            path: "settings",
            element: (
              <ErrorBoundary componentName="SettingsRoutes">
                <DepartmentLayout />
              </ErrorBoundary>
            ),
            children: [
              { index: true, element: <Navigate to="/settings/users" replace /> },
              { path: "users", element: <AdminRoute><UsersPage /></AdminRoute> },
              { path: "departments", element: <AdminRoute><DepartmentsPage /></AdminRoute> },
              { path: "ui-showcase", element: <AdminRoute><UIShowcasePage /></AdminRoute> },
              { path: "*", element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },

    // ========================================
    // ERROR ROUTES (Catch-all for 404s)
    // ========================================
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ]);
};

export default createRouter;
