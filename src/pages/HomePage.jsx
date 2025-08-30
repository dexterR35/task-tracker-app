import React from "react";
import DynamicButton from "../shared/components/ui/DynamicButton";
import netbetLogo from "../assets/netbet-logo.png";
import { useFetchData } from "../shared/hooks/useFetchData";
import { useNavigate } from "react-router-dom";

import {
  FiClock,
  FiBarChart2,
  FiUsers,
  FiCheckCircle,
  FiTrendingUp,
  FiUser,
  FiZap,
  FiPackage,
  FiTarget,
  FiArrowUp,
  FiArrowDown,
  FiMinus,
} from "react-icons/fi";
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

// Get color based on metric type (same as OptimizedSmallCard)
const getMetricColor = (type) => {
  switch (type) {
    case "total-tasks":
      return "#67C090";
    case "total-hours":
      return "#33A1E0";
    case "ai-tasks":
      return "#e31769";
    case "design":
      return "#eb2743";
    default:
      return "#3d48c9";
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
    subtitle: "AI Enhanced Tasks",
    reporterName: "Mike Wilson",
    bestAI: "ChatGPT",
    deliverables: null,
    bestCategory: "Poker",
    trend: "+20% from last month",
    trendDirection: "up",
    icon: FiTrendingUp,
    hasChart: true,
    chartData: ChartData,
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
    bestCategory: "Design",
    trend: "+5% from last month",
    trendDirection: "up",
    icon: FiUsers,
    hasChart: false,
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
    hasChart: false,
  },
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
    trend: "-12% from last month",
    trendDirection: "down",
    icon: FiCheckCircle,
    hasChart: false,
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
    icon: FiBarChart2,
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
        return <FiArrowUp className="w-4 h-4 text-green-success" />;
      case "down":
        return <FiArrowDown className="w-4 h-4 text-red-error" />;
      default:
        return <FiMinus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-soft-white-dark border  border-gray-700/50  rounded-lg p-6 w-full ">
      <div className=" h-auto ">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div
                className="p-3 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${metricColor}20` }}
              >
                <card.icon
                  className="w-6.5 h-6.5"
                  style={{ color: metricColor }}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-200">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
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
                  className="h-2 rounded-full "
                  style={{
                    width: "75%",
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
  const navigate = useNavigate();
  const { user, canAccess } = useFetchData();
  const isAuthenticated = !!user;





  // Show loading state if we're actually checking auth and have a user
  // This prevents the spinner from showing on the homepage when it's a public route


  return (
    <div className="min-h-[90vh] w-full bg-white-dark flex items-center justify-center flex-col">
      <div className="max-w-[86%] w-full mx-auto px-4 relative">
        {/* Hero Section */}

        <div className=" mb-2">
          <h1 className="mb-2 text-[6rem]">
            <span className="text-white-dark">Welcome to</span>
            <span className=" text-red-error ">SYNC</span>
          </h1>
          <p className="text-lg leading-6 soft-white max-w-xl mx-auto text-center  mb-16  ">
            The ultimate track task management platform designed for teams that
            prioritize{" "}
            <span className="text-red-error ">calculate monthly reports</span>{" "}
            and <span className="text-blue-default ">analyze performance</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 ">
            {isAuthenticated ? (
              // Show "View Dashboard" button when authenticated
              <DynamicButton
                to="/dashboard"
                variant="danger"
                size="lg"
                className="text-lg px-8 py-4  transition-all duration-200 transform hover:scale-102"
                type="button"
                iconName="funny"
              >
                View Dashboard
              </DynamicButton>
            ) : (
              // Show "Get Started" button when not authenticated
              <DynamicButton
                to="/login"
                variant="primary"
                size="lg"
                className="text-lg px-8 py-4  transition-all duration-200 transform hover:scale-102"
                type="button"
                iconName="default"
              >
                Get Started
              </DynamicButton>
            )}
          </div>
        </div>

        {/* Metrics Section */}
        <div className="mb-10 relative">
       
          {/* Homepage Cards Grid */}
          <div className="max-w-7xl mx-auto b">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-start">
              {homepageCards.map((card) => (
                <HomepageCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="absolute -bottom-18 left-1/2 -translate-x-1/2 z-4 bg-soft-white-dark rounded-2xl p-4 mb-16 border border-gray-600/30 w-[55.5%]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-success ">40+</div>
              <div className="text-gray-300">Active Teams</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-500 ">300+</div>
              <div className="text-gray-300">Tasks Completed per month</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-error">50/50</div>
              <div className="text-gray-300">whatever</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center space-x-4 absolute bottom-0 left-1/2 -translate-x-1/2">
          <p className="font-base italic text-sm text-gray-500">Powered by</p>
          <img
            src={netbetLogo}
            alt="NetBet Logo"
            className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;