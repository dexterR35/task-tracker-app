import React from 'react';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/features/auth/hooks/useAuth';
import TanStackTable from '@/components/Table/TanStackTable';
import FormattedDeliverableCalculation from '@/components/DeliverableCalculation/FormattedDeliverableCalculation';
import { useDeliverableCalculation } from '@/hooks/useDeliverableCalculation';
import { useDeliverablesOptions } from '@/hooks/useDeliverablesOptions';
import { createColumnHelper } from '@tanstack/react-table';

const columnHelper = createColumnHelper();

const TaskDeliverablesPage = () => {
  const { tasks, error, isLoading } = useAppData();
  const { user } = useAuth();
  const { deliverablesOptions } = useDeliverablesOptions();

  // Get real deliverables data from tasks
  const realDeliverablesData = tasks?.filter(task => 
    task.data_task?.deliverablesUsed && 
    task.data_task.deliverablesUsed.length > 0
  ) || [];

  // Debug: Log deliverable configuration
  console.log('🔍 Deliverable Options:', deliverablesOptions);
  console.log('📊 Tasks with deliverables:', realDeliverablesData.length);
  console.log('📋 Tasks data:', realDeliverablesData.map(task => ({
    taskName: task.data_task?.taskName,
    deliverablesUsed: task.data_task?.deliverablesUsed,
    deliverablesCount: task.data_task?.deliverablesUsed?.length || 0
  })));
  
  // Check if "Video Social Media" has declinari configured
  const videoSocialMedia = deliverablesOptions?.find(d => d.value === 'Video Social Media');
  if (videoSocialMedia) {
    console.log('🎥 Video Social Media config:', {
      name: videoSocialMedia.label,
      timePerUnit: videoSocialMedia.timePerUnit,
      timeUnit: videoSocialMedia.timeUnit,
      declinariTime: videoSocialMedia.declinariTime,
      declinariTimeUnit: videoSocialMedia.declinariTimeUnit
    });
  }

  // Debug: Check specific task data
  const specificTask = realDeliverablesData.find(task => 
    task.data_task?.taskName === 'gimodear-1289051251'
  );
  if (specificTask) {
    console.log('🎯 Specific task data:', {
      taskName: specificTask.data_task?.taskName,
      deliverablesUsed: specificTask.data_task?.deliverablesUsed,
      declinariQuantities: specificTask.data_task?.declinariQuantities,
      declinariDeliverables: specificTask.data_task?.declinariDeliverables
    });
  }

  // Calculate real summary stats without hooks
  const summaryStats = React.useMemo(() => {
    let totalDeliverables = 0;
    let totalHours = 0;
    let totalDeclinari = 0;
    let uniqueDeliverableTypes = new Set();

    realDeliverablesData.forEach(task => {
      const deliverablesUsed = task.data_task?.deliverablesUsed;
      if (!deliverablesUsed || !Array.isArray(deliverablesUsed) || deliverablesUsed.length === 0) {
        return;
      }

      // Calculate without using hooks - manual calculation
      deliverablesUsed.forEach((deliverable) => {
        const deliverableName = deliverable?.name;
        const quantity = deliverable?.count || 1;
        
        if (!deliverableName || typeof deliverableName !== 'string') {
          return;
        }
        
        // Add to unique deliverable types
        uniqueDeliverableTypes.add(deliverableName);
        
        const deliverableOption = deliverablesOptions?.find(d => d.value === deliverableName);
        
        if (deliverableOption) {
          // Calculate time for this deliverable
          const timePerUnit = deliverableOption.timePerUnit || 1;
          const timeUnit = deliverableOption.timeUnit || 'hr';
          const declinariTime = deliverableOption.declinariTime || 0;
          const declinariTimeUnit = deliverableOption.declinariTimeUnit || 'min';
          
          // Convert to hours
          let timeInHours = timePerUnit;
          if (timeUnit === 'min') timeInHours = timePerUnit / 60;
          if (timeUnit === 'days') timeInHours = timePerUnit * 8;
          
          // Add declinari time if present
          let declinariTimeInHours = 0;
          if (declinariTime > 0) {
            if (declinariTimeUnit === 'min') declinariTimeInHours = declinariTime / 60;
            else if (declinariTimeUnit === 'hr') declinariTimeInHours = declinariTime;
            else if (declinariTimeUnit === 'days') declinariTimeInHours = declinariTime * 8;
            else declinariTimeInHours = declinariTime / 60; // Default to minutes
          }
          
          // Get declinari quantity for this deliverable
          const declinariQuantity = deliverable?.declinariQuantity || 0;
          const totalDeclinariTime = declinariQuantity * declinariTimeInHours;
          const calculatedTime = (timeInHours * quantity) + totalDeclinariTime;
          
          totalDeliverables += quantity;
          totalHours += calculatedTime;
          totalDeclinari += declinariQuantity;
        }
      });
    });

    // Debug: Log the actual calculations
    console.log('📊 Summary Stats Calculation:', {
      tasksWithDeliverables: realDeliverablesData.length,
      totalDeliverables,
      totalHours,
      totalDeclinari,
      totalDays: totalHours / 8,
      uniqueDeliverableTypes: uniqueDeliverableTypes.size,
      uniqueTypes: Array.from(uniqueDeliverableTypes)
    });

    return {
      totalDeliverables,
      totalHours,
      totalDeclinari,
      totalDays: totalHours / 8,
      uniqueDeliverableTypes: uniqueDeliverableTypes.size
    };
  }, [realDeliverablesData, deliverablesOptions]);

  // Create table columns
  const columns = [
    columnHelper.accessor((row) => row.data_task?.taskName, {
      header: 'Task Name',
      cell: ({ getValue }) => {
        const taskName = getValue();
        if (!taskName) return 'No Link';
        
        const jiraUrl = `https://gmrd.atlassian.net/browse/${taskName}`;
        
        return (
          <a 
            href={jiraUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {taskName}
          </a>
        );
      },
      size: 200,
    }),
    columnHelper.accessor((row) => row.data_task?.deliverablesUsed, {
      header: 'Deliverables',
      cell: ({ getValue }) => {
        const deliverablesUsed = getValue();
        
        return (
          <FormattedDeliverableCalculation 
            deliverablesUsed={deliverablesUsed}
            showDetailedCalculations={user?.role === 'admin'}
            variant="detailed"
          />
        );
      },
      size: 300,
    }),
    columnHelper.accessor((row) => row.data_task?.deliverablesUsed, {
      id: 'deliverablesCount',
      header: 'Count',
      cell: ({ getValue }) => {
        const deliverablesUsed = getValue();
        if (!deliverablesUsed || !Array.isArray(deliverablesUsed)) return 0;
        
        // Calculate total quantity of all deliverables
        const totalQuantity = deliverablesUsed.reduce((sum, deliverable) => {
          return sum + (deliverable?.count || 1);
        }, 0);
        
        return (
          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
            {totalQuantity}
          </span>
        );
      },
      size: 80,
    }),
    columnHelper.accessor((row) => row.data_task?.deliverablesUsed, {
      id: 'declinariCount',
      header: 'Declinari',
      cell: ({ getValue }) => {
        const deliverablesUsed = getValue();
        const { deliverablesList } = useDeliverableCalculation(deliverablesUsed, deliverablesOptions);
        const totalDeclinari = deliverablesList.reduce((sum, deliverable) => sum + (deliverable.declinariQuantity || 0), 0);
        return (
          <span className="text-orange-600 dark:text-orange-400 font-medium">
            {totalDeclinari}
          </span>
        );
      },
      size: 100,
    }),
    columnHelper.accessor((row) => row.data_task?.deliverablesUsed, {
      id: 'totalHours',
      header: 'Total Hours',
      cell: ({ getValue }) => {
        const deliverablesUsed = getValue();
        const { totalTime } = useDeliverableCalculation(deliverablesUsed, deliverablesOptions);
        return (
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {totalTime.toFixed(1)}h
          </span>
        );
      },
      size: 100,
    }),
    columnHelper.accessor((row) => row.data_task?.deliverablesUsed, {
      id: 'totalDays',
      header: 'Total Days',
      cell: ({ getValue }) => {
        const deliverablesUsed = getValue();
        const { totalTime } = useDeliverableCalculation(deliverablesUsed, deliverablesOptions);
        const days = totalTime / 8;
        return (
          <span className="text-gray-600 dark:text-gray-400">
            {days.toFixed(2)}d
          </span>
        );
      },
      size: 100,
    }),
    columnHelper.accessor((row) => row.data_task?.deliverablesUsed, {
      id: 'totalMinutes',
      header: 'Total Minutes',
      cell: ({ getValue }) => {
        const deliverablesUsed = getValue();
        const { totalTime } = useDeliverableCalculation(deliverablesUsed, deliverablesOptions);
        const minutes = totalTime * 60;
        return (
          <span className="text-gray-600 dark:text-gray-400">
            {minutes.toFixed(0)}min
          </span>
        );
      },
      size: 120,
    }),
  ];

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center py-8 max-w-md mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Data</h2>
            <p className="text-gray-300 text-sm">
              {error?.message || "Failed to load task deliverables data. Please try refreshing the page."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading task deliverables...</p>
        </div>
      </div>
    );
  }

  // Show no data state
  if (realDeliverablesData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center py-8 max-w-md mx-auto">
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
            <div className="text-yellow-400 text-4xl mb-4">📋</div>
            <h2 className="text-xl font-bold text-yellow-400 mb-2">No Task Deliverables Found</h2>
            <p className="text-gray-300 text-sm">
              No tasks with deliverables found in the database. Create some tasks with deliverables to see them here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Deliverables</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and analyze deliverable calculations for all tasks
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {realDeliverablesData.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Tasks</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {summaryStats.uniqueDeliverableTypes}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Deliverable Types</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
            {summaryStats.totalDeliverables}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Deliverables</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {summaryStats.totalHours.toFixed(1)}h
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {summaryStats.totalDeclinari}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Declinari</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {summaryStats.totalDays.toFixed(1)}d
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Days</div>
        </div>
      </div>

      {/* Calculation Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 text-blue-600 dark:text-blue-400">📝</div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Calculation Formula
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p><strong>Base Formula:</strong> Total Time = (Base Time × Quantity) + Declinari Time</p>
              <p><strong>Work Day:</strong> 1 day = 8 hours (not 24 hours)</p>
              <p><strong>Time Conversion:</strong> Hours ÷ 8 = Days | Hours × 60 = Minutes</p>
              <p><strong>Declinari:</strong> Additional time added per task (if configured)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <TanStackTable
          data={realDeliverablesData}
          columns={columns}
          isLoading={isLoading}
          error={error}
          className="rounded-lg"
          showActions={false}
        />
      </div>
    </div>
  );
};

export default TaskDeliverablesPage;
