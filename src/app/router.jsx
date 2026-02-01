
import React from "react";
import {
  createBrowserRouter,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Loader from "@/components/ui/Loader/Loader";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import UsersPage from "@/pages/admin/UsersPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import UIShowcasePage from "@/pages/admin/UIShowcasePage";
import ComingSoonPage from "@/pages/ComingSoonPage";
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
      // PROTECTED ROUTES (Authentication required)
      // ========================================
      {
        element: (
          <ProtectedRoute>
            <ErrorBoundary componentName="AppLayout">
              <AppLayout />
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
            path: "profile",
            element: (
              <ErrorBoundary componentName="ComingSoonPage">
                <PageWrapper>
                  <ComingSoonPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          // ========================================
          // ADMIN-ONLY ROUTES (Admin role required)
          // ========================================
          {
            path: "users",
            element: (
              <AdminRoute>
                <ErrorBoundary componentName="UsersPage">
                  <PageWrapper>
                    <UsersPage />
                  </PageWrapper>
                </ErrorBoundary>
              </AdminRoute>
            ),
          },
          {
            path: "reporters",
            element: <Navigate to="/dashboard" replace />,
          },
          // ========================================
          // UTILITY ROUTES (Coming soon pages)
          // ========================================
          {
            path: "time-tracking",
            element: (
              <ErrorBoundary componentName="ComingSoonPage">
                <PageWrapper>
                  <ComingSoonPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "deliverables",
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: "projects",
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: "analytics",
            element: (
              <ErrorBoundary componentName="ComingSoonPage">
                <PageWrapper>
                  <ComingSoonPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "analytics/marketing",
            element: (
              <ErrorBoundary componentName="ComingSoonPage">
                <PageWrapper>
                  <ComingSoonPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "analytics/acquisition",
            element: (
              <ErrorBoundary componentName="ComingSoonPage">
                <PageWrapper>
                  <ComingSoonPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "analytics/product",
            element: (
              <ErrorBoundary componentName="ComingSoonPage">
                <PageWrapper>
                  <ComingSoonPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "analytics/ai-usage",
            element: (
              <ErrorBoundary componentName="ComingSoonPage">
                <PageWrapper>
                  <ComingSoonPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "analytics/reporter-overview",
            element: (
              <ErrorBoundary componentName="ComingSoonPage">
                <PageWrapper>
                  <ComingSoonPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "analytics/by-users",
            element: (
              <ErrorBoundary componentName="ComingSoonPage">
                <PageWrapper>
                  <ComingSoonPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "analytics/misc",
            element: (
              <ErrorBoundary componentName="ComingSoonPage">
                <PageWrapper>
                  <ComingSoonPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "analytics/month-comparison",
            element: (
              <ErrorBoundary componentName="ComingSoonPage">
                <PageWrapper>
                  <ComingSoonPage />
                </PageWrapper>
              </ErrorBoundary>
            ),
          },
          {
            path: "settings",
            element: <Navigate to="/users" replace />,
          },
          {
            path: "ui-showcase",
            element: (
              <AdminRoute>
                <ErrorBoundary componentName="UIShowcasePage">
                  <PageWrapper>
                    <UIShowcasePage />
                  </PageWrapper>
                </ErrorBoundary>
              </AdminRoute>
            ),
          },
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
