import { useState } from "react";
import { useGetUsersQuery } from "../../redux/services/usersApi";
import DynamicButton from "../../components/button/DynamicButton";
import CreateUserForm from "../../components/user/CreateUserForm";

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
        <div className="card  flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Users</h2>

          <DynamicButton
            variant="danger"
            onClick={() => setShowCreateForm(true)}
            size="sm"
          >
            Create User
          </DynamicButton>
        </div>

        {/* Create User Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 gradient-main   flex items-center justify-center z-50">
            <div className="border border-focus rounded-lg ">
              <CreateUserForm
                onSuccess={handleCreateSuccess}
                onCancel={handleCreateCancel}
              />
            </div>
          </div>
        )}

        <div className="bg-primary rounded-lg shadow p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-primary text-gray-200 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Role</th>
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
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-2`}>
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${u.isOnline ? "bg-green-success" : "bg-red-error"}`}
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
