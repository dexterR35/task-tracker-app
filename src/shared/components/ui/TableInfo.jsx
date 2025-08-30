import React from 'react';

const TableInfo = ({ tableType, data, columns }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Table Information</h3>
        <p className="text-gray-400">No data available for {tableType} table.</p>
      </div>
    );
  }

  const sampleRow = data[0];
  const columnInfo = columns.map(col => ({
    id: col.id,
    accessorKey: col.accessorKey,
    header: typeof col.header === 'string' ? col.header : col.accessorKey || col.id,
    value: sampleRow[col.accessorKey],
    type: typeof sampleRow[col.accessorKey]
  }));

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-white mb-2">Table Information: {tableType}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-md font-medium text-gray-300 mb-2">Data Summary</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>Total rows: {data.length}</li>
            <li>Total columns: {columns.length}</li>
            <li>Table type: {tableType}</li>
          </ul>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-300 mb-2">Columns</h4>
          <div className="text-sm text-gray-400 space-y-1 max-h-32 overflow-y-auto">
            {columnInfo.map((col, index) => (
              <div key={index} className="flex justify-between">
                <span>{col.header}</span>
                <span className="text-gray-500">({col.type})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableInfo;
