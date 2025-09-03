// src/router.jsx
import {
  createBrowserRouter,
  Navigate,
  useLocation,
  Link,
  Outlet,
} from "react-router-dom";
import { lazy, Suspense, memo, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "@/features/auth";

import {
  selectUser,
  selectIsLoading,
  selectIsAuthChecking,
  selectAuthError,
} from "@/features/auth";

import AppLayout from "@/components/layout/AppLayout";
import Loader from "@/components/ui/Loader/Loader";

// Import static pages directly (no lazy loading needed)
import LoginPage from "@/pages/auth/LoginPage";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";

// Lazy load dynamic pages that need data
const AdminManagementPage = lazy(
  () => import("@/pages/admin/ManagmentPage")
);
const AnalyticsPage = lazy(() => import("@/pages/admin/AnalyticsPage"));
const ComingSoonPage = lazy(() => import("@/components/ui/ComingSoon/ComingSoon"));
const NotFoundPage = lazy(() => import("@/pages/errorPages/NotFoundPage"));

// Simplified loading component for lazy-loaded pages
const PageLoader = ({ text = "Loading..." }) => (
  <div className="min-h-screen flex-center bg-primary">
    <Loader size="xl" text={text} variant="spinner" fullScreen={true} />
  </div>
);

// Wrapper component for lazy-loaded pages with Suspense
const LazyPage = ({ children, loadingText = "Loading..." }) => (
  <Suspense fallback={<PageLoader text={loadingText} />}>{children}</Suspense>
);

// Route protection component with auth checking loader
const ProtectedRoute = memo(({ children, requiredRole = null }) => {
  const user = useSelector(selectUser);
  const isAuthChecking = useSelector(selectIsAuthChecking);
  const error = useSelector(selectAuthError);
  const location = useLocation();
  const { canAccess } = useAuth();

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
  if (error) {
    return <Navigate to="/login" replace state={{ error: error }} />;
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
});

ProtectedRoute.displayName = "ProtectedRoute";

// Unauthorized page component
const UnauthorizedPage = () => {
  const { canAccess } = useAuth();
  
  // Memoized access check using centralized function
  const isAdmin = useMemo(() => canAccess('admin'), [canAccess]);

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

// Helper function to create protected routes with lazy loading
const createProtectedRoute = (
  Component,
  requiredRole = null,
  loadingText = "Loading..."
) => {
  const MemoizedComponent = memo(Component);

  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <LazyPage loadingText={loadingText}>
        <MemoizedComponent />
      </LazyPage>
    </ProtectedRoute>
  );
};

// Helper function to create admin-only routes
const createAdminRoute = (Component, loadingText = "Loading admin...") =>
  createProtectedRoute(Component, "admin", loadingText);

// Helper function to create user routes (accessible by both users and admins)
const createUserRoute = (Component, loadingText = "Loading...") =>
  createProtectedRoute(Component, "user", loadingText);

// Root layout that handles auth state and redirects
const RootLayout = () => {
  const user = useSelector(selectUser);
  const isAuthChecking = useSelector(selectIsAuthChecking);
  const location = useLocation();

  // Memoized route checks
  const isOnPublicRoute = useMemo(() => 
    ["/", "/login", "/unauthorized"].includes(location.pathname),
    [location.pathname]
  );

  const isOnLoginPage = useMemo(() => 
    location.pathname === "/login",
    [location.pathname]
  );

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
  if (user && isOnLoginPage) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated and trying to access protected routes, redirect to login
  if (!user && !isOnPublicRoute) {
    return <Navigate to="/login" replace />;
  }

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
          
          // Dashboard route - now properly rendered
          {
            path: "dashboard",
            element: createUserRoute(
              DashboardPage,
              "Loading dashboard..."
            ),
          },

          // Admin management (admin-only, but no /admin in URL)
          {
            path: "management",
            element: createAdminRoute(
              AdminManagementPage,
              "Loading management..."
            ),
          },

          // Analytics (admin-only, but no /admin in URL)
          {
            path: "analytics",
            element: createAdminRoute(AnalyticsPage, "Loading analytics..."),
          },

          // Preview routes
          {
            path: "preview/:monthId",
            children: [
              {
                index: true,
                element: createAdminRoute(ComingSoonPage),
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
