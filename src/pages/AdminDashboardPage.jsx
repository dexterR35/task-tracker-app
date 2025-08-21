import { useSearchParams, useNavigate } from "../hooks/useImports";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useGetUsersQuery } from "../redux/services/usersApi";
import {
  useGenerateMonthBoardMutation,
} from "../redux/services/tasksApi";
import DashboardWrapper from "../components/dashboard/DashboardWrapper";
import { format } from "date-fns";
import { collection, getDocs, useState, useEffect } from "../hooks/useImports";
import { db } from "../firebase";

const AdminDashboardPage = () => {
  const { addSuccess, addError } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const impersonatedUserId = searchParams.get("user") || "";
  const { data: usersList = [], isLoading: usersLoading } = useGetUsersQuery({ useCache: true });
  const [generateBoard, { isLoading: generatingBoard }] = useGenerateMonthBoardMutation();
  
  // Track when tasks don't exist to prevent re-checking
  const [noTasksForMonth, setNoTasksForMonth] = useState({});
  const [isCheckingTasks, setIsCheckingTasks] = useState(false);
  
  // Get current month from URL or default to current month
  const urlMonthId = searchParams.get("monthId");
  const currentMonth = format(new Date(), "yyyy-MM");
  const selectedMonth = urlMonthId || currentMonth;
  
  // Reset states when month changes
  useEffect(() => {
    setNoTasksForMonth({});
    setIsCheckingTasks(false);
  }, [selectedMonth]);

  // Function to clear the "no tasks" state for a specific month
  const clearNoTasksState = (monthId) => {
    console.log('Clearing no tasks state for month:', monthId);
    setNoTasksForMonth(prev => {
      const newState = { ...prev };
      delete newState[monthId];
      console.log('Updated noTasksForMonth state:', newState);
      return newState;
    });
  };

  const handleGenerateAnalytics = async (monthId) => {
    // Always work with current month - no restrictions
    
    // Prevent multiple simultaneous checks
    if (isCheckingTasks) return;
    
    // If we already know there are no tasks for this month, don't check again
    if (noTasksForMonth[monthId]) {
      addError(`Cannot generate analytics: No tasks found for ${format(new Date(monthId + "-01"), "MMMM yyyy")}. Please create at least one task before generating analytics.`);
      return;
    }
    
    setIsCheckingTasks(true);
    
    try {
      // Check if there are any tasks for this month
      const tasksRef = collection(db, 'tasks', monthId, 'monthTasks');
      const tasksSnapshot = await getDocs(tasksRef);
      
      if (tasksSnapshot.empty) {
        setNoTasksForMonth(prev => ({ ...prev, [monthId]: true }));
        addError(`Cannot generate analytics: No tasks found for ${format(new Date(monthId + "-01"), "MMMM yyyy")}. Please create at least one task before generating analytics.`);
        return;
      }
      
      addSuccess(`Generating analytics for ${format(new Date(monthId + "-01"), "MMMM yyyy")}...`);
      navigate(`/preview/${monthId}`);
    } finally {
      setIsCheckingTasks(false);
    }
  };

  const handleGenerateBoard = async (monthId) => {
    // Always work with current month - no restrictions
    
    // Prevent multiple simultaneous checks
    if (isCheckingTasks) return;
    
    // If we already know there are no tasks for this month, don't check again
    if (noTasksForMonth[monthId]) {
      addError(`Cannot create board: No tasks found for ${format(new Date(monthId + "-01"), "MMMM yyyy")}. Please create at least one task before generating the board.`);
      return;
    }
    
    setIsCheckingTasks(true);
    
    try {
      // Check if there are any tasks for this month
      const tasksRef = collection(db, 'tasks', monthId, 'monthTasks');
      const tasksSnapshot = await getDocs(tasksRef);
      
      if (tasksSnapshot.empty) {
        setNoTasksForMonth(prev => ({ ...prev, [monthId]: true }));
        addError(`Cannot create board: No tasks found for ${format(new Date(monthId + "-01"), "MMMM yyyy")}. Please create at least one task before generating the board.`);
        return;
      }
      
      await generateBoard({ monthId: monthId }).unwrap();
      addSuccess(`Month board for ${format(new Date(monthId + "-01"), "MMMM yyyy")} created successfully!`);
    } catch (error) {
      addError(`Failed to create month board: ${error.message}`);
    } finally {
      setIsCheckingTasks(false);
    }
  };

  const handleUserSelect = (e) => {
    const uid = e.target.value;
    const isCurrentMonth = selectedMonth === currentMonth;
    const hasUserFilter = uid && uid !== "";
    
    // Build URL parameters
    const newSearchParams = new URLSearchParams();
    
    // Always include monthId if it's not the current month
    if (!isCurrentMonth) {
      newSearchParams.set("monthId", selectedMonth);
    }
    
    // Always include user if there's a filter
    if (hasUserFilter) {
      newSearchParams.set("user", uid);
    }
    
    // Navigate to the appropriate URL
    const queryString = newSearchParams.toString();
    const url = queryString ? `/admin?${queryString}` : "/admin";
    navigate(url);
  };

  // Check if current month has no tasks
  const currentMonthHasNoTasks = noTasksForMonth[selectedMonth] || false;

  return (
    <DashboardWrapper
      title="Admin Dashboard"
      showUserFilter={true}
      usersList={usersList}
      usersLoading={usersLoading}
      onUserSelect={handleUserSelect}
      impersonatedUserId={impersonatedUserId}
      
      isAdmin={true}
      onGenerateAnalytics={handleGenerateAnalytics}
      onGenerateBoard={handleGenerateBoard}
      generatingBoard={generatingBoard}
      noTasksForCurrentMonth={currentMonthHasNoTasks}
      isCheckingTasks={isCheckingTasks}
      onTasksCreated={() => clearNoTasksState(selectedMonth)}
    />
  );
};

export default AdminDashboardPage;
