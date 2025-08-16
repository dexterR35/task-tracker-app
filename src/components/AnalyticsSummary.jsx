import React from 'react';

const AnalyticsSummary = ({ tasks }) => {
  const numberFmt = (n) => (Number.isFinite(n) ? (Math.round(n * 10) / 10) : 0);
  const totalTasks = tasks.length;
  const totalHours = tasks.reduce((s, t) => s + (parseFloat(t.timeInHours) || 0), 0);
  const aiTasks = tasks.filter(t => t.aiUsed).length;
  const aiHours = tasks.filter(t => t.aiUsed).reduce((s, t) => s + (parseFloat(t.timeSpentOnAI) || 0), 0);
  const reworked = tasks.filter(t => t.reworked).length;
  const avgHours = totalTasks ? totalHours / totalTasks : 0;

  const makeCounts = (field) => {
    const map = new Map();
    tasks.forEach(t => { const key = t[field] || 'unknown'; map.set(key, (map.get(key) || 0) + 1); });
    return Array.from(map.entries()).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count);
  };
  const markets = makeCounts('market').slice(0, 5);
  const products = makeCounts('product').slice(0, 5);

  const cardBase = 'p-4 bg-white rounded-lg shadow-sm border flex flex-col';

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      <div className={cardBase}><span className="text-xs text-gray-500">Total Tasks</span><span className="mt-1 text-2xl font-semibold">{totalTasks}</span></div>
      <div className={cardBase}><span className="text-xs text-gray-500">Total Hours</span><span className="mt-1 text-2xl font-semibold">{numberFmt(totalHours)}</span></div>
      <div className={cardBase}><span className="text-xs text-gray-500">AI Tasks</span><span className="mt-1 text-2xl font-semibold">{aiTasks}</span><span className="text-[10px] text-gray-400">{totalTasks ? numberFmt(aiTasks / totalTasks * 100) : 0}%</span></div>
      <div className={cardBase}><span className="text-xs text-gray-500">AI Hours</span><span className="mt-1 text-2xl font-semibold">{numberFmt(aiHours)}</span></div>
      <div className={cardBase}><span className="text-xs text-gray-500">Reworked</span><span className="mt-1 text-2xl font-semibold">{reworked}</span></div>
      <div className={cardBase}><span className="text-xs text-gray-500">Avg Hours/Task</span><span className="mt-1 text-2xl font-semibold">{numberFmt(avgHours)}</span></div>
      <div className="md:col-span-3 lg:col-span-3 p-4 bg-white rounded-lg shadow-sm border">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Top Markets</h3>
        {markets.length ? <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">{markets.map(m => <li key={m.key} className="flex justify-between"><span className="truncate pr-2">{m.key}</span><span className="font-medium">{m.count}</span></li>)}</ul> : <p className="text-xs text-gray-400">None</p>}
      </div>
      <div className="md:col-span-3 lg:col-span-3 p-4 bg-white rounded-lg shadow-sm border">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Top Products</h3>
        {products.length ? <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">{products.map(p => <li key={p.key} className="flex justify-between"><span className="truncate pr-2">{p.key}</span><span className="font-medium">{p.count}</span></li>)}</ul> : <p className="text-xs text-gray-400">None</p>}
      </div>
    </div>
  );
};

export default AnalyticsSummary;
