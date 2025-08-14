import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMonthlyTasks, useUsers } from '../hooks/useFirestore';
import { useNotifications } from '../hooks/useNotifications';
import DynamicButton from '../components/DynamicButton';
import TaskForm from '../components/TaskForm';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// Hook: keeps track of current monthId and updates automatically when month changes (checked every minute)
const useCurrentMonthId = () => {
  const [monthId, setMonthId] = useState(() => dayjs().format('YYYY-MM'));
  useEffect(() => {
    const interval = setInterval(() => {
      const current = dayjs().format('YYYY-MM');
      setMonthId(prev => (prev !== current ? current : prev));
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, []);
  return monthId;
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const monthId = useCurrentMonthId();
  const { data: tasks, fetchData: fetchTasks, loading: tasksLoading } = useMonthlyTasks(monthId);
  const { addSuccess, addError } = useNotifications();
  const { data: usersList, fetchData: fetchUsers } = useUsers();
  const [showTaskForm, setShowTaskForm] = useState(false);
  // Derive month boundaries from monthId (always current month enforced)
  const monthStart = dayjs(monthId + '-01');
  const monthEnd = monthStart.endOf('month');
  const [dateRange, setDateRange] = useState({ start: monthStart, end: monthEnd });
  const [selectedUser, setSelectedUser] = useState('');
  const [indexError, setIndexError] = useState(false);
  const indexLink = 'https://console.firebase.google.com/u/0/project/task-tracker-app-eb03e/firestore/indexes';
  const initialLoadedRef = useRef(false);
  const lastQueryHashRef = useRef(null);
  const navigate = useNavigate();

  // Build where clauses based on role, selected user, and date range (within current month only)
  const buildTaskQuery = useCallback(() => {
    const whereClauses = [];
    if (user?.role === 'admin') {
      if (selectedUser) whereClauses.push(['userUID', '==', selectedUser]);
    } else if (user?.uid) {
      whereClauses.push(['userUID', '==', user.uid]);
    }
    // Enforce month boundaries regardless of user-picked dates (clamped)
    const start = dateRange.start.isBefore(monthStart) ? monthStart : dateRange.start;
    const end = dateRange.end.isAfter(monthEnd) ? monthEnd : dateRange.end;
    whereClauses.push(['createdAt', '>=', start.toDate()]);
    whereClauses.push(['createdAt', '<=', end.toDate()]);
    return whereClauses;
  }, [user, selectedUser, dateRange, monthStart, monthEnd]);

  const queryHash = () => JSON.stringify({ u: user?.role === 'admin' ? selectedUser || 'ALL' : user?.uid, s: dateRange.start.format('YYYYMMDD'), e: dateRange.end.format('YYYYMMDD') });

  const loadTasks = async () => {
    try {
      const hash = queryHash();
      if (hash === lastQueryHashRef.current && tasks.length && !tasksLoading) return;
      await fetchTasks({
        where: buildTaskQuery(),
        orderBy: [['createdAt', 'desc']]
      });
      lastQueryHashRef.current = hash;
      setIndexError(false);
      addSuccess('Tasks loaded');
    } catch (err) {
      if (err?.code === 'failed-precondition' || /index/i.test(err?.message || '')) {
        setIndexError(true);
        addError('Firestore index required (userUID + createdAt). See instructions below.');
      } else {
        addError('Failed to load tasks');
      }
    }
  };

  const resetAndLoad = () => {
    loadTasks();
  };

  // Initial load once
  useEffect(() => {
    if (user && !initialLoadedRef.current) {
      if (user.role === 'admin') fetchUsers({ orderBy: [['createdAt', 'desc']], limit: 200 }).catch(()=>{});
      loadTasks();
      initialLoadedRef.current = true;
    }
  }, [user]);

  // Reload tasks automatically when monthId rolls over (day 1 new month)
  useEffect(() => {
    if (user && initialLoadedRef.current) {
      // Clear previous month tasks view (fresh board)
      lastQueryHashRef.current = null;
      loadTasks();
    }
  }, [monthId]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const picked = dayjs(value);
    // Clamp inside current month
    const clamped = picked.isBefore(monthStart) ? monthStart : picked.isAfter(monthEnd) ? monthEnd : picked;
    setDateRange(prev => ({ ...prev, [name]: clamped }));
  };

  const applyDateFilter = () => {
    lastQueryHashRef.current = null; // force new hash compare
    loadTasks();
  };

  const handleUserSelect = (e) => {
    setSelectedUser(e.target.value);
    lastQueryHashRef.current = null; // mark dirty; do NOT fetch yet
  };

  const handleLogout = async () => {
    try { await logout(); } catch { addError('Logout failed'); }
  };

  // Disable picking outside current month via min/max
  const startInputProps = { min: monthStart.format('YYYY-MM-DD'), max: monthEnd.format('YYYY-MM-DD') };
  const endInputProps = startInputProps;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Role: {user?.role}</p>
            </div>
            <DynamicButton id="logout-btn" variant="secondary" onClick={handleLogout} successMessage="Logged out successfully!">Logout</DynamicButton>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" name="start" value={dateRange.start.format('YYYY-MM-DD')} onChange={handleDateChange} className="border rounded px-3 py-2" {...startInputProps} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" name="end" value={dateRange.end.format('YYYY-MM-DD')} onChange={handleDateChange} className="border rounded px-3 py-2" {...endInputProps} />
          </div>
          {user?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select value={selectedUser} onChange={handleUserSelect} className="border rounded px-3 py-2 min-w-[180px]">
                <option value="">All Users</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.userUID}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
          )}
          <DynamicButton variant="primary" onClick={applyDateFilter} loading={tasksLoading}>Apply</DynamicButton>
        </div>

        {/* Action Buttons (only show create form toggle) */}
        <div className="mb-6">
          <DynamicButton id="create-task-btn" variant="success" icon={PlusIcon} onClick={() => setShowTaskForm(!showTaskForm)} className="w-full md:w-auto">{showTaskForm ? 'Hide Form' : 'Create Task'}</DynamicButton>
        </div>

        {showTaskForm && (
          <div className="mb-6"><TaskForm /></div>
        )}

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tasks ({tasks.length})</h2>
          </div>
          {indexError && (
            <div className="mb-4 p-4 border border-amber-300 bg-amber-50 rounded text-amber-800 text-sm space-y-2">
              <p className="font-medium">Composite index needed to run this filtered query.</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Open Firestore console Indexes page.</li>
                <li>Create composite index for collection path: <code>tasks/{'{monthId}'}/monthTasks</code></li>
                <li>Fields (order): <strong>userUID Ascending</strong>, <strong>createdAt Descending</strong>.</li>
                <li>Deploy and wait until index status is Active (may take a minute).</li>
                <li>Return here and press Apply again.</li>
              </ol>
              <a href={indexLink} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">Open Firestore Indexes</a>
            </div>
          )}
          {tasks.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tasks.map(task => (
                <div key={task.id} className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/task/${monthId}/${task.id}`)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{task.taskName}</h3>
                      <p className="text-sm text-gray-600">{task.market} • {task.product}</p>
                      <p className="text-sm text-gray-500">
                        {task.timeInHours}h total
                        {task.aiUsed && ` • ${task.timeSpentOnAI}h AI (${task.aiModel || 'Unknown'})`}
                        {task.reworked && ' • Reworked'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Created by: {task.createdByName || task.createdBy}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${task.aiUsed ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{task.aiUsed ? 'AI Used' : 'No AI'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tasks loaded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
