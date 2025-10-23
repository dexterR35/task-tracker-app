import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { CHART_COLORS } from "@/components/Cards/analyticsCardConfig";
import { CARD_SYSTEM } from '@/constants';

const ProductColumnChart = React.memo(({ data = [], title = "Product Tasks", colors = CHART_COLORS.DEFAULT }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  // Transform data for Recharts with proper colors - memoized
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const baseColor = item.color || colors[index] || colors[0] || CARD_SYSTEM.COLOR_HEX_MAP.blue;
      return {
        name: item.name,
        tasks: item.tasks || item.value || 0,
        color: baseColor
      };
    });
  }, [data, colors]);

  // Memoized formatter functions
  const tooltipFormatter = useCallback((value, name, props) => {
    const total = chartData.reduce((sum, item) => sum + item.tasks, 0);
    const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
    return [`${value} tasks (${percentage}%)`, 'Tasks'];
  }, [chartData]);

  const labelFormatter = useCallback((value, entry) => {
    const total = chartData.reduce((sum, item) => sum + item.tasks, 0);
    const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
    return `${value} (${percentage}%)`;
  }, [chartData]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
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
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#f9fafb'
              }}
              formatter={tooltipFormatter}
            />
            
            <Bar 
              dataKey="tasks" 
              name="Tasks" 
              radius={[2, 2, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
              <LabelList 
                dataKey="tasks" 
                position="top" 
                formatter={labelFormatter}
                style={{ fontSize: 11, fill: '#ffffff', fontWeight: 'medium' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

ProductColumnChart.displayName = 'ProductColumnChart';

export default ProductColumnChart;
