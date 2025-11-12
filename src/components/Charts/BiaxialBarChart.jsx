import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { CHART_COLORS, addConsistentColors } from "@/components/Cards/analyticsCardConfig";

const BiaxialBarChart = React.memo(({ 
  data = [], 
  title = "Biaxial Chart", 
  // tasksColor = CHART_COLORS.DEFAULT[0], // Use first color from your palette
  // hoursColor = CHART_COLORS.DEFAULT[1], // Use second color from your palette
  className = "",
  dataType = 'market', // Type of data for consistent color mapping
  showHours = false, // Whether to show hours bars (true for user analytics, false for main charts)
  bars = null // Optional: array of bar configs [{ dataKey, name, color }]. If null, uses default tasks/hours
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
    if (bars) {
      // If bars prop is provided, include all data keys from the original item
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
  }, [processedData, bars]);

  // Memoized formatter functions
  const tooltipFormatter = useCallback((value, name, props) => {
    if (bars) {
      const barConfig = bars.find(b => b.dataKey === name);
      if (barConfig) {
        return [`${value} ${barConfig.name.toLowerCase()}`, barConfig.name];
      }
    }
    if (name === 'tasks') {
      return [`${value} tasks`, 'Tasks'];
    } else if (name === 'hours') {
      return [`${value}h`, 'Hours'];
    }
    return [value, name];
  }, [bars]);

  const tasksLabelFormatter = useCallback((value) => {
    return `${value}`;
  }, []);

  const hoursLabelFormatter = useCallback((value) => {
    return `${value}h`;
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className={`card ${className}`}>
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className={`card rounded-lg p-4 ${className}`}>
      {title && <h4 className='capitalize mb-2'>{title}</h4>}
      
      <div className="h-100">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top:50,
              right: 10,
              left: 10,
              bottom: 5,
            }}
            barCategoryGap={0}
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
            {showHours && (
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
            />
            {bars && (
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
                content={({ payload }) => (
                  <ul style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '20px', 
                    padding: 0, 
                    margin: 0,
                    listStyle: 'none',
                    color: '#f9fafb'
                  }}>
                    {payload?.map((entry, index) => (
                      <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f9fafb' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: '14px', 
                          height: '14px', 
                          backgroundColor: entry.color,
                          borderRadius: '2px'
                        }}></span>
                        <span style={{ color: '#f9fafb' }}>{entry.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              />
            )}
            
            {/* Dynamic Bars - If bars prop is provided, use it; otherwise use default tasks/hours */}
            {bars ? (
              bars.map((barConfig, barIndex) => {
                const barColor = barConfig.color || CHART_COLORS.DEFAULT[barIndex % CHART_COLORS.DEFAULT.length];
                return (
                  <Bar 
                    key={`bar-${barConfig.dataKey}`}
                    yAxisId="tasks"
                    dataKey={barConfig.dataKey} 
                    name={barConfig.name} 
                    radius={[2, 2, 0, 0]}
                  >
                    {chartData.map((entry, index) => {
                      // Use market color from data if available (for per-market charts),
                      // For PRODUCT dataType (total charts), always use bar color
                      // For MARKET dataType, use entry color if available (for market-specific colors)
                      const cellColor = dataType === 'product' 
                        ? barColor 
                        : (entry.color || barColor);
                      return (
                        <Cell key={`${barConfig.dataKey}-cell-${index}`} fill={cellColor} />
                      );
                    })}
                    <LabelList 
                      dataKey={barConfig.dataKey} 
                      position="top" 
                      formatter={tasksLabelFormatter}
                      style={{ fontSize: 13, fill: '#f9fafb', fontWeight: 'medium' }}
                    />
                  </Bar>
                );
              })
            ) : (
              <>
                {/* Tasks Bar */}
                <Bar 
                  yAxisId="tasks"
                  dataKey="tasks" 
                  name="Tasks" 
                  radius={[2, 2, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`tasks-cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList 
                    dataKey="tasks" 
                    position="top" 
                    formatter={tasksLabelFormatter}
                    style={{ fontSize: 13, fill: '#f9fafb', fontWeight: 'medium' }}
                  />
                </Bar>
                
                {/* Hours Bar - Only show if showHours is true */}
                {showHours && (
                  <Bar 
                    yAxisId="hours"
                    dataKey="hours" 
                    name="Hours" 
                    radius={[2, 2, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`hours-cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList 
                      dataKey="hours" 
                      position="top" 
                      formatter={hoursLabelFormatter}
                      style={{ fontSize: 13, fill: '#f9fafb', fontWeight: 'medium' }}
                    />
                  </Bar>
                )}
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

BiaxialBarChart.displayName = 'BiaxialBarChart';

export default BiaxialBarChart;
