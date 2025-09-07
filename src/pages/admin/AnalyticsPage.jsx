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
  ComposedChart,
  RadialBarChart,
  RadialBar,
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
  "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6",
  "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1"
];

// Monthly targets (100% goals)
const MONTHLY_TARGETS = {
  totalTasks: 100,
  totalHours: 500,
  designTasks: 30,
  videoTasks: 25,
  devTasks: 45,
  aiTasks: 40,
  marketCoverage: 15,
  productTasks: 20,
  reporterTasks: 80,
  userTasks: 90
};

const AnalyticsPage = () => {
  const { tasks = [], users = [], reporters = [], isLoading = false } = useAppData();

  // Calculate all metrics with percentages
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
      chartData = generateChartData(validTasks, 30); // 30 days of data
    } catch (error) {
      console.warn('Error generating chart data:', error);
      chartData = Array.from({ length: 30 }, (_, i) => ({
        name: `Day ${i + 1}`,
        value: 0,
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
    }
    
    // Calculate percentages for monthly progress
    const percentages = {
      totalTasks: Math.min((taskMetrics.totalTasks / MONTHLY_TARGETS.totalTasks) * 100, 100),
      totalHours: Math.min((taskMetrics.totalHours / MONTHLY_TARGETS.totalHours) * 100, 100),
      designTasks: Math.min((designMetrics.totalDesignTasks / MONTHLY_TARGETS.designTasks) * 100, 100),
      videoTasks: Math.min((videoMetrics.totalVideoTasks / MONTHLY_TARGETS.videoTasks) * 100, 100),
      devTasks: Math.min((devMetrics.totalDevTasks / MONTHLY_TARGETS.devTasks) * 100, 100),
      aiTasks: Math.min((aiMetrics.totalAITasks / MONTHLY_TARGETS.aiTasks) * 100, 100),
      marketCoverage: Math.min((marketMetrics.totalMarkets / MONTHLY_TARGETS.marketCoverage) * 100, 100),
      productTasks: Math.min((productMetrics.totalProductTasks / MONTHLY_TARGETS.productTasks) * 100, 100),
      reporterTasks: Math.min((reporterMetrics.totalReporterTasks / MONTHLY_TARGETS.reporterTasks) * 100, 100),
      userTasks: Math.min((userMetrics.totalUserTasks / MONTHLY_TARGETS.userTasks) * 100, 100)
    };
    
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
      chartData,
      percentages
    };
  }, [tasks, users, reporters]);

  // Prepare data for different chart types
  const chartData = {
    // Monthly Progress Gauge Charts
    progressGauges: [
      { name: 'Total Tasks', value: Math.min(metrics.percentages.totalTasks || 0, 100), target: 100, color: '#67C090' },
      { name: 'Total Hours', value: Math.min(metrics.percentages.totalHours || 0, 100), target: 100, color: '#33A1E0' },
      { name: 'Design Tasks', value: Math.min(metrics.percentages.designTasks || 0, 100), target: 100, color: '#e31769' },
      { name: 'Video Tasks', value: Math.min(metrics.percentages.videoTasks || 0, 100), target: 100, color: '#8B5CF6' },
      { name: 'Dev Tasks', value: Math.min(metrics.percentages.devTasks || 0, 100), target: 100, color: '#F59E0B' },
      { name: 'AI Tasks', value: Math.min(metrics.percentages.aiTasks || 0, 100), target: 100, color: '#10B981' },
    ],

    // Department Performance Bar Chart
    departmentBar: [
      { 
        name: 'Design', 
        tasks: metrics.designMetrics.totalDesignTasks, 
        hours: metrics.designMetrics.totalDesignHours,
        percentage: metrics.percentages.designTasks,
        aiUsage: metrics.designMetrics.aiTasks,
        markets: metrics.designMetrics.topMarkets.length
      },
      { 
        name: 'Video', 
        tasks: metrics.videoMetrics.totalVideoTasks, 
        hours: metrics.videoMetrics.totalVideoHours,
        percentage: metrics.percentages.videoTasks,
        aiUsage: metrics.videoMetrics.aiTasks,
        markets: metrics.videoMetrics.topMarkets.length
      },
      { 
        name: 'Development', 
        tasks: metrics.devMetrics.totalDevTasks, 
        hours: metrics.devMetrics.totalDevHours,
        percentage: metrics.percentages.devTasks,
        aiUsage: metrics.devMetrics.aiTasks,
        markets: metrics.devMetrics.topMarkets.length
      },
    ],

    // Time Trends Line Chart (30 days)
    timeLine: metrics.chartData,

    // AI Models Distribution Pie Chart
    aiPie: metrics.aiMetrics.topAIModels.map((item, index) => ({
      name: item.model,
      value: item.count,
      percentage: metrics.aiMetrics.totalAITasks > 0 ? ((item.count / metrics.aiMetrics.totalAITasks) * 100).toFixed(1) : '0.0',
      fill: COLORS[index % COLORS.length]
    })),

    // User Performance Scatter Chart
    userScatter: metrics.userMetrics.topUsers.map((user, index) => ({
      x: user.taskCount,
      y: user.totalHours,
      name: user.name,
      efficiency: user.totalHours > 0 ? (user.taskCount / user.totalHours).toFixed(2) : 0,
      fill: COLORS[index % COLORS.length]
    })),

    // Market Distribution Area Chart
    marketArea: metrics.marketMetrics.topMarkets.map((market, index) => ({
      name: market.market,
      value: market.count,
      percentage: metrics.marketMetrics.totalMarkets > 0 ? ((market.count / metrics.marketMetrics.totalMarkets) * 100).toFixed(1) : '0.0',
      fill: COLORS[index % COLORS.length]
    })),

    // Department Comparison Radar Chart
    departmentRadar: [
      { 
        subject: 'Tasks', 
        Design: metrics.designMetrics.totalDesignTasks, 
        Video: metrics.videoMetrics.totalVideoTasks, 
        Development: metrics.devMetrics.totalDevTasks 
      },
      { 
        subject: 'Hours', 
        Design: metrics.designMetrics.totalDesignHours, 
        Video: metrics.videoMetrics.totalVideoHours, 
        Development: metrics.devMetrics.totalDevHours 
      },
      { 
        subject: 'AI Usage', 
        Design: metrics.designMetrics.aiTasks, 
        Video: metrics.videoMetrics.aiTasks, 
        Development: metrics.devMetrics.aiTasks 
      },
      { 
        subject: 'Markets', 
        Design: metrics.designMetrics.topMarkets.length, 
        Video: metrics.videoMetrics.topMarkets.length, 
        Development: metrics.devMetrics.topMarkets.length 
      },
    ],

    // Product Distribution Treemap
    productTreemap: metrics.productMetrics.topProducts.map((product, index) => ({
      name: product.product,
      size: product.count,
      percentage: metrics.productMetrics.totalProductTasks > 0 ? ((product.count / metrics.productMetrics.totalProductTasks) * 100).toFixed(1) : '0.0',
      fill: COLORS[index % COLORS.length]
    })),

    // Reporter Performance Data
    reporterData: metrics.reporterMetrics.topReporters.map((reporter, index) => ({
      name: reporter.name,
      tasks: reporter.taskCount,
      hours: reporter.totalHours,
      efficiency: reporter.totalHours > 0 ? (reporter.taskCount / reporter.totalHours).toFixed(2) : 0,
      percentage: metrics.reporterMetrics.totalReporterTasks > 0 ? ((reporter.taskCount / metrics.reporterMetrics.totalReporterTasks) * 100).toFixed(1) : '0.0',
      fill: COLORS[index % COLORS.length]
    })),

    // Composed Chart - Tasks vs Hours vs AI Usage
    composedData: metrics.chartData.map((day, index) => ({
      ...day,
      aiTasks: Math.floor(Math.random() * 5) + 1, // Mock AI data for demo
      hours: Math.floor(Math.random() * 20) + 5, // Mock hours data for demo
    })),

    // Funnel Chart - Task Completion Flow
    taskFunnel: [
      { name: 'Created', value: metrics.taskMetrics.totalTasks, fill: '#67C090' },
      { name: 'In Progress', value: Math.floor(metrics.taskMetrics.totalTasks * 0.7), fill: '#33A1E0' },
      { name: 'Review', value: Math.floor(metrics.taskMetrics.totalTasks * 0.5), fill: '#F59E0B' },
      { name: 'Completed', value: Math.floor(metrics.taskMetrics.totalTasks * 0.3), fill: '#10B981' },
    ],

    // Radial Bar Chart - Department Efficiency
    departmentRadial: [
      { name: 'Design', efficiency: Math.min(metrics.percentages.designTasks || 0, 100), fill: '#e31769' },
      { name: 'Video', efficiency: Math.min(metrics.percentages.videoTasks || 0, 100), fill: '#8B5CF6' },
      { name: 'Development', efficiency: Math.min(metrics.percentages.devTasks || 0, 100), fill: '#F59E0B' },
    ],

    // Sunburst Chart - Hierarchical Data
    sunburstData: {
      name: 'Total Tasks',
      children: [
        {
          name: 'Design',
          value: metrics.designMetrics.totalDesignTasks,
          children: [
            { name: 'AI Tasks', value: metrics.designMetrics.aiTasks },
            { name: 'Total Hours', value: Math.round(metrics.designMetrics.totalDesignHours) }
          ]
        },
        {
          name: 'Video',
          value: metrics.videoMetrics.totalVideoTasks,
          children: [
            { name: 'AI Tasks', value: metrics.videoMetrics.aiTasks },
            { name: 'Total Hours', value: Math.round(metrics.videoMetrics.totalVideoHours) }
          ]
        },
        {
          name: 'Development',
          value: metrics.devMetrics.totalDevTasks,
          children: [
            { name: 'AI Tasks', value: metrics.devMetrics.aiTasks },
            { name: 'Total Hours', value: Math.round(metrics.devMetrics.totalDevHours) }
          ]
        }
      ]
    }
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
      <h1 className="text-3xl font-bold !text-white mb-8"> Analytics Dashboard</h1>
      
      {/* Monthly Progress Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {chartData.progressGauges.map((gauge, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{gauge.name}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ value: gauge.value, fill: gauge.color }]}>
                <RadialBar dataKey="value" cornerRadius={10} fill={gauge.color} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold" fill="white">
                  {gauge.value.toFixed(1)}%
                </text>
                <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="text-sm" fill="white">
                  of {gauge.target}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
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
              <Bar dataKey="aiUsage" fill="#10B981" name="AI Usage" />
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
                label={({ name, percentage }) => `${name} ${percentage}%`}
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
          <h3 className="text-xl font-semibold text-white mb-4">Task Creation Trends (30 Days)</h3>
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

        {/* User Performance Bar Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">User Performance & Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.userScatter}>
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
              <Bar dataKey="x" fill="#8B5CF6" name="Tasks" />
              <Bar dataKey="y" fill="#F59E0B" name="Hours" />
            </BarChart>
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
            <BarChart data={chartData.reporterData}>
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
              <Bar dataKey="tasks" fill="#3B82F6" name="Tasks" />
              <Bar dataKey="hours" fill="#10B981" name="Hours" />
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

        {/* Composed Chart - Tasks vs Hours vs AI */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Daily Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData.composedData}>
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
              <Bar dataKey="value" fill="#67C090" name="Tasks" />
              <Line type="monotone" dataKey="hours" stroke="#33A1E0" strokeWidth={2} name="Hours" />
              <Line type="monotone" dataKey="aiTasks" stroke="#10B981" strokeWidth={2} name="AI Tasks" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Task Completion Flow */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Task Completion Flow</h3>
          <div className="space-y-3">
            {chartData.taskFunnel.map((stage, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.fill }}></div>
                  <span className="text-white font-medium">{stage.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{stage.value}</div>
                  <div className="text-xs text-gray-400">tasks</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Efficiency Radial Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Department Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={chartData.departmentRadial}>
              <RadialBar dataKey="efficiency" cornerRadius={10} fill="#8884d8" />
              <Legend />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Hierarchy */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Task Hierarchy</h3>
          <div className="space-y-4">
            {chartData.sunburstData.children.map((dept, index) => (
              <div key={index} className="p-4 bg-gray-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">{dept.name}</h4>
                  <span className="text-sm text-gray-400">{dept.value} tasks</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {dept.children.map((type, typeIndex) => (
                    <div key={typeIndex} className="flex items-center justify-between p-2 bg-gray-600/30 rounded">
                      <span className="text-sm text-gray-300">{type.name}</span>
                      <span className="text-sm font-medium text-white">{type.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Markets Overview Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Markets Overview</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{metrics.marketMetrics.totalMarkets || 0}</div>
              <div className="text-sm text-gray-400">Total Markets</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{metrics.marketMetrics.topMarkets.length || 0}</div>
              <div className="text-sm text-gray-400">Active Markets</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.marketArea}>
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
              <Bar dataKey="value" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Products Overview Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Products Overview</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{metrics.productMetrics.totalProductTasks}</div>
              <div className="text-sm text-gray-400">Total Product Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{metrics.productMetrics.topProducts.length}</div>
              <div className="text-sm text-gray-400">Active Products</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData.productTreemap}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="size"
              >
                {chartData.productTreemap.map((entry, index) => (
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

        {/* Total Tasks & Reporters Overview */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Total Tasks & Reporters</h3>
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400">{metrics.taskMetrics.totalTasks || 0}</div>
              <div className="text-sm text-gray-400">Total Tasks</div>
              <div className="text-xs text-gray-500 mt-1">{metrics.taskMetrics.totalHours || 0} hours</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400">{metrics.reporterMetrics.totalReporters || 0}</div>
              <div className="text-sm text-gray-400">Total Reporters</div>
              <div className="text-xs text-gray-500 mt-1">{metrics.reporterMetrics.totalReporterTasks || 0} assigned tasks</div>
            </div>
          </div>
          
          {/* Reporter List */}
          <div className="mt-4">
            <h4 className="text-lg font-semibold text-white mb-3">Reporter Details</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {metrics.reporterMetrics.topReporters.slice(0, 5).map((reporter, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-sm text-white">{reporter.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-white">{reporter.taskCount}</span>
                    <span className="text-xs text-gray-400 ml-1">tasks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Tasks & Markets Distribution */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">User Tasks & Markets</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.userScatter.map((user, index) => ({
              name: user.name,
              tasks: user.x || 0,
              markets: Math.floor(Math.random() * 8) + 1, // Mock market count per user
              fill: user.fill
            }))}>
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
              <Bar dataKey="tasks" fill="#8B5CF6" name="Tasks" />
              <Bar dataKey="markets" fill="#F59E0B" name="Markets" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Markets by Department */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Markets by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { 
                name: 'Design', 
                markets: metrics.designMetrics.topMarkets.length,
                tasks: metrics.designMetrics.totalDesignTasks,
                fill: '#e31769'
              },
              { 
                name: 'Video', 
                markets: metrics.videoMetrics.topMarkets.length,
                tasks: metrics.videoMetrics.totalVideoTasks,
                fill: '#8B5CF6'
              },
              { 
                name: 'Development', 
                markets: metrics.devMetrics.topMarkets.length,
                tasks: metrics.devMetrics.totalDevTasks,
                fill: '#F59E0B'
              }
            ]}>
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
              <Bar dataKey="markets" fill="#10B981" name="Markets" />
              <Bar dataKey="tasks" fill="#3B82F6" name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Markets Detail */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Top Markets Detail</h3>
          <div className="space-y-3">
            {metrics.marketMetrics.topMarkets.slice(0, 5).map((market, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-white font-medium">{market.market.toUpperCase()}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{market.count}</div>
                  <div className="text-xs text-gray-400">tasks</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products Detail */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Top Products Detail</h3>
          <div className="space-y-3">
            {metrics.productMetrics.topProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-white font-medium">{product.product}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{product.count}</div>
                  <div className="text-xs text-gray-400">tasks</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;