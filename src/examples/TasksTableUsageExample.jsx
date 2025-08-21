import React, { useState } from 'react';
import TasksTable from '../components/task/TasksTable';
import { format } from 'date-fns';

/**
 * Example component demonstrating how to use the updated TasksTable
 * with Redux state management and CRUD operations
 */
const TasksTableUsageExample = () => {
  const [monthId, setMonthId] = useState(format(new Date(), 'yyyy-MM'));
  const [userFilter, setUserFilter] = useState('');
  const [showUserFilter, setShowUserFilter] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true); // Toggle for demo

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">TasksTable Usage Example</h1>
      
      {/* Configuration Panel */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-4">Table Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Month Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Month:</label>
            <input
              type="month"
              value={monthId}
              onChange={(e) => setMonthId(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          {/* User Filter Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2">Show User Filter:</label>
            <input
              type="checkbox"
              checked={showUserFilter}
              onChange={(e) => setShowUserFilter(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Enable user filtering</span>
          </div>

          {/* User Filter */}
          {showUserFilter && (
            <div>
              <label className="block text-sm font-medium mb-2">User Filter:</label>
              <input
                type="text"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Enter user ID"
                className="border rounded px-3 py-2 w-full"
              />
            </div>
          )}

          {/* Admin Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2">Admin Mode:</label>
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Admin permissions</span>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">How This Works</h3>
        <ul className="text-sm space-y-1">
          <li>• The table automatically fetches tasks from Redux state for the selected month</li>
          <li>• CRUD operations (Create, Read, Update, Delete) are handled through Redux mutations</li>
          <li>• Data is cached in IndexedDB and Redux for optimal performance</li>
          <li>• Real-time updates are handled automatically through Firebase subscriptions</li>
          <li>• User filtering can be applied to show only specific user's tasks</li>
          <li>• Admin mode determines what actions are available</li>
        </ul>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Tasks Table</h2>
          <p className="text-sm text-gray-600">
            Month: {monthId} | 
            User Filter: {userFilter || 'None'} | 
            Admin: {isAdmin ? 'Yes' : 'No'}
          </p>
        </div>
        
        <TasksTable
          monthId={monthId}
          userFilter={userFilter || null}
          showUserFilter={showUserFilter}
          isAdmin={isAdmin}
        />
      </div>

      {/* Features Demo */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold mb-2">Features Demonstrated</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium">Redux Integration:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Automatic data fetching from Redux state</li>
              <li>Real-time updates through subscriptions</li>
              <li>Cache fallback when offline</li>
              <li>Optimistic updates for better UX</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">CRUD Operations:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Inline editing with validation</li>
              <li>Delete with confirmation</li>
              <li>Automatic cache updates</li>
              <li>Error handling and user feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksTableUsageExample;
