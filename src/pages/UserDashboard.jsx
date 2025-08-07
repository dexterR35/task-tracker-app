import React from "react";
import { Routes, Route, Link, useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import TaskForm from "../components/TaskForm";
import UserTaskTable from "../components/UserTaskTable";
import UserArchive from "../components/UserArchive";

export default function UserDashboard() {
  const { userId } = useParams();
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if no user is logged in
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Redirect if user tries to access another user's dashboard
  if (!isAdmin && userId !== currentUser.uid) {
    return <Navigate to={`/dashboard/${currentUser.uid}`} />;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <div className="user-dashboard">
      <header className="dashboard-header">
        <div className="flex flex-col items-center">
          <h1>Welcome, {currentUser.role || currentUser.email.split('@')[0]}</h1>
          <p>Let's Work, But not Today</p>
        </div>

        <nav className="dashboard-nav">
          <Link to="." end replace className="nav-link">
            Tasks
          </Link>
          <Link to="archive" replace className="nav-link">
            Archive
          </Link>
          <Link to="new-task" replace className="nav-link">
            Add Task
          </Link>
          {isAdmin && (
            <Link to="/admin" replace className="nav-link admin-link">
              Admin Panel
            </Link>
          )}
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </nav>
      </header>

      <main className="dashboard-content">
        <Routes>
          <Route index element={<UserTaskTable userId={userId} />} />
          <Route path="archive/*" element={<UserArchive userId={userId} />} />
          <Route path="new-task/*" element={<TaskForm userId={userId} />} />
        </Routes>
      </main>
    </div>
  );
}
