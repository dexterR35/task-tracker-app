import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
} from "recharts";
import { useAppData } from "@/hooks";
import {
  calculateTaskMetrics,
  calculateReporterMetrics,
  calculateUserMetrics,
  calculateDesignMetrics,
  calculateAIMetrics,
  calculateMarketMetrics,
  calculateProductMetrics,
  calculateVideoMetrics,
  calculateDeveloperMetrics,
  generateChartData,
} from "@/utils/analyticsUtils";

// Color palette for charts
const COLORS = [
  "#67C090", "#33A1E0", "#e31769", "#eb2743", "#8B5CF6",
  "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6"
];

const AnalyticsPage = () => {
  const { tasks = [], users = [], reporters = [], isLoading = false } = useAppData();

  // Calculate all metrics
  const metrics = useMemo(() => {
    const validTasks = Array.isArray(tasks) ? tasks : [];
    const validUsers = Array.isArray(users) ? users : [];
    const validReporters = Array.isArray(reporters) ? reporters : [];
    
    const taskMetrics = calculateTaskMetrics(validTasks);
    const reporterMetrics = calculateReporterMetrics(validTasks, validReporters);
    const userMetrics = calculateUserMetrics(validTasks, validUsers);
    const designMetrics = calculateDesignMetrics(validTasks, validReporters);
    const aiMetrics = calculateAIMetrics(validTasks);
    const marketMetrics = calculateMarketMetrics(validTasks);
    const productMetrics = calculateProductMetrics(validTasks);
    const videoMetrics = calculateVideoMetrics(validTasks, validReporters);
    const devMetrics = calculateDeveloperMetrics(validTasks, validReporters);
    
    let chartData = [];
    try {
      chartData = generateChartData(validTasks, 7);
    } catch (error) {
      console.warn('Error generating chart data:', error);
      chartData = Array.from({ length: 7 }, (_, i) => ({
        name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        value: 0,
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
    }
    
    return {
      taskMetrics,
      reporterMetrics,
      userMetrics,
      designMetrics,
      aiMetrics,
      marketMetrics,
      productMetrics,
      videoMetrics,
      devMetrics,
      chartData
    };
  }, [tasks, users, reporters]);

  // Prepare data for different chart types
  const chartData = {
    // Bar Chart Data - Department Performance
    departmentBar: [
      { name: 'Design', tasks: metrics.designMetrics.totalDesignTasks, hours: metrics.designMetrics.totalDesignHours },
      { name: 'Video', tasks: metrics.videoMetrics.totalVideoTasks, hours: metrics.videoMetrics.totalVideoHours },
      { name: 'Development', tasks: metrics.devMetrics.totalDevTasks, hours: metrics.devMetrics.totalDevHours },
    ],

    // Line Chart Data - Time Trends
    timeLine: metrics.chartData,

    // Pie Chart Data - AI Models Distribution
    aiPie: metrics.aiMetrics.topAIModels.map((item, index) => ({
      name: item.model,
      value: item.count,
      fill: COLORS[index % COLORS.length]
    })),

    // Scatter Chart Data - User Performance
    userScatter: metrics.userMetrics.topUsers.map((user, index) => ({
      x: user.taskCount,
      y: user.totalHours,
      name: user.name,
      fill: COLORS[index % COLORS.length]
    })),

    // Area Chart Data - Market Distribution
    marketArea: metrics.marketMetrics.topMarkets.map((market, index) => ({
      name: market.market,
      value: market.count,
      fill: COLORS[index % COLORS.length]
    })),

    // Radar Chart Data - Department Comparison
    departmentRadar: [
      { subject: 'Tasks', Design: metrics.designMetrics.totalDesignTasks, Video: metrics.videoMetrics.totalVideoTasks, Development: metrics.devMetrics.totalDevTasks },
      { subject: 'Hours', Design: metrics.designMetrics.totalDesignHours, Video: metrics.videoMetrics.totalVideoHours, Development: metrics.devMetrics.totalDevHours },
      { subject: 'AI Usage', Design: metrics.designMetrics.aiTasks, Video: metrics.videoMetrics.aiTasks, Development: metrics.devMetrics.aiTasks },
    ],

    // Treemap Data - Product Distribution
    productTreemap: metrics.productMetrics.topProducts.map((product, index) => ({
      name: product.product,
      size: product.count,
      fill: COLORS[index % COLORS.length]
    })),

    // Reporter Performance Data
    reporterData: metrics.reporterMetrics.topReporters.map((reporter, index) => ({
      name: reporter.name,
      tasks: reporter.taskCount,
      hours: reporter.totalHours,
      fill: COLORS[index % COLORS.length]
    }))
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-white">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-white mb-8">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Department Performance Bar Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Department Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.departmentBar}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Legend />
              <Bar dataKey="tasks" fill="#67C090" name="Tasks" />
              <Bar dataKey="hours" fill="#33A1E0" name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Models Distribution Pie Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">AI Models Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.aiPie}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.aiPie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Time Trends Line Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Task Creation Trends (7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.timeLine}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Line type="monotone" dataKey="value" stroke="#e31769" strokeWidth={3} dot={{ fill: '#e31769', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Performance Scatter Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">User Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={chartData.userScatter}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" dataKey="x" name="Tasks" stroke="#9CA3AF" />
              <YAxis type="number" dataKey="y" name="Hours" stroke="#9CA3AF" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Scatter dataKey="y" fill="#8B5CF6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Market Distribution Area Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Market Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.marketArea}>
              <defs>
                <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Area type="monotone" dataKey="value" stroke="#10B981" fillOpacity={1} fill="url(#marketGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department Comparison Radar Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Department Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={chartData.departmentRadar}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" />
              <PolarRadiusAxis stroke="#9CA3AF" />
              <Radar name="Design" dataKey="Design" stroke="#eb2743" fill="#eb2743" fillOpacity={0.3} />
              <Radar name="Video" dataKey="Video" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
              <Radar name="Development" dataKey="Development" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
              <Legend />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Reporter Performance Bar Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Reporter Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.reporterData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis dataKey="name" type="category" stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Bar dataKey="tasks" fill="#3B82F6" name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product Distribution Treemap */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Product Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={chartData.productTreemap}
              dataKey="size"
              aspectRatio={4/3}
              stroke="#374151"
              fill="#8884d8"
            >
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
            </Treemap>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;