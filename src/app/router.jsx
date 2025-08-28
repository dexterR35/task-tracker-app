// src/router.jsx
import { createBrowserRouter, Navigate, useLocation, Link } from "react-router-dom";
import { lazy, Suspense, memo, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "../shared/hooks/useAuth";
import { logger } from "../shared/utils/logger";
import { AuthProvider } from "../shared/context/AuthProvider";
import {
  selectUser,
  selectIsLoading,
  selectIsAuthChecking,
  selectAuthError
} from "../features/auth/authSlice";

import PublicLayout from "../shared/components/layout/PublicLayout";
import AuthenticatedLayout from "../shared/components/layout/AuthenticatedLayout";
import Loader from "../shared/components/ui/Loader";
import ComingSoonPage from "../shared/components/ui/ComingSoonPage";

// Import static pages directly (no lazy loading needed)
import LoginPage from "../pages/auth/LoginPage";
import HomePage from "../pages/dashboard/HomePage";

// Lazy load dynamic pages that need data
const TaskDetailPage = lazy(() => import("../pages/dashboard/TaskDetailPage"));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const UserProfilePage = lazy(() => import("../pages/admin/UserProfilePage"));
const AdminReportersPage = lazy(() => import("../pages/admin/AdminReportersPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

// Loading component for lazy-loaded pages with fade-in animation
const PageLoader = ({ text = "Loading..." }) => (
  <div className="min-h-screen flex-center bg-primary animate-fade-in">
    <Loader 
      size="xl" 
      text={text} 
      variant="spinner" 
      fullScreen={true}
    />
  </div>
);

// Wrapper component for lazy-loaded pages with Suspense and fade-in
const LazyPage = ({ children, loadingText = "Loading..." }) => (
  <Suspense fallback={<PageLoader text={loadingText} />}>
    <div className="animate-fade-in">
      {children}
    </div>
  </Suspense>
);

// Use individual selectors directly for better performance
const useAuthState = () => {
    const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  const isAuthChecking = useSelector(selectIsAuthChecking);
  const error = useSelector(selectAuthError);

  return { user, isLoading, isAuthChecking, error };
};

// Unified route protection component with memoization
const ProtectedRoute = memo(({ children, requiredRole = null, redirectToLogin = true }) => {
  const { user, isLoading, isAuthChecking, error } = useAuthState();
  const { canAccess } = useAuth(); // Get canAccess directly from useAuth
  const location = useLocation();
  

  // Debug logging removed - not needed in production

  // Show loading state during auth checking or login/logout operations
  if (isLoading || isAuthChecking) {
    return (
      <Loader 
        size="xl" 
        text="Processing..." 
        variant="dots" 
        fullScreen={true}
      />
    );
  }

  // Handle authentication errors - only redirect if not already on login page
  if (error && location.pathname !== "/login") {
    return <Navigate to="/login" replace state={{ error: error }} />;
  }

  // Check if user is authenticated
  if (!user) {
    if (redirectToLogin) {
      return (
        <Navigate
          to="/login"
          replace
          state={{ from: location.pathname + location.search + location.hash }}
        />
      );
    }
    return children; // Allow unauthenticated access for login page
  }

  // If user is authenticated and on login page, redirect to homepage
  if (location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  // Auto-redirect admins from /user to /admin
  if (location.pathname === "/user" && canAccess('admin')) {
    return <Navigate to="/admin" replace />;
  }

  // Check role-based access using the simplified canAccess function
  if (requiredRole && !canAccess(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
});

ProtectedRoute.displayName = 'ProtectedRoute';

// Unauthorized page component with proper React Router usage
const UnauthorizedPage = () => {
  const { user } = useAuthState();
  const { canAccess } = useAuth();
  const isAdmin = canAccess('admin');

  return (
    <div className="min-h-screen flex-center bg-primary">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        <div className="space-y-2">
          {isAdmin ? (
            <Link
              to="/admin"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Go to Admin Dashboard
            </Link>
          ) : (
            <Link
              to="/user"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Go to User Dashboard
            </Link>
          )}
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

// Memoized route components to prevent re-creation
const createMemoizedRoute = (Component, requiredRole = null, loadingText = "Loading...") => {
  const MemoizedComponent = memo(Component);
  
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <LazyPage loadingText={loadingText}>
        <MemoizedComponent />
      </LazyPage>
    </ProtectedRoute>
  );
};

// Helper function to create protected routes with lazy loading
const createProtectedRoute = (Component, requiredRole = null, loadingText = "Loading...") => 
  createMemoizedRoute(Component, requiredRole, loadingText);

// Helper function to create admin-only routes
const createAdminRoute = (Component, loadingText = "Loading admin...") => 
  createProtectedRoute(Component, "admin", loadingText);

// Helper function to create user routes (accessible by both users and admins)
const createUserRoute = (Component, loadingText = "Loading...") => 
  createProtectedRoute(Component, "user", loadingText);

// Single AuthProvider wrapper for all authenticated routes
const AuthenticatedRoutes = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
);

const router = createBrowserRouter([
  // Public routes (no authentication, no Redux/store loading)
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { 
        index: true, 
        element: <HomePage /> 
      },
      {
        path: "login",
        element: <LoginPage />, // Remove ProtectedRoute wrapper for truly static login
      },
      {
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },
    ],
  },
  
  // All authenticated routes wrapped in a single AuthProvider
  {
    element: <AuthenticatedRoutes><AuthenticatedLayout /></AuthenticatedRoutes>,
    children: [
      // User routes
      {
        path: "/user",
        children: [
          {
            index: true,
            element: createUserRoute(DashboardPage, "Loading dashboard..."),
          },
          {
            path: "task/:monthId/:taskId",
            element: createUserRoute(TaskDetailPage),
          },
        ],
      },
      
      // Admin routes
      {
        path: "/admin",
        children: [
          {
            index: true,
            element: createAdminRoute(DashboardPage, "Loading admin dashboard..."),
          },
          {
            path: "users",
            element: createAdminRoute(AdminUsersPage),
          },
          {
            path: "users/:userId",
            element: createAdminRoute(UserProfilePage),
          },
          {
            path: "reporters",
            element: createAdminRoute(AdminReportersPage),
          },
          {
            path: "task/:monthId/:taskId",
            element: createAdminRoute(TaskDetailPage),
          },
          {
            path: "analytics",
            element: createAdminRoute(ComingSoonPage),
          },
        ],
      },
      
      // Shared task routes
      {
        path: "/task/:monthId/:taskId",
        children: [
          {
            index: true,
            element: createUserRoute(TaskDetailPage),
          },
        ],
      },
      
      // Preview routes
      {
        path: "/preview/:monthId",
        children: [
          {
            index: true,
            element: createAdminRoute(ComingSoonPage),
          },
        ],
      },
    ],
  },
  
  // Catch-all route
  {
    path: "*",
    element: <LazyPage><NotFoundPage /></LazyPage>
  },
]);

export default router;
