import React from 'react';
import { useGetMonthTasksQuery } from '../../redux/services/tasksApi';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import LoadingWrapper from '../ui/LoadingWrapper';

const TaskCharts = ({ monthId }) => {
  const { data: tasks = [], isLoading } = useGetMonthTasksQuery({ monthId });
  const sumBy = (items, key) => {
    const map = new Map();
    for (const t of items) {
      const k = t[key];
      if (!k) continue;
      const prev = map.get(k) || 0;
      map.set(k, prev + (Number(t.timeInHours) || 0));
    }
    const arr = Array.from(map.entries()).map(([label, hours]) => ({ label, hours }));
    arr.sort((a, b) => b.hours - a.hours);
    return arr.slice(0, 8);
  };
  const marketsArr = sumBy(tasks, 'market');
  const productsArr = sumBy(tasks, 'product');
  const marketData = marketsArr.map(a => ({ name: a.label, hours: Math.round(a.hours * 10) / 10 }));
  const productData = productsArr.map(a => ({ name: a.label, hours: Math.round(a.hours * 10) / 10 }));

  return (
    <LoadingWrapper loading={isLoading} skeleton="chart">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Hours by Market</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={marketData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="hours" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Hours by Product</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={productData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="hours" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </LoadingWrapper>0 }}>
          <ResponsiveContainer>
            <BarChart data={productData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="hours" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
export default TaskCharts;
