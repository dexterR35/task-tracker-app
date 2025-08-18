import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
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
import { beginLoading, endLoading } from "../redux/slices/loadingSlice";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import ErrorDisplay from "../components/notification/error/ErrorDisplay";

const DashboardPage = () => {
  const { user } = useAuth();
  const { userId: impersonatedUserId } = useParams(); // Use this to read the URL parameter
  const monthId = useMemo(() => dayjs().format("YYYY-MM"), []);

  const dispatch = useDispatch();
  const tasks = useSelector(selectMonthTasks(monthId));
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
  const [selectedUser, setSelectedUser] = useState(impersonatedUserId || ""); // Correctly initializes state from URL param

  const navigate = useNavigate();

  const loadTasks = async ({ force } = {}) => {
    if (!force && tasksState?.status === "succeeded") return;
    try {
      await dispatch(fetchMonthTasksIfNeeded({ monthId, force }));
    } catch (err) {
      if (
        err?.code === "failed-precondition" ||
        /index/i.test(err?.message || "")
      );
    } finally {
      console.log("Tasks loaded for month:", monthId);
    }
  };

  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    // Admin user list fetch only once
    if (user.role === "admin" && !hasBootstrappedRef.current) {
      fetchUsers({ orderBy: [["createdAt", "desc"]], limit: 200 }).catch(
        () => {}
      );
    }

    const run = async () => {
      dispatch(beginLoading());
      try {
        await checkMonthExists();
        await loadTasks();
      } finally {
        dispatch(endLoading());
        console.log("Current month ID:", monthId);
      }
    };
    run();
    hasBootstrappedRef.current = true;
  }, [user, monthId, impersonatedUserId]); // Added impersonatedUserId to dependencies

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
      addError("Failed to generate month");
    } finally {
      setGenerating(false);
      dispatch(endLoading());
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const picked = dayjs(value);
    const clamped = picked.isBefore(monthStart)
      ? monthStart
      : picked.isAfter(monthEnd)
      ? monthEnd
      : picked;
    setDateRange((prev) => ({ ...prev, [name]: clamped }));
  };

  const filteredTasks = useMemo(() => {
    const start = dateRange.start.isBefore(monthStart)
      ? monthStart.valueOf()
      : dateRange.start.valueOf();
    const end = dateRange.end.isAfter(monthEnd)
      ? monthEnd.valueOf()
      : dateRange.end.valueOf();
    // Use impersonatedUserId if it exists, otherwise fall back to the currently logged in user
    const targetUser = user?.role === "admin" ? impersonatedUserId || selectedUser : user?.uid;
    return (tasks || []).filter((t) => {
      if (targetUser && t.userUID !== targetUser) return false;
      const created = t.createdAt || 0;
      return created >= start && created <= end;
    });
  }, [
    tasks,
    dateRange.start,
    dateRange.end,
    user,
    impersonatedUserId,
    selectedUser,
    monthStart,
    monthEnd,
  ]);

  const handleUserSelect = (e) => {
    const userId = e.target.value;
    setSelectedUser(userId);
    if (userId) {
      navigate(`/dashboard/${userId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const startInputProps = {
    min: monthStart.format("YYYY-MM-DD"),
    max: monthEnd.format("YYYY-MM-DD"),
  };
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
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="start"
              value={dateRange.start.format("YYYY-MM-DD")}
              onChange={handleDateChange}
              className="border rounded px-3 py-2"
              {...startInputProps}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="end"
              value={dateRange.end.format("YYYY-MM-DD")}
              onChange={handleDateChange}
              className="border rounded px-3 py-2"
              {...endInputProps}
            />
          </div>
          {user?.role === "admin" &&
            (usersLoading ? (
              <div className="text-sm text-gray-500">Loading users…</div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User
                </label>
                <select
                  value={impersonatedUserId || ""} // Ensure the select value matches the URL
                  onChange={handleUserSelect}
                  className="border rounded px-3 py-2 min-w-[200px]"
                >
                  <option value="">All Users</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.userUID}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>
            ))}
        </div>
        {/* Impersonation banner for admins */}
        {user?.role === "admin" && impersonatedUserId && (
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm px-4 py-2 rounded mb-6 flex justify-between items-center">
            <div>
              Viewing tasks for user:{" "}
              <span className="font-semibold">{impersonatedUserId}</span>
            </div>
            <DynamicButton
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              Exit View
            </DynamicButton>
          </div>
        )}
        {/* Action Buttons (only show create form toggle) */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start">
          {monthReady && (
            <DynamicButton
              id="create-task-btn"
              variant="success"
              icon={PlusIcon}
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="w-full md:w-auto"
            >
              {showTaskForm ? "Hide Form" : "Create Task"}
            </DynamicButton>
          )}
          {!monthReady && !checkingMonth && (
            <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800 max-w-xl">
              Current month ({monthId}) not generated yet. Please ask an admin
              to generate it.
            </div>
          )}
          {user?.role === "admin" && !monthReady && !checkingMonth && (
            <DynamicButton
              id="generate-month-btn"
              variant="primary"
              onClick={handleGenerateMonth}
              loading={generating}
              loadingText="Generating..."
            >
              Create new Board - {monthId}
            </DynamicButton>
          )}
        </div>
        {showTaskForm && monthReady && (
          <div className="mb-6">
            <TaskForm />
          </div>
        )}
        {/* Client-side filtering (memoized) */}
        <div className="space-y-8">
          {tasksStatus === "failed" && (
            <ErrorDisplay
              error={tasksError || "Failed to load tasks"}
              onRetry={() => loadTasks({ force: true })}
            />
          )}
          {tasksStatus === "succeeded" && filteredTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Summary
              </h2>
              <AnalyticsSummary tasks={filteredTasks} />
            </div>
          )}
          {tasksStatus === "succeeded" && filteredTasks.length === 0 && (
            <div className="bg-white border rounded-lg p-6 text-center text-sm text-gray-500">
              No tasks found for selected filters.
            </div>
          )}
          {tasksStatus === "succeeded" && filteredTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Tasks ({filteredTasks.length})
              </h2>
              <TasksTable
                tasks={filteredTasks}
                onSelect={(task) => navigate(`/task/${monthId}/${task.id}`)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;