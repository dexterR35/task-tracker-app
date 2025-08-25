import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../shared/hooks/useNotifications";
import { useSubscribeToUsersQuery } from "../../features/users/usersApi";
import CreateUserForm from "../../features/users/components/CreateUserForm";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import PageLoader from "../../shared/components/ui/PageLoader";
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
        <div className="card">
          <h3 className="text-red-error font-medium">Error loading users</h3>
          <p className="text-red-errpr mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-10">
      <h2>Users</h2>
     <div className="flex-center !flex-row !items-end !justify-between border-b border-gray-700 pb-2 mb-4 mt-10">
        <h3 className="mb-0">Users Management</h3>
 
        <DynamicButton
          id="create-user-btn"
          variant="outline"
          size="md"
          className="w-38"
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
        <PageLoader 
          text="Loading users..." 
          size="md"
          variant="dots"
        />
      ) : (
        <div className="bg-primary rounded-lg shadow p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-secondary text-gray-200 uppercase text-md ">
                <tr>
                  <th className="px-3 py-4 text-left">Name</th>
                  <th className="px-3 py-4 text-left">Email</th>
                  <th className="px-3 py-4 text-left">Role</th>
                  <th className="px-3 py-4 text-left">Occupation</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={4}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr 
                      key={u.userUID || u.id} 
                      className="border-t hover:bg-hover cursor-pointer"
                      onClick={() => handleUserClick(u)}
                    >
                      <td className="px-3 py-4 font-medium capitalize">{u.name || "-"}</td>
                      <td className="px-3 py-4">{u.email}</td>
                      <td className="px-3 py-4 capitalize">{u.role}</td>
                      <td className="px-3 py-4 capitalize">{u.occupation || "-"}</td>
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
