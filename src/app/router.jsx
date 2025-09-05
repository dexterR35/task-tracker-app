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
const ComingSoonPage = lazy(() => import("@/components/ui/ComingSoon/ComingSoon"));
const NotFoundPage = lazy(() => import("@/pages/errorPages/NotFoundPage"));

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

// Unauthorized page component
const UnauthorizedPage = () => {
  const { canAccess } = useAuth();
  
  // Direct access check - canAccess is already memoized in useAuth hook
  const isAdmin = canAccess('admin');

  return (
    <div className="min-h-screen flex-center bg-primary">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        <div className="space-y-2">
          <Link
            to="/dashboard"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};


// Root layout that handles initial auth checking and login page redirect
// All other auth checks and redirects are handled by ProtectedRoute
const RootLayout = () => {
  const { user, isAuthChecking } = useAuth();
  const location = useLocation();

  // Show loading during auth check
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

  // If user is authenticated and on login page, redirect to dashboard
  if (user && location.pathname === "/login") {
    return <Navigate to="/dashboard" replace />;
  }

  // Let ProtectedRoute handle all other auth checks and redirects
  return <Outlet />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // All routes use the same layout
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
          {
            path: "unauthorized",
            element: <UnauthorizedPage />,
          },
          
          // User routes (no user ID in path for security)
          {
            path: "dashboard",
            element: (
              <ProtectedRoute requiredRole="user">
                <LazyPage loadingText="Loading user dashboard...">
                  <UserDashboardPage />
                </LazyPage>
              </ProtectedRoute>
            ),
          },
          {
            path: "tasks",
            element: (
              <ProtectedRoute requiredRole="user">
                <LazyPage loadingText="Loading user tasks...">
                  <UserDashboardPage />
                </LazyPage>
              </ProtectedRoute>
            ),
          },

          // Admin analytics and management routes
          {
            path: "admin",
            children: [
              {
                path: "dashboard",
                element: (
                  <ProtectedRoute requiredRole="admin">
                    <LazyPage loadingText="Loading admin dashboard...">
                      <AdminDashboardPage />
                    </LazyPage>
                  </ProtectedRoute>
                ),
              },
              {
                path: "analytics",
                element: (
                  <ProtectedRoute requiredRole="admin">
                    <LazyPage loadingText="Loading analytics...">
                      <AnalyticsPage />
                    </LazyPage>
                  </ProtectedRoute>
                ),
              },
              {
                path: "users",
                element: (
                  <ProtectedRoute requiredRole="admin">
                    <LazyPage loadingText="Loading user management...">
                      <AdminManagementPage />
                    </LazyPage>
                  </ProtectedRoute>
                ),
              },
              {
                path: "tasks",
                element: (
                  <ProtectedRoute requiredRole="admin">
                    <LazyPage loadingText="Loading task management...">
                      <AdminTasksPage />
                    </LazyPage>
                  </ProtectedRoute>
                ),
              },
            ],
          },


          // Preview routes - admin access required
          {
            path: "preview/:monthId",
            children: [
              {
                index: true,
                element: (
                  <ProtectedRoute requiredRole="admin">
                    <LazyPage loadingText="Loading preview...">
                      <ComingSoonPage />
                    </LazyPage>
                  </ProtectedRoute>
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
