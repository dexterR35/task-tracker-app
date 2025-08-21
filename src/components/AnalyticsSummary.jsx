import React, { useMemo, useState } from 'react';
import LoadingWrapper from './ui/LoadingWrapper';

const numberFmt = (n) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : 0);
const currencyFmt = (n) => new Intl.NumberFormat('en-US', { 
  style: 'currency', 
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(n || 0);

const AnalyticsSummary = ({ 
  tasks = [], 
  loading = false, 
  error = null,
  showMonthly = true,
  showUserStats = true,
  showAdminStats = false,
  currentMonth = null
}) => {
  // const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  
  const stats = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        totalTasks: 0,
        totalHours: 0,
        avgHours: 0,
        aiTasks: 0,
        aiHours: 0,
        aiPct: 0,
        reworked: 0,
        reworkedPct: 0,
        monthlyStats: [],
        userStats: [],
        efficiency: 0,
        costSavings: 0
      };
    }

    const totalTasks = tasks.length;
    let totalHours = 0;
    let aiTasks = 0;
    let aiHours = 0;
    let reworked = 0;
    let efficiency = 0;
    let costSavings = 0;

    // Monthly grouping
    const monthlyData = {};
    const userData = {};

    for (const task of tasks) {
      const hours = parseFloat(task.timeInHours) || 0;
      const aiHoursForTask = parseFloat(task.timeSpentOnAI) || 0;
      
      totalHours += hours;
      if (task.aiUsed) {
        aiTasks += 1;
        aiHours += aiHoursForTask;
      }
      if (task.reworked) reworked += 1;

      // Monthly grouping
      const monthId = task.monthId || 'unknown';
      if (!monthlyData[monthId]) {
        monthlyData[monthId] = {
          month: monthId,
          tasks: 0,
          hours: 0,
          aiTasks: 0,
          aiHours: 0,
          reworked: 0
        };
      }
      monthlyData[monthId].tasks += 1;
      monthlyData[monthId].hours += hours;
      if (task.aiUsed) {
        monthlyData[monthId].aiTasks += 1;
        monthlyData[monthId].aiHours += aiHoursForTask;
      }
      if (task.reworked) monthlyData[monthId].reworked += 1;

      // User grouping
      const userId = task.userUID || task.createdBy || 'unknown';
      if (!userData[userId]) {
        userData[userId] = {
          userId,
          name: task.createdByName || 'Unknown User',
          tasks: 0,
          hours: 0,
          aiTasks: 0,
          aiHours: 0,
          reworked: 0,
          avgHours: 0
        };
      }
      userData[userId].tasks += 1;
      userData[userId].hours += hours;
      if (task.aiUsed) {
        userData[userId].aiTasks += 1;
        userData[userId].aiHours += aiHoursForTask;
      }
      if (task.reworked) userData[userId].reworked += 1;
    }

    // Calculate averages and percentages
    const avgHours = totalTasks ? totalHours / totalTasks : 0;
    const aiPct = totalTasks ? (aiTasks / totalTasks) * 100 : 0;
    const reworkedPct = totalTasks ? (reworked / totalTasks) * 100 : 0;
    
    // Calculate efficiency (AI usage reduces time)
    if (aiTasks > 0) {
      const avgNonAITime = (totalHours - aiHours) / (totalTasks - aiTasks);
      const avgAITime = aiHours / aiTasks;
      efficiency = avgNonAITime > 0 ? ((avgNonAITime - avgAITime) / avgNonAITime) * 100 : 0;
    }

    // Calculate cost savings (assuming $50/hour rate)
    const hourlyRate = 50;
    costSavings = aiHours * hourlyRate * 0.3; // 30% time savings with AI

    // Calculate user averages
    Object.values(userData).forEach(user => {
      user.avgHours = user.tasks > 0 ? user.hours / user.tasks : 0;
    });

    // Convert to arrays and sort
    const monthlyStats = Object.values(monthlyData)
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12); // Last 12 months

    const userStats = Object.values(userData)
      .sort((a, b) => b.hours - a.hours);

    return {
      totalTasks,
      totalHours,
      avgHours,
      aiTasks,
      aiHours,
      aiPct,
      reworked,
      reworkedPct,
      monthlyStats,
      userStats,
      efficiency,
      costSavings
    };
  }, [tasks]);



  const getPeriodTasks = (period) => {
    if (period === 'all') return tasks;
    if (period === 'current') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return tasks.filter(task => task.monthId === currentMonth);
    }
    if (period === 'last3') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const cutoff = threeMonthsAgo.toISOString().slice(0, 7);
      return tasks.filter(task => task.monthId >= cutoff);
    }
    return tasks;
  };

  const periodTasks = getPeriodTasks(selectedPeriod);
  const periodStats = useMemo(() => {
    const tasks = periodTasks;
    const totalTasks = tasks.length;
    const totalHours = tasks.reduce((sum, t) => sum + (parseFloat(t.timeInHours) || 0), 0);
    const aiTasks = tasks.filter(t => t.aiUsed).length;
    const aiHours = tasks.reduce((sum, t) => sum + (parseFloat(t.timeSpentOnAI) || 0), 0);
    
    return {
      totalTasks,
      totalHours,
      avgHours: totalTasks ? totalHours / totalTasks : 0,
      aiTasks,
      aiHours,
      aiPct: totalTasks ? (aiTasks / totalTasks) * 100 : 0
    };
  }, [periodTasks]);

  // Handle case when selected period has no data
  const hasPeriodData = periodStats.totalTasks > 0;

  const renderMetricCard = (title, value, subtitle, icon, color = 'blue') => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <span className="card-title">{title}</span>
          <div className="mt-1 text-2xl font-bold text-gray-200">{value}</div>
          {subtitle && (
            <span className="text-gray-200">{subtitle}</span>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-white rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  const renderMonthlyChart = () => (
    <div className="card">
      <h3>Monthly Overview</h3>
      
        {Array.isArray(stats.monthlyStats) && stats.monthlyStats.length > 0 ? (
          stats.monthlyStats.slice(0, 6).map((month) => (
            <div key={month.month} className="flex items-center justify-between">
              <span className="text-sm text-gray-200">{month.month}</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-200">{month.tasks} tasks</span>
                <span className="text-sm text-blue-400">{numberFmt(month.hours)}h</span>
                {month.aiTasks > 0 && (
                  <span className="text-sm text-green-600">{month.aiTasks} AI</span>
                )}
              </div>
            </div>
          ))
        ) : (
          
            <p>No monthly data available</p>
          
        )}
    
    </div>
  );

  const renderUserStats = () => (
    <div className="card">
      <h3>User Performance</h3>
      
        {Array.isArray(stats.userStats) && stats.userStats.length > 0 ? (
          stats.userStats.slice(0, 5).map((user) => (
            <div key={user.userId} className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-200">{user.name}</span>
                <span className="text-xs text-gray-200 ml-2">{user.tasks} tasks</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-blue-300">{numberFmt(user.hours)}h</span>
                <span className="text-sm text-gray-200">{numberFmt(user.avgHours)}h/task</span>
              </div>
            </div>
          ))
        ) : (
         
            <p>No user data available</p>
       
        )}
    
    </div>
  );

  return (
    <LoadingWrapper loading={loading} error={error} skeleton="grid" skeletonProps={{ items: 6, columns: 3 }}>
      <div className="space-y-6">
        {/* <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-300">Analytics Summary</h2>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="current">Current Month</option>
            <option value="last3">Last 3 Months</option>
          </select>
        </div> */}

 
        {!loading && !hasPeriodData && (
          <div className="col-span-full p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-600 font-medium">
                No data available for {selectedPeriod === 'all' ? 'all time' : selectedPeriod === 'current' ? 'current month' : 'last 3 months'}
              </span>
            </div>
            <p className="text-gray-800 text-sm mt-1">
              Try selecting a different period or wait for more data to be added.
            </p>
          </div>
        )}

        {/* Main Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {renderMetricCard(
            "Total Tasks",
            periodStats.totalTasks,
            `${stats.totalTasks} total`,
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>,
            'blue'
          )}
          
          {renderMetricCard(
            "Total Hours",
            numberFmt(periodStats.totalHours),
            `${numberFmt(stats.totalHours)} total`,
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>,
            'green'
          )}
          
          {renderMetricCard(
            "Avg Hours/Task",
            numberFmt(periodStats.avgHours),
            `${numberFmt(stats.avgHours)} overall`,
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>,
            'purple'
          )}
          
          {renderMetricCard(
            "AI Tasks",
            periodStats.aiTasks,
            `${numberFmt(periodStats.aiPct)}% of total`,
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>,
            'indigo'
          )}
        </div>

        {/* Additional Metrics for Admin */}
        {showAdminStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {renderMetricCard(
              "Efficiency Gain",
              `${numberFmt(stats.efficiency)}%`,
              "Time saved with AI",
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>,
              'green'
            )}
            
            {renderMetricCard(
              "Cost Savings",
              currencyFmt(stats.costSavings),
              "Estimated savings",
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>,
              'green'
            )}
            
            {renderMetricCard(
              "Reworked Tasks",
              stats.reworked,
              `${numberFmt(stats.reworkedPct)}% of total`,
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>,
              'yellow'
            )}
          </div>
        )}

        {/* Charts and Detailed Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          {showMonthly && renderMonthlyChart()}
          {showUserStats && renderUserStats()}
        </div>
      </div>
    </LoadingWrapper>
  );
};

export default AnalyticsSummary;