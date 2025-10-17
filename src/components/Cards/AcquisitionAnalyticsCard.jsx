import AnalyticsTable from "@/components/Table/AnalyticsTable";
import SimplePieChart from "@/components/Charts/SimplePieChart";
import BiaxialBarChart from "@/components/Charts/BiaxialBarChart";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";

const AcquisitionAnalyticsCard = ({
  title,
  acquisitionTableData,
  acquisitionTableColumns,
  casinoAcquisitionData,
  casinoAcquisitionTitle,
  casinoAcquisitionColors,
  sportAcquisitionData,
  sportAcquisitionTitle,
  sportAcquisitionColors,
  casinoBiaxialData,
  casinoBiaxialTitle,
  casinoBiaxialTasksColor,
  casinoBiaxialHoursColor,
  sportBiaxialData,
  sportBiaxialTitle,
  sportBiaxialTasksColor,
  sportBiaxialHoursColor,
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return <SkeletonAnalyticsCard className={className} />;
  }

  return (
    <div id="acquisition-analytics-card" className={`card-large ${className} `}>
      <h2 className="card-title text-xl mb-6">{title}</h2>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Acquisition Table */}
        <div className="table-container">
          <AnalyticsTable
            data={acquisitionTableData}
            columns={acquisitionTableColumns}
          />
        </div>
  
        {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Acquisition Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                🎰 <strong>Casino Acquisition:</strong> Task distribution across markets
              </span>
            </div>
            <SimplePieChart
              data={casinoAcquisitionData}
              title={casinoAcquisitionTitle}
              colors={casinoAcquisitionColors}
            />
          </div>

          {/* Sport Acquisition Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                ⚽ <strong>Sport Acquisition:</strong> Task distribution across markets
              </span>
            </div>
            <SimplePieChart
              data={sportAcquisitionData}
              title={sportAcquisitionTitle}
              colors={sportAcquisitionColors}
            />
          </div>
        </div>

        {/* Biaxial Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casino Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                🎰 <strong>Casino Acquisition:</strong> Tasks & Hours by Markets
              </span>
            </div>
            <BiaxialBarChart
              data={casinoBiaxialData}
              title={casinoBiaxialTitle}
              tasksColor={casinoBiaxialTasksColor}
              hoursColor={casinoBiaxialHoursColor}
            />
          </div>

          {/* Sport Biaxial Chart */}
          <div className="chart-container">
            <div className="mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                ⚽ <strong>Sport Acquisition:</strong> Tasks & Hours by Markets
              </span>
            </div>
            <BiaxialBarChart
              data={sportBiaxialData}
              title={sportBiaxialTitle}
              tasksColor={sportBiaxialTasksColor}
              hoursColor={sportBiaxialHoursColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcquisitionAnalyticsCard;
