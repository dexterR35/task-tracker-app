import React from "react";
import { useNavigate } from "react-router-dom";
import { useSubscribeToUsersQuery } from "../../features/users/usersApi";
import Loader from "../../shared/components/ui/Loader";
import { format } from "date-fns";

const AdminUsersPage = () => {
  const navigate = useNavigate();

  // API hooks
  const { data: users = [], error: usersError, isLoading } = useSubscribeToUsersQuery();
  

  


  // Handle user click to view their tasks
  const handleUserClick = (user) => {
    const userId = user.userUID || user.id;
    navigate(`/admin?user=${userId}`);
  };

  // Show error state
  if (usersError) {
    return (
      <div className="bg-red-error border rounded-lg p-6 text-center text-white">
        <p className="text-sm">
          Error loading users: {usersError.message || "Unknown error"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-white text-red-error rounded hover:bg-gray-100"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Loader 
        size="xl" 
        variant="spinner" 
        text="Please wait..." 
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Users</h1>
            <p className="text-sm text-gray-300">
              Click on a user to view their tasks
            </p>
          </div>

          {/* Users Table */}
          <div className="bg-primary p-6 border rounded-lg overflow-x-auto shadow-sm">
            <div className="flex-center !mx-0 !justify-between p-3 text-xs text-gray-300">
              <div>
                Showing {users.length} users
              </div>
            </div>

            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-800">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Occupation</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="border-b border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => handleUserClick(user)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-blue-400 hover:text-blue-300">
                        {user.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span>{user.email || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === "admin" 
                          ? "bg-red-100 text-red-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {user.role || "user"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span>{user.occupation || "N/A"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty state */}
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No users found.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

export default AdminUsersPage;
