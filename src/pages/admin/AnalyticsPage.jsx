import React, { useEffect, useMemo, useState } from "react";
import { useAppData, useMonthSelection } from "@/hooks/useAppData";
import MarketUserBreakdownCard from "@/components/Cards/MarketUserBreakdownCard";
import ReporterAnalyticsCard from "@/components/Cards/ReporterAnalyticsCard";
import UserAnalyticsCard from "@/components/Cards/UserAnalyticsCard";
import AcquisitionAnalyticsCard from "@/components/Cards/AcquisitionAnalyticsCard";
import MarketingAnalyticsCard from "@/components/Cards/MarketingAnalyticsCard";
import ProductAnalyticsCard from "@/components/Cards/ProductAnalyticsCard";
import MarketDistributionByUserCard from "@/components/Cards/MarketDistributionByUserCard";
import MonthProgressBar from "@/components/ui/MonthProgressBar";
import CSVExportButton from "@/components/ui/CSVExportButton";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import { generateAnalyticsPDF, generateAnalyticsCSV, downloadCSV } from "@/utils/pdfGenerator";

const AnalyticsPage = () => {
  // Get real-time data from month selection (same as AdminDashboardPage)
  const { user, users, reporters, error, isLoading: appDataLoading } = useAppData();
  
  // Card selection state
  const [selectedCards, setSelectedCards] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null); // 'pdf' or 'csv'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('');
  
  
  const {
    tasks, // Real-time tasks data (already filtered by selected month)
    availableMonths, // Available months for dropdown
    currentMonth, // Current month info
    selectedMonth, // Selected month info
    isCurrentMonth, // Boolean check
    isLoading, // Loading state for selected month
    isInitialLoading, // Loading state for initial month data
    isMonthDataReady, // Flag indicating month data is ready
    error: monthError, // Error state
    selectMonth, // Function to select month
    resetToCurrentMonth, // Function to reset
  } = useMonthSelection();

  // Get current month name for display
  const currentMonthName = currentMonth?.monthName || "Current Month";
  const selectedMonthName = selectedMonth?.monthName || currentMonthName;

  // Memoize analytics data to prevent unnecessary recalculations
  const analyticsData = useMemo(() => ({
    tasks,
    selectedMonth,
    users,
    reporters,
    isLoading
  }), [tasks, selectedMonth, users, reporters, isLoading]);

  // Card selection handlers
  const handleCardSelection = (cardId) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleSelectAll = () => {
    const allCardIds = [
      'market-user-breakdown-card',
      'reporter-analytics-card', 
      'user-analytics-card',
      'market-distribution-card',
      'acquisition-analytics-card',
      'marketing-analytics-card',
      'product-analytics-card'
    ];
    setSelectedCards(allCardIds);
  };

  const handleDeselectAll = () => {
    setSelectedCards([]);
  };

  // Export handlers
  const handlePDFExport = async () => {
    if (selectedCards.length === 0) {
      showError('Please select at least one card to export');
      return;
    }

    setIsExporting(true);
    setExportType('pdf');
    setExportProgress(0);
    setExportStep('Preparing PDF generation...');

    try {
      // Simulate progress steps
      const progressSteps = [
        { step: 'Preparing data...', progress: 10 },
        { step: 'Capturing card screenshots...', progress: 30 },
        { step: 'Processing images...', progress: 50 },
        { step: 'Generating PDF layout...', progress: 70 },
        { step: 'Finalizing document...', progress: 90 },
        { step: 'Saving PDF...', progress: 100 }
      ];

      // Process each step with delay
      for (const { step, progress } of progressSteps) {
        setExportStep(step);
        setExportProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await generateAnalyticsPDF(selectedCards, {
        filename: `analytics_${selectedMonth?.monthName || currentMonth?.monthName || 'export'}_${new Date().toISOString().split('T')[0]}.pdf`,
        title: `Analytics Report - ${selectedMonthName}`,
        includeTitle: true
      });

      setExportStep('PDF generated successfully!');
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      setExportStep('PDF generation failed. Please try again.');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsExporting(false);
      setExportType(null);
      setExportProgress(0);
      setExportStep('');
    }
  };

  const handleCSVExport = async () => {
    if (selectedCards.length === 0) {
      showError('Please select at least one card to export');
      return;
    }

    setIsExporting(true);
    setExportType('csv');
    setExportProgress(0);
    setExportStep('Preparing CSV generation...');

    try {
      // Simulate progress steps
      const progressSteps = [
        { step: 'Preparing data...', progress: 15 },
        { step: 'Extracting table data...', progress: 35 },
        { step: 'Processing card content...', progress: 55 },
        { step: 'Formatting CSV data...', progress: 75 },
        { step: 'Generating file...', progress: 90 },
        { step: 'Saving CSV...', progress: 100 }
      ];

      // Process each step with delay
      for (const { step, progress } of progressSteps) {
        setExportStep(step);
        setExportProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      const csvContent = generateAnalyticsCSV(selectedCards, analyticsData, {
        includeMetadata: true
      });
      
      const filename = `analytics_${selectedMonth?.monthName || currentMonth?.monthName || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);

      setExportStep('CSV generated successfully!');
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      setExportStep('CSV generation failed. Please try again.');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsExporting(false);
      setExportType(null);
      setExportProgress(0);
      setExportStep('');
    }
  };

  if (isLoading || isInitialLoading) {
    return (
      <div>
        {/* Page Header Skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
            </div>
          </div>
          
          {/* Month Progress Bar Skeleton */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
          </div>
        </div>

        {/* Analytics Cards Skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonAnalyticsCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error || monthError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 dark:text-red-400">
          Error loading analytics: {(error || monthError)?.message || "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Task breakdown by acquisition, product, and marketing
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Card Selection Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Deselect All
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedCards.length} selected
              </span>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePDFExport}
                disabled={isExporting || selectedCards.length === 0}
                className={`px-4 py-2 text-white text-sm rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg ${
                  selectedCards.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isExporting && exportType === 'pdf'
                    ? 'bg-red-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 hover:scale-105'
                }`}
              >
                {isExporting && exportType === 'pdf' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating PDF...</span>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </>
                ) : selectedCards.length === 0 ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Select Cards First</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Generate PDF</span>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </>
                )}
              </button>

              <button
                onClick={handleCSVExport}
                disabled={isExporting || selectedCards.length === 0}
                className={`px-4 py-2 text-white text-sm rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg ${
                  selectedCards.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isExporting && exportType === 'csv'
                    ? 'bg-green-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 hover:scale-105'
                }`}
              >
                {isExporting && exportType === 'csv' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating CSV...</span>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </>
                ) : selectedCards.length === 0 ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Select Cards First</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Generate CSV</span>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </>
                )}
              </button>
            </div>
            
            {/* Month Selector */}
            <select
              value={selectedMonth?.monthId || currentMonth?.monthId || ""}
              onChange={(e) => selectMonth(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              {availableMonths.map(month => (
                <option key={month.monthId} value={month.monthId}>
                  {month.monthName}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Month Progress Bar */}
        <div className="mt-4">
          <MonthProgressBar 
            monthId={selectedMonth?.monthId || currentMonth?.monthId}
            monthName={selectedMonth?.monthName || currentMonth?.monthName}
            isCurrentMonth={isCurrentMonth}
            startDate={selectedMonth?.startDate || currentMonth?.startDate}
            endDate={selectedMonth?.endDate || currentMonth?.endDate}
            daysInMonth={selectedMonth?.daysInMonth || currentMonth?.daysInMonth}
          />
        </div>
      </div>


      {/* Chart-based Analytics Cards - Only render when data is ready */}
      {!isLoading && tasks && tasks.length > 0 && (
        <div className="space-y-6">
          {/* Market User Breakdown Card */}
          <div className="relative">
            <div id="market-user-breakdown-card">
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCards.includes('market-user-breakdown-card')}
                      onChange={() => handleCardSelection('market-user-breakdown-card')}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 shadow-md"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border">
                      Export
                    </span>
                  </label>
                </div>
                <MarketUserBreakdownCard {...analyticsData} />
              </div>
            </div>
          </div>

          {/* Reporter Analytics Card */}
          <div className="relative">
            <div id="reporter-analytics-card">
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCards.includes('reporter-analytics-card')}
                      onChange={() => handleCardSelection('reporter-analytics-card')}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 shadow-md"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border">
                      Export
                    </span>
                  </label>
                </div>
                <ReporterAnalyticsCard {...analyticsData} />
              </div>
            </div>
          </div>

          {/* User Analytics Card */}
          <div className="relative">
            <div id="user-analytics-card">
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCards.includes('user-analytics-card')}
                      onChange={() => handleCardSelection('user-analytics-card')}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 shadow-md"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border">
                      Export
                    </span>
                  </label>
                </div>
                <UserAnalyticsCard {...analyticsData} />
              </div>
            </div>
          </div>

          {/* Market Distribution Card */}
          <div className="relative">
            <div id="market-distribution-card">
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCards.includes('market-distribution-card')}
                      onChange={() => handleCardSelection('market-distribution-card')}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 shadow-md"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border">
                      Export
                    </span>
                  </label>
                </div>
                <MarketDistributionByUserCard {...analyticsData} />
              </div>
            </div>
          </div>

          {/* Acquisition Analytics Card */}
          <div className="relative">
            <div id="acquisition-analytics-card">
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCards.includes('acquisition-analytics-card')}
                      onChange={() => handleCardSelection('acquisition-analytics-card')}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 shadow-md"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border">
                      Export
                    </span>
                  </label>
                </div>
                <AcquisitionAnalyticsCard {...analyticsData} />
              </div>
            </div>
          </div>

          {/* Marketing Analytics Card */}
          <div className="relative">
            <div id="marketing-analytics-card">
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCards.includes('marketing-analytics-card')}
                      onChange={() => handleCardSelection('marketing-analytics-card')}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 shadow-md"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border">
                      Export
                    </span>
                  </label>
                </div>
                <MarketingAnalyticsCard {...analyticsData} />
              </div>
            </div>
          </div>

          {/* Product Analytics Card */}
          <div className="relative">
            <div id="product-analytics-card">
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCards.includes('product-analytics-card')}
                      onChange={() => handleCardSelection('product-analytics-card')}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 shadow-md"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border">
                      Export
                    </span>
                  </label>
                </div>
                <ProductAnalyticsCard {...analyticsData} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  {/* Animated loading icon */}
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {exportType === 'pdf' ? 'Generating PDF Report' : 'Generating CSV Report'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {exportStep}
                </p>
              </div>
              
              {/* Progress bar */}
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
              
              {/* Processing details */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {exportType === 'pdf' 
                    ? 'Processing selected cards and capturing screenshots...'
                    : 'Extracting data from selected cards and formatting...'
                  }
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>• Selected cards: {selectedCards.length}</div>
                  <div>• Export type: {exportType?.toUpperCase()}</div>
                  <div>• Month: {selectedMonthName}</div>
                  <div>• Quality: High</div>
                </div>
              </div>
              
              {/* Success/Error message */}
              {(exportStep.includes('successfully') || exportStep.includes('failed')) && (
                <div className="text-center">
                  <p className={`text-sm font-medium ${
                    exportStep.includes('successfully') 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {exportStep.includes('successfully') ? '✅' : '❌'} {exportStep}
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

export default AnalyticsPage;