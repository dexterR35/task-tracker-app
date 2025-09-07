import { useGetUserByUIDQuery } from "@/features/users/usersApi";
import { useGetReportersQuery } from "@/features/reporters/reportersApi";
import { useGetMonthTasksQuery } from "@/features/tasks/tasksApi";
import { useSelector } from "react-redux";
import { selectCurrentMonthId } from "@/features/currentMonth";
import { useAuth } from "@/features/auth";
import { logger } from "@/utils/logger";

/**
 * Custom hook for user data fetching
 * Fetches only the current user's data and tasks
 */
export const useUserData = () => {
  const { user } = useAuth();
  const monthId = useSelector(selectCurrentMonthId);
  
  // Get the correct userUID using standardized utility
  const userUID = user?.userUID || user?.uid || user?.id;
  
  // Debug logging
  logger.log('useUserData Debug:', {
    user,
    userUID,
    monthId,
    hasUser: !!user,
    hasUserUID: !!userUID,
    hasMonthId: !!monthId,
    currentDate: new Date().toISOString(),
    expectedMonthId: new Date().toISOString().slice(0, 7), // YYYY-MM format
    userUIDBreakdown: {
      userUID: user?.userUID,
      uid: user?.uid,
      id: user?.id,
      finalUserUID: userUID
    }
  });
  
  // Fetch current user's data
  const { 
    data: userData, 
    isLoading: userLoading, 
    error: userError 
  } = useGetUserByUIDQuery(
    { userUID },
    { skip: !userUID }
  );
  
  // Fetch all reporters (needed for task creation) - this populates the cache
  const { 
    data: reporters = [], 
    isLoading: reportersLoading, 
    error: reportersError 
  } = useGetReportersQuery();
  
  // Fetch user's own tasks (userId: userUID)
  const { 
    data: tasksData = [], 
    isLoading: tasksLoading, 
    error: tasksError 
  } = useGetMonthTasksQuery(
    { monthId, userId: userUID, role: 'user' },
    { skip: !userUID || !monthId }
  );

  // Debug API call
  logger.log('useGetMonthTasksQuery Debug:', {
    monthId,
    userId: userUID,
    role: 'user',
    skip: !userUID || !monthId,
    tasksData,
    tasksLoading,
    tasksError
  });
  
  const isLoading = userLoading || reportersLoading || tasksLoading;
  const error = userError || reportersError || tasksError;
  
  return {
    user: userData,
    reporters,
    tasks: tasksData || [],
    isLoading,
    error,
    monthId
  };
};
