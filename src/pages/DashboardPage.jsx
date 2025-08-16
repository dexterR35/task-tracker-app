import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import ReactPaginate from 'react-paginate';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useFirestore';
import { useNotifications } from '../hooks/useNotifications';
import DynamicButton from '../components/DynamicButton';
import TaskForm from '../components/task/TaskForm';
// Use modularized components
import AnalyticsSummary from '../components/AnalyticsSummary';
import TasksTable from '../components/task/TasksTable';
// Kanban removed – using simple analytics cards & charts instead
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMonthTasksIfNeeded, selectMonthTasks, updateTask, deleteTask, generateMonth, selectMonthTasksState } from '../redux/slices/tasksSlice';
import { beginLoading, endLoading } from '../redux/slices/loadingSlice';
import { doc, getDoc, collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import ErrorDisplay from '../components/notification/error/ErrorDisplay';
const LazyTaskCharts = React.lazy(() => import('../components/task/TaskCharts'));


const useCurrentMonthId = () => dayjs().format('YYYY-MM');

const DashboardPage = () => {
  const { user } = useAuth();
  const { userId: impersonatedUserId } = useParams(); // if present, admin is viewing a specific user's dashboard
  const monthId = useCurrentMonthId();
  const dispatch = useDispatch();
  const tasks = useSelector(selectMonthTasks(monthId));
  const { addSuccess, addError } = useNotifications();
  const { data: usersList, fetchData: fetchUsers, loading: usersLoading } = useUsers();
  const tasksState = useSelector(selectMonthTasksState(monthId));
  const tasksStatus = tasksState?.status;
  const tasksError = tasksState?.error;
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [monthReady, setMonthReady] = useState(true);
  const [checkingMonth, setCheckingMonth] = useState(true);
  const monthStart = dayjs(monthId + '-01');
  const monthEnd = monthStart.endOf('month');
  const [dateRange, setDateRange] = useState({ start: monthStart, end: monthEnd });
  const [selectedUser, setSelectedUser] = useState(impersonatedUserId || '');


  const hasBootstrappedRef = useRef(false);
  const navigate = useNavigate();

  // All tasks fetched once per month; rest is client-side filtering
  const loadTasks = async ({ force } = {}) => {
    if (!force && tasksState?.status === 'succeeded') return;
    try {
      await dispatch(fetchMonthTasksIfNeeded({ monthId, force }));
    } catch (err) {
      if (err?.code === 'failed-precondition' || /index/i.test(err?.message || '')) ;
    } finally {
    }
  };


  // Unified bootstrap & reactive effect: runs when user/month/impersonation/selectedUser/dateRange changes
  useEffect(() => {
    if (!user) return;
    // Admin user list fetch only once
    if (user.role === 'admin' && !hasBootstrappedRef.current) {
      fetchUsers({ orderBy: [['createdAt', 'desc']], limit: 200 }).catch(() => { });
    }
    // When impersonation param changes, sync selectedUser immediately
    if (impersonatedUserId && selectedUser !== impersonatedUserId) {
      setSelectedUser(impersonatedUserId);
    }
    // Ensure month exists then load all tasks once
    const run = async () => {
      dispatch(beginLoading());
      try {
        await checkMonthExists();
        await loadTasks();
      } finally {
        dispatch(endLoading());
      }
    };
    run();
    hasBootstrappedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, monthId, impersonatedUserId]);

  const checkMonthExists = async () => {
    setCheckingMonth(true);
    try {
      const ref = doc(db, 'tasks', monthId);
      const snap = await getDoc(ref);
      setMonthReady(snap.exists());
    } catch {
      setMonthReady(false);
    } finally {
      setCheckingMonth(false);
    }
  };

  const [generating, setGenerating] = useState(false);
  const handleGenerateMonth = async () => {
    setGenerating(true);
    dispatch(beginLoading());
    try {
      await generateMonth(monthId, { createdBy: user?.uid });
      setMonthReady(true);
      addSuccess(`Month ${monthId} generated.`);
      await loadTasks({ force: true });
    } catch (e) {
      addError('Failed to generate month');
    } finally {
      setGenerating(false);
      dispatch(endLoading());
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const picked = dayjs(value);
    // Clamp inside current month
    const clamped = picked.isBefore(monthStart) ? monthStart : picked.isAfter(monthEnd) ? monthEnd : picked;
    setDateRange(prev => ({ ...prev, [name]: clamped }));
  };



  // Memoize filtered tasks
  const filteredTasks = useMemo(() => {
    const start = dateRange.start.isBefore(monthStart) ? monthStart.valueOf() : dateRange.start.valueOf();
    const end = dateRange.end.isAfter(monthEnd) ? monthEnd.valueOf() : dateRange.end.valueOf();
    const targetUser = user?.role === 'admin' ? (impersonatedUserId || selectedUser || null) : user?.uid;
    return (tasks || []).filter(t => {
      if (targetUser && t.userUID !== targetUser) return false;
      const created = t.createdAt || 0;
      return created >= start && created <= end;
    });
  }, [tasks, dateRange.start, dateRange.end, user, impersonatedUserId, selectedUser, monthStart, monthEnd]);

  // Preview state
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewName, setPreviewName] = useState('');
  const [savingPreview, setSavingPreview] = useState(false);
  const [previews, setPreviews] = useState([]);

  // Fetch previews (admin only)
  const fetchPreviews = useCallback(async () => {
    try {
      const q = query(collection(db, 'previews'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setPreviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      addError('Failed to load previews');
    }
  }, [addError]);

  useEffect(() => {
    if (user?.role === 'admin') fetchPreviews();
  }, [user, fetchPreviews]);

  // Handler to generate preview (admin only)
  const handleGeneratePreview = () => {
    // For now, just use filteredTasks and a timestamp as previewData
    setPreviewData({
      generatedAt: new Date().toISOString(),
      tasks: filteredTasks,
      summary: {
        count: filteredTasks.length,
        totalHours: filteredTasks.reduce((s, t) => s + (parseFloat(t.timeInHours) || 0), 0),
        aiTasks: filteredTasks.filter(t => t.aiUsed).length,
        // Add more calculations as needed
      }
    });
    setPreviewMode(true);
  };

  // Handler for Generate Full: prompt for name, save to Firestore
  const handleGenerateFull = async () => {
    if (!previewName.trim()) {
      addError('Please enter a name for this preview.');
      return;
    }
    setSavingPreview(true);
    try {
      // Only save summary and filter, not full tasks array
      const previewDoc = {
        name: previewName.trim(),
        generatedAt: new Date().toISOString(),
        summary: previewData.summary,
        filter: {
          dateRange: {
            start: dateRange.start.format('YYYY-MM-DD'),
            end: dateRange.end.format('YYYY-MM-DD')
          },
          selectedUser
        },
        createdBy: user?.uid,
        createdByName: user?.name || user?.email,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'previews'), previewDoc);
      addSuccess('Preview saved!');
      setPreviewMode(false);
      setPreviewName('');
      fetchPreviews();
    } catch (e) {
      console.error('Failed to save preview:', e);
      addError('Failed to save preview: ' + (e?.message || e));
    } finally {
      setSavingPreview(false);
    }
  };

  const handleUserSelect = (e) => { setSelectedUser(e.target.value); };


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
          </div>
        </div>

        {/* Filters + Admin Preview Button */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" name="start" value={dateRange.start.format('YYYY-MM-DD')} onChange={handleDateChange} className="border rounded px-3 py-2" {...startInputProps} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" name="end" value={dateRange.end.format('YYYY-MM-DD')} onChange={handleDateChange} className="border rounded px-3 py-2" {...endInputProps} />
          </div>
          {user?.role === 'admin' && !impersonatedUserId && (
            usersLoading ? (<div className="text-sm text-gray-500">Loading users…</div>) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <select value={selectedUser} onChange={handleUserSelect} className="border rounded px-3 py-2 min-w-[200px]">
                  <option value="">All Users</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.userUID}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>
            )
          )}
          {/* Admin-only Generate Preview button */}
          {user?.role === 'admin' && (
            <DynamicButton variant="primary" onClick={handleGeneratePreview} className="ml-2">Generate Preview</DynamicButton>
          )}
        </div>
        {/* Preview Panel (admin only, after Generate Preview) */}
        {previewMode && previewData && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-yellow-800">Preview Analytics</h2>
            </div>
            <div className="mb-4 text-sm text-gray-700">Preview generated at: {new Date(previewData.generatedAt).toLocaleString()}</div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Preview Name</label>
              <input type="text" value={previewName} onChange={e => setPreviewName(e.target.value)} className="border rounded px-3 py-2 w-full max-w-xs" placeholder="e.g. Q3 AI Analysis" disabled={savingPreview} />
            </div>
            <div className="mb-4">
              <strong>Summary:</strong>
              <ul className="list-disc ml-6">
                <li>Total Tasks: {previewData.summary.count}</li>
                <li>Total Hours: {previewData.summary.totalHours}</li>
                <li>AI Tasks: {previewData.summary.aiTasks}</li>
                {/* Add more summary items/calculations here */}
              </ul>
            </div>
            {/* Example: reuse existing charts for preview */}
            <div className="mb-4">
              <Suspense fallback={<div>Loading charts…</div>}>
                <LazyTaskCharts monthId={monthId} tasks={previewData.tasks} />
              </Suspense>
            </div>
            <div className="flex gap-4">
              <DynamicButton variant="success" onClick={handleGenerateFull} loading={savingPreview} disabled={savingPreview}>Generate Full</DynamicButton>
              <DynamicButton variant="outline" onClick={() => setPreviewMode(false)} disabled={savingPreview}>Cancel</DynamicButton>
            </div>
            {/* Placeholder for more advanced analytics/calculations */}
            <div className="text-xs text-gray-500 mt-2">(More analytics and export options coming soon…)</div>
          </div>
        )}
        {/* List of saved previews (admin only) */}
        {user?.role === 'admin' && previews.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">Saved Previews</h2>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Summary</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {previews.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</td>
                    <td className="px-3 py-2">
                      {p.summary ? (
                        <ul className="list-disc ml-4">
                          <li>Tasks: {p.summary.count}</li>
                          <li>Hours: {p.summary.totalHours}</li>
                          <li>AI: {p.summary.aiTasks}</li>
                        </ul>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {/* TODO: CSV/PDF download buttons */}
                      <span className="text-xs text-gray-400">(Export coming soon)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Impersonation banner for admins */}
        {user?.role === 'admin' && impersonatedUserId && (
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm px-4 py-2 rounded mb-6 flex justify-between items-center">
            <div>
              Viewing tasks for user: <span className="font-semibold">{impersonatedUserId}</span>
            </div>
            <DynamicButton
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >Exit View</DynamicButton>
          </div>
        )}

        {/* Action Buttons (only show create form toggle) */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start">
          {monthReady && (
            <DynamicButton id="create-task-btn" variant="success" icon={PlusIcon} onClick={() => setShowTaskForm(!showTaskForm)} className="w-full md:w-auto">{showTaskForm ? 'Hide Form' : 'Create Task'}</DynamicButton>
          )}
          {!monthReady && !checkingMonth && (
            <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800 max-w-xl">
              Current month ({monthId}) not generated yet. Please ask an admin to generate it.
            </div>
          )}
          {user?.role === 'admin' && !monthReady && !checkingMonth && (
            <DynamicButton id="generate-month-btn" variant="primary" onClick={handleGenerateMonth} loading={generating} loadingText="Generating...">Generate {monthId}</DynamicButton>
          )}
        </div>

        {showTaskForm && monthReady && (
          <div className="mb-6"><TaskForm /></div>
        )}

        {/* Client-side filtering (memoized) */}
        <div className="space-y-8">

          {tasksStatus === 'failed' && (
            <ErrorDisplay error={tasksError || 'Failed to load tasks'} onRetry={() => loadTasks({ force: true })} />
          )}
          {tasksStatus === 'succeeded' && filteredTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Summary</h2>
              <AnalyticsSummary tasks={filteredTasks} />
            </div>
          )}
          {tasksStatus === 'succeeded' && filteredTasks.length === 0 && (
            <div className="bg-white border rounded-lg p-6 text-center text-sm text-gray-500">No tasks found for selected filters.</div>
          )}
          {user?.role === 'admin' && tasksStatus === 'succeeded' && filteredTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Charts (Admin)</h2>
              <Suspense fallback={<div className="p-4 bg-white border rounded text-sm text-gray-500">Loading charts...</div>}>
                <LazyTaskCharts monthId={monthId} />
              </Suspense>
            </div>
          )}
          {tasksStatus === 'succeeded' && filteredTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Tasks ({filteredTasks.length})</h2>
              <TasksTable tasks={filteredTasks} onSelect={(task) => navigate(`/task/${monthId}/${task.id}`)} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;






