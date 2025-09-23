import React, { useState } from 'react';
import { exportToCSV } from '@/utils/exportData';
import { showError, showSuccess } from '@/utils/toast';

const TableCSVExportButton = ({ 
  data = [], 
  columns = [],
  tableType = 'table',
  className = "",
  buttonText = "Export CSV",
  filename = null
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('idle'); // 'idle', 'processing', 'completed', 'error'
  const [currentStep, setCurrentStep] = useState('');
  
  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setProgress(0);
    setExportStatus('processing');

    try {
      // Simulate processing steps with real progress
      const steps = [
        { step: 'Preparing table data...', progress: 15 },
        { step: 'Processing columns...', progress: 30 },
        { step: 'Formatting data...', progress: 45 },
        { step: 'Validating export...', progress: 60 },
        { step: 'Generating CSV...', progress: 75 },
        { step: 'Finalizing export...', progress: 90 },
        { step: 'Download ready...', progress: 100 }
      ];

      // Process each step with delay
      for (const { step, progress: stepProgress } of steps) {
        setCurrentStep(step);
        setProgress(stepProgress);
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay per step
      }

      // Get visible columns (excluding actions and selection columns)
      const visibleColumns = columns.filter(col => 
        col.id !== 'actions' && col.id !== 'select' && col.accessorKey
      );

      // Create headers
      const headers = visibleColumns.map(col => {
        // Handle different header types
        if (typeof col.header === 'string') return col.header;
        if (typeof col.header === 'function') return col.accessorKey || col.id;
        return col.accessorKey || col.id;
      }).join(',');

      // Create rows
      const rows = data.map(row => {
        return visibleColumns.map(col => {
          const value = row[col.accessorKey];
          // Handle different data types
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') {
            // Handle arrays, objects, etc.
            if (Array.isArray(value)) return value.join('; ');
            return JSON.stringify(value);
          }
          // Escape commas and quotes in string values
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
      });

      // Combine headers and rows
      const csvContent = [headers, ...rows].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Use custom filename or generate default
      const exportFilename = filename || `${tableType}_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', exportFilename);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('completed');
      showSuccess(`${tableType} exported successfully!`);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
        setExportStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setIsExporting(false);
      setProgress(0);
      showError('Failed to export data. Please try again.');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`
          inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm
          transition-all duration-200 ease-in-out
          ${isExporting 
            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }
          text-white shadow-md hover:shadow-lg
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isExporting ? (
          <>
            {/* Animated magnifying glass icon */}
            <div className="relative mr-3">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {buttonText}
          </>
        )}
      </button>

      {/* Full-screen modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  {/* Animated magnifying glass icon */}
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Exporting Table Data
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {exportStatus === 'processing' && 'Please wait while we process your table data...'}
                  {exportStatus === 'completed' && '✅ Export completed successfully!'}
                  {exportStatus === 'error' && '❌ Export failed. Please try again.'}
                </p>
              </div>
              
              {/* Current step */}
              {exportStatus === 'processing' && currentStep && (
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {currentStep}
                  </p>
                </div>
              )}
              
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {/* Progress percentage */}
                <div className="text-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {progress}% complete
                  </span>
                </div>
              </div>
              
              {/* Processing steps */}
              {exportStatus === 'processing' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Processing table data including:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div>• Column headers</div>
                    <div>• Row data</div>
                    <div>• Data formatting</div>
                    <div>• CSV generation</div>
                    <div>• File validation</div>
                    <div>• Download preparation</div>
                  </div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableCSVExportButton;
