import React from 'react';


const MarketsCard = ({ tasks = [] }) => {
  // Count tasks by market
  const marketCounts = tasks.reduce((acc, task) => {
    (task.markets || []).forEach(market => {
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
    symbol: market.substring(0, 2).toUpperCase(),
    name: market
  }));

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className='m-0'>Markets Overview</h3>
        <p className="text-sm text-gray-300">
          {tasks.length} total tasks across {markets.length} markets
        </p>
      </div>
      
      <div className="flex flex-wrap gap-4 justify-start">
        {markets.map((market, index) => (
          <div key={`market-${index}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <span className="font-bold text-lg">{market.symbol}</span>
            <span className="text-sm">{market.name}</span>
            <span className="bg-blue-500 text-xs px-2 py-1 rounded-full">
              {market.count} tasks
            </span>
          </div>
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
