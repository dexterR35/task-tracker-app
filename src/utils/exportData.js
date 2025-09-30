import { logger } from '@/utils/logger.js';

/**
 * Unified CSV Export utility function
 * Handles both table data and analytics data exports
 */
export const exportToCSV = (data, columns, tableType, options = {}) => {
    try {
      const { 
        filename = null, 
        includeHeaders = true, 
        customHeaders = null,
        analyticsMode = false 
      } = options;

      // Handle analytics data (array of objects without columns)
      if (analyticsMode || !columns) {
        return exportAnalyticsToCSV(data, tableType, { filename, includeHeaders });
      }

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
      
      // Use custom filename or generate default
      const exportFilename = filename || `${tableType}_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', exportFilename);
      
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

/**
 * Export analytics data to CSV
 * @param {Array|Object} data - Analytics data to export
 * @param {string} tableType - Type of data being exported
 * @param {Object} options - Export options
 * @returns {boolean} Success status
 */
export const exportAnalyticsToCSV = (data, tableType, options = {}) => {
  try {
    const { filename = null, includeHeaders = true } = options;
    
    let csvContent = '';
    
    // Handle different data structures
    if (Array.isArray(data)) {
      // Array of objects - create CSV from array
      if (data.length === 0) {
        csvContent = 'No data available';
      } else {
        const headers = Object.keys(data[0]);
        const rows = data.map(item => 
          headers.map(header => {
            const value = item[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') {
              return JSON.stringify(value);
            }
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        );
        
        if (includeHeaders) {
          csvContent = [headers.join(','), ...rows].join('\n');
        } else {
          csvContent = rows.join('\n');
        }
      }
    } else if (typeof data === 'object') {
      // Object data - create key-value pairs
      const entries = Object.entries(data);
      const rows = entries.map(([key, value]) => {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        const escapedValue = stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') 
          ? `"${stringValue.replace(/"/g, '""')}"` 
          : stringValue;
        return `${key},${escapedValue}`;
      });
      
      if (includeHeaders) {
        csvContent = ['Key,Value', ...rows].join('\n');
      } else {
        csvContent = rows.join('\n');
      }
    } else {
      csvContent = 'Invalid data format';
    }
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const exportFilename = filename || `${tableType}_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', exportFilename);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    logger.error('Error exporting analytics CSV:', error);
    return false;
  }
};
