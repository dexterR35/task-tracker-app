import React, { useMemo, useRef, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetUsersQuery } from '../redux/services/usersApi';
import { useGetMonthTasksQuery, useGetMonthBoardExistsQuery, useGenerateMonthBoardMutation, useComputeMonthAnalyticsMutation, useSaveMonthAnalyticsMutation, useGetMonthAnalyticsQuery } from '../redux/services/tasksApi';
import DynamicButton from '../components/DynamicButton';
import TaskForm from '../components/task/TaskForm';
import TasksTable from '../components/task/TasksTable';
import AnalyticsSummary from '../components/AnalyticsSummary';
import { Chart, registerables } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useNotifications } from '../hooks/useNotifications';
import { jsPDF } from 'jspdf';
Chart.register(...registerables);

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const impersonatedUserId = searchParams.get('user') || '';
  const monthId = useMemo(() => dayjs().format('YYYY-MM'), []);
  const { data: usersList = [], isLoading: usersLoading } = useGetUsersQuery();
  const { data: tasks = [], isLoading: tasksLoading } = useGetMonthTasksQuery({ monthId });
  const { data: board = { exists: true }, refetch: refetchBoard, isLoading: boardLoading } = useGetMonthBoardExistsQuery({ monthId });
  const [generateBoard, { isLoading: generatingBoard }] = useGenerateMonthBoardMutation();
  const [computeAnalytics, { isLoading: computing }] = useComputeMonthAnalyticsMutation();
  const [saveAnalytics, { isLoading: saving }] = useSaveMonthAnalyticsMutation();
  const { data: storedAnalytics, refetch: refetchStoredAnalytics } = useGetMonthAnalyticsQuery({ monthId });
  const { addError, addSuccess } = useNotifications();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const monthStart = dayjs(monthId + '-01');
  const monthEnd = monthStart.endOf('month');
  const [dateRange, setDateRange] = useState({ start: monthStart, end: monthEnd });
  const [analyticsPreview, setAnalyticsPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const barRef = useRef(null);
  const doughnutRef = useRef(null);

  useEffect(() => {}, [user, monthId]);

  const filteredTasks = useMemo(() => {
    const start = dateRange.start.startOf('day').valueOf();
    const end = dateRange.end.endOf('day').valueOf();
    return (tasks || []).filter(t => {
      if (impersonatedUserId && t.userUID !== impersonatedUserId) return false;
      const created = t.createdAt || 0;
      return created >= start && created <= end;
    });
  }, [tasks, dateRange, impersonatedUserId]);

  const handleGenerateAnalytics = async () => {
    setIsGenerating(true);
    try {
      // refetch tasks before compute to ensure analytics use fresh data
      // Note: useGetMonthTasksQuery returns cached data; analytics query fetches directly from Firestore
      const res = await computeAnalytics({ monthId }).unwrap();
      setAnalyticsPreview(res);
    } finally {
      setIsGenerating(false);
    }
  };
  const handleCancelAnalytics = () => setAnalyticsPreview(null);
  const handleSaveAnalytics = async () => {
    if (!analyticsPreview) return;
    try {
      await saveAnalytics({ monthId, data: analyticsPreview, overwrite: false }).unwrap();
      setAnalyticsPreview(null);
      await refetchStoredAnalytics();
      addSuccess('Analytics saved for this month');
    } catch (e) {
      const code = e?.data?.code || e?.code;
      if (code === 'ANALYTICS_EXISTS') {
        addError('Analytics already exist. You can only generate once per month.');
      }
    }
  };

  const handleUserSelect = (e) => {
    const uid = e.target.value;
    navigate(uid ? `/admin?user=${uid}` : '/admin');
  };

  const handleDownloadPdf = () => {
    if (!storedAnalytics) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = margin;

    doc.setFontSize(18);
    doc.text(`Monthly Analytics - ${monthId}`, margin, y);
    y += 24;

    doc.setFontSize(12);
    const s = storedAnalytics;
    const lines = [
      `Total Tasks: ${s.totalTasks || 0}`,
      `Total Hours: ${Math.round((s.totalHours || 0) * 10) / 10}`,
      `AI Tasks: ${s.ai?.tasks || 0}  |  AI Hours: ${Math.round((s.ai?.hours || 0) * 10) / 10}`,
      `Reworked: ${s.reworked || 0}`,
    ];
    lines.forEach(line => { doc.text(line, margin, y); y += 18; });
    y += 10;

    // Capture chart images
    const barImg = barRef.current?.toBase64Image?.();
    const doughnutImg = doughnutRef.current?.toBase64Image?.();

    const imgWidth = 240;
    const imgHeight = 160;
    if (barImg) doc.addImage(barImg, 'PNG', margin, y, imgWidth, imgHeight);
    if (doughnutImg) doc.addImage(doughnutImg, 'PNG', margin + imgWidth + 20, y, imgWidth, imgHeight);

    doc.save(`Analytics_${monthId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row flex-wrap gap-4 items-end">
          <h2 className="text-2xl font-bold text-gray-900">View User Task</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" name="start" value={dateRange.start.format('YYYY-MM-DD')} onChange={(e) => setDateRange(p => ({ ...p, start: dayjs(e.target.value) }))} className="border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" name="end" value={dateRange.end.format('YYYY-MM-DD')} onChange={(e) => setDateRange(p => ({ ...p, end: dayjs(e.target.value) }))} className="border rounded px-3 py-2" />
          </div>
          {usersLoading ? (
            <div className="space-y-2">
              <div className="h-5 w-40 skeleton rounded" />
              <div className="h-9 w-64 skeleton rounded" />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select value={impersonatedUserId || ''} onChange={handleUserSelect} className="border rounded px-3 py-2 min-w-[200px]">
                <option value="">All Users</option>
                {usersList.map(u => <option key={u.id} value={u.userUID}>{u.name || u.email}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start">
          <DynamicButton
            variant="success"
            onClick={() => setShowTaskForm(!showTaskForm)}
            disabled={boardLoading || !board?.exists}
            title={!board?.exists ? 'Create the board first' : ''}
          >
            {showTaskForm ? 'Hide Form' : 'Create Task'}
          </DynamicButton>
          {!board?.exists && (
            <DynamicButton variant="primary" onClick={async () => { await generateBoard({ monthId }).unwrap(); await refetchBoard(); }} loading={generatingBoard} loadingText="Generating...">Create Board - {monthId}</DynamicButton>
          )}
          <DynamicButton variant="outline" onClick={handleGenerateAnalytics} loading={isGenerating || computing} loadingText="Computing...">Generate Analytics ({monthId})</DynamicButton>
        </div>

        {showTaskForm && <div className="mb-6"><TaskForm /></div>}

        <div className="space-y-8">
          {/* Saved analytics moved to Admin Analytics page; not shown on dashboard */}

          <AnalyticsSummary tasks={filteredTasks} />
          {tasksLoading ? (
            <div className="bg-white border rounded-lg p-6">
              <div className="h-6 w-40 skeleton rounded mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-9 skeleton rounded" />
                ))}
              </div>
            </div>
          ) : filteredTasks.length === 0 ? <div className="bg-white border rounded-lg p-6 text-center text-sm text-gray-500">No tasks found.</div> : (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Tasks ({filteredTasks.length})</h2>
              <TasksTable tasks={filteredTasks} />
            </div>
          )}

          {analyticsPreview && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Analytics Preview ({monthId})</h3>
                <div className="flex gap-2">
                  <DynamicButton variant="success" onClick={handleSaveAnalytics} loading={saving} disabled={!!storedAnalytics} title={storedAnalytics ? 'Analytics already saved for this month' : ''}>Save</DynamicButton>
                  <DynamicButton variant="outline" onClick={handleDownloadPdf} disabled={!storedAnalytics}>Download PDF</DynamicButton>
                  <DynamicButton variant="danger" onClick={handleCancelAnalytics}>Cancel</DynamicButton>
                </div>
              </div>
              {(() => {
                const flatten = (obj) => ({ labels: Object.keys(obj || {}), values: Object.values(obj || {}) });
                const markets = (analyticsPreview.markets) || {};
                const products = (analyticsPreview.products) || {};
                const aiModels = (analyticsPreview.aiModels) || {};
                const deliverables = (analyticsPreview.deliverables) || {};
                const m = flatten(markets); const p = flatten(products); const ai = flatten(aiModels); const d = flatten(deliverables);
                const mData = { labels: m.labels, datasets: [{ label: '# Tasks', data: m.values.map(v => v.count || 0), backgroundColor: 'rgba(99,102,241,0.6)'}] };
                const pData = { labels: p.labels, datasets: [{ label: '# Tasks', data: p.values.map(v => v.count || 0), backgroundColor: 'rgba(16,185,129,0.6)'}] };
                const aiData = { labels: ai.labels, datasets: [{ label: '# Tasks', data: ai.values, backgroundColor: 'rgba(234,88,12,0.6)'}] };
                const dData = { labels: d.labels, datasets: [{ label: '# Deliverables', data: d.values, backgroundColor: 'rgba(139,92,246,0.6)'}] };
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-center">Tasks by Market</h4>
                      <Bar data={mData} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-center">Tasks by Product</h4>
                      <Doughnut data={pData} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-center">AI Models (count)</h4>
                      <Bar data={aiData} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-center">Deliverables (count)</h4>
                      <Bar data={dData} />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;


