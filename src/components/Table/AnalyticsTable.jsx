import { SkeletonTable } from "@/components/ui/Skeleton/Skeleton";

const AnalyticsTable = ({ 
  data, 
  columns, 
  title, 
  className = "",
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className={`card-small ${className}`}>
        <h3 className="card-title text-base mb-4">{title}</h3>
        <SkeletonTable rows={4} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`card-small ${className}`}>
        <h3 className="card-title text-base mb-4">{title}</h3>
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm font-medium">No data available</div>
      </div>
    );
  }

  return (
    <div className={`card-small ${className}`}>
      <h3 className="card-title text-base mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200/60 dark:border-gray-600/60">
              {columns.map((column, index) => (
                <th 
                  key={index}
                  className={`py-3 px-2 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide ${
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100/60 dark:border-gray-700/60 last:border-b-0 hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors duration-200">
                {columns.map((column, colIndex) => (
                  <td 
                    key={colIndex}
                    className={`py-3 px-2 text-gray-900 dark:text-white ${
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left'
                    } ${column.bold ? 'font-bold' : 'font-semibold'} ${column.highlight ? 'text-blue-600 dark:text-blue-400' : ''}`}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsTable;
