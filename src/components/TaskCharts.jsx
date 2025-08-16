import React from 'react';
import { useSelector } from 'react-redux';
import { selectMarketChartData, selectProductChartData } from '../redux/slices/tasksSlice';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const baseOptions = { responsive:true, plugins:{ legend:{ display:false }}, scales:{ y:{ ticks:{ precision:0 }}}};

const TaskCharts = ({ monthId }) => {
  const marketData = useSelector(selectMarketChartData(monthId));
  const productData = useSelector(selectProductChartData(monthId));
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
