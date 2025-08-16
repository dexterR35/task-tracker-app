import React from 'react';
import { useSelector } from 'react-redux';
import { selectMonthTotalTasks, selectMonthTotalHours, selectMonthMarketSummary, selectMonthProductSummary } from '../../redux/slices/tasksSlice';

const StatBox = ({ label, value }) => (
  <div className="p-4 bg-white rounded-lg shadow-sm border">
    <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
  </div>
);

const ListBox = ({ title, items, itemKey='name', countKey='count' }) => (
  <div className="p-4 bg-white rounded-lg shadow-sm border">
    <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
    {items.length === 0 ? <p className="text-xs text-gray-400">None</p> : (
      <ul className="space-y-1 max-h-40 overflow-y-auto text-sm">
        {items.map(it => (
          <li key={it[itemKey]} className="flex justify-between">
            <span className="truncate pr-2 text-gray-700">{it[itemKey]}</span>
            <span className="font-medium text-gray-900">{it[countKey]}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const TaskStatsPanel = ({ monthId }) => {
  const totalTasks = useSelector(selectMonthTotalTasks(monthId));
  const totalHours = useSelector(selectMonthTotalHours(monthId));
  const marketSummary = useSelector(selectMonthMarketSummary(monthId));
  const productSummary = useSelector(selectMonthProductSummary(monthId));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatBox label="Total Tasks" value={totalTasks} />
      <StatBox label="Total Hours" value={Math.round(totalHours * 10)/10} />
      <ListBox title="Markets" items={marketSummary.map(m => ({ name: m.market, count: m.count }))} />
      <ListBox title="Products" items={productSummary.map(p => ({ name: p.product, count: p.count }))} />
    </div>
  );
};

export default TaskStatsPanel;
