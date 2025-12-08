import React, { useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { CHART_COLORS, addConsistentColors } from "@/components/Cards/analyticsCardConfig";
import { CARD_SYSTEM } from '@/constants';

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
  dataType = 'market', // Type of data for consistent color mapping
  showLegend = true // Show/hide legend
}) => {
  // Calculate percentages that sum to exactly 100% (with 1 decimal place)
  const calculatedPercentages = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    if (total === 0) {
      const result = {};
      data.forEach(item => {
        result[item.name || item.key] = 0;
      });
      return result;
    }

    // Calculate raw percentages with 1 decimal place
    const percentages = data.map(item => {
      const rawPercentage = ((item.value || 0) / total) * 100;
      // Round to 1 decimal place, then multiply by 10 to work with integers
      const rounded = Math.round(rawPercentage * 10) / 10;
      const floored = Math.floor(rounded * 10); // Floor in tenths (e.g., 33.3 -> 333)
      const remainder = (rawPercentage * 10) - floored;
      return {
        name: item.name || item.key,
        value: item.value || 0,
        floored,
        remainder,
        rawPercentage
      };
    });

    // Calculate sum of floored values (in tenths)
    const sumFloored = percentages.reduce((sum, p) => sum + p.floored, 0);
    const targetTotal = 1000; // 100.0% in tenths
    const difference = targetTotal - sumFloored;

    // Sort by remainder (descending) to allocate extra tenths to largest remainders
    const sorted = [...percentages].sort((a, b) => b.remainder - a.remainder);
    // Allocate the difference (which should be between 0 and number of items)
    const differenceToAllocate = Math.max(0, Math.min(Math.round(difference), percentages.length));
    
    // Allocate final percentages (in tenths)
    sorted.forEach((item, index) => {
      item.finalPercentage = index < differenceToAllocate ? item.floored + 1 : item.floored;
    });

    // Create result object (convert back from tenths to percentage)
    const result = {};
    percentages.forEach(p => {
      result[p.name] = p.finalPercentage / 10; // Convert from tenths back to percentage
    });

    return result;
  }, [data]);

  // Process data with consistent colors and sort to reduce label collisions
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sort data by value (descending) to group larger slices together
    // This helps space out labels better and reduces collisions
    const sortedData = [...data].sort((a, b) => (b.value || 0) - (a.value || 0));
    
    return addConsistentColors(sortedData, dataType);
  }, [data, dataType]);

  if (!processedData || processedData.length === 0) {
    return (
      <div className={`${className}`}>
        {title && <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h4>}
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

  // Helper function to capitalize text
  const capitalizeText = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const renderLabelLine = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (!showLeaderLines) return null;
    
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

    // Capitalize the name
    const capitalizedName = capitalizeText(name);

    // Use calculated percentage that sums to 100%, fallback to Recharts percent if not available
    const calculatedPercent = calculatedPercentages[name] !== undefined 
      ? calculatedPercentages[name] 
      : percent * 100;

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
          fontSize={11}
          fontWeight="medium"
          className="dark:fill-gray-200"
          style={{ pointerEvents: 'none' }}
        >
          {showPercentages ? (() => {
            // If percentage is very small but greater than 0, show "<1%" instead of "0.0%"
            if (calculatedPercent > 0 && calculatedPercent < 0.5) {
              return `${capitalizedName} (<1%)`;
            }
            // For whole numbers, show without decimal
            if (calculatedPercent === Math.floor(calculatedPercent)) {
              return `${capitalizedName} (${calculatedPercent}%)`;
            }
            // Otherwise show with 1 decimal place
            return `${capitalizedName} (${calculatedPercent.toFixed(1)}%)`;
          })() : capitalizedName}
        </text>
      </g>
    );
  };

  return (
    <div className={className}>
      {title && <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h4>}
      <div className="h-56 relative overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 30, right: 40, bottom: 30, left: 40 }}>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={showLeaderLines ? renderLabelLine : false}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {processedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || colors[index % colors.length]}
                  stroke="none"
                  strokeWidth={0}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [value, name]}
              labelStyle={{ color: '#374151', fontSize: '12px', fontWeight: 'bold' }}
              contentStyle={{ 
                // backgroundColor: '#1f2937', 
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'medium'
              }}
            />
            {showLegend && (
              <Legend 
                verticalAlign="middle" 
                align="right"
                layout="vertical"
                width={130}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', fontWeight: 'medium' }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

SimplePieChart.displayName = 'SimplePieChart';

export default SimplePieChart;
