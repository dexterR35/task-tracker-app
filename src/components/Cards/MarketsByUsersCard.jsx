import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";

const MarketsByUsersCard = ({
  title,
  analyticsByUserMarketsTableData,
  analyticsByUserMarketsTableColumns,
  marketsData,
  marketsTitle,
  marketsColors,
  className = "",
  isLoading = false,
  // User by task chart props
  userByTaskData,
  userByTaskTitle,
  userByTaskColors,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  return (
    <div id="markets-by-users-card" className={`card-large ${className} bg-gray-500`}>
      <h2 className="card-title text-xl mb-6">{title}</h2>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Markets by Users Table Div */}
          <div className="table-container">
            <AnalyticsTable
              data={analyticsByUserMarketsTableData}
              columns={analyticsByUserMarketsTableColumns}
              title="Markets by Users"
            />
          </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 ">
           {/* Markets Chart Div */}
           <div className="right-chart-container">
             <div className="mb-2">
               {/* <span className="text-xs text-gray-600 dark:text-gray-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                 📈 <strong>Data Source:</strong> Raw tasks → Market totals by user task counts | 
                 <strong> Formula:</strong> marketTotals[market] = sum of all user tasks per market
               </span> */}
             </div>
             <SimplePieChart
               data={marketsData}
               title={marketsTitle}
               colors={marketsColors}
             />
           </div>

           {/* User by Task Chart Div */}
           <div className="flex flex-col items-center">
             <div className="mb-2">
             {/* <span className="text-xs text-gray-600 dark:text-gray-400 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                 👥 <strong>Data Source:</strong> Table data → User totals | 
                 <strong> Formula:</strong> tableData.map(row =&gt; {`{name: row.user, value: row.total}`})
               </span> */}
             </div>
             <SimplePieChart
               data={userByTaskData}
               title={userByTaskTitle}
               colors={userByTaskColors}
               className="max-w-4xl w-full"
             />
           </div>
        </div>
      </div>
    </div>
  );
};

export default MarketsByUsersCard;
