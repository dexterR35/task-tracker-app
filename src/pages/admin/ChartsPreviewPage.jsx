import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";
import { showSuccess, showError } from "../../shared/utils/toast";
import { useCentralizedAnalytics } from "../../shared/hooks/analytics/useCentralizedAnalytics";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import Loader from "../../shared/components/ui/Loader";
import { format } from "date-fns";
import { 
  ChartBarIcon, 
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  EyeIcon
} from "@heroicons/react/24/outline";

const ChartsPreviewPage = () => {
  const { monthId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [chartsData, setChartsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use centralized analytics to get real-time data from Redux state
  const {
    analytics,
    hasData,
    isLoading: analyticsLoading,
    error: analyticsError,
    reload,
    refreshAnalytics
  } = useCentralizedAnalytics(monthId);

  useEffect(() => {
    const loadChartsData = async () => {
      try {
        setIsLoading(true);
        
        // Generate charts from cached real-time data
        if (hasData && analytics) {
          const chartsData = generateChartsFromAnalytics(analytics, monthId);
          setChartsData(chartsData);
        }
      } catch (error) {
        showError(`Failed to load charts data: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadChartsData();
  }, [monthId, hasData, analytics]);

  const generateChartsFromAnalytics = (analytics, monthId) => {
    // Generate comprehensive charts data from analytics
    const charts = {
      monthId,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.uid,
      charts: {
        // Task completion trends
        taskTrends: {
          title: "Task Completion Trends",
          type: "line",
          data: analytics.taskTrends || [],
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `Task Completion Trends - ${format(new Date(monthId + "-01"), "MMMM yyyy")}`
              }
            }
          }
        },
        
        // Category distribution
        categoryDistribution: {
          title: "Task Category Distribution",
          type: "doughnut",
          data: analytics.categoryAnalytics || {},
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Tasks by Category"
              }
            }
          }
        },
        
        // AI usage analytics
        aiUsage: {
          title: "AI Usage Analytics",
          type: "bar",
          data: analytics.aiAnalytics || {},
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "AI Usage Statistics"
              }
            }
          }
        },
        
        // User performance
        userPerformance: {
          title: "User Performance",
          type: "radar",
          data: analytics.userPerformance || {},
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Team Performance Overview"
              }
            }
          }
        },
        
        // Market analytics
        marketAnalytics: {
          title: "Market Distribution",
          type: "pie",
          data: analytics.marketAnalytics || {},
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Tasks by Market"
              }
            }
          }
        },
        
        // Product analytics
        productAnalytics: {
          title: "Product Distribution",
          type: "bar",
          data: analytics.productAnalytics || {},
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Tasks by Product"
              }
            }
          }
        }
      },
      
      // Summary statistics
      summary: {
        totalTasks: analytics.summary?.totalTasks || 0,
        totalHours: analytics.summary?.totalHours || 0,
        totalAIHours: analytics.summary?.totalAIHours || 0,
        averageTaskDuration: analytics.summary?.averageTaskDuration || 0,
        completionRate: analytics.summary?.completionRate || 0,
        aiUsageRate: analytics.summary?.aiUsageRate || 0
      }
    };

    return charts;
  };

  const handleSaveCharts = async () => {
    try {
      setIsGenerating(true);
      
      // Save charts data to Firebase using batch operations
      const { useSaveChartsDataMutation } = await import("../../features/tasks/tasksApi");
      const [saveChartsData] = useSaveChartsDataMutation();
      await saveChartsData({ monthId, chartsData }).unwrap();
      
      showSuccess("Charts data saved successfully!");
    } catch (error) {
      showError(`Failed to save charts: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      setIsLoading(true);
      await refreshAnalytics();
      showSuccess("Charts data refreshed successfully!");
    } catch (error) {
      showError(`Failed to refresh data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/admin");
  };

  if (isLoading || analyticsLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <Loader 
            text="Loading charts data..." 
            size="lg"
            variant="dots"
          />
        </div>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="card text-center">
            <h2 className="text-red-error mb-4">Error Loading Charts</h2>
            <p className="text-gray-300 mb-4">{analyticsError.message}</p>
            <DynamicButton
              onClick={handleBackToDashboard}
              variant="primary"
              icon={ArrowLeftIcon}
            >
              Back to Dashboard
            </DynamicButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">
                Charts Preview
              </h1>
              <p className="text-gray-300">
                {format(new Date(monthId + "-01"), "MMMM yyyy")} Analytics
              </p>
            </div>
            
            <div className="flex gap-3">
              <DynamicButton
                onClick={handleBackToDashboard}
                variant="outline"
                icon={ArrowLeftIcon}
                size="md"
              >
                Back to Dashboard
              </DynamicButton>
              
              <DynamicButton
                onClick={handleRefreshData}
                variant="outline"
                icon={EyeIcon}
                size="md"
              >
                Refresh Data
              </DynamicButton>
              
              <DynamicButton
                onClick={handleSaveCharts}
                variant="primary"
                icon={DocumentArrowDownIcon}
                size="md"
                loading={isGenerating}
                loadingText="Saving..."
              >
                Save Charts
              </DynamicButton>
            </div>
          </div>
        </div>

        {/* Charts Content */}
        {chartsData ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="card-title">Total Tasks</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {chartsData.summary.totalTasks}
                </p>
              </div>
              
              <div className="card">
                <h3 className="card-title">Total Hours</h3>
                <p className="text-3xl font-bold text-green-400">
                  {chartsData.summary.totalHours.toFixed(1)}h
                </p>
              </div>
              
              <div className="card">
                <h3 className="card-title">AI Usage Rate</h3>
                <p className="text-3xl font-bold text-purple-400">
                  {(chartsData.summary.aiUsageRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Object.entries(chartsData.charts).map(([key, chart]) => (
                <div key={key} className="card">
                  <h3 className="card-title">{chart.title}</h3>
                  <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <ChartBarIcon className="w-12 h-12 mx-auto mb-2" />
                      <p>Chart: {chart.type}</p>
                      <p className="text-sm">Data points: {Array.isArray(chart.data) ? chart.data.length : Object.keys(chart.data).length}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Data Info */}
            <div className="card">
              <h3 className="card-title">Charts Information</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong>Generated:</strong> {format(new Date(chartsData.generatedAt), "PPP 'at' p")}</p>
                <p><strong>Generated by:</strong> {user?.name || user?.email}</p>
                <p><strong>Data source:</strong> Real-time analytics from Firestore</p>
                <p><strong>Charts count:</strong> {Object.keys(chartsData.charts).length}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center">
            <h2 className="text-gray-300 mb-4">No Charts Data Available</h2>
            <p className="text-gray-400 mb-4">
              No analytics data found for {format(new Date(monthId + "-01"), "MMMM yyyy")}
            </p>
            <DynamicButton
              onClick={handleRefreshData}
              variant="primary"
              icon={EyeIcon}
            >
              Refresh Data
            </DynamicButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartsPreviewPage;
