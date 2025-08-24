import { format } from 'date-fns';

export const computeAnalyticsFromTasks = (tasks, monthId) => {
  const agg = {
    totalTasks: 0,
    totalHours: 0,
    ai: { tasks: 0, hours: 0 },
    reworked: 0,
    byUser: {},
    markets: {},
    products: {},
    aiModels: {},
    deliverables: {},
    aiBreakdownByProduct: {},
    aiBreakdownByMarket: {},
    daily: {},
  };

  for (const t of tasks) {
    agg.totalTasks += 1;
    agg.totalHours += Number(t.timeInHours) || 0;
    if (t.aiUsed) {
      agg.ai.tasks += 1;
      agg.ai.hours += Number(t.timeSpentOnAI) || 0;
    }
    if (t.reworked) agg.reworked += 1;
    if (t.userUID) {
      if (!agg.byUser[t.userUID]) agg.byUser[t.userUID] = { count: 0, hours: 0 };
      agg.byUser[t.userUID].count += 1;
      agg.byUser[t.userUID].hours += Number(t.timeInHours) || 0;
    }
    
    // Daily grouping
    const createdDay = (() => {
      const ms = t.createdAt || 0;
      if (!ms) return null;
      const d = new Date(ms);
      if (isNaN(d.getTime())) return null;
      return format(d, 'yyyy-MM-dd');
    })();
    if (createdDay) {
      if (!agg.daily[createdDay]) agg.daily[createdDay] = { count: 0, hours: 0 };
      agg.daily[createdDay].count += 1;
      agg.daily[createdDay].hours += Number(t.timeInHours) || 0;
    }
    
    const addCountHours = (map, key) => {
      if (!map[key]) map[key] = { count: 0, hours: 0 };
      map[key].count += 1;
      map[key].hours += Number(t.timeInHours) || 0;
    };
    
    if (Array.isArray(t.markets)) {
      t.markets.forEach((m) => addCountHours(agg.markets, m || 'N/A'));
    } else if (t.market) {
      addCountHours(agg.markets, t.market);
    }
    
    if (t.product) {
      if (!agg.products[t.product]) agg.products[t.product] = { count: 0, hours: 0 };
      agg.products[t.product].count += 1;
      agg.products[t.product].hours += Number(t.timeInHours) || 0;
    }
    
    // AI breakdown by product/market
    const ensureBreakdown = (map, key) => {
      if (!map[key]) map[key] = { aiTasks: 0, aiHours: 0, nonAiTasks: 0, nonAiHours: 0, totalTasks: 0, totalHours: 0 };
      return map[key];
    };
    const applyBreakdown = (entry, task) => {
      entry.totalTasks += 1;
      entry.totalHours += Number(task.timeInHours) || 0;
      if (task.aiUsed) {
        entry.aiTasks += 1;
        entry.aiHours += Number(task.timeSpentOnAI) || 0;
      } else {
        entry.nonAiTasks += 1;
        entry.nonAiHours += Number(task.timeInHours) || 0;
      }
    };
    
    if (t.product) {
      const e = ensureBreakdown(agg.aiBreakdownByProduct, t.product);
      applyBreakdown(e, t);
    }
    
    const marketsList = Array.isArray(t.markets) ? t.markets : (t.market ? [t.market] : []);
    marketsList.forEach((mk) => {
      const e = ensureBreakdown(agg.aiBreakdownByMarket, mk || 'N/A');
      applyBreakdown(e, t);
    });
    
    if (Array.isArray(t.aiModels)) {
      t.aiModels.forEach((m) => {
        const key = m || 'N/A';
        agg.aiModels[key] = (agg.aiModels[key] || 0) + 1;
      });
    } else if (t.aiModel) {
      const key = t.aiModel || 'N/A';
      agg.aiModels[key] = (agg.aiModels[key] || 0) + 1;
    }
    
    if (Array.isArray(t.deliverables)) {
      t.deliverables.forEach((d) => {
        const key = String(d || 'N/A');
        agg.deliverables[key] = (agg.deliverables[key] || 0) + 1;
      });
    } else if (t.deliverable) {
      const key = String(t.deliverable || 'N/A');
      agg.deliverables[key] = (agg.deliverables[key] || 0) + 1;
    }
  }

  return {
    monthId,
    generatedAt: new Date().toISOString(),
    ...agg,
  };
};
