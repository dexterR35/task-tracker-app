import { useDispatch, useSelector } from "../hooks/useImports";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useNavigate } from "../hooks/useImports";
import {
  selectAutoCreatedBoards,
  selectManuallyCreatedBoards,
  clearAutoCreatedBoards,
  clearManuallyCreatedBoards,
  resetSettings
} from "../redux/slices/adminSettingsSlice";
import { format } from "date-fns";
import DynamicButton from "../components/button/DynamicButton";

const AdminSettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addSuccess, addError } = useNotifications();

  // Get settings from Redux
  const autoCreatedBoards = useSelector(selectAutoCreatedBoards);
  const manuallyCreatedBoards = useSelector(selectManuallyCreatedBoards);

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    navigate('/admin');
    return null;
  }



  const handleClearAutoCreatedBoards = () => {
    dispatch(clearAutoCreatedBoards());
    addSuccess('Auto-created boards history cleared!');
  };

  const handleClearManuallyCreatedBoards = () => {
    dispatch(clearManuallyCreatedBoards());
    addSuccess('Manually created boards history cleared!');
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all admin settings to defaults?')) {
      dispatch(resetSettings());
      addSuccess('Settings reset to defaults!');
    }
  };

  const formatAutoCreatedBoards = () => {
    const boards = Object.entries(autoCreatedBoards);
    if (boards.length === 0) {
      return <p className="text-gray-500 text-sm">No boards have been auto-created yet.</p>;
    }

    return (
      <div className="space-y-2">
        {boards.map(([monthId, timestamp]) => (
          <div key={monthId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-sm font-medium">
              {format(new Date(monthId + "-01"), "MMMM yyyy")}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(timestamp), "MMM dd, yyyy 'at' HH:mm")}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const formatManuallyCreatedBoards = () => {
    const boards = Object.entries(manuallyCreatedBoards);
    if (boards.length === 0) {
      return <p className="text-gray-500 text-sm">No boards have been manually created yet.</p>;
    }

    return (
      <div className="space-y-2">
        {boards.map(([monthId, boardData]) => (
          <div key={monthId} className="flex justify-between items-center p-2 bg-blue-50 rounded">
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {format(new Date(monthId + "-01"), "MMMM yyyy")}
              </span>
              <span className="text-xs text-blue-600">
                ID: {boardData.boardId}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {format(new Date(boardData.timestamp), "MMM dd, yyyy 'at' HH:mm")}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage application settings and preferences
              </p>
            </div>
            <DynamicButton
              variant="outline"
              onClick={() => navigate('/admin')}
            >
              Back to Dashboard
            </DynamicButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Board Creation History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Board Creation History
            </h2>
            
            <div className="space-y-4">
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Auto-Created Boards History
                </h3>
                <div className="max-h-40 overflow-y-auto">
                  {formatAutoCreatedBoards()}
                </div>
                {Object.keys(autoCreatedBoards).length > 0 && (
                  <DynamicButton
                    variant="secondary"
                    size="sm"
                    onClick={handleClearAutoCreatedBoards}
                    className="mt-2"
                  >
                    Clear History
                  </DynamicButton>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Created Boards History
                </h3>
                <div className="max-h-40 overflow-y-auto">
                  {formatManuallyCreatedBoards()}
                </div>
                {Object.keys(manuallyCreatedBoards).length > 0 && (
                  <DynamicButton
                    variant="secondary"
                    size="sm"
                    onClick={handleClearManuallyCreatedBoards}
                    className="mt-2"
                  >
                    Clear History
                  </DynamicButton>
                )}
              </div>
            </div>
          </div>

          {/* General Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              General Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Reset Settings
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Reset all admin settings to their default values
                </p>
                <DynamicButton
                  variant="danger"
                  size="sm"
                  onClick={handleResetSettings}
                  disabled={true}
                  className="opacity-50 cursor-not-allowed"
                >
                  Reset to Defaults (Disabled)
                </DynamicButton>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Current Status
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boards auto-created:</span>
                    <span className="font-medium text-gray-900">
                      {Object.keys(autoCreatedBoards).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boards manually created:</span>
                    <span className="font-medium text-gray-900">
                      {Object.keys(manuallyCreatedBoards).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            About Board Creation
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Auto-creation is currently disabled</p>
            <p>• Boards must be created manually using the "Create Board" button</p>
            <p>• Each board gets a unique auto-generated ID</p>
            <p>• Board creation history is tracked and displayed above</p>
            <p>• Settings are persisted across browser sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
