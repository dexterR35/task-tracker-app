import React, { useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { CHART_COLORS } from "@/components/Cards/analyticsCardConfig";
import { CARD_SYSTEM } from '@/constants';
import { addConsistentColors, getColorsForData } from '@/utils/chartColorMapping';

const SimplePieChart = React.memo(({ 
  data, 
  title, 
  colors = CHART_COLORS.DEFAULT,
  className = "",
  showLeaderLines = true,
  leaderLineLength = 25,
  leaderLineStyle = "solid", // "solid", "dashed", "dotted"
  showPercentages = true,
  minPercentageThreshold = 5,
  dataType = 'market' // Type of data for consistent color mapping
}) => {
  // Process data with consistent colors
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return addConsistentColors(data, dataType);
  }, [data, dataType]);

  if (!processedData || processedData.length === 0) {
    return (
      <div className={`card ${className}`}>
        <h4>{title}</h4>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  // const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  //   if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
  //   const RADIAN = Math.PI / 180;
  //   const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  //   const x = cx + radius * Math.cos(-midAngle * RADIAN);
  //   const y = cy + radius * Math.sin(-midAngle * RADIAN);

  //   return (
  //     <text 
  //       x={x} 
  //       y={y} 
  //       fill="white" 
  //       textAnchor={x > cx ? 'start' : 'end'} 
  //       dominantBaseline="central"
  //       fontSize={10}
  //       fontWeight="bold"
  //     >
  //       {`${(percent * 100).toFixed(0)}%`}
  //     </text>
  //   );
  // };

  const renderLabelLine = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (!showLeaderLines || percent < (minPercentageThreshold / 100)) return null;
    
    const RADIAN = Math.PI / 180;
    
    // Calculate outer point for the line
    const outerX = cx + outerRadius * Math.cos(-midAngle * RADIAN);
    const outerY = cy + outerRadius * Math.sin(-midAngle * RADIAN);
    
    // Calculate label position (extended beyond the pie)
    const labelRadius = outerRadius + leaderLineLength;
    const labelX = cx + labelRadius * Math.cos(-midAngle * RADIAN);
    const labelY = cy + labelRadius * Math.sin(-midAngle * RADIAN);

    // Determine stroke dash array based on style
    const getStrokeDashArray = () => {
      switch (leaderLineStyle) {
        case "dashed": return "5,5";
        case "dotted": return "2,3";
        default: return "none";
      }
    };

    return (
      <g style={{ pointerEvents: 'none' }}>
        {/* Leader line from pie edge to label */}
        <line
          x1={outerX}
          y1={outerY}
          x2={labelX}
          y2={labelY}
          stroke="#374151"
          strokeWidth={1}
          strokeDasharray={getStrokeDashArray()}
          className="dark:stroke-gray-200"
        />
        {/* Label at the end of the line with name and percentage */}
        <text
          x={labelX}
          y={labelY}
          fill="#374151"
          textAnchor={labelX > cx ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={12}
          fontWeight="bold"
          className="dark:fill-gray-200"
          style={{ pointerEvents: 'none' }}
        >
          {showPercentages ? `${name} (${(percent * 100).toFixed(0)}%)` : name}
        </text>
      </g>
    );
  };

  return (
    <div className={`card ${className}`}>
      <h4>{title}</h4>
      <div className="h-56 relative overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={showLeaderLines ? renderLabelLine : false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [value, name]}
              labelStyle={{ color: '#374151', fontSize: '14px', fontWeight: 'bold' }}
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'medium'
              }}
            />
            <Legend 
              verticalAlign="middle" 
              align="right"
              layout="vertical"
              width={120}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', fontWeight: 'medium' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

SimplePieChart.displayName = 'SimplePieChart';

export default SimplePieChart;
