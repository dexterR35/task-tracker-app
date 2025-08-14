import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { createNewUser, getAllUsers } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useFirestore';
import { useNotifications } from '../hooks/useNotifications';
import DynamicButton from '../components/DynamicButton';
import ErrorDisplay from '../components/ErrorDisplay';

function ManageUsersPage() {
  const { user: currentUser, reset: resetAuth } = useAuth();
  const { data: users, fetchData: fetchUsers, loading: usersLoading } = useUsers();
  const { addSuccess, addError, addInfo } = useNotifications();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      await fetchUsers({
        orderBy: [['createdAt', 'desc']]
      });
      addSuccess('Users loaded successfully!');
    } catch (error) {
      addError('Failed to load users');
      console.error('Error loading users:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Always create users with 'user' role
      const userData = { ...formData, role: 'user' };
      const result = await createNewUser(userData);
      
      if (result.success) {
        addSuccess(result.message || 'User created successfully!');
        setFormData({ name: '', email: '', password: '' });
        setShowCreateModal(false);
        
        // Check if admin re-authentication is required (free tier)
        if (result.requiresAdminReauth) {
          addInfo('Please sign back in to continue as admin');
          resetAuth();
          navigate('/login');
        } else {
          loadUsers(); // Refresh the users list only if still authenticated
        }
      }
    } catch (error) {
      addError(error.message || 'Failed to create user');
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUserDashboard = (user) => {
    addInfo(`Viewing ${user.name}'s dashboard...`);
    navigate(`/dashboard/${user.userUID}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600 mt-1">Create and manage user accounts (all users have 'user' role)</p>
        </div>
        <DynamicButton
          id="create-user-btn"
          variant="primary"
          icon={UserPlusIcon}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <span>Create User</span>
        </DynamicButton>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Users ({users.length})</h2>
        </div>
        
        {usersLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No users found. Create your first user!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <DynamicButton
                          id={`view-user-${user.id}`}
                          variant="outline"
                          size="sm"
                          icon={EyeIcon}
                          onClick={() => handleViewUserDashboard(user)}
                          className="p-1"
                          successMessage={`Navigating to ${user.name}'s dashboard`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength="6"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> All created users will have 'user' role by default. Only marian@netbet.ro has admin privileges.
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <DynamicButton
                  id="cancel-create-user"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </DynamicButton>
                <DynamicButton
                  id="submit-create-user"
                  type="submit"
                  variant="primary"
                  loading={loading}
                  loadingText="Creating..."
                  successMessage="User created successfully!"
                  className="flex-1"
                >
                  Create User
                </DynamicButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsersPage;
