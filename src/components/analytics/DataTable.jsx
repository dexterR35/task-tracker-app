import React from "react";

const DataTable = ({ 
  data = {}, 
  title = "Data Table",
  columns = [],
  showSummary = false,
  summaryData = {},
  className = ""
}) => {
  // If no data provided, show error
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
        <div className="text-center text-red-400 py-8">
          <div className="text-lg font-semibold mb-2">⚠️ No Data Available</div>
          <div className="text-gray-300">No data is provided for this table.</div>
        </div>
      </div>
    );
  }

  // Get column headers from data structure or use provided columns
  const getHeaders = () => {
    if (columns.length > 0) {
      return columns;
    }
    
    // Auto-detect headers from first data row
    const firstKey = Object.keys(data)[0];
    if (firstKey && data[firstKey]) {
      const firstRow = data[firstKey];
      const headers = Object.keys(firstRow).filter(key => key !== 'total');
      return ['Category', ...headers, 'Total'];
    }
    
    return ['Category', 'Total'];
  };

  const headers = getHeaders();

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full bg-gray-700 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-600">
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  className={`px-4 py-3 text-white font-semibold ${
                    index === 0 ? 'text-left' : 'text-center'
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(data).map(([category, rowData]) => (
              <tr key={category} className="border-t border-gray-600 hover:bg-gray-600/50">
                <td className="px-4 py-3 text-white font-medium">{category}</td>
                {headers.slice(1, -1).map((header, index) => (
                  <td key={index} className="px-4 py-3 text-center text-white">
                    {rowData[header] || 0}
                  </td>
                ))}
                <td className="px-4 py-3 text-center text-white font-semibold bg-gray-600/30">
                  {rowData.total || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary Stats */}
      {showSummary && summaryData && Object.keys(summaryData).length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {Object.entries(summaryData).map(([key, value]) => (
            <div key={key} className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">
                {value}
              </div>
              <div className="text-sm text-gray-300 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataTable;
