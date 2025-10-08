import { logger } from '@/utils/logger.js';
import { formatDate, normalizeTimestamp } from '@/utils/dateUtils.js';

/**
 * Format value for CSV export with proper date formatting and empty field handling
 */
const formatValueForCSV = (value, columnId, reporters = []) => {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return '-';
  }
  
  // Handle Done column - calculate difference between start and end date
  if (columnId === 'done') {
    // If it's already a calculated number, return it
    if (typeof value === 'number') {
      return value === 0 ? 'Same day' : `${value} days`;
    }
    
    // If it's an object with startDate and endDate, calculate the difference
    if (value && typeof value === 'object') {
      const startDate = value.startDate;
      const endDate = value.endDate;
      
      if (startDate && endDate) {
        const normalizedStart = normalizeTimestamp(startDate);
        const normalizedEnd = normalizeTimestamp(endDate);
        
        if (normalizedStart && normalizedEnd) {
          const diffTime = normalizedEnd.getTime() - normalizedStart.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays === 0 ? 'Same day' : `${diffDays} days`;
        }
      }
    }
    
    return '-';
  }
  
  // Handle date columns (excluding done)
  const dateColumns = ['startDate', 'endDate', 'dateCreated', 'createdByName'];
  if (dateColumns.includes(columnId)) {
    const normalizedDate = normalizeTimestamp(value);
    if (normalizedDate) {
      const formattedDate = formatDate(normalizedDate, 'dd MMM yyyy, HH:mm', true); // Romanian locale
      return formattedDate !== 'N/A' ? formattedDate : '-';
    }
    return '-';
  }
  
  // Handle date created with Romanian format
  if (columnId === 'createdAt') {
    const normalizedDate = normalizeTimestamp(value);
    if (normalizedDate) {
      const formattedDate = formatDate(normalizedDate, 'dd MMM yyyy, HH:mm', true); // Romanian locale
      return formattedDate !== 'N/A' ? formattedDate : '-';
    }
    return '-';
  }
  
  // Handle boolean columns (VIP, ReWorked)
  if (columnId === 'isVip' || columnId === 'reworked') {
    return value ? 'Yes' : 'No';
  }
  
  // Handle AI Models array - join as single row
  if (columnId === 'aiModels' && Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '-';
  }
  
  // Handle Markets array - join as single row  
  if (columnId === 'markets' && Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '-';
  }
  
  // Handle deliverables object - format with count and name (e.g., 2xgamepreview)
  if (columnId === 'deliverables' && typeof value === 'object') {
    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      
      let deliverables = [];
      
      value.forEach(item => {
        if (typeof item === 'object' && item.quantity && item.name) {
          // Format as "quantityxname" (e.g., 2xgamepreview)
          deliverables.push(`${item.quantity}x${item.name}`);
        }
      });
      
      if (deliverables.length === 0) return '-';
      
      return deliverables.join(', ');
    }
    
    // Handle single deliverable object
    if (value && typeof value === 'object') {
      if (value.quantity && value.name) {
        // Format as "quantityxname" (e.g., 2xgamepreview)
        return `${value.quantity}x${value.name}`;
      }
      return '-';
    }
    return '-';
  }
  
  // Handle reporter - show name instead of UID/ID
  if (columnId === 'reporters') {
    // If it's already a name, return it
    if (typeof value === 'string' && !value.includes('@') && !value.includes('UID') && !value.match(/^[a-z0-9]{20,}$/)) {
      return value;
    }
    // If it's a UID/ID, look it up from the reporters data
    if (typeof value === 'string' && reporters.length > 0) {
      const reporter = reporters.find(r => 
        r.reporterUID?.toLowerCase() === value.toLowerCase() || 
        r.uid?.toLowerCase() === value.toLowerCase() ||
        r.id?.toLowerCase() === value.toLowerCase()
      );
      return reporter?.name || value;
    }
    return value || '-';
  }
  
  // Handle observations
  if (columnId === 'observations') {
    return value && value.trim() ? value : '-';
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join('; ') : '-';
  }
  
  // Handle objects
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Handle strings
  const stringValue = String(value);
  if (stringValue.trim() === '') {
    return '-';
  }
  
  return stringValue;
};

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
        analyticsMode = false,
        reporters = []
      } = options;

      // Handle analytics data (array of objects without columns)
      if (analyticsMode || !columns) {
        return exportAnalyticsToCSV(data, tableType, { filename, includeHeaders });
      }

      // Get all columns (both visible and hidden) excluding only the select column
      const allColumns = columns.filter(col => 
        col.id !== 'select' && col.id !== 'actions'
      );
      
      // Debug logging
      console.log('Total columns passed to export:', columns.length);
      console.log('Columns after filtering:', allColumns.length);
      console.log('Column details:', allColumns.map(col => ({
        id: col.id,
        header: col.header,
        accessorKey: col.accessorKey,
        hasAccessorFn: typeof col.accessorFn === 'function'
      })));
  
      // Create headers
      const headers = allColumns.map(col => {
        // Handle different header types
        if (typeof col.header === 'string') return col.header;
        if (typeof col.header === 'function') return col.accessorKey || col.id;
        return col.accessorKey || col.id;
      }).join(',');

      // Create rows
      const rows = data.map(row => {
        return allColumns.map(col => {
          let value;
          
          // Handle different accessor types
          if (typeof col.accessorFn === 'function') {
            // Function accessor: (row) => row.data_task?.departments
            value = col.accessorFn(row);
          } else if (col.accessorKey) {
            // Simple accessor key: 'data_task.taskName'
            if (col.accessorKey.includes('.')) {
              // Nested accessor: 'data_task.taskName'
              const keys = col.accessorKey.split('.');
              value = keys.reduce((obj, key) => obj?.[key], row);
            } else {
              // Direct accessor
              value = row[col.accessorKey];
            }
          } else {
            value = null;
          }
          // Format the value using our custom formatter
          const formattedValue = formatValueForCSV(value, col.id, reporters);
          
          // Escape commas and quotes in string values
          if (formattedValue.includes(',') || formattedValue.includes('"') || formattedValue.includes('\n')) {
            return `"${formattedValue.replace(/"/g, '""')}"`;
          }
          return formattedValue;
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
