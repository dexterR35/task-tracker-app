import React, { useState } from "react";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import ReporterFormModal from "@/features/reporters/components/ReporterForm/ReporterFormModal";
import ReporterTable from "@/features/reporters/components/ReporterTable/ReporterTable";

const ReportersPage = () => {
  const { reporters, error, isLoading, canManageReporters } = useAppDataContext();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <div className="text-center py-8 max-w-md mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Data</h2>
            <p className="text-gray-300 text-sm">
              {error?.message || "Failed to load reporters. Please try refreshing the page."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!canManageReporters(user)) {
    return (
      <div className="py-6">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-lg font-medium mb-2">
            Access Denied
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Reporters</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage reporter profiles and assignments
          </p>
        </div>
        <DynamicButton
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          size="sm"
          iconName="add"
          iconPosition="left"
        >
          Add Reporter
        </DynamicButton>
      </div>
      <ReporterTable
        reporters={reporters}
        error={error}
        user={user}
        isLoading={isLoading}
        className="rounded-lg"
      />
      <ReporterFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="create"
        onSuccess={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default ReportersPage;
