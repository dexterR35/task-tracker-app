/**
 * User Profile Page
 * 
 * @fileoverview Profile page with tabs and cards like analytics page
 * @author Senior Developer
 * @version 5.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Icons } from '@/components/icons';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import TextField from '@/components/forms/components/TextField';
import PasswordField from '@/components/forms/components/PasswordField';
import { CARD_SYSTEM } from '@/constants';
import { logger } from '@/utils/logger';
import SmallCard from '@/components/Card/smallCards/SmallCard';

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Static form data for now
  const [formData, setFormData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@netbet.ro',
    department: user?.department || 'Design',
    role: user?.role || 'user',
    userUID: user?.userUID || 'user_123456',
    phone: '+40 123 456 789',
    location: 'Bucharest, Romania',
    joinDate: 'January 15, 2024',
    lastLogin: 'Today, 2:30 PM'
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Get user's color based on role
  const getUserColor = () => {
    const role = user?.role || 'user';
    return CARD_SYSTEM.COLOR_HEX_MAP[role === 'admin' ? 'crimson' : 'purple'];
  };

  const userColor = getUserColor();

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle password input changes
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (import.meta.env.MODE === 'development') {
        logger.log('Profile updated:', formData);
      }
      setIsEditing(false);
    } catch (error) {
      logger.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        alert('New password must be at least 6 characters');
        return;
      }

      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (import.meta.env.MODE === 'development') {
        logger.log('Password changed');
      }
      
      // Clear password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setIsChangingPassword(false);
    } catch (error) {
      logger.error('Error changing password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData({
      name: user?.name || 'John Doe',
      email: user?.email || 'john.doe@netbet.ro',
      department: user?.department || 'Design',
      role: user?.role || 'user',
      userUID: user?.userUID || 'user_123456',
      phone: '+40 123 456 789',
      location: 'Bucharest, Romania',
      joinDate: 'January 15, 2024',
      lastLogin: 'Today, 2:30 PM'
    });
    setIsEditing(false);
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  // Tab change handler
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Profile tabs configuration
  const profileTabs = useMemo(() => [
    {
      id: 'profile',
      name: 'Profile',
      description: 'Personal information, account details, and settings'
    },
  ], []);


  // Create profile cards data
  const profileCards = [
    {
      id: 'user-info',
      title: 'Personal Information',
      subtitle: 'Basic Details',
      description: 'Your personal data',
      icon: Icons.generic.user,
      color: 'purple',
      value: formData.name,
      badge: {
        text: formData.role.toUpperCase(),
        color: 'purple'
      },
      content: (
        <div className="flex items-center space-x-4 mb-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: userColor }}
          >
            {formData.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{formData.name}</h3>
            <p className="text-sm text-gray-400">{formData.email}</p>
            <p className="text-xs text-gray-500">{formData.department}</p>
          </div>
        </div>
      ),
      details: [
        { label: 'Full Name', value: formData.name },
        { label: 'Email', value: formData.email },
        { label: 'Department', value: formData.department },
        { label: 'Phone', value: formData.phone },
        { label: 'Location', value: formData.location },
      ]
    },
    {
      id: 'account-details',
      title: 'Account Details',
      subtitle: 'System Information',
      description: 'Account Status',
      icon: Icons.generic.settings,
      color: 'blue',
      value: 'Active',
      badge: {
        text: 'Online',
        color: 'blue'
      },
      details: [
        { label: 'User ID', value: formData.userUID },
        { label: 'Email', value: formData.email },
        { label: 'Role', value: formData.role.toUpperCase() },
        { label: 'Status', value: 'Active' },
        { label: 'Member Since', value: formData.joinDate },
        { label: 'Last Login', value: formData.lastLogin },
      ]
    },
    {
      id: 'security-settings',
      title: 'Security Settings',
      subtitle: 'Password & Security',
      description: 'Account Security',
      icon: Icons.generic.settings,
      color: 'amber',
      value: 'Protected',
      badge: {
        text: 'Secure',
        color: 'amber'
      },
      content: isChangingPassword ? (
        <div className="space-y-4">
          <PasswordField
            field={{
              name: 'currentPassword',
              type: 'password',
              label: 'Current Password',
              required: true,
              placeholder: 'Enter current password'
            }}
            register={() => {}}
            errors={{}}
            setValue={(field, value) => handlePasswordChange(field, value)}
            watch={() => passwordData.currentPassword}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={passwordData}
          />
          
          <PasswordField
            field={{
              name: 'newPassword',
              type: 'password',
              label: 'New Password',
              required: true,
              placeholder: 'Enter new password'
            }}
            register={() => {}}
            errors={{}}
            setValue={(field, value) => handlePasswordChange(field, value)}
            watch={() => passwordData.newPassword}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={passwordData}
          />
          
          <PasswordField
            field={{
              name: 'confirmPassword',
              type: 'password',
              label: 'Confirm New Password',
              required: true,
              placeholder: 'Confirm new password'
            }}
            register={() => {}}
            errors={{}}
            setValue={(field, value) => handlePasswordChange(field, value)}
            watch={() => passwordData.confirmPassword}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={passwordData}
          />
          
          <div className="flex space-x-3">
            <DynamicButton
              onClick={handleChangePassword}
              loading={isLoading}
              iconName="save"
              className="flex-1"
            >
              Change Password
            </DynamicButton>
            <DynamicButton
              onClick={handleCancel}
              variant="outline"
              iconName="cancel"
              className="flex-1"
            >
              Cancel
            </DynamicButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.amber}10`,
              borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.amber}20`
            }}
          >
            <div className="flex items-center space-x-3">
              <Icons.generic.settings className="w-5 h-5" style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.amber }} />
              <div>
                <h4 className="text-sm font-semibold text-gray-200">Password Security</h4>
                <p className="text-xs text-gray-400">Last changed: Recently</p>
              </div>
            </div>
          </div>
          
          <DynamicButton
            onClick={() => setIsChangingPassword(true)}
            iconName="settings"
            className="w-full"
          >
            Change Password
          </DynamicButton>
        </div>
      ),
      details: [
        { label: 'Password Status', value: 'Protected' },
        { label: 'Last Changed', value: 'Recently' },
        { label: '2FA Status', value: 'Disabled' },
        { label: 'Login Notifications', value: 'Enabled' },
      ]
    },
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      subtitle: 'Update Information',
      description: 'Personal Details',
      icon: Icons.buttons.edit,
      color: 'green',
      value: isEditing ? 'Editing' : 'Edit',
      badge: {
        text: isEditing ? 'Active' : 'Ready',
        color: 'green'
      },
      content: isEditing ? (
        <div className="space-y-4">
          <TextField
            field={{
              name: 'name',
              type: 'text',
              label: 'Full Name',
              required: true,
              placeholder: 'Enter your full name'
            }}
            register={() => {}}
            errors={{}}
            setValue={(field, value) => handleInputChange(field, value)}
            watch={() => formData.name}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={formData}
          />
          
          <TextField
            field={{
              name: 'department',
              type: 'text',
              label: 'Department',
              required: false,
              placeholder: 'Enter your department'
            }}
            register={() => {}}
            errors={{}}
            setValue={(field, value) => handleInputChange(field, value)}
            watch={() => formData.department}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={formData}
          />
          
          <TextField
            field={{
              name: 'phone',
              type: 'text',
              label: 'Phone Number',
              required: false,
              placeholder: 'Enter your phone number'
            }}
            register={() => {}}
            errors={{}}
            setValue={(field, value) => handleInputChange(field, value)}
            watch={() => formData.phone}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={formData}
          />
          
          <TextField
            field={{
              name: 'location',
              type: 'text',
              label: 'Location',
              required: false,
              placeholder: 'Enter your location'
            }}
            register={() => {}}
            errors={{}}
            setValue={(field, value) => handleInputChange(field, value)}
            watch={() => formData.location}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={formData}
          />
          
          <div className="flex space-x-3">
            <DynamicButton
              onClick={handleSaveProfile}
              loading={isLoading}
              iconName="save"
              className="flex-1"
            >
              Save Changes
            </DynamicButton>
            <DynamicButton
              onClick={handleCancel}
              variant="outline"
              iconName="cancel"
              className="flex-1"
            >
              Cancel
            </DynamicButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.green}10`,
              borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.green}20`
            }}
          >
            <div className="flex items-center space-x-3">
              <Icons.buttons.edit className="w-5 h-5" style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.green }} />
              <div>
                <h4 className="text-sm font-semibold text-gray-200">Profile Information</h4>
                <p className="text-xs text-gray-400">Click to edit your details</p>
              </div>
            </div>
          </div>
          
          <DynamicButton
            onClick={() => setIsEditing(true)}
            iconName="edit"
            className="w-full"
          >
            Edit Profile
          </DynamicButton>
        </div>
      ),
      details: [
        { label: 'Name', value: formData.name },
        { label: 'Department', value: formData.department },
        { label: 'Phone', value: formData.phone },
        { label: 'Location', value: formData.location },
      ]
    }
  ];



  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icons.generic.user className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-200 mb-2">No User Data</h2>
          <p className="text-gray-400">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Profile Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Manage your account information and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {profileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'profile' && (
            <div className="mb-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {profileCards.map((card) => (
                  <SmallCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default ProfilePage;