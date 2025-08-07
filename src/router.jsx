import { createBrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminRoute from './auth/AdminRoute';
import Root from './pages/Root';
import TaskForm from './components/TaskForm';
import UserTaskTable from './components/UserTaskTable';
import UserArchive from './components/UserArchive';

const options = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_partialHydration: true,
    v7_normalizeFormMethod: true,
    v7_fetcherPersist: true,
    v7_skipActionErrorRevalidation: true,
  },
};

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Root />,
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/dashboard/:userId',
      element: (
        <ProtectedRoute>
          <UserDashboard />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <UserTaskTable /> },
        { path: 'archive', element: <UserArchive /> },
        { path: 'new-task', element: <TaskForm /> },
      ],
    },
    {
      path: '/admin',
      element: (
        <AdminRoute>
          <AdminPanel />
        </AdminRoute>
      ),
    },
  ],
  options
);

export default router;
