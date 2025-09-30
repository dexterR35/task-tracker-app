import React from 'react';
import { useUnifiedExport } from '@/hooks/useUnifiedExport';

const TableCSVExportButton = ({ 
  data = [], 
  columns = [],
  tableType = 'table',
  className = "",
  buttonText = "Export CSV",
  filename = null
}) => {
  const { exportCSV, isExporting, exportProgress, exportStep, exportStatus } = useUnifiedExport(data, {
    dataType: 'table',
    columns,
    tableType,
    filename
  });
  
  const handleExport = async () => {
    await exportCSV();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`
          inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white
          ${isExporting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }
          transition-colors duration-200
        `}
      >
        {isExporting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {buttonText}
          </>
        )}
      </button>

      {/* Export Status Modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              {/* Status Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                <svg className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>

              {/* Status Title */}
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {exportStatus === 'processing' ? 'Exporting Data' : 
                 exportStatus === 'completed' ? 'Export Complete' : 
                 exportStatus === 'error' ? 'Export Failed' : 'Preparing Export'}
              </h3>

              {/* Progress Bar */}
              {exportStatus === 'processing' && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${exportProgress}%` }}
                    ></div>
                  </div>
                  
                  {/* Progress percentage */}
                  <div className="text-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {exportProgress}% complete
                    </span>
                  </div>
                </div>
              )}

              {/* Current Step */}
              {exportStep && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {exportStep}
                  </p>
                </div>
              )}

              {/* Success message */}
              {exportStatus === 'completed' && (
                <div className="text-center">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Your CSV file has been downloaded successfully!
                  </p>
                </div>
              )}

              {/* Error message */}
              {exportStatus === 'error' && (
                <div className="text-center">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Export failed. Please try again.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableCSVExportButton;