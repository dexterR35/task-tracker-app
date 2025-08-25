// src/router.jsx
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../shared/hooks/useAuth";
import Layout from "../shared/components/layout/Layout";
import LoginPage from "../pages/auth/LoginPage";
import TaskDetailPage from "../pages/dashboard/TaskDetailPage";
import HomePage from "../pages/dashboard/HomePage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import ChartsPreviewPage from "../pages/admin/ChartsPreviewPage";
import UserDashboardPage from "../pages/user/UserDashboardPage";
import NotFoundPage from "../pages/NotFoundPage";

// Component to protect login page from authenticated users
const LoginRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isAuthChecking } = useAuth();
  const location = useLocation();
  
  // If auth is still loading or checking, don't redirect yet - show auth loader
  if (isLoading || isAuthChecking) {
    return null; // GlobalLoader will handle this
  }
  
  if (isAuthenticated) {
    const from = location.state?.from || "/";
    return <Navigate to={from} replace />;
  }
  return children;
};

// Component to protect routes that require authentication
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, isLoading, isAuthChecking } = useAuth();
  const location = useLocation();

  // If auth is still loading or checking, don't redirect yet - show auth loader
  if (isLoading || isAuthChecking) {
    return null; // GlobalLoader will handle this
  }

  if (!isAuthenticated)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    );
  if (requiredRole && role !== requiredRole)
    return <Navigate to="/unauthorized" replace />;
  return children;
};

// Component for admin-only routes
const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);

// Component for authenticated user routes
const UserRoute = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

// Root index wrapper: show HomePage for unauthenticated users, redirect authenticated users
const RootIndex = () => {
  const { isAuthenticated, role, isLoading, isAuthChecking } = useAuth();
  
  // If auth is still loading or checking, don't show anything - show auth loader
  if (isLoading || isAuthChecking) {
    return null; // GlobalLoader will handle this
  }
  
  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/user" replace />;
  }
  
  // Show HomePage for unauthenticated users
  return <HomePage />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <RootIndex />,
      },
      {
        path: "login",
        element: (
          <LoginRoute>
            <LoginPage />
          </LoginRoute>
        ),
      },
      {
        path: "user",
        element: (
          <UserRoute>
            <UserDashboardPage />
          </UserRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/analytics",
        element: (
          <AdminRoute>
            <NotFoundPage />
          </AdminRoute>
        ),
      },
      {
        path: "preview/:monthId",
        element: (
          <AdminRoute>
            <ChartsPreviewPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        ),
      },
      {
        path: "task/:monthId/:taskId",
        element: (
          <UserRoute>
            <TaskDetailPage />
          </UserRoute>
        ),
      },
      {
        path: "admin/task/:monthId/:taskId",
        element: (
          <AdminRoute>
            <TaskDetailPage />
          </AdminRoute>
        ),
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;
