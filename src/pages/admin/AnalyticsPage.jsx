import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAppData } from "@/hooks/useAppData";
import MarketsByUsersCard from "@/components/Cards/MarketsByUsersCard";
import MarketingAnalyticsCard from "@/components/Cards/MarketingAnalyticsCard";
import AcquisitionAnalyticsCard from "@/components/Cards/AcquisitionAnalyticsCard";
import ProductAnalyticsCard from "@/components/Cards/ProductAnalyticsCard";
import { 
  getCachedMarketsByUsersCardProps, 
  getCachedMarketingAnalyticsCardProps, 
  getCachedAcquisitionAnalyticsCardProps, 
  getCachedProductAnalyticsCardProps 
} from "@/components/Cards/analyticsCardConfig";
import { MonthProgressBar } from "@/utils/monthUtils.jsx";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import { generateAnalyticsPDF } from "@/utils/pdfGenerator";
import DynamicButton from "@/components/ui/Button/DynamicButton";

const AnalyticsPage = () => {
  // Get real-time data from month selection
  const { users, error } = useAppData();
  
  // Card selection state
  const [selectedCards, setSelectedCards] = useState([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('markets-by-users');
  
  const {
    tasks, // Real-time tasks data (selected or current month)
    availableMonths, // Available months for dropdown
    currentMonth, // Current month info
    selectedMonth, // Selected month info
    isCurrentMonth, // Boolean check
    isLoading, // Loading state for selected month
    isInitialLoading, // Loading state for initial month data
    error: monthError, // Error state
    selectMonth, // Function to select month
  } = useAppData();

  // Debug logging removed for cleaner code

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('');

  // Get current month name for display
  const currentMonthName = currentMonth?.monthName || "Current Month";
  const selectedMonthName = selectedMonth?.monthName || currentMonthName;

  // Card selection handlers - memoized to prevent re-renders
  const handleCardSelection = useCallback((cardId) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  }, []);

  // Tab change handler - memoized to prevent re-renders
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Analytics tabs configuration - memoized to prevent re-renders
  const analyticsTabs = useMemo(() => [
    {
      id: 'markets-by-users',
      name: 'Markets by Users',
      description: 'Task breakdown by markets and users'
    },
    {
      id: 'marketing-analytics',
      name: 'Marketing Analytics',
      description: 'Marketing performance and analytics'
    },
    {
      id: 'acquisition-analytics',
      name: 'Acquisition Analytics',
      description: 'Acquisition metrics and insights'
    },
    {
      id: 'product-analytics',
      name: 'Product Analytics',
      description: 'Product breakdown and analytics'
    },
  ], []);

  // Analytics data object - memoized to prevent unnecessary re-renders
  const analyticsData = useMemo(() => ({
    tasks,
    selectedMonth,
    users,
    isLoading
  }), [tasks, selectedMonth, users, isLoading]);

  // Lazy load card props - only calculate active tab
  const marketsByUsersCardProps = useMemo(() => {
    if (activeTab !== 'markets-by-users') return null;
    return getCachedMarketsByUsersCardProps(
      analyticsData.tasks,
      analyticsData.users,
      analyticsData.selectedMonth,
      analyticsData.isLoading
    );
  }, [activeTab, analyticsData.tasks, analyticsData.users, analyticsData.selectedMonth, analyticsData.isLoading]);

  const marketingAnalyticsCardProps = useMemo(() => {
    if (activeTab !== 'marketing-analytics') return null;
    return getCachedMarketingAnalyticsCardProps(
      analyticsData.tasks,
      analyticsData.selectedMonth,
      analyticsData.isLoading
    );
  }, [activeTab, analyticsData.tasks, analyticsData.selectedMonth, analyticsData.isLoading]);

  const acquisitionAnalyticsCardProps = useMemo(() => {
    if (activeTab !== 'acquisition-analytics') return null;
    return getCachedAcquisitionAnalyticsCardProps(
      analyticsData.tasks,
      analyticsData.selectedMonth,
      analyticsData.isLoading
    );
  }, [activeTab, analyticsData.tasks, analyticsData.selectedMonth, analyticsData.isLoading]);

  const productAnalyticsCardProps = useMemo(() => {
    if (activeTab !== 'product-analytics') return null;
    return getCachedProductAnalyticsCardProps(
      analyticsData.tasks,
      analyticsData.selectedMonth,
      analyticsData.isLoading
    );
  }, [activeTab, analyticsData.tasks, analyticsData.selectedMonth, analyticsData.isLoading]);


  // Removed Select All and Deselect All handlers - keeping only individual card selection

  // Error handling function
  const showError = (message) => {
    console.error(message);
    // You can replace this with a toast notification if you have one
    alert(message);
  };

  // Export handlers
  const handlePDFExport = async () => {
    if (selectedCards.length === 0) {
      showError('Please select at least one card to export');
      return;
    }

    setIsExporting(true);
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

      // Process each step quickly
      for (const { step, progress } of progressSteps) {
        setExportStep(step);
        setExportProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 500ms to 100ms
      }

      await generateAnalyticsPDF(selectedCards, {
        filename: `analytics_${selectedMonth?.monthName || currentMonth?.monthName || 'export'}_${new Date().toISOString().split('T')[0]}.pdf`,
        title: `Analytics Report - ${selectedMonthName}`,
        includeTitle: true
      });

      setExportStep('PDF generated successfully!');
      await new Promise(resolve => setTimeout(resolve, 200)); // Reduced from 1000ms to 200ms

    } catch (error) {
      setExportStep('PDF generation failed. Please try again.');
      await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 2000ms to 500ms
    } finally {
      setIsExporting(false);
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
            {/* Card Selection Info */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedCards.length} selected
              </span>
            </div>

            {/* Export Button */}
            <div className="flex items-center space-x-2">
              <DynamicButton
                onClick={handlePDFExport}
                disabled={isExporting || selectedCards.length === 0}
                variant={selectedCards.length === 0 ? "disabled" : "danger"}
                size="sm"
                iconName={isExporting ? "loading" : "download"}
                iconPosition="left"
                className={isExporting ? "animate-pulse" : ""}
              >
                {isExporting 
                  ? "Generating PDF..." 
                  : selectedCards.length === 0 
                    ? "Select Cards First" 
                    : "Generate PDF"
                }
              </DynamicButton>
            </div>
            
            {/* Month Selector */}
            <select
              value={selectedMonth?.monthId || currentMonth?.monthId || ""}
              onChange={(e) => selectMonth(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              {availableMonths && availableMonths.length > 0 ? (
                availableMonths.map(month => (
                  <option key={month.monthId} value={month.monthId}>
                    {month.monthName} {month.isCurrent ? "(Current)" : ""}
                  </option>
                ))
              ) : (
                currentMonth && (
                  <option value={currentMonth.monthId}>
                    {currentMonth.monthName} (Current)
                  </option>
                )
              )}
            </select>
          </div>
        </div>
        
        {/* Month Progress Bar */}
        <div className="mt-4 card">
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

      {/* Analytics Tabs */}
      {!isLoading && (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {analyticsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'markets-by-users' ? (
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
                    {marketsByUsersCardProps ? (
                      <MarketsByUsersCard 
                        {...marketsByUsersCardProps}
                      />
                    ) : (
                      <SkeletonAnalyticsCard />
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'marketing-analytics' ? (
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
                    {marketingAnalyticsCardProps ? (
                      <MarketingAnalyticsCard 
                        {...marketingAnalyticsCardProps}
                      />
                    ) : (
                      <SkeletonAnalyticsCard />
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'acquisition-analytics' ? (
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
                    {acquisitionAnalyticsCardProps ? (
                      <AcquisitionAnalyticsCard 
                        {...acquisitionAnalyticsCardProps}
                      />
                    ) : (
                      <SkeletonAnalyticsCard />
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'product-analytics' ? (
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
                    {productAnalyticsCardProps ? (
                      <ProductAnalyticsCard 
                        {...productAnalyticsCardProps}
                      />
                    ) : (
                      <SkeletonAnalyticsCard />
                    )}
                  </div>
                </div>
              </div>
            ) : null}
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
                  Generating PDF Report
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
                  Processing selected cards and capturing screenshots...
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>• Selected cards: {selectedCards.length}</div>
                  <div>• Export type: PDF</div>
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