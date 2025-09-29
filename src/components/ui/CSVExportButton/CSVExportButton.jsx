import React, { useState } from 'react';
import { useAnalyticsExport } from '@/hooks/useAnalyticsExport';
import { useAppData } from '@/hooks/useAppData';

const CSVExportButton = ({ 
  tasks = [], 
  className = "",
  buttonText = "Convert to CSV",
  filename = "analytics_export"
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('idle'); // 'idle', 'processing', 'completed', 'error'
  const [currentStep, setCurrentStep] = useState('');
  
  const { getCompleteAnalytics } = useAnalyticsExport(tasks);
  const { users, reporters } = useAppData();

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setProgress(0);
    setExportStatus('processing');

    try {
      // Simulate processing steps with real progress
      const steps = [
        { step: 'Preparing data...', progress: 10 },
        { step: 'Processing analytics...', progress: 20 },
        { step: 'Generating categories...', progress: 30 },
        { step: 'Calculating time metrics...', progress: 40 },
        { step: 'Processing market data...', progress: 50 },
        { step: 'Generating user analytics...', progress: 60 },
        { step: 'Creating reporter breakdown...', progress: 70 },
        { step: 'Calculating AI metrics...', progress: 80 },
        { step: 'Formatting CSV data...', progress: 90 },
        { step: 'Finalizing export...', progress: 100 }
      ];

      // Process each step with delay
      for (const { step, progress: stepProgress } of steps) {
        setCurrentStep(step);
        setProgress(stepProgress);
        await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay per step
      }

      // Get analytics data
      const analyticsData = getCompleteAnalytics();
      
      // Convert to CSV format
      const csvData = convertAnalyticsToCSV(analyticsData);
      
      // Create and download CSV
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('completed');
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
        setExportStatus('idle');
      }, 2000);

    } catch (error) {
      // Export error occurred
      setExportStatus('error');
      setIsExporting(false);
      setProgress(0);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);
    }
  };

  // Convert analytics data to CSV format with direct data (no calculations)
  const convertAnalyticsToCSV = (data) => {
    const rows = [];
    
    // Add document header
    rows.push(['📊 ANALYTICS EXPORT REPORT']);
    rows.push(['Generated At', new Date().toLocaleString()]);
    rows.push(['Total Tasks', data.metadata?.totalTasks || 0]);
    rows.push(['']); // Empty row
    
    // SUMMARY SECTION
    rows.push(['📈 SUMMARY OVERVIEW']);
    rows.push(['']);
    rows.push(['Metric', 'Value']);
    rows.push(['Total Tasks', data.summary?.totalTasks || 0]);
    rows.push(['Total Hours', data.summary?.totalHours || 0]);
    rows.push(['Unique Markets', data.summary?.uniqueMarkets || 0]);
    rows.push(['']); // Empty row
    
    // CATEGORIES BREAKDOWN SECTION
    if (data.categories?.totals) {
      rows.push(['📋 CATEGORIES BREAKDOWN']);
      rows.push(['']);
      rows.push(['Category', 'Count']);
      
      Object.entries(data.categories.totals).forEach(([category, count]) => {
        if (category !== 'total') {
          rows.push([category, count]);
        }
      });
      rows.push(['']); // Empty row
    }
    
    // TIME DISTRIBUTION SECTION
    if (data.time?.timeDistribution) {
      rows.push(['⏰ TIME DISTRIBUTION']);
      rows.push(['']);
      rows.push(['Category', 'Hours']);
      
      data.time.timeDistribution.forEach(item => {
        rows.push([item.category, item.hours]);
      });
      rows.push(['']); // Empty row
    }
    
    // MARKET BREAKDOWN SECTION
    if (data.markets?.marketCounts) {
      rows.push(['🌍 MARKET BREAKDOWN']);
      rows.push(['']);
      rows.push(['Market', 'Count']);
      
      Object.entries(data.markets.marketCounts).forEach(([market, count]) => {
        rows.push([market, count]);
      });
      rows.push(['']); // Empty row
    }
    
    // DETAILED TASK DATA SECTION (Analytics focused)
    if (tasks && tasks.length > 0) {
      rows.push(['📝 TASK ANALYTICS DATA']);
      rows.push(['']);
      rows.push(['Task ID', 'Title', 'Category', 'Market', 'Hours', 'AI Hours', 'Created Date', 'Status']);
      
      tasks.forEach((task, index) => {
        rows.push([
          task.id || task.taskId || `TASK-${index + 1}`,
          task.title || task.taskTitle || 'Untitled Task',
          task.category || task.data_task?.category || 'Uncategorized',
          task.market || task.data_task?.market || 'No Market',
          task.hours || task.data_task?.hours || 0,
          task.aiHours || task.data_task?.aiHours || 0,
          task.createdAt || task.data_task?.createdAt || 'Unknown Date',
          task.status || task.data_task?.status || 'Active'
        ]);
      });
      rows.push(['']); // Empty row
    }
    
    // Add footer
    rows.push(['']);
    rows.push(['📄 End of Report']);
    rows.push(['Generated by Task Tracker Analytics']);
    
    // Convert to CSV format with proper escaping
    return rows.map(row => 
      row.map(cell => {
        const cellValue = cell === null || cell === undefined ? '' : String(cell);
        // Escape commas, quotes, and newlines
        if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n') || cellValue.includes('\r')) {
          return `"${cellValue.replace(/"/g, '""')}"`;
        }
        return cellValue;
      }).join(',')
    ).join('\n');
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
                  Exporting Analytics Data
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {exportStatus === 'processing' && 'Please wait while we process your data...'}
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
                    Processing comprehensive analytics data including:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div>• Task categories</div>
                    <div>• Time analytics</div>
                    <div>• Market breakdown</div>
                    <div>• User metrics</div>
                    <div>• Reporter data</div>
                    <div>• AI usage stats</div>
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

export default CSVExportButton;