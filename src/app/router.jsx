// src/router.jsx
import { createBrowserRouter, Navigate, useLocation, Link } from "react-router-dom";
import { lazy, Suspense, memo, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "../shared/hooks/useAuth";

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
import HomePage from "../pages/HomePage";

// Lazy load dynamic pages that need data

const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const TasksPage = lazy(() => import("../pages/task/TasksPage"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const UserProfilePage = lazy(() => import("../pages/admin/UserProfilePage"));
const AdminReportersPage = lazy(() => import("../pages/admin/AdminReportersPage"));
const NotFoundPage = lazy(() => import("../pages/errorPages/NotFoundPage"));

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
  
  // Check if this is a public route that doesn't need protection
  const isPublicRoute = location.pathname === '/login' || location.pathname === '/unauthorized';
  
  // For public routes, don't show loading or check authentication
  if (isPublicRoute) {
    return children;
  }

  // Show loading state only during login/logout operations, not during initial auth check
  if (isLoading) {
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
  // Only redirect to login if we're not currently checking auth (prevents redirect during refresh)
  if (!user && !isAuthChecking) {
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

  // If we're still checking auth, show a minimal loading state
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-white dark:bg-primary transition-colors duration-300">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }



  // Auto-redirect admins from /user to /admin
  if (location.pathname === "/user" && canAccess('admin')) {
    return <Navigate to="/admin" replace />;
  }

  // For homepage, allow authenticated users to stay (don't redirect them away)
  // But mark that they came from an authenticated route
  if (location.pathname === "/") {
    return children;
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

// Single wrapper for all authenticated routes
const AuthenticatedRoutes = ({ children }) => (
  <>{children}</>
);

const router = createBrowserRouter([
  // Public routes (no authentication required)
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
        element: <LoginPage />,
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
            path: "tasks",
            children: [
              {
                index: true,
                element: createUserRoute(TasksPage, "Loading user tasks..."),
              },
              {
                path: ":monthId/:taskId",
                element: createUserRoute(TasksPage),
              },
            ],
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
            path: "tasks",
            children: [
              {
                index: true,
                element: createAdminRoute(TasksPage, "Loading admin tasks..."),
              },
              {
                path: ":monthId/:taskId",
                element: createAdminRoute(TasksPage),
              },
            ],
          },
          {
            path: "analytics",
            element: createAdminRoute(ComingSoonPage),
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
