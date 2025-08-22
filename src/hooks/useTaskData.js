// import { useMemo } from 'react';
// import { useSelector } from 'react-redux';

// /**
//  * Hook that gets task data from Redux cache and IndexedDB, calculates metrics,
//  * and returns the calculated data for use in card components
//  */
// export const useTaskData = (monthId, userId = null) => {
//   // Access the RTK Query cache from Redux state (same as taskApi)
//   const tasksApiState = useSelector((state) => state.tasksApi);

//   const taskData = useMemo(() => {
//     // Get tasks from Redux cache using the same query pattern as taskApi
//     const queries = tasksApiState?.queries || {};
//     const queryKey = `subscribeToMonthTasks({"monthId":"${monthId}","userId":${userId ? `"${userId}"` : 'null'},"useCache":true})`;
//     const query = queries[queryKey];
    
//     const tasks = query?.data || [];
//     const isLoading = query?.isLoading || false;
//     const error = query?.error || null;

//     // Filter tasks by user if userId is provided (same as taskApi filtering)
//     const filteredTasks = userId ? tasks.filter(task => task.userUID === userId) : tasks;

//     if (!filteredTasks || filteredTasks.length === 0) {
//       return {
//         // Raw data
//         tasks: filteredTasks,
//         monthId,
//         userId,
        
//         // Loading states
//         isLoading,
//         error,
//         hasData: false,
        
//         // Calculated metrics - all zero when no data
//         metrics: {
//           // Basic metrics
//           totalTasks: 0,
//           totalHours: 0,
//           avgHoursPerTask: 0,
          
//           // AI metrics
//           aiTasks: 0,
//           aiHours: 0,
//           aiPercentage: 0,
//           avgAITimePerTask: 0,
          
//           // Quality metrics
//           reworkedTasks: 0,
//           reworkedPercentage: 0,
          
//           // Efficiency metrics
//           efficiency: 0,
//           timeSaved: 0,
          
//           // Status metrics
//           completedTasks: 0,
//           pendingTasks: 0,
//           completedPercentage: 0,
//         }
//       };
//     }

//     // Calculate all metrics
//     const totalTasks = filteredTasks.length;
//     const totalHours = filteredTasks.reduce((sum, task) => sum + (parseFloat(task.timeInHours) || 0), 0);
//     const avgHoursPerTask = totalTasks > 0 ? totalHours / totalTasks : 0;

//     // AI metrics
//     const aiTasks = filteredTasks.filter(task => task.aiUsed).length;
//     const aiHours = filteredTasks.reduce((sum, task) => {
//       return sum + (task.aiUsed ? (parseFloat(task.timeSpentOnAI) || 0) : 0);
//     }, 0);
//     const aiPercentage = totalTasks > 0 ? (aiTasks / totalTasks) * 100 : 0;
//     const avgAITimePerTask = aiTasks > 0 ? aiHours / aiTasks : 0;

//     // Quality metrics
//     const reworkedTasks = filteredTasks.filter(task => task.reworked).length;
//     const reworkedPercentage = totalTasks > 0 ? (reworkedTasks / totalTasks) * 100 : 0;

//     // Efficiency metrics
//     let efficiency = 0;
//     let timeSaved = 0;
//     if (aiTasks > 0) {
//       const nonAITasks = filteredTasks.filter(task => !task.aiUsed);
//       const nonAITotalHours = nonAITasks.reduce((sum, task) => sum + (parseFloat(task.timeInHours) || 0), 0);
//       const avgNonAITime = nonAITasks.length > 0 ? nonAITotalHours / nonAITasks.length : 0;
//       const avgAITime = aiHours / aiTasks;
      
//       if (avgNonAITime > 0) {
//         efficiency = ((avgNonAITime - avgAITime) / avgNonAITime) * 100;
//         timeSaved = (avgNonAITime - avgAITime) * aiTasks;
//       }
//     }

//     // Status metrics
//     const completedTasks = filteredTasks.filter(task => task.status === 'completed').length;
//     const pendingTasks = totalTasks - completedTasks;
//     const completedPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

//     return {
//       // Raw data
//       tasks: filteredTasks,
//       monthId,
//       userId,
      
//       // Loading states
//       isLoading,
//       error,
//       hasData: true,
      
//       // All calculated metrics
//       metrics: {
//         // Basic metrics
//         totalTasks,
//         totalHours,
//         avgHoursPerTask,
        
//         // AI metrics
//         aiTasks,
//         aiHours,
//         aiPercentage,
//         avgAITimePerTask,
        
//         // Quality metrics
//         reworkedTasks,
//         reworkedPercentage,
        
//         // Efficiency metrics
//         efficiency,
//         timeSaved,
        
//         // Status metrics
//         completedTasks,
//         pendingTasks,
//         completedPercentage,
//       }
//     };
//   }, [tasksApiState, monthId, userId]);

//   return taskData;
// };

// export default useTaskData;
