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
    <div className="card">
      <div className="mb-4">
        <h3 className="m-0">Markets Overview</h3>
        <p className="text-sm text-gray-200">
          {tasks.length} total tasks across {markets.length} markets
        </p>
      </div>

      <div className="flex flex-wrap gap-4 justify-start">
        {markets.map((market, index) => (
          <p
            key={`market-${index}`}
            className="card m-0  px-3 py-2 rounded-lg flex items-center space-x-2"
          >
            <span className="font-bold uppercase">{market.name}</span>
            <span className="bg-blue-default text-xs px-2 py-1 rounded-md">
              {market.count} tasks
            </span>
          </p>
        ))}
      </div>

      {markets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-300">No markets found</p>
        </div>
      )}
    </div>
  );
};

export default MarketsCard;
