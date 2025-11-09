

import React from 'react';
import SmallCard from '@/components/Card/smallCards/SmallCard';
import { Icons } from '@/components/icons';


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

