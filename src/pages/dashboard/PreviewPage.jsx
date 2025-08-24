import {
  useSaveMonthAnalyticsMutation,
  useGetMonthAnalyticsQuery,
  useGetMonthBoardExistsQuery,
  useSubscribeToMonthTasksQuery,
} from "../../features/tasks/tasksApi";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import { useNotifications } from "../../shared/hooks/useNotifications";
import { logger } from "../../shared/utils/logger";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
} from "recharts";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

// Custom tooltip to prevent React errors
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom hook for analytics generation using centralized analytics
const useAnalyticsGeneration = (monthId, board, tasks) => {
  const { addError, addSuccess } = useNotifications();
  
  const [analyticsPreview, setAnalyticsPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

    const generateAnalytics = useCallback(async () => {
    if (!monthId || !board?.exists) {
      setError('Board does not exist');
      return;
    }

    if (!tasks || tasks.length === 0) {
      setError('No tasks found');
      return;
    }

    // Check if we already have analytics for this data
    const tasksKey = `${monthId}_${tasks.length}_${tasks.reduce((sum, task) => sum + (task.updatedAt || 0), 0)}`;
    if (window._lastAnalyticsKey === tasksKey && analyticsPreview) {
      logger.log('Analytics already generated for this data, skipping calculation');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      logger.log('Starting analytics generation for month:', monthId);
      
      // Use centralized analytics calculator
      const { calculateAnalyticsFromTasks } = await import('../../shared/utils/analyticsCalculator');
      const result = calculateAnalyticsFromTasks(tasks, monthId);
      
      // Cache the analytics key
      window._lastAnalyticsKey = tasksKey;
      
      setAnalyticsPreview(result);
      addSuccess(`Analytics generated for ${monthId}!`);

    } catch (error) {
      logger.error('Error generating analytics:', error);
      setError(error?.message || 'Failed to generate analytics');
      addError('Failed to generate analytics');
    } finally {
      setIsGenerating(false);
    }
  }, [monthId, board?.exists, tasks, analyticsPreview, addSuccess, addError]);

  // Clear analytics when monthId changes
  useEffect(() => {
    setAnalyticsPreview(null);
    setError(null);
    
    // Clean up cache keys when monthId changes
    delete window._lastDataKey;
    delete window._lastAnalyticsKey;
    delete window._lastFlattenedKey;
  }, [monthId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      delete window._lastDataKey;
      delete window._lastAnalyticsKey;
      delete window._lastFlattenedKey;
    };
  }, []);

  return {
    analyticsPreview,
    isGenerating,
    error,
    generateAnalytics,
    setAnalyticsPreview
  };
};

const PreviewPage = () => {
  const { monthId } = useParams();
  const navigate = useNavigate();
  const { addError } = useNotifications();

  // Queries
  const { data: existingAnalytics } = useGetMonthAnalyticsQuery({ monthId });
  const { data: board = { exists: false }, isLoading: boardLoading } = useGetMonthBoardExistsQuery({ monthId });
  const { data: tasks = [], isLoading: tasksLoading } = useSubscribeToMonthTasksQuery({ monthId }, {
    skip: !board?.exists
  });

  // Debug: Log the data we're receiving (only once per data change)
  const dataKey = `${monthId}_${board?.exists}_${tasks?.length || 0}`;
  if (dataKey !== window._lastDataKey) {
    window._lastDataKey = dataKey;
    logger.log('PreviewPage - monthId:', monthId);
    logger.log('PreviewPage - board:', board);
    logger.log('PreviewPage - tasks count:', tasks?.length || 0);
    logger.log('PreviewPage - sample task:', tasks?.[0]);
  }

  // Custom hook for analytics generation
  const {
    analyticsPreview,
    isGenerating,
    error,
    generateAnalytics,
    setAnalyticsPreview
  } = useAnalyticsGeneration(monthId, board, tasks);

  const [saveAnalytics, { isLoading: saving }] = useSaveMonthAnalyticsMutation();

  // Auto-generate analytics when tasks are available
  useEffect(() => {
    if (!monthId) return;

    // Wait for board loading to complete before making decisions
    if (boardLoading) return; // Still loading board

    if (!board?.exists) {
      addError(`Cannot generate analytics: Month board for ${monthId} is not created yet. Please create the month board first.`);
      navigate("/admin");
      return;
    }

    // Only show "no tasks" error if board exists and tasks are not loading
    if (board?.exists && !tasksLoading && tasks.length === 0) {
      addError(`Cannot generate analytics: No tasks found for ${monthId}. Please create at least one task first.`);
      navigate("/admin");
      return;
    }

    // Auto-generate analytics when tasks are available and no preview exists
    if (board?.exists && !tasksLoading && tasks.length > 0 && !analyticsPreview && !isGenerating) {
      // Add a small delay to prevent multiple rapid calls
      const timeoutId = setTimeout(() => {
        if (!analyticsPreview && !isGenerating) {
          generateAnalytics();
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [monthId, board, boardLoading, tasks, tasksLoading, analyticsPreview, isGenerating, generateAnalytics, navigate, addError]);





  const handleSaveAnalytics = async () => {
    if (!analyticsPreview) return;

    try {
      await saveAnalytics({
        monthId,
        data: analyticsPreview,
        overwrite: false,
      }).unwrap();
      navigate("/admin/analytics");
    } catch (error) {
      const code = error?.data?.code || error?.code;
      if (code === "ANALYTICS_EXISTS") {
        addError("Analytics already exist for this month. Cannot save again.");
      } else {
        addError("Failed to save analytics");
      }
    }
  };

  const handleCancel = () => {
    navigate("/admin");
  };

  const handleRetry = () => {
    setAnalyticsPreview(null);
    generateAnalytics();
  };

  // Loading state
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary rounded-lg shadow-md p-6 text-center">
            <div className="text-xl font-semibold mb-4">
              Generating Analytics Preview...
            </div>
            <div className="flex justify-center mb-4">
              {/* You can add a specific loading state here if needed, but a table skeleton can be complex.
                      The page-level loader is often a better UX. */}
                      <p className="text-gray-400">Generates...</p>
            </div>
            <div className="text-sm text-gray-600">
              Loading from cache or generating from Redux state...
            </div>
            <button 
              onClick={handleRetry} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-xl font-semibold mb-4 text-red-600">
              Error Generating Analytics
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {error}
            </div>
            <div className="flex gap-3 justify-center">
              <DynamicButton variant="primary" onClick={handleRetry}>
                Retry
              </DynamicButton>
              <DynamicButton variant="outline" onClick={handleCancel}>
                Back to Admin
              </DynamicButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No analytics state - show loading instead of manual generation button
  if (!analyticsPreview && !isGenerating) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="card text-gray-200">
            <div className="text-xl font-semibold mb-4">
              Loading Analytics...
            </div>
            <div className="text-sm text-gray-400">
              Analytics will be generated automatically when tasks are loaded.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = [
    "#6366f1",
    "#10b981",
    "#ef4444",
    "#f59e0b",
    "#14b8a6",
    "#8b5cf6",
    "#3b82f6",
    "#22c55e",
  ];

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-primary rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2>
                Analytics Preview ({format(new Date(monthId + "-01"), "MMMM yyyy")})
              </h2>
              <div className="mt-2 text-sm text-gray-600">
                <strong>Month:</strong> {monthId}
                {board?.exists && (
                  <span className="ml-2 text-green-600">
                    • Month board ready
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {existingAnalytics ? (
                <DynamicButton
                  variant="danger"
                  disabled={true}
                  title="Analytics already exist for this month"
                >
                  Already Saved
                </DynamicButton>
              ) : (
                <DynamicButton
                  variant="success"
                  onClick={handleSaveAnalytics}
                  loading={saving}
                >
                  Save Analytics
                </DynamicButton>
              )}
              <DynamicButton variant="danger" onClick={handleCancel}>
                Cancel
              </DynamicButton>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="bg-white rounded-lg shadow p-6">
          {(() => {
            const flatten = (obj) => ({
              labels: Object.keys(obj || {}),
              values: Object.values(obj || {}),
            });
            const markets = analyticsPreview.markets || {};
            const products = analyticsPreview.products || {};
            const aiModels = analyticsPreview.aiModels || {};
            const deliverables = analyticsPreview.deliverables || {};
            
            // Debug: Log the original analytics data (only once per analytics change)
            const analyticsKey = JSON.stringify({ markets, products, aiModels, deliverables });
            if (analyticsKey !== window._lastAnalyticsKey) {
              window._lastAnalyticsKey = analyticsKey;
              console.log('Original analytics data:');
              console.log('Markets:', markets);
              console.log('Products:', products);
              console.log('AI Models:', aiModels);
              console.log('Deliverables:', deliverables);
            }
            const aiByProduct = analyticsPreview.aiBreakdownByProduct || {};
            const aiByMarket = analyticsPreview.aiBreakdownByMarket || {};
            const daily = analyticsPreview.daily || {};
            const m = flatten(markets);
            const p = flatten(products);
            const ai = flatten(aiModels);
            const d = flatten(deliverables);
            
            // Debug: Log the flattened data to see what's being passed to charts (only once per data change)
            const flattenedKey = JSON.stringify({ m, p, ai, d });
            if (flattenedKey !== window._lastFlattenedKey) {
              window._lastFlattenedKey = flattenedKey;
              console.log('Flattened data for charts:');
              console.log('Markets:', m);
              console.log('Products:', p);
              console.log('AI Models:', ai);
              console.log('Deliverables:', d);
            }
            const prodKeys = Object.keys(aiByProduct);
            const prodAiTasks = prodKeys.map(
              (k) => aiByProduct[k]?.aiTasks || 0
            );
            const prodNonAiTasks = prodKeys.map(
              (k) => aiByProduct[k]?.nonAiTasks || 0
            );
            const marketKeys = Object.keys(aiByMarket);
            const marketAiTasks = marketKeys.map(
              (k) => aiByMarket[k]?.aiTasks || 0
            );
            const marketNonAiTasks = marketKeys.map(
              (k) => aiByMarket[k]?.nonAiTasks || 0
            );
            const dayKeys = Object.keys(daily).sort();
            const dayCounts = dayKeys.map((k) => daily[k]?.count || 0);
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center">
                    Tasks by Market
                  </h4>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={m.labels.map((name, i) => {
                          const value = m.values[i];
                          const count = typeof value === 'number' ? value : (typeof value === 'object' ? value?.count || 0 : 0);
                          return {
                            name,
                            count,
                          };
                        })}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center">
                    Tasks by Product
                  </h4>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={p.labels.map((name, i) => {
                            const value = p.values[i];
                            const count = typeof value === 'number' ? value : (typeof value === 'object' ? value?.count || 0 : 0);
                            return {
                              name,
                              count,
                            };
                          })}
                          dataKey="count"
                          nameKey="name"
                          outerRadius={110}
                          label
                        >
                          {p.labels.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                                                  </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center">
                    AI Models (count)
                  </h4>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={ai.labels.map((name, i) => {
                          const value = ai.values[i];
                          const count = typeof value === 'number' ? value : (typeof value === 'object' ? value?.count || 0 : 0);
                          return {
                            name,
                            count,
                          };
                        })}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center">
                    Deliverables (count)
                  </h4>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={d.labels.map((name, i) => {
                          const value = d.values[i];
                          const count = typeof value === 'number' ? value : (typeof value === 'object' ? value?.count || 0 : 0);
                          return {
                            name,
                            count,
                          };
                        })}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center">
                    AI vs Non-AI by Product (tasks)
                  </h4>
                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={prodKeys.map((name, i) => ({
                          name,
                          ai: prodAiTasks[i] || 0,
                          nonAi: prodNonAiTasks[i] || 0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          dataKey="ai"
                          stackId="a"
                          fill="#6366f1"
                          name="AI Tasks"
                        />
                        <Bar
                          dataKey="nonAi"
                          stackId="a"
                          fill="#cbd5e1"
                          name="Non-AI Tasks"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center">
                    AI vs Non-AI by Market (tasks)
                  </h4>
                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={marketKeys.map((name, i) => ({
                          name,
                          ai: marketAiTasks[i] || 0,
                          nonAi: marketNonAiTasks[i] || 0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          dataKey="ai"
                          stackId="a"
                          fill="#10b981"
                          name="AI Tasks"
                        />
                        <Bar
                          dataKey="nonAi"
                          stackId="a"
                          fill="#cbd5e1"
                          name="Non-AI Tasks"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-medium mb-2 text-center">
                    Daily Tasks Trend
                  </h4>
                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                      <LineChart
                        data={dayKeys.map((name, i) => ({
                          name,
                          count: dayCounts[i] || 0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-medium mb-2 text-center">
                    Product Hours vs AI Hours (bubble)
                  </h4>
                  <div style={{ width: "100%", height: 340 }}>
                    <ResponsiveContainer>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" name="Total Hours" />
                        <YAxis type="number" dataKey="y" name="AI Hours" />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                        <Scatter
                          name="Products"
                          data={prodKeys.map((k) => ({
                            x: aiByProduct[k]?.totalHours || 0,
                            y: aiByProduct[k]?.aiHours || 0,
                            z: Math.max(
                              4,
                              Math.min(20, aiByProduct[k]?.totalTasks || 0)
                            ),
                          }))}
                          fill="#ea580c"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
