import React from "react";
import SmallCard from "./cards/SmallCard";

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
} from "@heroicons/react/24/outline";

const TaskMetricsDashboardNew = ({
  monthId,
  userId = null,
  showSmallCards = true,
  className = "",
}) => {
  if (!monthId) {
    return (
      <div className="text-center text-gray-300 py-8">
        No month selected for metrics
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Small Cards Section */}
      {showSmallCards && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            Key Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <SmallCard
              title="Total Tasks"
              icon={ClipboardDocumentListIcon}
              monthId={monthId}
              userId={userId}
              trend={true}
              trendValue="This Month"
              trendDirection="up"
              loading={false}
            />

            <SmallCard
              title="Total Hours"
              icon={ClockIcon}
              monthId={monthId}
              userId={userId}
              trend={true}
              trendValue="Total Time"
              trendDirection="up"
            />

            <SmallCard
              title="Total Time with AI"
              icon={SparklesIcon}
              monthId={monthId}
              userId={userId}
              trend={true}
              trendValue="AI Assisted"
              trendDirection="up"
            />

            <SmallCard
              title="AI Tasks"
              icon={SparklesIcon}
              monthId={monthId}
              userId={userId}
              trend={true}
              trendValue="AI Usage"
              trendDirection="up"
            />

            <SmallCard
              title="Development"
              icon={CodeBracketIcon}
              monthId={monthId}
              userId={userId}
              trend={true}
              trendValue="Development"
              trendDirection="up"
            />

            <SmallCard
              title="Design"
              icon={PaintBrushIcon}
              monthId={monthId}
              userId={userId}
              trend={true}
              trendValue="Design Work"
              trendDirection="up"
            />

            <SmallCard
              title="Video"
              icon={VideoCameraIcon}
              monthId={monthId}
              userId={userId}
              trend={true}
              trendValue="Video Production"
              trendDirection="up"
            />

            <SmallCard
              title="User Performance"
              icon={UserGroupIcon}
              monthId={monthId}
              userId={userId}
              trend={true}
              trendValue="Team Stats"
              trendDirection="up"
            />

            <SmallCard
              title="Markets"
              icon={GlobeAltIcon}
              monthId={monthId}
              userId={userId}
              trend={true}
              trendValue="Active Markets"
              trendDirection="up"
            />

            <SmallCard
              title="Products"
              icon={CubeIcon}
              monthId={monthId}
              userId={userId}
              trend={true}
              trendValue="Active Products"
              trendDirection="up"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskMetricsDashboardNew;
