import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import ReactPaginate from 'react-paginate';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useFirestore';
import { useNotifications } from '../hooks/useNotifications';
import DynamicButton from '../components/DynamicButton';
import TaskForm from '../components/TaskForm';
// Kanban removed – using simple analytics cards & charts instead
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMonthTasksIfNeeded, selectMonthTasks, updateTask, deleteTask, generateMonth, selectMonthTasksState } from '../redux/slices/tasksSlice';
import { beginLoading, endLoading } from '../redux/slices/loadingSlice';
import { doc, getDoc, collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { marketOptions, productOptions, taskNameOptions, aiModelOptions } from '../constants/taskOptions';
const LazyTaskCharts = React.lazy(() => import('../components/TaskCharts'));
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
// Date formatting helpers
const formatDay = (ts) => ts ? dayjs(ts).format('MMM D') : '-';
import ErrorDisplay from '../components/ErrorDisplay';

// Simple loading component
const SimpleLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="h-8 w-8 relative">
      <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
      <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
    </div>
  </div>
);

// (Filter spinner/debounce removed – spinner now only for major network mutations)

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
  // Derive month boundaries from monthId (always current month enforced)
  const monthStart = dayjs(monthId + '-01');
  const monthEnd = monthStart.endOf('month');
  const [dateRange, setDateRange] = useState({ start: monthStart, end: monthEnd });
  // If admin is impersonating (route param present) lock to that user; else allow selection (admin) or self (user)
  const [selectedUser, setSelectedUser] = useState(impersonatedUserId || '');
  const [indexError, setIndexError] = useState(false);
  const indexLink = 'https://console.firebase.google.com/u/0/project/task-tracker-app-eb03e/firestore/indexes';
  const hasBootstrappedRef = useRef(false);
  const navigate = useNavigate();

  // All tasks fetched once per month; rest is client-side filtering

  const [localLoading, setLocalLoading] = useState(false);
  // Track if we've completed the very first successful load so spinner can be removed afterward
  const initialLoadDoneRef = useRef(false);
  const [initialLoadDoneState, setInitialLoadDoneState] = useState(false); // state mirror for render
  const loadTasks = async ({ force } = {}) => {
    if (!force && tasksState?.status === 'succeeded') return;
    setLocalLoading(true);
    try {
      await dispatch(fetchMonthTasksIfNeeded({ monthId, force }));
      setIndexError(false);
    } catch (err) {
      if (err?.code === 'failed-precondition' || /index/i.test(err?.message || '')) setIndexError(true);
    } finally {
      setLocalLoading(false);
    }
  };

  // Mark initial load done once we hit first succeeded state
  useEffect(() => {
    if (!initialLoadDoneRef.current && tasksStatus === 'succeeded') {
      initialLoadDoneRef.current = true;
      setInitialLoadDoneState(true);
    }
  }, [tasksStatus]);

  const resetAndLoad = () => {
    loadTasks();
  };

  // Unified bootstrap & reactive effect: runs when user/month/impersonation/selectedUser/dateRange changes
  useEffect(() => {
    if (!user) return;
    // Admin user list fetch only once
    if (user.role === 'admin' && !hasBootstrappedRef.current) {
      fetchUsers({ orderBy: [['createdAt', 'desc']], limit: 200 }).catch(()=>{});
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

  // Removed filter spinner & debounce: filtering is instantaneous and local.

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

  // Logout removed from dashboard (handled only in header)

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
          {!initialLoadDoneState && (tasksStatus === 'loading' || localLoading) && <SimpleLoader />}
          {tasksStatus === 'failed' && (
            <ErrorDisplay error={tasksError || 'Failed to load tasks'} onRetry={() => loadTasks({ force: true })} />
          )}
          {tasksStatus === 'succeeded' && filteredTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Summary</h2>
              <AnalyticsSummary tasks={filteredTasks} />
            </div>
          )}
            {tasksStatus === 'succeeded' && filteredTasks.length === 0 && !localLoading && (
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

// --- Simple inline components for analytics & list ---
import ReactMemo from 'react';

const numberFmt = (n) => (Number.isFinite(n) ? (Math.round(n * 10) / 10) : 0);

const AnalyticsSummary = ({ tasks }) => {
  const totalTasks = tasks.length;
  const totalHours = tasks.reduce((s,t)=>s+(parseFloat(t.timeInHours)||0),0);
  const aiTasks = tasks.filter(t=>t.aiUsed).length;
  const aiHours = tasks.filter(t=>t.aiUsed).reduce((s,t)=>s+(parseFloat(t.timeSpentOnAI)||0),0);
  const reworked = tasks.filter(t=>t.reworked).length;
  const avgHours = totalTasks ? totalHours / totalTasks : 0;

  const makeCounts = (field) => {
    const map = new Map();
    tasks.forEach(t=>{ const key = t[field] || 'unknown'; map.set(key,(map.get(key)||0)+1); });
    return Array.from(map.entries()).map(([k,v])=>({ key:k, count:v })).sort((a,b)=>b.count-a.count);
  };
  const markets = makeCounts('market').slice(0,5);
  const products = makeCounts('product').slice(0,5);

  const cardBase = 'p-4 bg-white rounded-lg shadow-sm border flex flex-col';

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      <div className={cardBase}><span className="text-xs text-gray-500">Total Tasks</span><span className="mt-1 text-2xl font-semibold">{totalTasks}</span></div>
      <div className={cardBase}><span className="text-xs text-gray-500">Total Hours</span><span className="mt-1 text-2xl font-semibold">{numberFmt(totalHours)}</span></div>
      <div className={cardBase}><span className="text-xs text-gray-500">AI Tasks</span><span className="mt-1 text-2xl font-semibold">{aiTasks}</span><span className="text-[10px] text-gray-400">{totalTasks?numberFmt(aiTasks/totalTasks*100):0}%</span></div>
      <div className={cardBase}><span className="text-xs text-gray-500">AI Hours</span><span className="mt-1 text-2xl font-semibold">{numberFmt(aiHours)}</span></div>
      <div className={cardBase}><span className="text-xs text-gray-500">Reworked</span><span className="mt-1 text-2xl font-semibold">{reworked}</span></div>
      <div className={cardBase}><span className="text-xs text-gray-500">Avg Hours/Task</span><span className="mt-1 text-2xl font-semibold">{numberFmt(avgHours)}</span></div>
      <div className="md:col-span-3 lg:col-span-3 p-4 bg-white rounded-lg shadow-sm border">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Top Markets</h3>
        {markets.length? <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">{markets.map(m=> <li key={m.key} className="flex justify-between"><span className="truncate pr-2">{m.key}</span><span className="font-medium">{m.count}</span></li>)}</ul>:<p className="text-xs text-gray-400">None</p>}
      </div>
      <div className="md:col-span-3 lg:col-span-3 p-4 bg-white rounded-lg shadow-sm border">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Top Products</h3>
        {products.length? <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">{products.map(p=> <li key={p.key} className="flex justify-between"><span className="truncate pr-2">{p.key}</span><span className="font-medium">{p.count}</span></li>)}</ul>:<p className="text-xs text-gray-400">None</p>}
      </div>
    </div>
  );
};

const TasksTable = ({ tasks, onSelect }) => {
  const dispatch = useDispatch();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [rowActionId, setRowActionId] = useState(null);
  // Pagination state
  // Restore page & size from URL or localStorage
  const params = new URLSearchParams(window.location.search);
  const initialPageSize = parseInt(params.get('ps') || localStorage.getItem('tt_pageSize') || '25',10);
  const initialPage = parseInt(params.get('p') || localStorage.getItem('tt_page') || '0',10);
  const [page, setPage] = useState(isNaN(initialPage)?0:initialPage);
  const [pageSize, setPageSize] = useState(isNaN(initialPageSize)?25:initialPageSize);
  const pageCount = Math.ceil(tasks.length / pageSize) || 1;
  const startIdx = page * pageSize;
  const currentPageTasks = tasks.slice(startIdx, startIdx + pageSize);

  const syncState = (newPage, newSize) => {
    const search = new URLSearchParams(window.location.search);
    search.set('p', String(newPage));
    search.set('ps', String(newSize));
    const newUrl = `${window.location.pathname}?${search.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
    localStorage.setItem('tt_page', String(newPage));
    localStorage.setItem('tt_pageSize', String(newSize));
  };
  const handlePageChange = (sel) => { const np = sel.selected; setPage(np); syncState(np, pageSize); };
  const handlePageSizeChange = (e) => { const ns = parseInt(e.target.value,10)||25; setPageSize(ns); setPage(0); syncState(0, ns); };
  const startEdit = (t) => { setEditingId(t.id); setForm({ taskName: t.taskName||'', market: t.market||'', product: t.product||'', timeInHours: t.timeInHours||0, timeSpentOnAI: t.timeSpentOnAI||0, aiUsed: !!t.aiUsed, aiModel: t.aiModel || '', reworked: !!t.reworked }); };
  const cancelEdit = () => { setEditingId(null); setForm({}); };
  const saveEdit = async (t) => {
    try {
      setRowActionId(t.id);
      await dispatch(updateTask(t.monthId, t.id, { ...form, timeInHours: Number(form.timeInHours)||0, timeSpentOnAI: form.aiUsed ? (Number(form.timeSpentOnAI)||0) : 0, aiModel: form.aiUsed ? form.aiModel : '' }));
    } catch(e){
      console.error(e);
    } finally {
      setEditingId(null);
      setRowActionId(null);
    }
  };
  const removeTask = async (t) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      setRowActionId(t.id);
      await dispatch(deleteTask(t.monthId, t.id));
    } catch(e){
      console.error(e);
    } finally {
      setRowActionId(null);
    }
  };
  if (!tasks.length) return <div className="bg-white border rounded-lg p-6 text-center text-sm text-gray-500">No tasks found for selected filters.</div>;
  return (
    <div className="bg-white border rounded-lg overflow-x-auto shadow-sm">
      <div className="flex items-center justify-between p-3 text-xs text-gray-600">
        <div>
          Showing {Math.min(startIdx + 1, tasks.length)}–{Math.min(startIdx + pageSize, tasks.length)} of {tasks.length}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">Page size:
            <select value={pageSize} onChange={handlePageSizeChange} className="border rounded px-1 py-0.5 text-xs">
              {[10,25,50,100].map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-3 py-2 text-left">Task</th>
            <th className="px-3 py-2 text-left">Market</th>
            <th className="px-3 py-2 text-left">Product</th>
            <th className="px-3 py-2 text-left">Created</th>
            <th className="px-3 py-2 text-right">Hours</th>
            <th className="px-3 py-2 text-right">AI Hours</th>
            <th className="px-3 py-2">AI Model</th>
            <th className="px-3 py-2">AI?</th>
            <th className="px-3 py-2">Reworked</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentPageTasks.map(t => {
            const isEdit = editingId === t.id;
            return (
              <tr key={t.id} className={`border-t ${isEdit? 'bg-yellow-50':'hover:bg-blue-50'}`}>
                <td className="px-3 py-2 font-medium text-gray-800 truncate max-w-[160px]">
                  {isEdit ? (
                    <select className="border px-2 py-1 rounded w-full" value={form.taskName} onChange={e=>setForm(f=>({...f, taskName:e.target.value}))}>
                      <option value="">Select task</option>
                      {taskNameOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : <button className="text-left w-full" onClick={()=>onSelect(t)}>{t.taskName}</button>}
                </td>
                <td className="px-3 py-2">{isEdit ? (
                  <select className="border px-2 py-1 rounded w-full" value={form.market} onChange={e=>setForm(f=>({...f, market:e.target.value}))}>
                    <option value="">Select market</option>
                    {marketOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (t.market||'-')}</td>
                <td className="px-3 py-2">{isEdit ? (
                  <select className="border px-2 py-1 rounded w-full" value={form.product} onChange={e=>setForm(f=>({...f, product:e.target.value}))}>
                    <option value="">Select product</option>
                    {productOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (t.product||'-')}</td>
                <td className="px-3 py-2">{formatDay(t.createdAt)}</td>
                <td className="px-3 py-2 text-right">{isEdit ? <input type="number" step="0.1" className="border px-2 py-1 rounded w-20 text-right" value={form.timeInHours} onChange={e=>setForm(f=>({...f, timeInHours:e.target.value}))}/> : numberFmt(parseFloat(t.timeInHours)||0)}</td>
                <td className="px-3 py-2 text-right">{isEdit ? (
                  form.aiUsed ? <input type="number" step="0.1" className="border px-2 py-1 rounded w-20 text-right" value={form.timeSpentOnAI} onChange={e=>setForm(f=>({...f, timeSpentOnAI:e.target.value}))}/> : <span className="text-gray-400">-</span>
                ) : numberFmt(parseFloat(t.timeSpentOnAI)||0)}</td>
                <td className="px-3 py-2">{isEdit ? (
                  form.aiUsed ? (
                    <select className="border px-2 py-1 rounded w-full" value={form.aiModel} onChange={e=>setForm(f=>({...f, aiModel:e.target.value}))}>
                      <option value="">Select model</option>
                      {aiModelOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : <span className="text-gray-400 text-xs">AI off</span>
                ) : (t.aiModel || (t.aiUsed ? '—' : '-'))}</td>
                <td className="px-3 py-2 text-center">{isEdit ? <input type="checkbox" checked={form.aiUsed} onChange={e=>setForm(f=>({
                  ...f,
                  aiUsed: e.target.checked,
                  // reset AI-related fields when turning off
                  ...(e.target.checked ? {} : { timeSpentOnAI: 0, aiModel: '' })
                }))}/> : (t.aiUsed?'✓':'-')}</td>
                <td className="px-3 py-2 text-center">{isEdit ? <input type="checkbox" checked={form.reworked} onChange={e=>setForm(f=>({...f, reworked:e.target.checked}))}/> : (t.reworked?'✓':'-')}</td>
                <td className="px-3 py-2 text-right space-x-2">
                  {isEdit ? (
                    <>
                      <button disabled={rowActionId===t.id} onClick={()=>saveEdit(t)} className={`inline-flex items-center px-2 py-1 rounded text-white ${rowActionId===t.id? 'bg-green-400 cursor-not-allowed':'bg-green-600 hover:bg-green-700'}`} title="Save"><CheckIcon className="w-4 h-4"/></button>
                      <button onClick={cancelEdit} className="inline-flex items-center px-2 py-1 bg-gray-400 text-white rounded" title="Cancel"><XMarkIcon className="w-4 h-4"/></button>
                    </>
                  ) : (
                    <>
                      <button disabled={rowActionId===t.id} onClick={()=>startEdit(t)} className={`inline-flex items-center px-2 py-1 rounded text-white ${rowActionId===t.id? 'bg-blue-400 cursor-not-allowed':'bg-blue-600 hover:bg-blue-700'}`} title="Edit"><PencilIcon className="w-4 h-4"/></button>
                      <button disabled={rowActionId===t.id} onClick={()=>removeTask(t)} className={`inline-flex items-center px-2 py-1 rounded text-white ${rowActionId===t.id? 'bg-red-400 cursor-not-allowed':'bg-red-600 hover:bg-red-700'}`} title="Delete"><TrashIcon className="w-4 h-4"/></button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="p-3">
        <ReactPaginate
          className="flex items-center gap-1 flex-wrap text-xs"
          pageClassName=""
          activeClassName="!bg-blue-600 !text-white"
          pageLinkClassName="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
          activeLinkClassName="px-2 py-1 rounded border border-blue-600 bg-blue-600 text-white"
          breakLinkClassName="px-2 py-1"
          previousLinkClassName="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
          nextLinkClassName="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
          disabledLinkClassName="opacity-40 cursor-not-allowed"
          previousLabel="Prev"
          nextLabel="Next"
          breakLabel="..."
          onPageChange={handlePageChange}
          forcePage={page}
          pageCount={pageCount}
          marginPagesDisplayed={1}
          pageRangeDisplayed={3}
        />
      </div>
    </div>
  );
};


