import React, { useMemo } from 'react';

const numberFmt = (n) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : 0);

const AnalyticsSummary = ({ tasks = [] }) => {
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    let totalHours = 0;
    let aiTasks = 0;
    let aiHours = 0;
    let reworked = 0;

    for (const t of tasks) {
      const hours = parseFloat(t.timeInHours) || 0;
      totalHours += hours;

      if (t.aiUsed) {
        aiTasks += 1;
        aiHours += parseFloat(t.timeSpentOnAI) || 0;
      }
      if (t.reworked) reworked += 1;

    }

    const avgHours = totalTasks ? totalHours / totalTasks : 0;
    const aiPct = totalTasks ? (aiTasks / totalTasks) * 100 : 0;
    const reworkedPct = totalTasks ? (reworked / totalTasks) * 100 : 0;

    return {
      totalTasks,
      totalHours,
      avgHours,
      aiTasks,
      aiHours,
      aiPct,
      reworked,
      reworkedPct,
    };
  }, [tasks]);

  const cardBase = 'p-4 bg-white rounded-lg shadow-sm border flex flex-col';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className={cardBase}>
          <span className="text-xs text-gray-500">Total Tasks</span>
          <span className="mt-1 text-2xl font-semibold">{stats.totalTasks}</span>
        </div>
        <div className={cardBase}>
          <span className="text-xs text-gray-500">Total Hours</span>
          <span className="mt-1 text-2xl font-semibold">{numberFmt(stats.totalHours)}</span>
        </div>
        <div className={cardBase}>
          <span className="text-xs text-gray-500">Avg Hours/Task</span>
          <span className="mt-1 text-2xl font-semibold">{numberFmt(stats.avgHours)}</span>
        </div>
        <div className={cardBase}>
          <span className="text-xs text-gray-500">AI Tasks</span>
          <span className="mt-1 text-2xl font-semibold">{stats.aiTasks}</span>
          <span className="text-[10px] text-gray-400">{numberFmt(stats.aiPct)}%</span>
        </div>
        <div className={cardBase}>
          <span className="text-xs text-gray-500">AI Hours</span>
          <span className="mt-1 text-2xl font-semibold">{numberFmt(stats.aiHours)}</span>
        </div>
        <div className={cardBase}>
          <span className="text-xs text-gray-500">Reworked</span>
          <span className="mt-1 text-2xl font-semibold">{stats.reworked}</span>
          <span className="text-[10px] text-gray-400">{numberFmt(stats.reworkedPct)}%</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSummary;