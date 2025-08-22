import { useState } from "react";
import { useGetUsersQuery } from "../redux/services/usersApi";

import CreateUserForm from "../components/user/CreateUserForm";

const AdminUsersPage = () => {
  const { data: users = [], isLoading, error } = useGetUsersQuery();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateSuccess = (newUser) => {
    setShowCreateForm(false);
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-primary rounded-lg shadow-md p-6 mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Users</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create User
          </button>
        </div>

        {/* Create User Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <CreateUserForm
                onSuccess={handleCreateSuccess}
                onCancel={handleCreateCancel}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-left">UID</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={5}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.userUID || u.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{u.name || "-"}</td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2">{u.role}</td>
                      <td className="px-3 py-2">{u.userUID || u.id}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-2`}>
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${u.isOnline ? "bg-green-500" : "bg-red-400"}`}
                          ></span>
                          {u.isOnline ? "Online" : "Offline"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
