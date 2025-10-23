import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { CHART_COLORS } from "@/components/Cards/analyticsCardConfig";
import { CARD_SYSTEM } from '@/constants';

const BiaxialBarChart = React.memo(({ 
  data = [], 
  title = "Biaxial Chart", 
  tasksColor = CHART_COLORS.DEFAULT[0], // Use first color from your palette
  hoursColor = CHART_COLORS.DEFAULT[1], // Use second color from your palette
  className = "" 
}) => {
  // Transform data for Recharts - memoized to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      name: item.name,
      tasks: item.tasks || 0,
      hours: item.hours || 0,
      color: item.color || CHART_COLORS.DEFAULT[index % CHART_COLORS.DEFAULT.length]
    }));
  }, [data]);

  // Memoized formatter functions
  const tooltipFormatter = useCallback((value, name, props) => {
    if (name === 'tasks') {
      return [`${value} tasks`, 'Tasks'];
    } else if (name === 'hours') {
      return [`${value}h`, 'Hours'];
    }
    return [value, name];
  }, []);

  const tasksLabelFormatter = useCallback((value) => {
    return `${value}`;
  }, []);

  const hoursLabelFormatter = useCallback((value) => {
    return `${value}h`;
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className={`h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#e5e7eb' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="tasks"
              orientation="left"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: 'Tasks', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
            />
            <YAxis 
              yAxisId="hours"
              orientation="right"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: 'Hours', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6b7280' } }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
              formatter={tooltipFormatter}
            />
            
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
                style={{ fontSize: 11, fill: '#ffffff', fontWeight: 'medium' }}
              />
            </Bar>
            
            {/* Hours Bar */}
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
                style={{ fontSize: 11, fill: '#ffffff', fontWeight: 'medium' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

BiaxialBarChart.displayName = 'BiaxialBarChart';

export default BiaxialBarChart;
