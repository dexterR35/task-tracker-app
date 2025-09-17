import React from "react";

const AnalyticsTable = ({ 
  data, 
  columns, 
  title, 
  className = "" 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">No data available</div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600">
              {columns.map((column, index) => (
                <th 
                  key={index}
                  className={`py-2 text-left font-medium text-gray-500 dark:text-gray-300 ${
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
              <tr key={rowIndex} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                {columns.map((column, colIndex) => (
                  <td 
                    key={colIndex}
                    className={`py-2 text-gray-900 dark:text-white ${
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left'
                    } ${column.bold ? 'font-semibold' : ''} ${column.highlight ? 'text-blue-600 dark:text-blue-400' : ''}`}
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
