// src/router.jsx
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../shared/hooks/useAuth";
import { useSelector } from "react-redux";
import { selectIsAdmin, selectCanAccessAdmin, selectCanAccessUser } from "../features/auth/authSlice";
import Layout from "../shared/components/layout/Layout";
import Loader from "../shared/components/ui/Loader";
import LoginPage from "../pages/auth/LoginPage";
import TaskDetailPage from "../pages/dashboard/TaskDetailPage";
import HomePage from "../pages/dashboard/HomePage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import NotFoundPage from "../pages/NotFoundPage";

// Protect login page from authenticated users
const LoginRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isAuthChecking, user } = useAuth();
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();

  if (isLoading || isAuthChecking) {
    return (
      <div className="min-h-screen flex-center bg-primary" role="status" aria-busy="true">
        <Loader size="xl" text="Checking session..." variant="spinner" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Redirect based on user role using selector
    const from = location.state?.from || "/";
    const defaultRoute = isAdmin ? "/admin" : "/user";
    const redirectTo = from === "/" ? defaultRoute : from;
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

// Simple route protection with role-based access
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading, isAuthChecking, error } = useAuth();
  const canAccessAdmin = useSelector(selectCanAccessAdmin);
  const canAccessUser = useSelector(selectCanAccessUser);
  const location = useLocation();

  if (isLoading || isAuthChecking) {
    return (
      <div className="min-h-screen flex-center bg-primary" role="status" aria-busy="true">
        <Loader size="xl" text="Checking session..." variant="spinner" />
      </div>
    );
  }

  // Handle authentication errors
  if (error) {
    console.error("Authentication error:", error);
    return <Navigate to="/login" replace state={{ error: error }} />;
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    );
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

  // Check role-based access using selectors
  if (requiredRole === "admin" && !canAccessAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  if (requiredRole === "user" && !canAccessUser) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Admin-only routes
const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);

// User routes (accessible by both users and admins)
const UserRoute = ({ children }) => (
  <ProtectedRoute requiredRole="user">
    {children}
  </ProtectedRoute>
);

// Root index wrapper: redirect authenticated users based on role
const RootIndex = () => {
  const { isAuthenticated, user, isLoading, isAuthChecking } = useAuth();
  const isAdmin = useSelector(selectIsAdmin);

  if (isLoading || isAuthChecking) {
    return (
      <div className="min-h-screen flex-center bg-primary" role="status" aria-busy="true">
        <Loader size="xl" text="Checking session..." variant="spinner" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Check if user account is active
    if (user.isActive === false) {
      return <Navigate to="/login" replace state={{ error: "Account is deactivated. Please contact administrator." }} />;
    }

    // Redirect based on user role using selector
    const redirectTo = isAdmin ? "/admin" : "/user";
    return <Navigate to={redirectTo} replace />;
  }

  return <HomePage />;
};

// Unauthorized page component
const UnauthorizedPage = () => {
  const { user } = useAuth();
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();
  const error = location.state?.error;

  return (
    <div className="min-h-screen flex-center bg-primary">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        {error && (
          <p className="text-gray-700 mb-4">{error}</p>
        )}
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
          <LoginRoute>
            <LoginPage />
          </LoginRoute>
        ),
      },
      {
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },
      {
        path: "user",
        element: (
          <UserRoute>
            <DashboardPage />
          </UserRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <AdminRoute>
            <DashboardPage />
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
        path: "admin/users",
        element: (
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        ),
      },
      {
        path: "preview/:monthId",
        element: (
          <AdminRoute>
            <NotFoundPage />
          </AdminRoute>
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
        path: "admin/analytics",
        element: (
          <AdminRoute>
            <NotFoundPage /> {/* Placeholder for future analytics page */}
          </AdminRoute>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;
