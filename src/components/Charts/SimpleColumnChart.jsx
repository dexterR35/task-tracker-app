import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SimpleColumnChart = ({ data = [], title = "Chart", colors = [], multiBar = false }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.map((item, index) => {
    const baseColor = colors[index] || colors[0] || '#3b82f6';
    return {
      name: item.name,
      tasks: item.tasks || item.value || 0,
      COM: item.COM || 0,
      DE: item.DE || 0,
      FI: item.FI || 0,
      FR: item.FR || 0,
      IE: item.IE || 0,
      IT: item.IT || 0,
      RO: item.RO || 0,
      UK: item.UK || 0,
      color: baseColor
    };
  });

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
              tick={{ fontSize: 12, fill: '#6b7280' }}
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
            />
            <Legend />
            
            {multiBar ? (
              <>
                <Bar 
                  dataKey="COM" 
                  name="COM" 
                  fill="#3b82f6"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="DE" 
                  name="DE" 
                  fill="#10b981"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="FI" 
                  name="FI" 
                  fill="#f59e0b"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="FR" 
                  name="FR" 
                  fill="#ef4444"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="IE" 
                  name="IE" 
                  fill="#8b5cf6"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="IT" 
                  name="IT" 
                  fill="#06b6d4"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="RO" 
                  name="RO" 
                  fill="#84cc16"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="UK" 
                  name="UK" 
                  fill="#f97316"
                  radius={[2, 2, 0, 0]}
                />
              </>
            ) : (
              <Bar 
                dataKey="tasks" 
                name="Tasks" 
                fill="#3b82f6"
                radius={[2, 2, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SimpleColumnChart;
