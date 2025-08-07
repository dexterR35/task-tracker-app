import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import AdminUserManagement from '../components/AdminUserManagement';
import '../styles/admin.css';

import {
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore'; // Make sure to import Firestore utilities
import { db } from '../firebase'; // Your firebase config import

const AdminPanel = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { mockUsers } = await import('../mockData');
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const generateCSV = async (userId = null) => {
    if (!selectedMonth) {
      alert('Please select a month first');
      return;
    }

    try {
      setLoading(true);
      let allTasks = [];

      try {
        if (userId) {
          // Download for specific user
          const tasksRef = collection(db, 'users', userId, 'months', selectedMonth, 'tasks');
          const q = query(tasksRef, orderBy('createdAt'));
          const snapshot = await getDocs(q);
          allTasks = snapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate().toISOString(),
          }));
        } else {
          // Download for all users
          for (const user of users) {
            const tasksRef = collection(db, 'users', user.id, 'months', selectedMonth, 'tasks');
            const q = query(tasksRef, orderBy('createdAt'));
            const snapshot = await getDocs(q);
            const userTasks = snapshot.docs.map(doc => ({
              ...doc.data(),
              createdAt: doc.data().createdAt.toDate().toISOString(),
            }));
            allTasks = [...allTasks, ...userTasks];
          }
        }
      } catch (firebaseError) {
        console.warn('Failed to get data from Firebase, falling back to mock data:', firebaseError);
        const { mockUserTasks } = await import('../mockData');
        const tasks = userId ? mockUserTasks[userId] || [] : Object.values(mockUserTasks).flat();
        allTasks = tasks;
      }

      if (allTasks.length === 0) {
        alert('No data found for the selected month');
        return;
      }

      const headers = [
        'User Email',
        'Jira Link',
        'Ticket Type',
        'Market',
        'Department',
        'AI Used',
        'AI Model',
        'Time User',
        'Time AI',
        'Created At',
      ].join(',');

      const rows = allTasks.map(task =>
        [
          task.userEmail || '',
          task.jiraLink || '',
          task.ticketType || task.taskType || '',
          task.market || '',
          task.department || '',
          task.aiUsed || '',
          task.aiModel || '',
          task.timeUser || '',
          task.timeAi || '',
          task.createdAt || '',
        ].join(',')
      );

      const csvContent = [headers, ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks-${selectedMonth}${userId ? `-${userId}` : ''}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Error generating CSV file');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableMonths = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthStr);
    }
    return months;
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <div className="user-controls">
          <span>Admin: {currentUser.email}</span>
          <button onClick={() => navigate('/')}>Dashboard</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-tabs">
          <div className="tab-buttons">
            <button
              className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              User Management
            </button>
            <button
              className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reports
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'users' && (
              <div className="tab-panel">
                <AdminUserManagement />
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="tab-panel">
                <div className="report-controls">
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    required
                  >
                    <option value="">Select Month</option>
                    {getAvailableMonths().map(month => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => generateCSV()}
                    disabled={!selectedMonth || loading}
                    className="generate-button"
                  >
                    {loading ? 'Generating...' : 'Download All Users Report'}
                  </button>
                </div>

                {users.length > 0 && (
                  <div className="users-list">
                    <h2>Download by User</h2>
                    {users.map(user => (
                      <div key={user.id} className="user-card">
                        <div className="user-info">
                          <h3>{user.name || user.email}</h3>
                          <p>{user.email}</p>
                        </div>
                        <button
                          onClick={() => generateCSV(user.id)}
                          disabled={!selectedMonth || loading}
                          className="generate-button"
                        >
                          {loading ? 'Generating...' : 'Download User Report'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
