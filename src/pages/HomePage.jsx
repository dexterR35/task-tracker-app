import React from "react";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import netbetLogo from "@/assets/netbet-logo.png";  
import { Icons } from "@/components/icons";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const ModernAreaChart = ({ data, color = "#eb2743" }) => (
  <ResponsiveContainer width="100%" height={80}>
    <AreaChart
      data={data}
      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
    >
      <defs>
        <linearGradient id={`area-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.8} />
          <stop offset="95%" stopColor={color} stopOpacity={0.1} />
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
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.3} />
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

// Get color based on metric type using new Tailwind colors
const getMetricColor = (type) => {
  switch (type) {
    case "total-tasks":
      return "#2fd181"; // green-success
    case "total-hours":
      return "#2a9df4"; // blue-default
    case "ai-tasks":
      return "#eb2743"; // red-error
    case "design":
      return "#eb2743"; // red-error
    default:
      return "#3d48c9"; // btn-primary
  }
};

// Chart data for Design
const ChartData = [
  { name: "Mon", value: 3 },
  { name: "Tue", value: 6 },
  { name: "Wed", value: 4 },
  { name: "Thu", value: 8 },
  { name: "Fri", value: 7 },
  { name: "Sat", value: 2 },
  { name: "Sun", value: 7 },
];

// Dummy data for homepage cards
const homepageCards = [
  {
    id: "ai-tasks",
    title: "AI Tasks",
    type: "ai-tasks",
    value: "45",
    subtitle: "AI Tools",
    reporterName: "Emma Haarper",
    bestAI: "Claude",
    deliverables: null,
    bestCategory: "Poker",
    trend: "+20% from last month",
    trendDirection: "up",
    icon: Icons.generic.chart,
    hasChart: true,
    chartData: ChartData,
  },
  {
    id: "user-performance",
    title: "Team Performance",
    type: "user-performance",
    value: "92%",
    subtitle: "User per month",
    reporterName: "John Travolta",
    bestAI: null,
    deliverables: null,
    bestCategory: "Design",
    trend: "+5% / week",
    trendDirection: "up",
    icon: Icons.admin.users,
    hasChart: true,
    chartData: ChartData,
  },

  {
    id: "total-hours",
    title: "Total Hours",
    type: "total-hours",
    value: "8.2",
    subtitle: "Hours Tracked",
    reporterName: "Johnny English",
    bestAI: null,
    deliverables: null,
    bestCategory: "Sports",
    trend: "+8% from last month",
    trendDirection: "up",
    icon: Icons.generic.clock,
    hasChart: false,
  },
  {
    id: "total-tasks",
    title: "Total Tasks",
    type: "total-tasks",
    value: "156",
    subtitle: "Analytical Tasks",
    reporterName: "Johnny Sins",
    bestAI: null,
    deliverables: null,
    bestCategory: "Casino",
    trend: "-12% from last month",
    trendDirection: "down",
    icon: Icons.generic.task,
    hasChart: true, 
    chartData: ChartData,
  },
  {
    id: "design",
    title: "Design",
    type: "design",
    value: "140",
    subtitle: "Design tasks",
    reporterName: "Emma Karter",
    bestAI: null,
    deliverables: 120,
    bestCategory: "Sport",
    trend: "-18% from last month",
    trendDirection: "up",
    icon: Icons.cards.chart,
    hasChart: true,
    chartData: ChartData,
  },
];

// Homepage Card Component (same design as OptimizedSmallCard)
const HomepageCard = ({ card }) => {
  const metricColor = getMetricColor(card.type);

  const getTrendIconComponent = (direction) => {
    switch (direction) {
      case "up":
        return <Icons.buttons.chevronUp className="w-4 h-4 text-green-success" />;
      case "down":
        return <Icons.buttons.chevronDown className="w-4 h-4 text-red-error" />;
      default:
        return <Icons.buttons.minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700/50 rounded-lg p-4 w-full">
      <div className="h-auto">
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
              <div className="leading-6">
                <h3 className="text-sm font-semibold text-gray-300 !mb-0">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-400 mt-0">{card.subtitle}</p>
              </div>
            </div>

            {/* Trend Indicator */}
            <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700/30">
              {getTrendIconComponent(card.trendDirection)}
              <span className="text-xs font-medium text-green-success">
                {card.trend}
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
              <div className="text-sm text-gray-400 mb-1">{card.trend}</div>
            </div>

            {/* Chart Section - Only for cards with charts */}
            {card.hasChart && (
              <div className="mb-6 h-16">
                {card.type === "ai-tasks" ? (
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
                  <Icons.generic.user className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Reporter</span>
                </div>
                <span className="text-sm font-medium text-gray-300">
                  {card.reporterName}
                </span>
              </div>
              {/* Only show best AI for AI task cards */}
              {card.bestAI !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icons.generic.zap className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">Best AI</span>
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    {card.bestAI}
                  </span>
                </div>
              )}
              {/* Only show deliverables for design cards */}
              {card.deliverables !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icons.generic.package className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">Deliverables</span>
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    {card.deliverables}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icons.generic.target className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Best Category</span>
                </div>
                <span className="text-sm font-medium text-gray-300">
                  {card.bestCategory}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Progress</span>
                <span className="text-xs text-gray-400">
                  {card.type === "ai-tasks" ? "85%" : 
                   card.type === "design" ? "70%" : "75%"}
                </span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: card.type === "ai-tasks" ? "85%" : 
                           card.type === "design" ? "70%" : "75%",
                    backgroundColor: metricColor,
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
    <div className="min-h-screen w-full bg-white-dark flex items-center justify-center flex-col">
      <div className="max-w-[90%] w-full mx-auto px-4 relative pt-10">
        {/* Hero Section */}
        <div className="mb-5">
          <h1 className="mb-2 text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            <span className="text-white-dark">Welcome to</span>
            <span className=" text-red-error">SYNC</span>
          </h1>
          <p className="text-base md:text-lg leading-6 text-gray-300 max-w-xl mx-auto text-center mb-10">
            The task management platform designed for teams that
            prioritize{" "}
            <span className="text-red-error">calculate monthly reports</span>{" "}
            and <span className="text-blue-default">analyze performance</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center  ">
            <DynamicButton
              to="/login"
              variant="primary"
              size="lg"
              className="text-xl w-1/8"
              type="button"
              iconName="default"
        
            >
              Get Started
            </DynamicButton>
          </div>
        </div>
        {/* Metrics Section */}
        <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-center">
              {homepageCards.map((card) => (
                <HomepageCard key={card.id} card={card} />
              ))}
            </div>
        </div>
        {/* Footer */}
        <div className="flex-center space-x-2 mt-20 mb-10">
          <p className="font-base italic text-xs text-gray-500">Powered by</p>
          <img
            src={netbetLogo}
            alt="NetBet Logo"
            className="h-auto w-20 object-contain opacity-80"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;