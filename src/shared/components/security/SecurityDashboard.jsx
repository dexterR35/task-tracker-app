import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getSecurityRecommendations } from '../../utils/security';
import DynamicButton from '../ui/DynamicButton';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const SecurityDashboard = () => {
  const { user } = useAuth();
  const [securityStats, setSecurityStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspiciousActivity: 0,
    lastLoginAttempts: 0,
  });

  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Simulate security stats (in real app, fetch from API)
    setSecurityStats({
      totalUsers: 25,
      activeUsers: 18,
      suspiciousActivity: 2,
      lastLoginAttempts: 5,
    });

    // Get security recommendations
    const userRecommendations = getSecurityRecommendations(
      user?.lastLogin, 
      0 // failedAttempts would come from API
    );
    setRecommendations(userRecommendations);
  }, [user]);

  const securityCards = [
    {
      title: 'Total Users',
      value: securityStats.totalUsers,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      description: 'Registered users',
    },
    {
      title: 'Active Users',
      value: securityStats.activeUsers,
      icon: ShieldCheckIcon,
      color: 'bg-green-500',
      description: 'Users active this month',
    },
    {
      title: 'Suspicious Activity',
      value: securityStats.suspiciousActivity,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      description: 'Flagged login attempts',
    },
    {
      title: 'Recent Logins',
      value: securityStats.lastLoginAttempts,
      icon: ClockIcon,
      color: 'bg-purple-500',
      description: 'Last 24 hours',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Security Dashboard
        </h2>
        <DynamicButton
          variant="outline"
          size="sm"
          icon={ChartBarIcon}
        >
          View Details
        </DynamicButton>
      </div>

      {/* Security Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {securityCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.color} text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Security Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Security Recommendations
            </h3>
          </div>
          <ul className="mt-2 space-y-1">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                • {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent Security Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Last login attempt tracking
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Rate limiting protection
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              Enabled
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Suspicious activity detection
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              Monitoring
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
