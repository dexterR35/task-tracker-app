import { useCallback } from 'react';
import { 
  exportCategoryTotals,
  exportTimeAnalytics,
  exportMarketAnalytics,
  exportCompleteAnalytics,
  exportBasicMetrics,
  exportAIMetrics,
  exportTimeChartData,
  exportEnhancedData,
  exportTrend,
  downloadAnalytics,
  getChartData,
  logAnalytics
} from '@/utils/exportAnalytics';

/**
 * Custom hook for analytics export functionality
 * @param {Array} tasks - Array of task objects from useAppData
 * @returns {Object} Export functions and data
 */
export const useAnalyticsExport = (tasks = []) => {
  
  // Export category totals
  const getCategoryTotals = useCallback(() => {
    return exportCategoryTotals(tasks);
  }, [tasks]);

  // Export time analytics
  const getTimeAnalytics = useCallback(() => {
    return exportTimeAnalytics(tasks);
  }, [tasks]);

  // Export market analytics
  const getMarketAnalytics = useCallback(() => {
    return exportMarketAnalytics(tasks);
  }, [tasks]);

  // Export complete analytics
  const getCompleteAnalytics = useCallback(() => {
    return exportCompleteAnalytics(tasks);
  }, [tasks]);

  // Download analytics data
  const downloadData = useCallback((format = 'json', filename = null) => {
    downloadAnalytics(tasks, format, filename);
  }, [tasks]);

  // Get chart data
  const getChartDataForType = useCallback((chartType = 'all') => {
    return getChartData(tasks, chartType);
  }, [tasks]);

  // Log analytics data
  const logData = useCallback((type = 'all') => {
    logAnalytics(tasks, type);
  }, [tasks]);

  // Additional extracted functions
  const getBasicMetrics = useCallback(() => {
    return exportBasicMetrics(tasks);
  }, [tasks]);

  const getAIMetrics = useCallback(() => {
    return exportAIMetrics(tasks);
  }, [tasks]);

  const getTimeChartData = useCallback((days = 7) => {
    return exportTimeChartData(tasks, days);
  }, [tasks]);

  const getEnhancedData = useCallback(() => {
    return exportEnhancedData(tasks);
  }, [tasks]);

  const getTrend = useCallback((currentValue, previousValue) => {
    return exportTrend(currentValue, previousValue);
  }, []);

  return {
    // Original data getters
    getCategoryTotals,
    getTimeAnalytics,
    getMarketAnalytics,
    getCompleteAnalytics,
    
    // Extracted function getters
    getBasicMetrics,
    getAIMetrics,
    getTimeChartData,
    getEnhancedData,
    getTrend,
    
    // Export functions
    downloadData,
    getChartData: getChartDataForType,
    logData,
    
    // Quick access to data
    categoryData: getCategoryTotals(),
    timeData: getTimeAnalytics(),
    marketData: getMarketAnalytics(),
    completeData: getCompleteAnalytics(),
    basicData: getBasicMetrics(),
    aiData: getAIMetrics(),
    timeChartData: getTimeChartData(),
    enhancedData: getEnhancedData()
  };
};
