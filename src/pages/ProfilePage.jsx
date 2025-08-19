import React from 'react';
import { useAuth } from '../hooks/useAuth';

const ProfilePage = () => {
  const { user, role } = useAuth();
  if (!user) return null;
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Name</div>
              <div className="text-base font-medium">{user.name || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-base font-medium">{user.email || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Role</div>
              <div className="text-base font-medium capitalize">{role}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">UID</div>
              <div className="text-base font-mono break-all">{user.uid}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;


