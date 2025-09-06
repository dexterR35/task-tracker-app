import { useGetUsersQuery } from "@/features/users/usersApi";
import { useGetReportersQuery } from "@/features/reporters/reportersApi";
import { useGetMonthTasksQuery } from "@/features/tasks/tasksApi";
import { useSelector } from "react-redux";
import { selectCurrentMonthId } from "@/features/currentMonth";
import { useAuth } from "@/features/auth";

/**
 * Custom hook for admin data fetching
 * Fetches all users, reporters, and tasks for admin users
 */
export const useAdminData = () => {
  const monthId = useSelector(selectCurrentMonthId);
  const { user } = useAuth();
  const userUID = user?.userUID;
  
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
  
  // Fetch all tasks (admin only - with userUID but role determines filtering)
  const { 
    data: tasksData = [], 
    isLoading: tasksLoading, 
    error: tasksError 
  } = useGetMonthTasksQuery(
    { monthId, userId: userUID, role: 'admin' },
    { skip: !monthId || !userUID }
  );
  
  const isLoading = usersLoading || reportersLoading || tasksLoading;
  const error = usersError || reportersError || tasksError;
  
  return {
    users,
    reporters,
    tasks: tasksData || [],
    isLoading,
    error,
    monthId
  };
};
