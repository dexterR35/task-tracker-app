// src/router.jsx
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../shared/hooks/useAuth";

import Layout from "../shared/components/layout/Layout";
import Loader from "../shared/components/ui/Loader";
import LoginPage from "../pages/auth/LoginPage";
import TaskDetailPage from "../pages/dashboard/TaskDetailPage";
import HomePage from "../pages/dashboard/HomePage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminReportersPage from "../pages/admin/AdminReportersPage";
import NotFoundPage from "../pages/NotFoundPage";

// Unified route protection component
const ProtectedRoute = ({ children, requiredRole = null, redirectToLogin = true }) => {
  const { isAuthenticated, user, isLoading, error } = useAuth();
  const location = useLocation();

  // Show loading state during login/logout operations only
  if (isLoading) {
    return (
      <Loader 
        size="xl" 
        text="Processing..." 
        variant="spinner" 
        fullScreen={true}
      />
    );
  }

  // Handle authentication errors - only redirect if not already on login page
  // Don't redirect if we're already on login page to prevent loops
  if (error && location.pathname !== "/login") {
    return <Navigate to="/login" replace state={{ error: error }} />;
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
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

  // Check if user account is active
  if (user.isActive === false) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ error: "Account is deactivated. Please contact administrator." }}
      />
    );
  }

  // Check role-based access if required
  if (requiredRole === "admin" && user.role !== "admin") {
    return <Navigate to="/unauthorized" replace />;
  }
  
  if (requiredRole === "user" && user.role !== "user" && user.role !== "admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Unauthorized page component
const UnauthorizedPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen flex-center bg-primary">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        <div className="space-y-2">
          {isAdmin ? (
            <a
              href="/admin"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Go to Admin Dashboard
            </a>
          ) : (
            <a
              href="/user"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Go to User Dashboard
            </a>
          )}
          <a
            href="/"
            className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
};

// Root index wrapper: redirect authenticated users based on role
const RootIndex = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Loader 
        size="xl" 
        text="Processing..." 
        variant="spinner" 
        fullScreen={true}
      />
    );
  }

  if (isAuthenticated && user) {
    // Check if user account is active
    if (user.isActive === false) {
      return <Navigate to="/login" replace state={{ error: "Account is deactivated. Please contact administrator." }} />;
    }

    // Redirect based on user role
    const redirectTo = user.role === "admin" ? "/admin" : "/user";
    return <Navigate to={redirectTo} replace />;
  }

  return <HomePage />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <RootIndex /> },
      {
        path: "login",
        element: (
          <ProtectedRoute redirectToLogin={false}>
            <LoginPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },
      {
        path: "user",
        element: (
          <ProtectedRoute requiredRole="user">
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute requiredRole="admin">
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "task/:monthId/:taskId",
        element: (
          <ProtectedRoute requiredRole="user">
            <TaskDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminUsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/reporters",
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminReportersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "preview/:monthId",
        element: (
          <ProtectedRoute requiredRole="admin">
            <NotFoundPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/task/:monthId/:taskId",
        element: (
          <ProtectedRoute requiredRole="admin">
            <TaskDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/analytics",
        element: (
          <ProtectedRoute requiredRole="admin">
            <NotFoundPage /> {/* Placeholder for future analytics page */}
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;
