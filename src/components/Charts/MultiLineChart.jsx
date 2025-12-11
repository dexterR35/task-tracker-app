import React, { useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, addConsistentColors } from "@/components/Cards/analyticsCardConfig";

const MultiLineChart = React.memo(({ 
  data = [], 
  title = "Line Chart", 
  className = "",
  dataType = 'market', // Type of data for consistent color mapping
  lines = null, // Optional: array of line configs [{ dataKey, name, color, yAxisId }]. If null, uses default tasks/hours
  showHours = false // Whether to show hours axis (dual axis mode)
}) => {
  // Process data with consistent colors
  // If data already has colors, preserve them; otherwise apply consistent colors
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Check if data already has color property set (e.g., for market colors)
    const hasCustomColors = data.some(item => item.color);
    if (hasCustomColors) {
      // Preserve existing colors
      return data;
    }
    // Otherwise apply consistent colors based on dataType
    return addConsistentColors(data, dataType);
  }, [data, dataType]);

  // Transform data for Recharts - memoized to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    if (lines) {
      // If lines prop is provided, include all data keys from the original item
      return processedData.map((item, index) => {
        const baseItem = {
          name: item.name,
          color: item.color || CHART_COLORS.DEFAULT[index % CHART_COLORS.DEFAULT.length]
        };
        // Include all data keys from the original item
        Object.keys(item).forEach(key => {
          if (key !== 'name' && key !== 'color') {
            baseItem[key] = item[key] || 0;
          }
        });
        return baseItem;
      });
    }
    // Default: tasks and hours
    return processedData.map((item, index) => ({
      name: item.name,
      tasks: item.tasks || 0,
      hours: item.hours || 0,
      color: item.color || CHART_COLORS.DEFAULT[index % CHART_COLORS.DEFAULT.length]
    }));
  }, [processedData, lines]);

  // Memoized formatter functions
  const tooltipFormatter = useCallback((value, name, props) => {
    if (lines) {
      const lineConfig = lines.find(l => l.dataKey === name);
      if (lineConfig) {
        // Check if it's hours or tasks based on the name
        if (name.includes('Hours')) {
          return [`${value}h`, lineConfig.name];
        }
        // For month-to-month comparison, show "X tasks" format
        return [`${value} tasks`, lineConfig.name];
      }
    }
    if (name === 'tasks') {
      return [`${value} tasks`, 'Tasks'];
    } else if (name === 'hours') {
      return [`${value}h`, 'Hours'];
    }
    // Check if name contains "Hours" or "Tasks"
    if (name.includes('Hours')) {
      return [`${value}h`, name];
    }
    // For month names in month-to-month comparison, show as "X tasks"
    if (typeof value === 'number') {
      return [`${value} tasks`, name];
    }
    return [value, name];
  }, [lines]);

  if (!data || data.length === 0) {
    return (
      <div className={`${className}`}>
        {title && <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h4>}
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-3 capitalize'>{title}</h4>}
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#e5e7eb' }}
              angle={-25}
              textAnchor="end"
              height={70}
            />
            <YAxis 
              yAxisId="tasks"
              orientation="left"
              tick={{ fontSize: 13, fill: '#e5e7eb' }}
              label={{ value: 'Tasks', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#e5e7eb' } }}
            />
            {(showHours || (lines && lines.some(l => l.dataKey && l.dataKey.includes('Hours')))) && (
              <YAxis 
                yAxisId="hours"
                orientation="right"
                tick={{ fontSize: 13, fill: '#e5e7eb' }}
                label={{ value: 'Hours', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6b7280' } }}
              />
            )}
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
              formatter={tooltipFormatter}
              labelFormatter={(label) => {
                return label || '';
              }}
            />
            {lines && (
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
                content={({ payload }) => {
                  // Map payload entries to line configurations to get correct colors
                  const legendItems = payload?.map((entry) => {
                    const lineConfig = lines.find(l => l.dataKey === entry.dataKey || l.name === entry.value);
                    return {
                      ...entry,
                      color: lineConfig?.color || entry.color
                    };
                  }) || [];
                  
                  return (
                    <ul style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: '20px', 
                      padding: 0, 
                      margin: 0,
                      listStyle: 'none',
                      color: '#f9fafb'
                    }}>
                      {legendItems.map((entry, index) => (
                        <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f9fafb' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: '20px', 
                            height: '2px', 
                            backgroundColor: entry.color,
                          }}></span>
                          <span style={{ color: '#f9fafb' }}>{entry.value}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }}
              />
            )}
            
            {/* Dynamic Lines - If lines prop is provided, use it; otherwise use default tasks/hours */}
            {lines ? (
              lines.map((lineConfig, lineIndex) => {
                const lineColor = lineConfig.color || CHART_COLORS.DEFAULT[lineIndex % CHART_COLORS.DEFAULT.length];
                // Determine yAxisId based on dataKey
                const yAxisId = lineConfig.dataKey && lineConfig.dataKey.includes('Hours') ? 'hours' : 'tasks';
                return (
                  <Line 
                    key={`line-${lineConfig.dataKey}`}
                    yAxisId={yAxisId}
                    type="monotone"
                    dataKey={lineConfig.dataKey} 
                    name={lineConfig.name}
                    stroke={lineColor}
                    strokeWidth={2}
                    dot={{ r: 4, fill: lineColor }}
                    activeDot={{ r: 6 }}
                  />
                );
              })
            ) : (
              <>
                {/* Tasks Line */}
                <Line 
                  yAxisId="tasks"
                  type="monotone"
                  dataKey="tasks" 
                  name="Tasks"
                  stroke={CHART_COLORS.DEFAULT[0]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: CHART_COLORS.DEFAULT[0] }}
                  activeDot={{ r: 6 }}
                />
                
                {/* Hours Line - Only show if showHours is true */}
                {showHours && (
                  <Line 
                    yAxisId="hours"
                    type="monotone"
                    dataKey="hours" 
                    name="Hours"
                    stroke={CHART_COLORS.DEFAULT[1]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: CHART_COLORS.DEFAULT[1] }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

MultiLineChart.displayName = 'MultiLineChart';

export default MultiLineChart;
