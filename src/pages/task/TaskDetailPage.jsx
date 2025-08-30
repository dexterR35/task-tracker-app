import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import { useCentralizedDataAnalytics } from "../../shared/hooks/analytics/useCentralizedDataAnalytics";
import { useCurrentMonth } from "../../shared/hooks/useCurrentMonth";


const TaskDetailPage = () => {
  const { taskId, monthId: paramMonthId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { monthId: globalMonthId } = useCurrentMonth();

  // Use effective monthId (param takes precedence)
  const effectiveMonthId = paramMonthId || globalMonthId;

  // Get passed task data from navigation state
  const task = location.state?.taskData;

  // Get additional data from centralized hook for enhanced display
  const { 
    reporters = [],
    users = [],
    getReporterById,
    getUserById
  } = useCentralizedDataAnalytics();

  // If no task data is passed, show error (this should not happen when navigating from table)
  if (!task) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-yellow-800 font-semibold mb-2">Task Data Not Available</h2>
          <p className="text-yellow-600">
            Task data is not available. Please navigate from the task table to view task details.
          </p>
          <DynamicButton 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            Go Back
          </DynamicButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
        <DynamicButton variant="outline" onClick={() => navigate(-1)}>
          Back
        </DynamicButton>
      </div>
      <div className="space-y-4 text-sm mb-8">
        <div>
          <span className="font-medium text-gray-700">ID:</span> {task.id}
        </div>
        <div>
          <span className="font-medium text-gray-700">Jira Link:</span>{" "}
          {task.jiraLink ? (
            <a
              href={task.jiraLink}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              {task.jiraLink}
            </a>
          ) : (
            "-"
          )}
        </div>
        <div>
          <span className="font-medium text-gray-700">Markets:</span>{" "}
          {Array.isArray(task.markets)
            ? task.markets.join(", ")
            : task.market || "-"}
        </div>
        <div>
          <span className="font-medium text-gray-700">Product:</span>{" "}
          {task.product}
        </div>
        <div>
          <span className="font-medium text-gray-700">Task Name:</span>{" "}
          {task.taskName}
        </div>
        <div>
          <span className="font-medium text-gray-700">User:</span>{" "}
          {getUserById(task.userUID)?.name || task.userUID}
        </div>
        <div>
          <span className="font-medium text-gray-700">Reporter:</span>{" "}
          {getReporterById(task.reporters)?.name || task.reporters || "Not assigned"}
        </div>
        <div>
          <span className="font-medium text-gray-700">Month ID:</span>{" "}
          {task.monthId}
        </div>
        <div>
          <span className="font-medium text-gray-700">Created By:</span>{" "}
          {task.createdByName || task.createdBy}
        </div>
        <div>
          <span className="font-medium text-gray-700">AI Used:</span>{" "}
          {task.aiUsed ? "Yes" : "No"}
        </div>
        <div>
          <span className="font-medium text-gray-700">AI Models:</span>{" "}
          {task.aiUsed
            ? (task.aiModels && task.aiModels !== false && Array.isArray(task.aiModels))
              ? task.aiModels.join(", ")
              : task.aiModel || "-"
            : "-"}
        </div>
        <div>
          <span className="font-medium text-gray-700">Deliverables:</span>{" "}
          {Array.isArray(task.deliverables)
            ? task.deliverables.join(", ")
            : task.deliverable || "-"}
        </div>
        <div>
          <span className="font-medium text-gray-700">Other Deliverables:</span>{" "}
          {task.deliverablesOther && task.deliverablesOther !== false && Array.isArray(task.deliverablesOther) && task.deliverablesOther.length > 0
            ? task.deliverablesOther.join(", ")
            : "-"}
        </div>
        <div>
          <span className="font-medium text-gray-700">
            Time Spent On AI (h):
          </span>{" "}
          {task.timeSpentOnAI}
        </div>
        <div>
          <span className="font-medium text-gray-700">Time In Hours:</span>{" "}
          {task.timeInHours}
        </div>
        <div>
          <span className="font-medium text-gray-700">Reworked:</span>{" "}
          {task.reworked ? "Yes" : "No"}
        </div>
        <div>
          <span className="font-medium text-gray-700">Created At:</span>{" "}
          {task.createdAt
            ? format(task.createdAt?.toDate?.() || task.createdAt, "yyyy-MM-dd HH:mm")
            : "N/A"}
        </div>
        <div>
          <span className="font-medium text-gray-700">Updated At:</span>{" "}
          {task.updatedAt
            ? format(task.updatedAt?.toDate?.() || task.updatedAt, "yyyy-MM-dd HH:mm")
            : "N/A"}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
