const MarketsCard = ({ tasks = [] }) => {
  // Count tasks by market
  const marketCounts = tasks.reduce((acc, task) => {
    (task.markets || []).forEach((market) => {
      if (market?.trim()) {
        acc[market] = (acc[market] || 0) + 1;
      }
    });
    return acc;
  }, {});

  // Convert to array for rendering
  const markets = Object.entries(marketCounts).map(([market, count]) => ({
    market,
    count,
    name: market,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-300 dark:border-gray-700">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white m-0">Markets Overview</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {tasks.length} total tasks across {markets.length} markets
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-start">
        {markets.map((market, index) => (
          <div
            key={`market-${index}`}
            className="bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md flex items-center space-x-2"
          >
            <span className="font-medium text-xs uppercase text-gray-900 dark:text-white">{market.name}</span>
            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
              {market.count}
            </span>
          </div>
        ))}
      </div>

      {markets.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No markets found</p>
        </div>
      )}
    </div>
  );
};

export default MarketsCard;
