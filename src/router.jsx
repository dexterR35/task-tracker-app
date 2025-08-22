// src/router.jsx
import { createBrowserRouter, Navigate, useLocation } from "./hooks/useImports";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import TaskDetailPage from "./pages/others/TaskDetailPage";
import HomePage from "./pages/HomePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import UserDashboardPage from "./pages/user/UserDashboardPage";
import PreviewPage from "./pages/others/PreviewPage";
import NotFoundPage from "./pages/others/NotFoundPage";
import Skeleton from "./components/ui/Skeleton";



// Component to protect login page from authenticated users
const LoginRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) {
    const from = location.state?.from || "/dashboard";
    return <Navigate to={from} replace />;
  }
  return children;
};

// Component to protect routes that require authentication
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, initialAuthResolved } = useAuth();
  const location = useLocation();

  if (!initialAuthResolved) {
    return alert("Initial auth resolved");
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

// Root index wrapper: redirect authenticated users directly to dashboard
const RootIndex = () => {
  const { isAuthenticated, role, initialAuthResolved } = useAuth();
  if (!initialAuthResolved) return <Skeleton variant="card" className="min-h-screen" />;
  if (!isAuthenticated) return <HomePage />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/user" replace />;
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
            <AdminAnalyticsPage />
          </AdminRoute>
        ),
      },
      {
        path: "preview/:monthId",
        element: (
          <AdminRoute>
            <PreviewPage />
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
