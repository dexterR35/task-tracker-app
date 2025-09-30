import { useState } from 'react';
import { exportToCSV, exportAnalyticsToCSV } from '@/utils/exportData';
import { generateAnalyticsPDF } from '@/utils/pdfGenerator';
import { exportEnhancedAnalytics } from '@/utils/calculatorAnalytics';
import { useAppData } from '@/hooks/useAppData';
import { showSuccess, showError } from '@/utils/toast';

/**
 * Unified Export Hook
 * Handles all export functionality (CSV, PDF, JSON) for tables and analytics
 */
export const useUnifiedExport = (data = [], options = {}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('');
  const [exportStatus, setExportStatus] = useState('idle'); // 'idle', 'processing', 'completed', 'error'

  const {
    dataType = 'table', // 'table', 'analytics'
    columns = null,
    tableType = 'data',
    filename = null,
    analyticsData = null
  } = options;

  // Get analytics data if needed
  const { users, reporters } = useAppData();

  /**
   * Export data as CSV
   * @param {Object} exportOptions - Additional export options
   * @returns {Promise<boolean>} Success status
   */
  const exportCSV = async (exportOptions = {}) => {
    if (isExporting) return false;

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('processing');
    setExportStep('Preparing CSV export...');

    try {
      // Simulate processing steps
      const steps = [
        { step: 'Preparing data...', progress: 20 },
        { step: 'Processing export...', progress: 50 },
        { step: 'Generating CSV...', progress: 80 },
        { step: 'Finalizing...', progress: 100 }
      ];

      for (const { step, progress } of steps) {
        setExportStep(step);
        setExportProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      let success = false;

      if (dataType === 'analytics') {
        // Export analytics data
        const analyticsDataToExport = analyticsData || exportEnhancedAnalytics(data);
        success = exportAnalyticsToCSV(analyticsDataToExport, tableType, {
          filename: filename || `${tableType}_analytics_${new Date().toISOString().split('T')[0]}.csv`,
          ...exportOptions
        });
      } else {
        // Export table data
        success = exportToCSV(data, columns, tableType, {
          filename: filename || `${tableType}_export_${new Date().toISOString().split('T')[0]}.csv`,
          ...exportOptions
        });
      }

      if (success) {
        setExportStatus('completed');
        setExportStep('CSV exported successfully!');
        showSuccess('CSV exported successfully!');
      } else {
        throw new Error('Failed to export CSV');
      }

      return success;
    } catch (error) {
      setExportStatus('error');
      setExportStep('CSV export failed. Please try again.');
      showError(`CSV export failed: ${error.message}`);
      return false;
    } finally {
      setIsExporting(false);
      // Reset after 3 seconds
      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
        setExportStep('');
      }, 3000);
    }
  };

  /**
   * Export analytics as PDF
   * @param {Array} selectedCards - Cards to include in PDF
   * @param {Object} pdfOptions - PDF generation options
   * @returns {Promise<boolean>} Success status
   */
  const exportPDF = async (selectedCards = [], pdfOptions = {}) => {
    if (isExporting) return false;

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('processing');
    setExportStep('Preparing PDF export...');

    try {
      // Simulate processing steps
      const steps = [
        { step: 'Preparing analytics data...', progress: 15 },
        { step: 'Capturing card screenshots...', progress: 40 },
        { step: 'Generating PDF...', progress: 70 },
        { step: 'Finalizing PDF...', progress: 100 }
      ];

      for (const { step, progress } of steps) {
        setExportStep(step);
        setExportProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const analyticsDataToExport = analyticsData || exportEnhancedAnalytics(data);
      
      const success = await generateAnalyticsPDF(selectedCards, {
        filename: filename || `analytics_export_${new Date().toISOString().split('T')[0]}.pdf`,
        ...pdfOptions
      });

      if (success) {
        setExportStatus('completed');
        setExportStep('PDF exported successfully!');
        showSuccess('PDF exported successfully!');
      } else {
        throw new Error('Failed to export PDF');
      }

      return success;
    } catch (error) {
      setExportStatus('error');
      setExportStep('PDF export failed. Please try again.');
      showError(`PDF export failed: ${error.message}`);
      return false;
    } finally {
      setIsExporting(false);
      // Reset after 3 seconds
      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
        setExportStep('');
      }, 3000);
    }
  };

  /**
   * Export data as JSON
   * @param {Object} jsonOptions - JSON export options
   * @returns {Promise<boolean>} Success status
   */
  const exportJSON = async (jsonOptions = {}) => {
    if (isExporting) return false;

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('processing');
    setExportStep('Preparing JSON export...');

    try {
      // Simulate processing steps
      const steps = [
        { step: 'Preparing data...', progress: 30 },
        { step: 'Formatting JSON...', progress: 70 },
        { step: 'Generating file...', progress: 100 }
      ];

      for (const { step, progress } of steps) {
        setExportStep(step);
        setExportProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      let dataToExport = data;
      if (dataType === 'analytics') {
        dataToExport = analyticsData || exportEnhancedAnalytics(data);
      }

      // Create JSON export
      const jsonData = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${tableType}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      const success = true;

      if (success) {
        setExportStatus('completed');
        setExportStep('JSON exported successfully!');
        showSuccess('JSON exported successfully!');
      } else {
        throw new Error('Failed to export JSON');
      }

      return success;
    } catch (error) {
      setExportStatus('error');
      setExportStep('JSON export failed. Please try again.');
      showError(`JSON export failed: ${error.message}`);
      return false;
    } finally {
      setIsExporting(false);
      // Reset after 3 seconds
      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
        setExportStep('');
      }, 3000);
    }
  };

  /**
   * Quick export with automatic format detection
   * @param {string} format - Export format ('csv', 'pdf', 'json')
   * @param {Object} options - Export options
   * @returns {Promise<boolean>} Success status
   */
  const quickExport = async (format = 'csv', options = {}) => {
    switch (format.toLowerCase()) {
      case 'csv':
        return await exportCSV(options);
      case 'pdf':
        return await exportPDF(options.selectedCards || [], options);
      case 'json':
        return await exportJSON(options);
      default:
        showError(`Unsupported export format: ${format}`);
        return false;
    }
  };

  /**
   * Get export status and progress
   */
  const getExportStatus = () => ({
    isExporting,
    exportProgress,
    exportStep,
    exportStatus
  });

  return {
    // Export functions
    exportCSV,
    exportPDF,
    exportJSON,
    quickExport,
    
    // Status
    getExportStatus,
    isExporting,
    exportProgress,
    exportStep,
    exportStatus
  };
};
