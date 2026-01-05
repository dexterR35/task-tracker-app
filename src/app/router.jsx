
import React from "react";
import {
  createBrowserRouter,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import AuthLayout from "@/components/layout/AuthLayout";
import Loader from "@/components/ui/Loader/Loader";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import AdminManagementPage from "@/pages/admin/ManagmentPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import TaskDetailPage from "@/pages/TaskDetailPage";
import LandingPages from "@/pages/LandingPages";
import FeaturesSummaryPage from "@/pages/FeaturesSummaryPage";
import TeamDaysOffPage from "@/pages/TeamDaysOffPage";
import HowToUsePage from "@/pages/HowToUsePage";
import ExperienceSystemPage from "@/pages/ExperienceSystemPage";
import ComingSoonPage from "@/components/ui/ComingSoon/ComingSoon";
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
              <ErrorBoundary componentName="ComingSoonPage">
                <PageWrapper>
                  <ComingSoonPage />
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
          {
            path: "experience",
            element: (
              <ErrorBoundary componentName="ExperienceSystemPage">
                <PageWrapper key="experience">
                  <ExperienceSystemPage />
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
