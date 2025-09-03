import { logger } from './logger.js';

// CSV Export utility function
export const exportToCSV = (data, columns, tableType) => {
    try {
      // Get visible columns (excluding actions and selection columns)
      const visibleColumns = columns.filter(col => 
        col.id !== 'actions' && col.id !== 'select' && col.accessorKey
      );
  
      // Create headers
      const headers = visibleColumns.map(col => {
        // Handle different header types
        if (typeof col.header === 'string') return col.header;
        if (typeof col.header === 'function') return col.accessorKey || col.id;
        return col.accessorKey || col.id;
      }).join(',');
  
      // Create rows
      const rows = data.map(row => {
        return visibleColumns.map(col => {
          const value = row[col.accessorKey];
          // Handle different data types
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') {
            // Handle arrays, objects, etc.
            if (Array.isArray(value)) return value.join('; ');
            return JSON.stringify(value);
          }
          // Escape commas and quotes in string values
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
      });
  
      // Combine headers and rows
      const csvContent = [headers, ...rows].join('\n');
  
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${tableType}_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  
      return true;
    } catch (error) {
      logger.error('Error exporting CSV:', error);
      return false;
    }
  };

// Export other utility functions if you have them
export const exportToExcel = (data, columns, tableType) => {
  // Excel export implementation
  console.log('Excel export not implemented yet');
  return false;
};

export const exportToPDF = (data, columns, tableType) => {
  // PDF export implementation
  console.log('PDF export not implemented yet');
  return false;
};
  