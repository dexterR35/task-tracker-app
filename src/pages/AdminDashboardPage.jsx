import  {dayjs, useMemo, useState, useEffect,useSearchParams,useNavigate } from '../hooks/useImports';
import { useAuth } from '../hooks/useAuth';
import { useGetUsersQuery } from '../redux/services/usersApi';
import { useGetMonthTasksQuery, useGetMonthBoardExistsQuery, useGenerateMonthBoardMutation } from '../redux/services/tasksApi';
import DynamicButton from '../components/button/DynamicButton';
import TaskForm from '../components/task/TaskForm';
import TasksTable from '../components/task/TasksTable';
import AnalyticsSummary from '../components/AnalyticsSummary';
import Skeleton from '../components/ui/Skeleton';


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


  const [showTaskForm, setShowTaskForm] = useState(false);
  const monthStart = dayjs(monthId + '-01');
  const monthEnd = monthStart.endOf('month');
  const [dateRange, setDateRange] = useState({ start: monthStart, end: monthEnd });

  useEffect(() => { }, [user, monthId]);

  const filteredTasks = useMemo(() => {
    const start = dateRange.start.startOf('day').valueOf();
    const end = dateRange.end.endOf('day').valueOf();
    return (tasks || []).filter(t => {
      if (impersonatedUserId && t.userUID !== impersonatedUserId) return false;
      const created = t.createdAt || 0;
      return created >= start && created <= end;
    });
  }, [tasks, dateRange, impersonatedUserId]);

  const handleGenerateAnalytics = () => {
    navigate(`/preview/${monthId}`);
  };

  const handleUserSelect = (e) => {
    const uid = e.target.value;
    navigate(uid ? `/admin?user=${uid}` : '/admin');
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
              <Skeleton variant="text" width="160px" height="20px" />
              <Skeleton variant="input" width="256px" />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select value={impersonatedUserId || ''} onChange={handleUserSelect} className="border rounded px-3 py-2 min-w-[200px]">
                <option value="">All Users</option>
                {usersList.map(u => (
                  <option key={u.userUID || u.id} value={u.userUID || u.id}>
                    {u.name || u.email}
                  </option>
                ))}
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
          <DynamicButton variant="outline" onClick={handleGenerateAnalytics}>Generate Analytics ({monthId})</DynamicButton>
        </div>

        {showTaskForm && <div className="mb-6"><TaskForm /></div>}

        <div className="space-y-8">
          <AnalyticsSummary tasks={filteredTasks} loading={tasksLoading} />
          {!tasksLoading && filteredTasks.length === 0 ? <div className="bg-white border rounded-lg p-6 text-center text-sm text-gray-500">No tasks found.</div> : (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Tasks ({filteredTasks.length})</h2>
              <TasksTable tasks={filteredTasks} loading={tasksLoading} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;


