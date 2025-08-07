import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

export default function Dashboard() {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Task Tracker</h1>
        <div className="user-controls">
          <span>Welcome, {currentUser.name}!</span>
          {isAdmin && (
            <button onClick={() => navigate('/admin')} className="admin-button">
              Admin Panel
            </button>
          )}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main>
        <TaskForm />
        <TaskList />
      </main>
    </div>
  );
}