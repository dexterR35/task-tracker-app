/**
 * Application Router Configuration
 * 
 * @fileoverview Main router configuration with route protection and layouts
 * @author Senior Developer
 * @version 2.0.0
 * Updated: Removed WeekViewPage references
 */

import React from "react";
import {
  createBrowserRouter,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
// Removed authUtils imports - using auth context directly

import AuthLayout from "@/components/layout/AuthLayout";
import Loader from "@/components/ui/Loader/Loader";
import ErrorBoundary from "@/components/layout/ErrorBoundary";

// Import static pages directly (no lazy loading needed)
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";


// Import all pages directly
import AdminManagementPage from "@/pages/admin/ManagmentPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import TaskDetailPage from "@/pages/TaskDetailPage";
import LandingPages from "@/pages/LandingPages";
import DynamicAnalyticsPage from "@/pages/DynamicAnalyticsPage";
import ProfilePage from "@/pages/ProfilePage";
import FeaturesSummaryPage from "@/pages/FeaturesSummaryPage";
import TeamDaysOffPage from "@/pages/TeamDaysOffPage";
import HowToUsePage from "@/pages/HowToUsePage";

// Import simple components directly (no lazy loading needed)
import ComingSoonPage from "@/components/ui/ComingSoon/ComingSoon";
import NotFoundPage from "@/pages/errorPages/NotFoundPage";
import UnauthorizedPage from "@/pages/errorPages/UnauthorizedPage";

/**
 * Simple loading component for app initialization
 * @returns {JSX.Element} - Loading component
 */
const SimpleLoader = () => (
  <div className="min-h-screen flex-center bg-primary">
    <Loader size="lg" text="Initializing app…" variant="spinner" />
  </div>
);


/**
 * Page wrapper with smooth transitions
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} - Page wrapper component
 */
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



/**
 * Public route protection component
 * Redirects authenticated users to dashboard, allows unauthenticated users to access public pages
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} - Public route component
 */
const PublicRoute = ({ children }) => {
  const authState = useAuth();

  // Show loading during initial auth check to prevent flash
  if (authState.isLoading || authState.isAuthChecking) {
    return <SimpleLoader />;
  }

  // If user is authenticated, redirect to dashboard
  if (authState.user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is not authenticated, show the public page
  return children;
};

/**
 * Protected route component with authentication and role-based access control
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string|null} props.requiredRole - Required role for access (optional)
 * @returns {JSX.Element} - Protected route component
 */
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

/**
 * Admin-only route protection component
 * Assumes user is already authenticated by parent ProtectedRoute
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} - Admin route component
 */
const AdminRoute = ({ children }) => {
  const authState = useAuth();
  const { canAccess } = authState;

  // Only check admin role since authentication is already verified by parent ProtectedRoute
  if (!canAccess("admin")) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

ProtectedRoute.displayName = "ProtectedRoute";




/**
 * Root layout with error boundary
 * Auth loading is handled by ProtectedRoute components
 * @returns {JSX.Element} - Root layout component
 */
const RootLayout = () => {
  return (
    <ErrorBoundary componentName="RootLayout">
      <Outlet />
    </ErrorBoundary>
  );
};

/**
 * Main application router configuration
 * Defines all routes with proper protection and layouts
 * @returns {Router} - Created browser router instance
 */
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
      // PROTECTED ROUTES (Authentication required)
      // ========================================
      {
        element: (
          <ProtectedRoute>
            <ErrorBoundary componentName="AuthLayout">
              <AuthLayout />
            </ErrorBoundary>
          </ProtectedRoute>
        ),
        children: [
          // ========================================
          // USER ROUTES (All authenticated users)
          // ========================================
          {
            path: "dashboard",
            element: (
              <ErrorBoundary componentName="AdminDashboardPage">
                <PageWrapper key="dashboard">
                  <AdminDashboardPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "task/:taskId",
            element: (
              <ErrorBoundary componentName="TaskDetailPage">
                <PageWrapper>
                  <TaskDetailPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "profile",
            element: (
              <ErrorBoundary componentName="ProfilePage">
                <PageWrapper>
                  <ProfilePage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "analytics-detail",
            element: (
              <ErrorBoundary componentName="DynamicAnalyticsPage">
                <PageWrapper>
                  <DynamicAnalyticsPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "landing-pages",
            element: (
              <ErrorBoundary componentName="LandingPages">
                <PageWrapper key="landing-pages">
                  <LandingPages />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "features",
            element: (
              <ErrorBoundary componentName="FeaturesSummaryPage">
                <PageWrapper key="features">
                  <FeaturesSummaryPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "team-days-off",
            element: (
              <ErrorBoundary componentName="TeamDaysOffPage">
                <PageWrapper key="team-days-off">
                  <TeamDaysOffPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "how-to-use",
            element: (
              <ErrorBoundary componentName="HowToUsePage">
                <PageWrapper key="how-to-use">
                  <HowToUsePage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          
          // ========================================
          // ADMIN-ONLY ROUTES (Admin role required)
          // ========================================
          {
            path: "analytics",
            element: (
              <AdminRoute>
                <ErrorBoundary componentName="AnalyticsPage">
                  <PageWrapper key="analytics">
                    <AnalyticsPage />
                  </PageWrapper>
                </ErrorBoundary>
              </AdminRoute>
            ),
          },
          {
            path: "analytics/:cardId",
            element: (
              <AdminRoute>
                <ErrorBoundary componentName="AnalyticsPage">
                  <PageWrapper key="analytics-detail">
                    <AnalyticsPage />
                  </PageWrapper>
                </ErrorBoundary>
              </AdminRoute>
            ),
          },
          {
            path: "users",
            element: (
              <AdminRoute>
                <ErrorBoundary componentName="AdminManagementPage">
                  <PageWrapper>
                    <AdminManagementPage />
                  </PageWrapper>
                </ErrorBoundary>
              </AdminRoute>
            ),
          },
          
          // ========================================
          // UTILITY ROUTES (Coming soon pages)
          // ========================================
          {
            path: "preview/:monthId",
            element: <ComingSoonPage />,
          },
          {
            path: "coming-soon",
            element: <ComingSoonPage />,
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
