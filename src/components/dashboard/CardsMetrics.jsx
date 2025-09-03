import React, { useState, useMemo, useCallback } from "react";
import { DynamicButton } from "@/components";
import OptimizedSmallCard from "@/components/ui/Card/OptimizedSmallCard";
import { useFetchData } from "@/hooks/useFetchData";
import { useAuth } from "@/features/auth";
import { ANALYTICS_TYPES, TASK_CATEGORIES } from "@/features/analytics";


import {
  ClipboardDocumentListIcon,
  ClockIcon,
  SparklesIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CubeIcon,
  CodeBracketIcon,
  VideoCameraIcon,
  PaintBrushIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

// Memoized OptimizedSmallCard component to prevent unnecessary re-renders
const MemoizedOptimizedSmallCard = React.memo(OptimizedSmallCard);

// Occupation-based card filtering configuration - moved to constants
const OCCUPATION_CARD_MAPPING = {
  'designer': ['design', 'total-tasks', 'total-hours', 'ai-combined', 'markets', 'products', 'ai-models', 'user-performance', 'top-reporter', 'user-reporter'],
  'developer': ['development', 'total-tasks', 'total-hours', 'ai-combined', 'markets', 'products', 'ai-models', 'user-performance', 'top-reporter', 'user-reporter'],
  'video-editor': ['video', 'total-tasks', 'total-hours', 'ai-combined', 'markets', 'products', 'ai-models', 'user-performance', 'top-reporter', 'user-reporter'],
  'admin': ['total-tasks', 'total-hours', 'ai-combined', 'development', 'design', 'video', 'user-performance', 'markets', 'products', 'ai-models', 'deliverables', 'top-reporter', 'user-reporter'],
  'user': ['total-tasks', 'total-hours', 'ai-combined', 'development', 'design', 'video', 'user-performance', 'markets', 'products', 'ai-models', 'top-reporter', 'user-reporter']
};

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
    id: "ai-combined",
    title: "AI Analytics",
    type: ANALYTICS_TYPES.AI_COMBINED,
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
    id: "top-reporter",
    title: "Reporters",
    type: ANALYTICS_TYPES.TOP_REPORTER,
    icon: UserIcon,
    trend: true,
    trendValue: "Reporter Stats",
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
  {
    id: "user-reporter",
    title: "All Reporters",
    type: ANALYTICS_TYPES.USER_REPORTER,
    icon: UserIcon,
    trend: true,
    trendValue: "All Reporters",
    trendDirection: "up",
  },
];

// Memoized card filtering hook to eliminate redundant calculations
const useFilteredCards = (user, userOccupation, canAccess) => {
  return useMemo(() => {
    // For admins, always show all cards regardless of which user they're viewing
    // For regular users, filter based on their occupation
    const isAdmin = canAccess('admin');
    const occupation = userOccupation || (isAdmin ? 'admin' : (user?.occupation || user?.role || 'user'));
    
    // Get allowed cards for this occupation
    const allowedCardIds = OCCUPATION_CARD_MAPPING[occupation] || OCCUPATION_CARD_MAPPING['user'];
    
    // Filter cards based on occupation
    return METRIC_CARDS_CONFIG.filter(card => allowedCardIds.includes(card.id));
  }, [user?.role, user?.occupation, userOccupation, canAccess]);
};

const OptimizedTaskMetricsBoard = ({
  userId = null,
  showSmallCards = true,
  className = "",
  userOccupation = null, // Allow passing specific occupation
}) => {
  const [showKeyMetrics, setShowKeyMetrics] = useState(true);
  
  // Use the centralized hook directly
  const {
    user,
    analytics,
    getMetric,
    hasData,
    error,
    isLoading,
    monthId,

  } = useFetchData(userId);
  
  // Get canAccess function from useAuth
  const { canAccess } = useAuth();
  
  // Use memoized card filtering with canAccess
  const filteredCardsConfig = useFilteredCards(user, userOccupation, canAccess);
  
  // Memoize getMetric function to prevent unnecessary re-renders
  const memoizedGetMetric = useCallback((type, category) => {
    return getMetric(type, category);
  }, [getMetric]);
  
  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const toggleTableButton = useCallback(() => {
    setShowKeyMetrics(!showKeyMetrics);
  }, [showKeyMetrics]);

  // Add error boundary for analytics
  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        Error loading analytics: {error?.message || 'Unknown error'}
      </div>
    );
  }

  // Memoize the cards to prevent unnecessary re-renders
  const metricCards = useMemo(() => {
    if (!showSmallCards || !showKeyMetrics || !monthId) {
      return null;
    }

    // Show loading state while data is being fetched
    if (isLoading) {
      return (
        <div className="col-span-full text-center py-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-400">Loading analytics...</span>
          </div>
        </div>
      );
    }

    // Show message when no analytics data is available
    if (!analytics || typeof analytics !== 'object') {
      return (
        <div className="col-span-full text-center py-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
            <div className="text-gray-400 mb-2">
              <svg className="w-8 h-8 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">No Analytics Data</h3>
            <p className="text-sm text-gray-400">
              {monthId ? `No board exists for ${monthId}. Create a board to start tracking tasks and view analytics.` : 'Select a month to view analytics.'}
            </p>
          </div>
        </div>
      );
    }

    return filteredCardsConfig.map((cardConfig) => {
      try {
        const metricData = memoizedGetMetric(cardConfig.type, cardConfig.category);
        
        return (
          <MemoizedOptimizedSmallCard
            key={cardConfig.id}
            title={cardConfig.title}
            type={cardConfig.type}
            category={cardConfig.category}
            icon={cardConfig.icon}
            userId={userId}
            trend={cardConfig.trend}
            trendValue={cardConfig.trendValue}
            trendDirection={cardConfig.trendDirection}
            value={metricData?.value || 0}
            additionalData={metricData?.additionalData || {}}
            reporters={[]}
          />
        );
      } catch (error) {
        console.error(`[DashboardMetrics] Error rendering card ${cardConfig.id}:`, error);
        return (
          <div key={cardConfig.id} className="text-center text-red-400 py-4">
            Error loading {cardConfig.title}
          </div>
        );
      }
    });
  }, [
    showSmallCards, 
    showKeyMetrics, 
    monthId, 
    userId, 
    error, 
    isLoading,
    memoizedGetMetric,
    filteredCardsConfig,
    analytics
  ]);

  if (!monthId) {
    return (
      <div className="card">
        No month selected for metrics
      </div>
    );
  }

  // Temporary debug section - remove this after fixing the issue
  const debugSection = process.env.NODE_ENV === 'development' && (
    <div className="mb-6 p-4 bg-gray-400 border  rounded-lg">
      <h3 className="text-lg font-semibold ">Debug Info</h3>
      <div className="text-sm text-gray-700 dark:!text-gray-300 space-y-1">
        <p>Users Role: {user?.role}</p>
        <p>User Occupation: {user?.occupation}</p>
        <p>Filtered Cards Count: {filteredCardsConfig.length}</p>
        <p>All Available Cards: {METRIC_CARDS_CONFIG.map(card => card.id).join(', ')}</p>
        <p>Analytics Available: {analytics ? 'Yes' : 'No'}</p>
        <p>Has Data: {hasData ? 'Yes' : 'No'}</p>
        <p>Month ID: {monthId}</p>
        <p>User ID: {userId}</p>
      </div>
    </div>
  );

  // ALWAYS show the metrics board - don't hide it when no data
  // The cards will show zero values if no data is available
  return (
    <div className={`space-y-6 ${className}`}>
      {debugSection}
      
      {/* Metrics Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Key Metrics
          </h2>
          <DynamicButton
            variant="secondary"
            size="sm"
            onClick={toggleTableButton}
            icon={showKeyMetrics ? ChevronUpIcon : ChevronDownIcon}
          >
            {showKeyMetrics ? "Hide" : "Show"} Metrics
          </DynamicButton>
        </div>

        {showKeyMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {metricCards}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(OptimizedTaskMetricsBoard);
