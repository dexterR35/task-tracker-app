import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
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
  // Biaxial bar chart props
  biaxialBarData,
  biaxialBarTitle,
  biaxialTasksColor,
  biaxialHoursColor,
  // Users biaxial bar chart props
  usersBiaxialData,
  usersBiaxialTitle,
  usersBiaxialTasksColor,
  usersBiaxialHoursColor,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  return (
    <div id="markets-by-users-card" className={`card-large ${className}`}>
      <h2 className="card-title text-xl mb-6">{title}</h2>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Markets by Users Table Div */}
          <div className="table-container">
            <AnalyticsTable
              data={analyticsByUserMarketsTableData}
              columns={analyticsByUserMarketsTableColumns}
            />
          </div>
        {/* Charts Container - 2 charts in a row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Markets Distribution Pie Chart */}
           <div className="chart-container">
             <div className="mb-2">
               <span className="text-xs text-gray-600 dark:text-gray-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                 📈 <strong>Markets Distribution:</strong> Task distribution across markets
               </span>
             </div>
             <SimplePieChart
               data={marketsData}
               title={marketsTitle}
               colors={marketsColors}
             />
           </div>

           {/* User by Task Chart */}
           <div className="chart-container">
             <div className="mb-2">
               <span className="text-xs text-gray-600 dark:text-gray-400 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                 👥 <strong>Users by Tasks:</strong> Task distribution by users
               </span>
             </div>
             <SimplePieChart
               data={userByTaskData}
               title={userByTaskTitle}
               colors={userByTaskColors}
             />
           </div>
        </div>

        {/* Biaxial Charts Container - 2 charts in a row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Markets Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                📊 <strong>Markets:</strong> Tasks & Hours by Market
              </span>
            </div>
            <BiaxialBarChart
              data={biaxialBarData}
              title={biaxialBarTitle}
              tasksColor={biaxialTasksColor}
              hoursColor={biaxialHoursColor}
            />
          </div>

          {/* Users Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
                👥 <strong>Users:</strong> Tasks & Hours by User
              </span>
            </div>
            <BiaxialBarChart
              data={usersBiaxialData}
              title={usersBiaxialTitle}
              tasksColor={usersBiaxialTasksColor}
              hoursColor={usersBiaxialHoursColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketsByUsersCard;
