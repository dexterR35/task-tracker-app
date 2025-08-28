import React from "react";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import netbetLogo from "../../assets/netbet-logo.png";
import {
  FiClock,
  FiBarChart2,
  FiUsers,
  FiCheckCircle,
  FiTrendingUp,
  FiCalendar,
  FiUser,
  FiZap,
  FiPackage,
  FiTarget,
  FiArrowUp,
  FiArrowDown,
  FiMinus
} from "react-icons/fi";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Chart Components
const ModernLineChart = ({ data, color = "#3d48c9" }) => (
  <ResponsiveContainer width="100%" height={80}>
    <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
          <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
      <Line 
        type="monotone" 
        dataKey="value" 
        stroke={color} 
        strokeWidth={3}
        dot={{ fill: color, strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: "#fff" }}
        fill={`url(#gradient-${color})`}
      />
    </LineChart>
  </ResponsiveContainer>
);

const ModernAreaChart = ({ data, color = "#eb2743" }) => (
  <ResponsiveContainer width="100%" height={80}>
    <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
      <defs>
        <linearGradient id={`area-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
          <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
      <Area 
        type="monotone" 
        dataKey="value" 
        fill={`url(#area-${color})`}
        stroke={color} 
        strokeWidth={3}
      />
    </AreaChart>
  </ResponsiveContainer>
);

const ModernBarChart = ({ data, color = "#a99952" }) => (
  <ResponsiveContainer width="100%" height={80}>
    <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
      <defs>
        <linearGradient id={`bar-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={1}/>
          <stop offset="100%" stopColor={color} stopOpacity={0.3}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
      <Bar 
        dataKey="value" 
        fill={`url(#bar-${color})`}
        radius={[2, 2, 0, 0]}
        barSize={35}
      />
    </BarChart>
  </ResponsiveContainer>
);

// Get color based on metric type (same as OptimizedSmallCard)
const getMetricColor = (type) => {
  switch (type) {
    case 'total-tasks': return "#3d48c9";
    case 'total-hours': return "#2fd181";
    case 'total-time-with-ai': return "#538cff";
    case 'ai-tasks': return "#a99952";
    case 'development': return "#c10f29";
    case 'design': return "#eb2743";
    case 'video': return "#a99952";
    case 'user-performance': return "#3d48c9";
    case 'markets': return "#2fd181";
    case 'products': return "#538cff";
    default: return "#3d48c9";
  }
};

// Chart data for AI Tasks
const aiTasksChartData = [
  { name: 'Mon', value: 8 }, { name: 'Tue', value: 12 }, { name: 'Wed', value: 10 },
  { name: 'Thu', value: 15 }, { name: 'Fri', value: 13 }, { name: 'Sat', value: 9 },
  { name: 'Sun', value: 11 }
];

// Chart data for Design
const designChartData = [
  { name: 'Mon', value: 3 }, { name: 'Tue', value: 5 }, { name: 'Wed', value: 4 },
  { name: 'Thu', value: 7 }, { name: 'Fri', value: 6 }, { name: 'Sat', value: 2 },
  { name: 'Sun', value: 3 }
];

// Dummy data for homepage cards
const homepageCards = [
  {
    id: "total-tasks",
    title: "Total Tasks",
    type: "total-tasks",
    value: "156",
    subtitle: "Active Tasks",
    reporterName: "John Smith",
    bestAI: null,
    deliverables: null,
    bestCategory: "Casino",
    trend: "+12% from last month",
    trendDirection: "up",
    icon: FiCheckCircle,
    hasChart: false
  },
  {
    id: "total-hours",
    title: "Total Hours",
    type: "total-hours",
    value: "8.2",
    subtitle: "Hours Tracked",
    reporterName: "Sarah Johnson",
    bestAI: null,
    deliverables: null,
    bestCategory: "Sports",
    trend: "+8% from last month",
    trendDirection: "up",
    icon: FiClock,
    hasChart: false
  },
  {
    id: "ai-tasks",
    title: "AI Tasks",
    type: "ai-tasks",
    value: "45",
    subtitle: "AI Enhanced Tasks",
    reporterName: "Mike Wilson",
    bestAI: "ChatGPT",
    deliverables: null,
    bestCategory: "Poker",
    trend: "+20% from last month",
    trendDirection: "up",
    icon: FiTrendingUp,
    hasChart: true,
    chartData: aiTasksChartData
  },
  {
    id: "design",
    title: "Design",
    type: "design",
    value: "23",
    subtitle: "Design Projects",
    reporterName: "Emma Davis",
    bestAI: null,
    deliverables: 12,
    bestCategory: "Casino",
    trend: "+18% from last month",
    trendDirection: "up",
    icon: FiBarChart2,
    hasChart: true,
    chartData: designChartData
  },
  {
    id: "user-performance",
    title: "Team Performance",
    type: "user-performance",
    value: "92%",
    subtitle: "Team Performance",
    reporterName: "Alex Brown",
    bestAI: null,
    deliverables: null,
    bestCategory: "Sports",
    trend: "+5% from last month",
    trendDirection: "up",
    icon: FiUsers,
    hasChart: false
  },
  {
    id: "development",
    title: "Development",
    type: "development",
    value: "34",
    subtitle: "Development Work",
    reporterName: "Chris Lee",
    bestAI: null,
    deliverables: null,
    bestCategory: "Poker",
    trend: "+10% from last month",
    trendDirection: "up",
    icon: FiCalendar,
    hasChart: false
  }
];

// Homepage Card Component (same design as OptimizedSmallCard)
const HomepageCard = ({ card }) => {
  const metricColor = getMetricColor(card.type);
  
  const getTrendIconComponent = (direction) => {
    switch (direction) {
      case "up": return <FiArrowUp className="w-3 h-3 text-green-success" />;
      case "down": return <FiArrowDown className="w-3 h-3 text-red-error" />;
      default: return <FiMinus className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="group transition-all duration-300 hover:scale-[1.02]">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 rounded-lg p-6 h-full transition-all duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="p-3 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${metricColor}20` }}
              >
                <card.icon 
                  className="w-6 h-6" 
                  style={{ color: metricColor }}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-200">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {card.subtitle}
                </p>
              </div>
            </div>
            
            {/* Trend Indicator */}
            <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700/30">
              {getTrendIconComponent(card.trendDirection)}
              <span className="text-xs font-medium text-green-success">
                +12%
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Main Value */}
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-100 mb-2">
                {card.value}
              </div>
              <div className="text-sm text-gray-400 mb-1">
                {card.trend}
              </div>
            </div>

            {/* Chart Section - Only for cards with charts */}
            {card.hasChart && (
              <div className="mb-6 h-20">
                {card.type === 'ai-tasks' ? (
                  <ModernBarChart data={card.chartData} color={metricColor} />
                ) : (
                  <ModernAreaChart data={card.chartData} color={metricColor} />
                )}
              </div>
            )}

            {/* Enhanced Data */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiUser className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Reporter</span>
                </div>
                <span className="text-sm font-medium text-gray-200">
                  {card.reporterName}
                </span>
              </div>
              {/* Only show best AI for AI task cards */}
              {card.bestAI !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FiZap className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">Best AI</span>
                  </div>
                  <span className="text-sm font-medium text-gray-200">
                    {card.bestAI}
                  </span>
                </div>
              )}
              {/* Only show deliverables for design cards */}
              {card.deliverables !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FiPackage className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">Deliverables</span>
                  </div>
                  <span className="text-sm font-medium text-gray-200">
                    {card.deliverables}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiTarget className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Best Category</span>
                </div>
                <span className="text-sm font-medium text-gray-200">
                  {card.bestCategory}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Progress</span>
                <span className="text-xs text-gray-400">75%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: "75%",
                    backgroundColor: metricColor 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-primary via-primary to-gradient-start">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-6">
              <span className="text-red-error">Welcome</span> to{" "}
              <span className="bg-gradient-to-r from-blue-default to-red-error bg-clip-text text-transparent">
                SYNC
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
              The ultimate task management platform designed for teams that prioritize{" "}
              <span className="text-green-success font-semibold">efficiency</span> and{" "}
              <span className="text-blue-default font-semibold">clarity</span>
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
              Manage tasks, track time, calculate monthly reports, and analyze performance 
              with our intuitive and powerful platform.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <DynamicButton
              to="/login"
              variant="primary"
              size="lg"
              className="text-lg px-8 py-4 bg-gradient-to-r from-btn-primary to-blue-default hover:from-blue-default hover:to-btn-primary transition-all duration-300 transform hover:scale-105"
              type="button"
              iconName="default"
            >
              Get Started
            </DynamicButton>
            <DynamicButton
              to="/dashboard"
              variant="secondary"
              size="lg"
              className="text-lg px-8 py-4 border-2 border-gray-600 hover:border-gray-500 transition-all duration-300"
              type="button"
              iconName="default"
            >
              View Dashboard
            </DynamicButton>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-200 mb-4">
              Platform Overview
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Real-time insights into your team's productivity and performance
            </p>
          </div>

          {/* Homepage Cards Grid */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homepageCards.map((card) => (
                <HomepageCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-gray-800/30 to-gray-700/30 backdrop-blur-sm rounded-2xl p-8 mb-16 border border-gray-600/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-success mb-2">500+</div>
              <div className="text-gray-400">Active Teams</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-default mb-2">10K+</div>
              <div className="text-gray-400">Tasks Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-error mb-2">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 mb-8">
            <p className="text-gray-400 text-lg">
              Ready to transform your workflow?
            </p>
            <DynamicButton
              to="/login"
              variant="primary"
              size="md"
              className="bg-gradient-to-r from-red-error to-red-500 hover:from-red-500 hover:to-red-error transition-all duration-300"
              type="button"
              iconName="default"
            >
              Start Free Trial
            </DynamicButton>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <p className="font-base italic text-sm text-gray-500">
              Powered by
            </p>
            <img
              src={netbetLogo}
              alt="NetBet Logo"
              className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
