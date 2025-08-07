import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTasks, setUserTasks] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User'
  });
  const { createUser, deleteUser, updateUser } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Get users from mockData for now, later can be replaced with actual API call
      const { mockUsers } = await import('../mockData');
      setUsers(mockUsers);
    } catch (error) {
      setError('Error fetching users: ' + error.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await createUser(newUser);
      setSuccess('User created successfully!');
      setNewUser({ name: '', email: '', password: '', role: 'User' });
      fetchUsers(); // Refresh user list
    } catch (error) {
      setError('Failed to create user: ' + error.message);
    }
  };

  const handleViewTasks = async (user) => {
    try {
      const { mockUserTasks } = await import('../mockData');
      const tasks = mockUserTasks[user.uid] || [];
      setUserTasks(tasks);
      setSelectedUser(user);
    } catch (error) {
      setError('Error fetching user tasks: ' + error.message);
    }
  };

  const handleExportTasks = async (user) => {
    try {
      const { mockUserTasks } = await import('../mockData');
      const tasks = mockUserTasks[user.uid] || [];
      const filteredTasks = selectedMonth 
        ? tasks.filter(task => {
            const taskMonth = new Date(task.createdAt).getMonth() + 1;
            return taskMonth.toString().padStart(2, '0') === selectedMonth;
          })
        : tasks;

      // Create CSV content
      const headers = ['Date', 'Task Type', 'Market', 'Department', 'AI Used', 'Time Used', 'LP Number', 'Jira Link'];
      const csvContent = [
        headers.join(','),
        ...filteredTasks.map(task => [
          new Date(task.createdAt).toLocaleDateString(),
          task.taskType,
          task.market,
          task.department,
          task.aiUsed,
          task.timeUser,
          task.lpNumber,
          task.jiraLink
        ].join(','))
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${user.name}_tasks_${selectedMonth || 'current'}_month.csv`;
      link.click();
      setSuccess('Tasks exported successfully!');
    } catch (error) {
      setError('Error exporting tasks: ' + error.message);
    }
  };

  const handleEditUser = (user) => {
    setNewUser({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    // You could add editing mode state and UI here
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        await deleteUser(user.uid);
        setSuccess('User deleted successfully!');
        fetchUsers();
      } catch (error) {
        setError('Error deleting user: ' + error.message);
      }
    }
  };

  return (
    <div className="admin-user-management">
      <h2>User Management</h2>
      
      {/* Create User Form */}
      <div className="create-user-form">
        <h3>Create New User</h3>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={newUser.name}
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <button type="submit">Create User</button>
        </form>
      </div>

      {/* User List */}
      <div className="user-list">
        <h3>Existing Users</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button 
                    onClick={() => handleViewTasks(user)}
                    className="view-button"
                  >
                    View Tasks
                  </button>
                  <button 
                    onClick={() => handleExportTasks(user)}
                    className="export-button"
                  >
                    Export CSV
                  </button>
                  <button 
                    onClick={() => handleEditUser(user)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Task History Modal */}
      {selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Tasks for {selectedUser.name}</h3>
              <button onClick={() => setSelectedUser(null)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="date-filter">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">Current Month</option>
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                <button onClick={() => handleExportTasks(selectedUser)} className="export-button">
                  Export Selected Month
                </button>
              </div>
              <div className="tasks-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Task Type</th>
                      <th>Market</th>
                      <th>Department</th>
                      <th>AI Used</th>
                      <th>Time Used</th>
                      <th>LP Number</th>
                      <th>Jira Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userTasks.map((task) => (
                      <tr key={task.id}>
                        <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                        <td>{task.taskType}</td>
                        <td>{task.market}</td>
                        <td>{task.department}</td>
                        <td>{task.aiUsed}</td>
                        <td>{task.timeUser} hrs</td>
                        <td>{task.lpNumber}</td>
                        <td>
                          <a href={task.jiraLink} target="_blank" rel="noopener noreferrer">
                            View Jira
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
