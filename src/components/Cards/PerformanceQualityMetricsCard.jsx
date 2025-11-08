/**
 * Performance Quality Metrics Card Component
 * 
 * @fileoverview Reusable card component for displaying performance and quality metrics
 * @author Senior Developer
 * @version 1.0.0
 */

import React from 'react';
import SmallCard from '@/components/Card/smallCards/SmallCard';
import { Icons } from '@/components/icons';

/**
 * Performance Quality Metrics Card
 * Displays productivity score, task completion, quality rating, and on-time delivery metrics
 * 
 * @param {Object} props - Component props
 * @param {Object} props.efficiency - Efficiency data object
 * @param {number} props.efficiency.productivityScore - Productivity score percentage (default: 87)
 * @param {number} props.efficiency.averageTaskCompletion - Average task completion in days (default: 2.3)
 * @param {number} props.efficiency.qualityRating - Quality rating out of 5 (default: 4.2)
 * @param {number} props.efficiency.onTimeDelivery - On-time delivery percentage (default: 94)
 * @returns {JSX.Element} Performance Quality Metrics Card
 */
const PerformanceQualityMetricsCard = ({ 
  efficiency = {
    productivityScore: 87,
    averageTaskCompletion: 2.3,
    qualityRating: 4.2,
    onTimeDelivery: 94,
  }
}) => {
  const card = {
    id: 'performance-quality-metrics',
    title: 'Performance',
    subtitle: 'Quality Metrics',
    description: 'Performance',
    icon: Icons.generic.chart,
    color: 'crimson',
    value: `${efficiency.productivityScore || 87}%`,
    badge: {
      text: `${efficiency.productivityScore || 87}%`,
      color: 'crimson'
    },
    details: [
      {
        icon: Icons.generic.target,
        label: 'Productivity Score',
        value: `${efficiency.productivityScore || 87}%`,
      },
      {
        icon: Icons.generic.clock,
        label: 'Avg Task Completion',
        value: `${efficiency.averageTaskCompletion || 2.3} days`,
      },
      {
        icon: Icons.generic.star,
        label: 'Quality Rating',
        value: `${efficiency.qualityRating || 4.2}/5`,
      },
      {
        icon: Icons.generic.check,
        label: 'On-Time Delivery',
        value: `${efficiency.onTimeDelivery || 94}%`,
      },
    ],
  };

  return <SmallCard card={card} />;
};

export default PerformanceQualityMetricsCard;

