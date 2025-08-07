import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';

export default function TaskList() {
  const { currentUser, userRole } = useAuth();
  const isAdmin = userRole === 'Admin';
  const [tasks, setTasks] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(isAdmin ? 'all' : currentUser?.uid);

  function getCurrentMonth() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  useEffect(() => {
    fetchAvailableMonths();
    fetchTasks();

    // Add listener for task updates
    const handleTaskUpdate = () => {
      fetchTasks();
    };
    window.addEventListener('taskUpdated', handleTaskUpdate);

    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdate);
    };
  }, [selectedMonth, selectedUser]);

  const fetchAvailableMonths = async () => {
    try {
      // Generate last 12 months
      const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      });
      setAvailableMonths(months);
    } catch (error) {
      console.error('Error generating months:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Get tasks from localStorage, organized by user
      const userTasks = JSON.parse(localStorage.getItem('userTasks') || '{}');
      
      // Get users from testUsers
      const mockUsers = [
        { id: 'bogdan', email: 'bogdan@netbet.ro', role: 'Bogdan' },
        { id: 'razvan', email: 'razvan@netbet.ro', role: 'Razvan' },
        { id: 'danela', email: 'danela@netbet.ro', role: 'Danela' },
        { id: 'marean', email: 'marean@netbet.ro', role: 'Marean' },
        { id: 'admin', email: 'admin@netbet.ro', role: 'Admin' }
      ];
      setUsers(mockUsers);

      // Get tasks based on user role and filter them
      const userSpecificTasks = isAdmin ? 
        Object.values(userTasks).flat() : // Admin sees all tasks
        (userTasks[currentUser.uid] || []); // Regular users see their own tasks

      // Further filter by selected user and month
      const tasksForCurrentView = userSpecificTasks
        .filter(task => selectedUser === 'all' ? true : task.userId === selectedUser)
        .filter(task => {
          const taskMonth = task.month || new Date(task.createdAt).toISOString().slice(0, 7);
          return taskMonth === selectedMonth;
        });
      
      setTasks(tasksForCurrentView);
      
      // Filter tasks based on user role and selection
      const filteredTasks = allTasks
        .filter(task => selectedUser === 'all' ? true : task.userId === selectedUser)
        .filter(task => {
          const taskMonth = new Date(task.createdAt).toISOString().slice(0, 7);
          return taskMonth === selectedMonth;
        });
      
      setTasks(filteredTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-list">
      <div className="list-controls">
        <h2>Task Archive</h2>
        <div className="filters">
          {isAdmin && (
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              className="user-filter"
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          )}
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-filter"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div>No tasks found for this period.</div>
      ) : (
        <div className="tasks-grid">
          {tasks.map(task => (
            <div key={task.id} className="task-card">
              <h3>
                <a href={task.jiraLink} target="_blank" rel="noopener noreferrer">
                  View Jira Ticket
                </a>
              </h3>
              <div className="task-details">
                {isAdmin && (
                  <p><strong>User:</strong> {task.userEmail}</p>
                )}
                <p><strong>Market:</strong> {task.market}</p>
                <p><strong>Department:</strong> {task.department}</p>
                <p><strong>Task Type:</strong> {task.taskType}</p>
                {task.taskType === 'LP' && (
                  <p><strong>Landing Pages:</strong> {task.lpNumber}</p>
                )}
                {task.taskType === 'Banners' && (
                  <p><strong>Banners:</strong> {task.bannerNumber}</p>
                )}
                {task.taskType === 'Misc' && (
                  <p><strong>Details:</strong> {task.miscInfo}</p>
                )}
                <p><strong>Time Spent:</strong> {task.timeUser}h</p>
                {task.aiUsed === 'Yes' && (
                  <>
                    <p><strong>AI Model:</strong> {task.aiModel === 'Other' ? task.otherAiModel : task.aiModel}</p>
                    <p><strong>AI Time:</strong> {task.timeAi}h</p>
                  </>
                )}
                <p><strong>Old Task:</strong> {task.isOldTask}</p>
                <p><strong>Created:</strong> {task.createdAt.toLocaleDateString()}</p>
              </div>
              {task.isOldTask === 'Yes' && (
                <div className="task-actions">
                  <button onClick={() => handleEdit(task.id)}>Edit</button>
                  <button onClick={() => handleDelete(task.id)} className="delete">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}