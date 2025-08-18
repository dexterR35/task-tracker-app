import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useUsers } from "../hooks/useFirestore";
import { useNotifications } from "../hooks/useNotifications";
import DynamicButton from "../components/DynamicButton";
import TaskForm from "../components/task/TaskForm";
import AnalyticsSummary from "../components/AnalyticsSummary";
import TasksTable from "../components/task/TasksTable";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMonthTasksIfNeeded,
  selectMonthTasks,
  generateMonth,
  selectMonthTasksState,
} from "../redux/slices/tasksSlice";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import ErrorDisplay from "../components/notification/error/ErrorDisplay";
import MonthlyReport from '../components/MonthlyReport';

const DashboardPage = () => {
  const { user } = useAuth();
  const { userId: impersonatedUserId } = useParams();
  const monthId = useMemo(() => dayjs().format("YYYY-MM"), []);

  const dispatch = useDispatch();
  const allTasks = useSelector(selectMonthTasks(monthId));
  const { addSuccess, addError } = useNotifications();
  const {
    data: usersList,
    fetchData: fetchUsers,
    loading: usersLoading,
  } = useUsers();
  const tasksState = useSelector(selectMonthTasksState(monthId));
  const tasksStatus = tasksState?.status;
  const tasksError = tasksState?.error;

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [monthReady, setMonthReady] = useState(true);
  const [checkingMonth, setCheckingMonth] = useState(true);
  const monthStart = dayjs(monthId + "-01");
  const monthEnd = monthStart.endOf("month");
  const [dateRange, setDateRange] = useState({
    start: monthStart,
    end: monthEnd,
  });

  const navigate = useNavigate();
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    // Fetch tasks for everyone
    dispatch(fetchMonthTasksIfNeeded({ monthId }));

    // Admin-specific logic: fetch the list of users
    if (user.role === 'admin' && !hasBootstrappedRef.current) {
      fetchUsers({ orderBy: [["createdAt", "desc"]], limit: 200 }).catch(() => {});
      hasBootstrappedRef.current = true;
    }
    
    // Admin-specific logic: check if month document exists
    if (user.role === 'admin') {
      checkMonthExists();
    }
  }, [user, monthId, dispatch]);

  const checkMonthExists = async () => {
    setCheckingMonth(true);
    try {
      const ref = doc(db, "tasks", monthId);
      const snap = await getDoc(ref);
      setMonthReady(snap.exists());
    } catch {
      setMonthReady(false);
    } finally {
      setCheckingMonth(false);
    }
  };

  const handleGenerateMonth = async () => {
    // This is an admin-only action, so no role check needed here
    // ... (function remains the same)
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: dayjs(value) }));
  };
  
  const handleUserSelect = (e) => {
    const userId = e.target.value;
    navigate(userId ? `/dashboard/${userId}` : "/dashboard");
  };

  const filteredTasks = useMemo(() => {
    const start = dateRange.start.startOf('day').valueOf();
    const end = dateRange.end.endOf('day').valueOf();

    return (allTasks || []).filter((t) => {
      // Role-based user filtering
      if (user?.role === 'admin') {
        // If admin has selected a user, filter by that user. Otherwise, show all.
        if (impersonatedUserId && t.userUID !== impersonatedUserId) {
          return false;
        }
      } else {
        // If not an admin, they can ONLY see their own tasks.
        if (t.userUID !== user?.uid) {
          return false;
        }
      }

      // Date filtering (for admins)
      if (user?.role === 'admin') {
          const created = t.createdAt || 0;
          return created >= start && created <= end;
      }

      // Regular users see all their tasks for the month, no date filter applied
      return true;
    });
  }, [allTasks, dateRange, user, impersonatedUserId]);

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {user.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
          </h1>
        </div>

        {/* Admin-Only Filters Section */}
        {user.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" name="start" value={dateRange.start.format("YYYY-MM-DD")} onChange={handleDateChange} className="border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" name="end" value={dateRange.end.format("YYYY-MM-DD")} onChange={handleDateChange} className="border rounded px-3 py-2" />
            </div>
            {usersLoading ? <div className="text-sm text-gray-500">Loading users…</div> : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <select value={impersonatedUserId || ""} onChange={handleUserSelect} className="border rounded px-3 py-2 min-w-[200px]">
                  <option value="">All Users</option>
                  {usersList.map((u) => <option key={u.id} value={u.userUID}>{u.name || u.email}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Admin-Only Impersonation Banner */}
        {user.role === 'admin' && impersonatedUserId && (
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm px-4 py-2 rounded mb-6 flex justify-between items-center">
            <div>Viewing tasks for: <span className="font-semibold">{usersList.find((u) => u.userUID === impersonatedUserId)?.name || impersonatedUserId}</span></div>
            <DynamicButton variant="outline" size="sm" onClick={() => navigate("/dashboard")}>Exit View</DynamicButton>
          </div>
        )}

        {/* Admin-Only Monthly Report */}
        {user.role === 'admin' && <MonthlyReport />}

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start">
          <DynamicButton id="create-task-btn" variant="success" icon={PlusIcon} onClick={() => setShowTaskForm(!showTaskForm)}>{showTaskForm ? "Hide Form" : "Create Task"}</DynamicButton>
          
          {/* Admin-Only Month Generation */}
          {user.role === 'admin' && !monthReady && !checkingMonth && (
              <DynamicButton id="generate-month-btn" variant="primary" onClick={handleGenerateMonth} loading={generating} loadingText="Generating...">Create Board - {monthId}</DynamicButton>
          )}
        </div>

        {showTaskForm && <div className="mb-6"><TaskForm /></div>}

        <div className="space-y-8">
          {tasksStatus === "failed" && <ErrorDisplay error={tasksError || "Failed to load tasks"} onRetry={() => dispatch(fetchMonthTasksIfNeeded({ monthId, force: true }))} />}
          {tasksStatus === "succeeded" && (
            <>
              <AnalyticsSummary tasks={filteredTasks} />
              {filteredTasks.length === 0 ? <div className="bg-white border rounded-lg p-6 text-center text-sm text-gray-500">No tasks found.</div> : (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Tasks ({filteredTasks.length})</h2>
                  <TasksTable tasks={filteredTasks} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;