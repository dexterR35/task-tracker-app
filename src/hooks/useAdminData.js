import { useGetUsersQuery } from "@/features/users/usersApi";
import { useGetReportersQuery } from "@/features/reporters/reportersApi";
import { useSubscribeToMonthTasksQuery } from "@/features/tasks/tasksApi";
import { useSelector } from "react-redux";
import { selectCurrentMonthId } from "@/features/currentMonth";

/**
 * Custom hook for admin data fetching
 * Fetches all users, reporters, and tasks for admin users
 */
export const useAdminData = () => {
  const monthId = useSelector(selectCurrentMonthId);
  
  // Fetch all users (admin only)
  const { 
    data: users = [], 
    isLoading: usersLoading, 
    error: usersError 
  } = useGetUsersQuery();
  
  // Fetch all reporters (admin only)
  const { 
    data: reporters = [], 
    isLoading: reportersLoading, 
    error: reportersError 
  } = useGetReportersQuery();
  
  // Fetch all tasks (admin only - userId: null)
  const { 
    data: tasksData = { tasks: [] }, 
    isLoading: tasksLoading, 
    error: tasksError 
  } = useSubscribeToMonthTasksQuery(
    { monthId, userId: null },
    { skip: !monthId }
  );
  
  const isLoading = usersLoading || reportersLoading || tasksLoading;
  const error = usersError || reportersError || tasksError;
  
  return {
    users,
    reporters,
    tasks: tasksData.tasks || [],
    isLoading,
    error,
    monthId
  };
};
