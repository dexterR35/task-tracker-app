import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function UserDashboard() {
  const { uid } = useParams();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [viewingUser, setViewingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Determine if admin is viewing another user's dashboard
  const isViewingOtherUser = uid && uid !== currentUser?.uid;
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isViewingOtherUser && isAdmin) {
      fetchUserDetails(uid);
    } else {
      setViewingUser(currentUser);
    }
  }, [uid, currentUser, isViewingOtherUser, isAdmin]);

  const fetchUserDetails = async (userUID) => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'users'), where('userUID', '==', userUID));
      const querySnapshot = await getDocs(usersQuery);
      
      if (querySnapshot.empty) {
        toast.error('User not found');
        return;
      }
      
      const userData = querySnapshot.docs[0].data();
      setViewingUser(userData);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-center text-gray-600">Loading user dashboard...</p>
        </div>
      </div>
    );
  }

  const displayUser = viewingUser || currentUser;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        {isViewingOtherUser && isAdmin && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Admin View:</span> You are viewing {displayUser?.email}'s dashboard
            </p>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isViewingOtherUser ? `${displayUser?.email}'s Dashboard` : 'My Dashboard'}
          </h1>
          <p className="text-gray-600">
            {isViewingOtherUser 
              ? `Profile information for ${displayUser?.name || displayUser?.email}` 
              : `Welcome back, ${displayUser?.name || displayUser?.email}!`
            }
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions - Only show for own dashboard */}
          {!isViewingOtherUser && (
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                  Create New Task
                </button>
                <button className="w-full bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 transition-colors">
                  View All Tasks
                </button>
              </div>
            </div>
          )}

          {/* Task Statistics */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-green-900 mb-3">Task Statistics</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Total Tasks:</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Completed:</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">In Progress:</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Pending:</span>
                <span className="font-medium">--</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-purple-900 mb-3">Recent Activity</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-purple-700">No recent activity</span>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="bg-gray-50 p-6 rounded-lg md:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Profile Information</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">User ID:</span>
                <span className="ml-2 text-gray-600">{displayUser?.userUID}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-600">{displayUser?.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-600">{displayUser?.name || 'Not set'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Role:</span>
                <span className="ml-2 text-gray-600 capitalize">{displayUser?.role}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Member Since:</span>
                <span className="ml-2 text-gray-600">
                  {displayUser?.createdAt 
                    ? new Date(displayUser.createdAt.seconds ? displayUser.createdAt.seconds * 1000 : displayUser.createdAt).toLocaleDateString() 
                    : 'Unknown'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;


