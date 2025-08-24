import React, { useState, useMemo } from "react";
import SmallCard from "./cards/SmallCard";
import { ANALYTICS_TYPES, TASK_CATEGORIES } from "../../hooks/useTaskAnalytics";

import {
  ClipboardDocumentListIcon,
  ClockIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CubeIcon,
  ChartBarIcon,
  CogIcon,
  CodeBracketIcon,
  VideoCameraIcon,
  PaintBrushIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

// Memoized SmallCard component to prevent unnecessary re-renders
const MemoizedSmallCard = React.memo(SmallCard);

// Configuration array for all metric cards using type-based approach
const METRIC_CARDS_CONFIG = [
  {
    id: "total-tasks",
    title: "Total Tasks",
    type: ANALYTICS_TYPES.TOTAL_TASKS,
    icon: ClipboardDocumentListIcon,
    trend: true,
    trendValue: "This Month",
    trendDirection: "up",
  },
  {
    id: "total-hours",
    title: "Total Hours",
    type: ANALYTICS_TYPES.TOTAL_HOURS,
    icon: ClockIcon,
    trend: true,
    trendValue: "Total Time",
    trendDirection: "up",
  },
  {
    id: "total-time-with-ai",
    title: "Total Time with AI",
    type: ANALYTICS_TYPES.TOTAL_TIME_WITH_AI,
    icon: SparklesIcon,
    trend: true,
    trendValue: "AI Assisted",
    trendDirection: "up",
  },
  {
    id: "ai-tasks",
    title: "AI Tasks",
    type: ANALYTICS_TYPES.AI_TASKS,
    icon: SparklesIcon,
    trend: true,
    trendValue: "AI Usage",
    trendDirection: "up",
  },
  {
    id: "development",
    title: "Development",
    type: ANALYTICS_TYPES.DEVELOPMENT,
    category: TASK_CATEGORIES.DEV,
    icon: CodeBracketIcon,
    trend: true,
    trendValue: "Development",
    trendDirection: "up",
  },
  {
    id: "design",
    title: "Design",
    type: ANALYTICS_TYPES.DESIGN,
    category: TASK_CATEGORIES.DESIGN,
    icon: PaintBrushIcon,
    trend: true,
    trendValue: "Design Work",
    trendDirection: "up",
  },
  {
    id: "video",
    title: "Video",
    type: ANALYTICS_TYPES.VIDEO,
    category: TASK_CATEGORIES.VIDEO,
    icon: VideoCameraIcon,
    trend: true,
    trendValue: "Video Production",
    trendDirection: "up",
  },
  {
    id: "user-performance",
    title: "User Performance",
    type: ANALYTICS_TYPES.USER_PERFORMANCE,
    icon: UserGroupIcon,
    trend: true,
    trendValue: "Team Stats",
    trendDirection: "up",
  },
  {
    id: "markets",
    title: "Markets",
    type: ANALYTICS_TYPES.MARKETS,
    icon: GlobeAltIcon,
    trend: true,
    trendValue: "Active Markets",
    trendDirection: "up",
  },
  {
    id: "products",
    title: "Products",
    type: ANALYTICS_TYPES.PRODUCTS,
    icon: CubeIcon,
    trend: true,
    trendValue: "Active Products",
    trendDirection: "up",
  },
];

const TaskMetricDashBoard = ({
  monthId,
  userId = null,
  showSmallCards = true,
  className = "",
}) => {
  const [showKeyMetrics, setShowKeyMetrics] = useState(false);

  // Memoize the cards to prevent unnecessary re-renders
  const metricCards = useMemo(() => {
    if (!showSmallCards || !showKeyMetrics || !monthId) {
      return null;
    }

    return METRIC_CARDS_CONFIG.map((cardConfig) => (
      <MemoizedSmallCard
        key={cardConfig.id}
        title={cardConfig.title}
        type={cardConfig.type}
        category={cardConfig.category}
        icon={cardConfig.icon}
        monthId={monthId}
        userId={userId}
        trend={cardConfig.trend}
        trendValue={cardConfig.trendValue}
        trendDirection={cardConfig.trendDirection}
        loading={false}
      />
    ));
  }, [showSmallCards, showKeyMetrics, monthId, userId]);

  if (!monthId) {
    return (
      <div className="text-center text-gray-300 py-8">
        No month selected for metrics
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics Toggle Button */}
      <div className="flex items-center justify-between">
        <h2>
          Task Metrics
        </h2>
        <button
          onClick={() => setShowKeyMetrics(!showKeyMetrics)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
        >
          <span>{showKeyMetrics ? 'Hide' : 'Show'}</span>
          {showKeyMetrics ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Small Cards Section */}
      {showSmallCards && showKeyMetrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {metricCards}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskMetricDashBoard;
