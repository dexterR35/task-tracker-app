
import React from "react";
import {
  createBrowserRouter,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useDepartmentApp } from "@/hooks/useDepartmentApp";
import design from "@/app/departments/design";
import food from "@/app/departments/food";
import SettingsLayout from "@/components/layout/SettingsLayout";
import DepartmentGuard from "@/components/layout/DepartmentGuard";
import RedirectToAppHome from "@/components/layout/RedirectToAppHome";
import Loader from "@/components/ui/Loader/Loader";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import UsersPage from "@/pages/admin/UsersPage";
import UIShowcasePage from "@/pages/admin/UIShowcasePage";
import DepartmentsPage from "@/pages/admin/DepartmentsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFoundPage from "@/pages/errorPages/NotFoundPage";
import UnauthorizedPage from "@/pages/errorPages/UnauthorizedPage";


const SimpleLoader = () => (
  <div className="min-h-screen flex-center bg-primary">
    <Loader size="lg" text="Initializing application..." variant="spinner" />
  </div>
);


const PageWrapper = ({ children }) => {
  const location = useLocation();
  
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};



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

  if (!canAccess("admin")) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
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
      // ========================================
      {
        element: (
          <ProtectedRoute>
            <ErrorBoundary componentName="DepartmentGuard">
              <DepartmentGuard />
            </ErrorBoundary>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <RedirectToAppHome /> },
          // ========================================
          // DESIGN (task tracker) – from src/app/departments/design
          // ========================================
          {
            path: "design",
            element: (
              <ErrorBoundary componentName="DesignLayout">
                <design.Layout />
              </ErrorBoundary>
            ),
            children: design.routes,
          },
          // ========================================
          // FOOD (office food orders) – from src/app/departments/food
          // ========================================
          {
            path: "food",
            element: (
              <ErrorBoundary componentName="FoodLayout">
                <food.Layout />
              </ErrorBoundary>
            ),
            children: food.routes,
          },
          // ========================================
          // SHARED SETTINGS (no department in path)
          // ========================================
          {
            path: "settings",
            element: (
              <ErrorBoundary componentName="SettingsLayout">
                <SettingsLayout />
              </ErrorBoundary>
            ),
            children: [
              { index: true, element: <Navigate to="/settings/users" replace /> },
              { path: "users", element: <AdminRoute><PageWrapper><UsersPage /></PageWrapper></AdminRoute> },
              { path: "departments", element: <AdminRoute><PageWrapper><DepartmentsPage /></PageWrapper></AdminRoute> },
              { path: "ui-showcase", element: <AdminRoute><PageWrapper><UIShowcasePage /></PageWrapper></AdminRoute> },
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
