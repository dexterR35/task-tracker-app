// src/router.jsx
import {
  createBrowserRouter,
  Navigate,
  useLocation,
  Link,
  Outlet,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { useAuth } from "@/features/auth";

import AppLayout from "@/components/layout/AppLayout";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import Loader from "@/components/ui/Loader/Loader";

// Import static pages directly (no lazy loading needed)
import LoginPage from "@/pages/auth/LoginPage";
import HomePage from "@/pages/HomePage";

// Lazy load dynamic pages that need data
const AdminManagementPage = lazy(
  () => import("@/pages/admin/ManagmentPage")
);
const AdminDashboardPage = lazy(
  () => import("@/pages/admin/AdminDashboardPage")
);
const AdminTasksPage = lazy(
  () => import("@/pages/admin/AdminTasksPage")
);
const UserDashboardPage = lazy(
  () => import("@/pages/user/UserDashboardPage")
);
const AnalyticsPage = lazy(
  () => import("@/pages/admin/AnalyticsPage")
);
const DebugPage = lazy(
  () => import("@/pages/admin/DebugPage")
);
const ComingSoonPage = lazy(() => import("@/components/ui/ComingSoon/ComingSoon"));
const NotFoundPage = lazy(() => import("@/pages/errorPages/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("@/pages/errorPages/UnauthorizedPage"));

// Simplified loading component for lazy-loaded pages
const PageLoader = ({ text = "Loading...page loader" }) => (
  <div className="min-h-screen flex-center bg-primary">
    <Loader size="xl" text={text} variant="spinner" fullScreen={true} />
  </div>
);

// Wrapper component for lazy-loaded pages with Suspense
const LazyPage = ({ children, loadingText = "Loading...page loader2" }) => (
  <Suspense fallback={<PageLoader text={loadingText} />}>{children}</Suspense>
);

// Admin Layout component that wraps all admin routes with protection
const AdminLayout = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </ProtectedRoute>
  );
};

// Role-based dashboard component
const RoleBasedDashboard = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return (
      <LazyPage loadingText="Loading admin dashboard...">
        <AdminDashboardPage />
      </LazyPage>
    );
  }
  
  return (
    <LazyPage loadingText="Loading user dashboard...">
      <UserDashboardPage />
    </LazyPage>
  );
};

// Route protection component with auth checking loader
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthChecking, authError, canAccess } = useAuth();
  const location = useLocation();

  // Show loading state during initial auth check
  if (isAuthChecking) {
    return (
      <Loader
        size="xl"
        text="Checking authentication..."
        variant="dots"
        fullScreen={true}
      />
    );
  }

  // Handle authentication errors
  if (authError) {
    return <Navigate to="/login" replace state={{ error: authError }} />;
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    );
  }

  // Check role-based access using centralized canAccess function
  if (requiredRole && !canAccess(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

ProtectedRoute.displayName = "ProtectedRoute";



// Root layout that handles only login loading state
// All auth checks and redirects are handled by ProtectedRoute
const RootLayout = () => {
  const { isLoading: authLoading } = useAuth();
  const location = useLocation();

  // Show loading during login process (covers entire screen including nav/layout)
  const showLoginLoading = authLoading && location.pathname === '/login';
  if (showLoginLoading) {
    return (
      <Loader
        size="xl"
        text="Signing in..."
        variant="dots"
        fullScreen={true}
      />
    );
  }

  return <Outlet />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // Unauthorized page at root level (no layout)
      {
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },
      // All other routes use the same layout
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: "login",
            element: <LoginPage />,
          },
          
          // User routes (no user ID in path for security)
          {
            path: "dashboard",
            element: (
              <ProtectedRoute requiredRole="user">
                <ErrorBoundary>
                  <RoleBasedDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            ),
          },
          
          // Consolidated admin routes under /admin
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              {
                path: "analytics",
                element: (
                  <LazyPage loadingText="Loading analytics...">
                    <AnalyticsPage />
                  </LazyPage>
                ),
              },
              {
                path: "users",
                element: (
                  <LazyPage loadingText="Loading user management...">
                    <AdminManagementPage />
                  </LazyPage>
                ),
              },
              {
                path: "tasks",
                element: (
                  <LazyPage loadingText="Loading task management...">
                    <AdminTasksPage />
                  </LazyPage>
                ),
              },
              {
                path: "debug",
                element: (
                  <LazyPage loadingText="Loading debug tools...">
                    <DebugPage />
                  </LazyPage>
                ),
              },
              {
                path: "preview/:monthId",
                element: (
                  <LazyPage loadingText="Loading preview...">
                    <ComingSoonPage />
                  </LazyPage>
                ),
              },
            ],
          },
        ],
      },
    ],
  },

  // Catch-all route
  {
    path: "*",
    element: (
      <LazyPage>
        <NotFoundPage />
      </LazyPage>
    ),
  },
]);

export default router;
