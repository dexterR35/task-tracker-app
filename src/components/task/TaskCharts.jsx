import React from 'react';
import { useGetMonthTasksQuery } from '../../redux/services/tasksApi';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const baseOptions = { responsive:true, plugins:{ legend:{ display:false }}, scales:{ y:{ ticks:{ precision:0 }}}};

const TaskCharts = ({ monthId }) => {
  const { data: tasks = [] } = useGetMonthTasksQuery({ monthId });
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
  const marketData = { labels: marketsArr.map(a => a.label), hours: marketsArr.map(a => Math.round(a.hours * 10) / 10) };
  const productData = { labels: productsArr.map(a => a.label), hours: productsArr.map(a => Math.round(a.hours * 10) / 10) };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Hours by Market</h3>
        <Bar data={{ labels: marketData.labels, datasets:[{ data: marketData.hours, backgroundColor:'#6366f1'}] }} options={baseOptions} />
      </div>
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Hours by Product</h3>
        <Bar data={{ labels: productData.labels, datasets:[{ data: productData.hours, backgroundColor:'#10b981'}] }} options={baseOptions} />
      </div>

    </div>
  );
};
export default TaskCharts;
