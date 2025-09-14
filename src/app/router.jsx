// src/router.jsx
import {
  createBrowserRouter,
  Navigate,
  useLocation,
  useNavigate,
  Link,
  Outlet,
} from "react-router-dom";
import { lazy, Suspense, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { isUserAuthenticated, isAuthLoading } from "@/utils/authUtils";

import AuthLayout from "@/components/layout/AuthLayout";
import Loader from "@/components/ui/Loader/Loader";

// Import static pages directly (no lazy loading needed)
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";


// Lazy load only heavy pages that need data
const AdminManagementPage = lazy(
  () => import("@/pages/admin/ManagmentPage")
);
const AdminDashboardPage = lazy(
  () => import("@/pages/admin/AdminDashboardPage")
);
const DebugPage = lazy(
  () => import("@/pages/admin/DebugPage")
);
const AnalyticsPage = lazy(
  () => import("@/pages/admin/AnalyticsPage")
);

// Import simple components directly (no lazy loading needed)
import ComingSoonPage from "@/components/ui/ComingSoon/ComingSoon";
import NotFoundPage from "@/pages/errorPages/NotFoundPage";
import UnauthorizedPage from "@/pages/errorPages/UnauthorizedPage";

// Simple loading component
const SimpleLoader = () => (
  <div className="min-h-screen flex-center ">
    <Loader size="lg" text="Loading... Please wait" variant="spinner" />
  </div>
);

// Simple lazy page wrapper with motion
const LazyPage = ({ children }) => (
  <Suspense fallback={<SimpleLoader />}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  </Suspense>
);


// Universal dashboard component - same page for both admin and user roles
const RoleBasedDashboard = () => {
  return (
    <LazyPage>
      <AdminDashboardPage />
    </LazyPage>
  );
};

// Public route protection - redirects authenticated users to dashboard
const PublicRoute = ({ children }) => {
  const authState = useAuth();
  const location = useLocation();

  // Show loading during initial auth check
  if (isAuthLoading(authState)) {
    return <SimpleLoader />;
  }

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

  // Memoize the redirect state to prevent infinite re-renders
  const redirectState = useMemo(() => ({
    from: location.pathname + location.search + location.hash
  }), [location.pathname, location.search, location.hash]);

  const errorState = useMemo(() => ({
    error: authState.error
  }), [authState.error]);

  // Show loading state during initial auth check
  if (isAuthLoading(authState)) {
    return <SimpleLoader />;
  }

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

ProtectedRoute.displayName = "ProtectedRoute";



// Root layout
const RootLayout = () => {
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
            element: <RoleBasedDashboard />,
          },
          
          // Admin-only routes (no /admin prefix)
          {
            path: "analytics",
            element: (
              <ProtectedRoute requiredRole="admin">
                <LazyPage>
                  <AnalyticsPage />
                </LazyPage>
              </ProtectedRoute>
            ),
          },
          {
            path: "users",
            element: (
              <ProtectedRoute requiredRole="admin">
                <LazyPage>
                  <AdminManagementPage />
                </LazyPage>
              </ProtectedRoute>
            ),
          },
          {
            path: "debug",
            element: (
              <ProtectedRoute requiredRole="admin">
                <LazyPage>
                  <DebugPage />
                </LazyPage>
              </ProtectedRoute>
            ),
          },
          {
            path: "preview/:monthId",
            element: <ComingSoonPage />,
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
