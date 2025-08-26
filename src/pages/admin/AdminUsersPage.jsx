import React, { useState } from "react";
import { useAuth } from "../../shared/hooks/useAuth";
import { showSuccess, showError } from "../../shared/utils/toast";
import { useSubscribeToUsersQuery, useUpdateUserMutation, useDeleteUserMutation } from "../../features/users/usersApi";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import DashboardLoader from "../../shared/components/ui/DashboardLoader";
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { sanitizeText } from "../../shared/utils/sanitization";
import { logger } from "../../shared/utils/logger";

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();

  // Local state
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [rowActionId, setRowActionId] = useState(null);

  // API hooks
  const { data: users = [], error: usersError } = useSubscribeToUsersQuery();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  // Handle edit user
  const startEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: sanitizeText(user.name || ""),
      email: sanitizeText(user.email || ""),
      role: user.role || "user",
      occupation: sanitizeText(user.occupation || ""),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      setRowActionId(editingId);

      const updates = {
        name: form.name,
        email: form.email,
        role: form.role,
        occupation: form.occupation,
      };

      await updateUser({ id: editingId, updates }).unwrap();
      logger.log("[AdminUsersPage] updated user", { id: editingId, updates });
      showSuccess("User updated successfully!");
    } catch (e) {
      logger.error("User update error:", e);
      showError(`Failed to update user: ${e.message || "Please try again."}`);
    } finally {
      setEditingId(null);
      setRowActionId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const removeUser = async (user) => {
    if (!window.confirm("Delete this user?")) return;
    if (user.id === currentUser?.uid) {
      showError("You cannot delete yourself!");
      return;
    }

    try {
      setRowActionId(user.id);
      await deleteUser({ id: user.id }).unwrap();
      showSuccess("User deleted successfully!");
    } catch (e) {
      logger.error("User delete error:", e);
      showError(`Failed to delete user: ${e.message || "Please try again."}`);
    } finally {
      setRowActionId(null);
    }
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

  return (
    <DashboardLoader>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">User Management</h1>
            <p className="text-sm text-gray-300">
              Manage user accounts, roles, and permissions
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
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-800">
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-2 py-1 border rounded bg-gray-700 text-white"
                        />
                      ) : (
                        <span>{user.name || "N/A"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-2 py-1 border rounded bg-gray-700 text-white"
                        />
                      ) : (
                        <span>{user.email || "N/A"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <select
                          value={form.role}
                          onChange={(e) => setForm({ ...form, role: e.target.value })}
                          className="w-full px-2 py-1 border rounded bg-gray-700 text-white"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === "admin" 
                            ? "bg-red-100 text-red-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {user.role || "user"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <input
                          type="text"
                          value={form.occupation}
                          onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                          className="w-full px-2 py-1 border rounded bg-gray-700 text-white"
                        />
                      ) : (
                        <span>{user.occupation || "N/A"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <div className="flex space-x-2">
                          <DynamicButton
                            onClick={saveEdit}
                            variant="success"
                            size="xs"
                            icon={CheckIcon}
                            loading={rowActionId === user.id}
                          >
                            Save
                          </DynamicButton>
                          <DynamicButton
                            onClick={cancelEdit}
                            variant="outline"
                            size="xs"
                            icon={XMarkIcon}
                          >
                            Cancel
                          </DynamicButton>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <DynamicButton
                            onClick={() => startEdit(user)}
                            variant="outline"
                            size="xs"
                            icon={PencilIcon}
                          >
                            Edit
                          </DynamicButton>
                          <DynamicButton
                            onClick={() => removeUser(user)}
                            variant="danger"
                            size="xs"
                            icon={TrashIcon}
                            loading={rowActionId === user.id}
                            disabled={user.id === currentUser?.uid}
                          >
                            Delete
                          </DynamicButton>
                        </div>
                      )}
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
    </DashboardLoader>
  );
};

export default AdminUsersPage;
