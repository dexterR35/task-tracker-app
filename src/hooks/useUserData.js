import { useGetUserByUIDQuery } from "@/features/users/usersApi";
import { useGetReportersQuery } from "@/features/reporters/reportersApi";
import { useSubscribeToMonthTasksQuery } from "@/features/tasks/tasksApi";
import { useSelector } from "react-redux";
import { selectCurrentMonthId } from "@/features/currentMonth";
import { useAuth } from "@/features/auth";

/**
 * Custom hook for user data fetching
 * Fetches only the current user's data and tasks
 */
export const useUserData = () => {
  const { user } = useAuth();
  const monthId = useSelector(selectCurrentMonthId);
  
  // Fetch current user's data
  const { 
    data: userData, 
    isLoading: userLoading, 
    error: userError 
  } = useGetUserByUIDQuery(
    { userUID: user?.uid },
    { skip: !user?.uid }
  );
  
  // Fetch all reporters (needed for task creation)
  const { 
    data: reporters = [], 
    isLoading: reportersLoading, 
    error: reportersError 
  } = useGetReportersQuery(
    undefined,
    { skip: !monthId }
  );
  
  // Fetch user's own tasks (userId: user.uid)
  const { 
    data: tasksData = { tasks: [] }, 
    isLoading: tasksLoading, 
    error: tasksError 
  } = useSubscribeToMonthTasksQuery(
    { monthId, userId: user?.uid },
    { skip: !user?.uid || !monthId }
  );
  
  const isLoading = userLoading || reportersLoading || tasksLoading;
  const error = userError || reportersError || tasksError;
  
  return {
    user: userData,
    reporters,
    tasks: tasksData.tasks || [],
    isLoading,
    error,
    monthId
  };
};
