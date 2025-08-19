import React from 'react';
import { useGetUsersQuery, useCreateUserMutation } from '../redux/services/usersApi';
import DynamicButton from '../components/DynamicButton';

const AdminUsersPage = () => {
  const { data: users = [], isLoading } = useGetUsersQuery();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();

  const onSubmit = async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '').trim();
    if (!email || !password) return;
    await createUser({ email, password, name }).unwrap();
    if (formEl && typeof formEl.reset === 'function') formEl.reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Users</h2>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Create User</h3>
          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" type="text" className="border rounded px-3 py-2 w-full" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
              <input name="email" type="email" className="border rounded px-3 py-2 w-full" placeholder="user@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
              <input name="password" type="password" className="border rounded px-3 py-2 w-full" placeholder="min 6 chars" required />
            </div>
            <div className="sm:col-span-2 lg:col-span-5">
              <DynamicButton type="submit" variant="primary" loading={creating} loadingText="Creating...">Create User</DynamicButton>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-left">UID</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="px-3 py-3" colSpan={4}>
                    <div className="h-5 w-40 skeleton rounded mb-2" />
                    <div className="h-5 w-64 skeleton rounded" />
                  </td></tr>
                ) : users.length === 0 ? (
                  <tr><td className="px-3 py-3" colSpan={4}>No users found.</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{u.name || '-'}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">{u.role}</td>
                    <td className="px-3 py-2">{u.userUID || u.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;


