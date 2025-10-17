// src/router.jsx
import {
  createBrowserRouter,
  Navigate,
  useLocation,
  useNavigate,
  Link,
  Outlet,
} from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { isUserAuthenticated, isAuthLoading } from "@/features/utils/authUtils";

import AuthLayout from "@/components/layout/AuthLayout";
import Loader from "@/components/ui/Loader/Loader";

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
import DocumentationPage from "@/pages/DocumentationPage";

// Import simple components directly (no lazy loading needed)
import ComingSoonPage from "@/components/ui/ComingSoon/ComingSoon";
import NotFoundPage from "@/pages/errorPages/NotFoundPage";
import UnauthorizedPage from "@/pages/errorPages/UnauthorizedPage";

// Simple loading component
const SimpleLoader = () => (
  <div className="min-h-screen flex-center ">
    <Loader size="lg" text="Initializing app…" variant="spinner" />
  </div>
);

// Simple page wrapper with motion
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



// Public route protection - redirects authenticated users to dashboard
const PublicRoute = ({ children }) => {
  const authState = useAuth();
  const location = useLocation();


  // If user is authenticated, redirect to dashboard
  if (isUserAuthenticated(authState)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is not authenticated, show the public page
  return children;
};

// Route protection component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const authState = useAuth();
  const { canAccess } = authState;
  const location = useLocation();

  // Redirect state object
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
  if (!isUserAuthenticated(authState)) {
    return <Navigate to="/login" replace state={redirectState} />;
  }

  // Only check role for admin routes
  if (requiredRole === "admin" && !canAccess("admin")) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Admin-only route protection component (assumes user is already authenticated)
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




// Root layout with global auth loading state
const RootLayout = () => {
  const authState = useAuth();
  
  // Show loading during initial auth check to prevent flash
  if (isAuthLoading(authState)) {
    return <SimpleLoader />;
  }
  
  return <Outlet />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // Public routes (no layout needed)
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
      // Homepage route (public, but redirects authenticated users)
      {
        index: true,
        element: (
          <PublicRoute>
            <HomePage />
          </PublicRoute>
        ),
      },
      // Protected routes with AuthLayout (sidebar navigation)
      {
        element: (
          <ProtectedRoute>
            <AuthLayout />
          </ProtectedRoute>
        ),
        children: [
          // Dashboard route
          {
            path: "dashboard",
            element: (
              <PageWrapper key="dashboard">
                <AdminDashboardPage />
              </PageWrapper>
            ),
          },
          
          // Admin-only routes (no /admin prefix)
          {
            path: "analytics",
            element: (
              <AdminRoute>
                <PageWrapper key="analytics">
                  <AnalyticsPage />
                </PageWrapper>
              </AdminRoute>
            ),
          },
          {
            path: "landing-pages",
            element: (
              <AdminRoute>
                <PageWrapper key="landing-pages">
                  <LandingPages />
                </PageWrapper>
              </AdminRoute>
            ),
          },
          {
            path: "users",
            element: (
              <AdminRoute>
                <PageWrapper>
                  <AdminManagementPage />
                </PageWrapper>
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
          {
            path: "task/:taskId",
            element: (
              <PageWrapper>
                <TaskDetailPage />
              </PageWrapper>
            ),
          },
          {
            path: "analytics-detail",
            element: (
              <PageWrapper>
                <DynamicAnalyticsPage />
              </PageWrapper>
            ),
          },
          {
            path: "documentation",
            element: (
              <PageWrapper key="documentation">
                <DocumentationPage />
              </PageWrapper>
            ),
          },
        ],
      },
    ],
  },

  // Catch-all route
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
