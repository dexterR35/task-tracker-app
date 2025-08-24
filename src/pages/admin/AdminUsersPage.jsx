import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../shared/hooks/useNotifications";
import { useSubscribeToUsersQuery } from "../../features/users/usersApi";
import CreateUserForm from "../../features/users/components/CreateUserForm";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import { PlusIcon } from "@heroicons/react/24/outline";

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { addSuccess, addError } = useNotifications();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Use real-time subscription for live updates
  const { data: users = [], isLoading, error } = useSubscribeToUsersQuery();

  const handleUserCreated = (newUser) => {
    addSuccess(`User ${newUser.name} created successfully!`);
    setShowCreateForm(false);
  };

  const handleCreateError = (error) => {
    addError(`Failed to create user: ${error.message}`);
  };

  const handleUserClick = (user) => {
    navigate(`/admin?user=${user.userUID || user.id}`);
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading users</h3>
          <p className="text-red-600 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <DynamicButton
          id="create-user-btn"
          variant="primary"
          size="md"
          icon={PlusIcon}
          onClick={() => setShowCreateForm(true)}
        >
          Create User
        </DynamicButton>
      </div>

      {showCreateForm && (
        <div className="mb-6">
          <CreateUserForm
            onSuccess={handleUserCreated}
            onError={handleCreateError}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {isLoading ? (
        <div className="bg-primary rounded-lg shadow p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-primary rounded-lg shadow p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-primary text-gray-200 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={3}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr 
                      key={u.userUID || u.id} 
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleUserClick(u)}
                    >
                      <td className="px-3 py-2 font-medium">{u.name || "-"}</td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2">{u.role}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
