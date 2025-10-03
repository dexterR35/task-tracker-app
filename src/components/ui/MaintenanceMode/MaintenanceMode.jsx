import React from 'react';
import Loader from '@/components/ui/Loader/Loader';

const MaintenanceMode = () => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Loading Spinner */}
        <div className="mb-8">
          <Loader size="lg" />
        </div>

        {/* Maintenance Message */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            App Under Maintenance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Will be soon available
          </p>
        </div>

      </div>
    </div>
  );
};

export default MaintenanceMode;
