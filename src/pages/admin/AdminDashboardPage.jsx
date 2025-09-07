import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";
import { 
  selectCurrentMonthId, 
  selectCurrentMonthName, 
  selectBoardExists,
  selectCurrentMonthDaysInMonth,
  selectCurrentMonthGenerating,
  selectCurrentMonthStartDate,
  selectCurrentMonthEndDate,
  generateMonthBoard
} from "@/features/currentMonth";
import { showSuccess, showError } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import { DynamicButton, Loader } from "@/components/ui";
import { TaskTable } from "@/features/tasks";
import { useAdminData } from "@/hooks";
import { useAuth } from "@/features/auth";

// Admin Dashboard - Shows all users' data with admin controls
const AdminDashboardPage = () => {
  // AdminDashboardPage is only accessible to admin users (enforced by route protection)
  
  // Get month data
  const monthId = useSelector(selectCurrentMonthId);
  const monthName = useSelector(selectCurrentMonthName);
  
  // Use custom hook for admin data fetching (includes reporters API call)
  const { users, reporters, tasks, isLoading, error } = useAdminData();
  
  // Use the currentMonth state as the source of truth
  const boardExists = useSelector(selectBoardExists);
  
  const [showTable, setShowTable] = useState(true);

  const dispatch = useDispatch();
  
  // Get auth data
  const { canAccess } = useAuth();
  const isUserAdmin = canAccess('admin');
  
  // Get additional month data from Redux store
  const daysInMonth = useSelector(selectCurrentMonthDaysInMonth);
  const isGenerating = useSelector(selectCurrentMonthGenerating);
  const startDate = useSelector(selectCurrentMonthStartDate);
  const endDate = useSelector(selectCurrentMonthEndDate);
  

  // Handle generate month board (admin only)
  const handleGenerateBoard = async () => {
    if (!canAccess('admin')) {
      showError("You need admin permissions to generate month boards.");
      return;
    }

    if (!monthId) {
      showError("Current month not available. Please refresh the page.");
      return;
    }

    try {
      const result = await dispatch(generateMonthBoard({
        monthId,
        startDate: startDate,
        endDate: endDate,
        daysInMonth: daysInMonth
      }));

      if (generateMonthBoard.fulfilled.match(result)) {
        showSuccess("Month board generated successfully!");
        logger.log("Month board generated", { monthId, result: result.payload });
      } else {
        showError("Failed to generate month board. Please try again.");
        logger.error("Month board generation failed", { monthId, error: result.error });
      }
    } catch (error) {
      showError("An error occurred while generating the month board.");
      logger.error("Month board generation error", { monthId, error });
    }
  };


  // Admin sees all tasks
  const filteredTasks = tasks;

  // Title for admin dashboard
  const title = "Admin Dashboard - All Users";

  if (isLoading) {
    return <Loader size="xl" text="Loading admin dashboard..." fullScreen={true} />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 text-center text-red-400">
        Error loading dashboard: {error.message || "Unknown error"}
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="container mx-auto px-4 py-6 text-center text-red-400">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400">
            {monthName ? `${monthName} - ${format(new Date(), 'yyyy')}` : 'Current Month'}
          </p>
        </div>
        
        {/* Admin Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
          {/* Generate Board Button (Admin Only) */}
          {isUserAdmin && !boardExists && (
            <DynamicButton
              onClick={handleGenerateBoard}
              disabled={isGenerating}
              variant="primary"
              size="md"
              className="bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? "Generating..." : "Generate Board"}
            </DynamicButton>
          )}
        </div>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Total Users</h3>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Total Tasks</h3>
          <p className="text-2xl font-bold">{filteredTasks.length}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Reporters</h3>
          <p className="text-2xl font-bold">{reporters.length}</p>
        </div>
        <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Board Status</h3>
          <p className="text-lg font-bold">{boardExists ? "Active" : "Not Generated"}</p>
        </div>
      </div>

      {/* Board Warning (Admin Only) */}
      {isUserAdmin && !boardExists && (
        <div className="bg-yellow-600 text-white p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">⚠️ Month Board Not Generated</h3>
          <p className="mb-3">
            The month board for {monthName} has not been generated yet. 
            Generate it to enable task management features.
          </p>
          <DynamicButton
            onClick={handleGenerateBoard}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="border-white text-white hover:bg-white hover:text-yellow-600"
          >
            {isGenerating ? "Generating..." : "Generate Board Now"}
          </DynamicButton>
        </div>
      )}

      {/* Tasks Section */}
      {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            All Tasks
          </h2>
          <DynamicButton
            onClick={() => setShowTable(!showTable)}
            variant="outline"
            size="sm"
          >
            {showTable ? "Hide Table" : "Show Table"}
          </DynamicButton>
        </div>

        {showTable && (
          <TaskTable
            tasks={filteredTasks}
            users={users}
            reporters={reporters}
            monthId={monthId}
            isAdminView={isUserAdmin}
          />
        )}
      </div> */}

    </div>
  );
};

export default AdminDashboardPage;
