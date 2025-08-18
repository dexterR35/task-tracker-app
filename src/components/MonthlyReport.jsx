import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { Chart, registerables } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import DynamicButton from './DynamicButton';

// Import exceljs for spreadsheet creation and file-saver for downloading
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Firebase imports
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Redux imports
import {
  fetchMonthTasksIfNeeded,
  selectMonthTasks,
  selectMonthTasksState,
} from '../redux/slices/tasksSlice';

// dayjs plugins
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

Chart.register(...registerables);

const MonthlyReport = () => {
  const dispatch = useDispatch();
  const monthId = useMemo(() => dayjs().format('YYYY-MM'), []);

  // State management
  const [dateRange, setDateRange] = useState({
    start: dayjs().startOf('month'),
    end: dayjs().endOf('month'),
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Refs
  const cancelGenerationRef = useRef(false);
  const barChartRef = useRef(null);
  const doughnutChartRef = useRef(null);

  // Redux selectors
  const allMonthTasks = useSelector(selectMonthTasks(monthId));
  const tasksState = useSelector(selectMonthTasksState(monthId));
  const initialDataLoading = tasksState?.status === 'loading';

  useEffect(() => {
    dispatch(fetchMonthTasksIfNeeded({ monthId }));
  }, [dispatch, monthId]);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setReportData(null);
    cancelGenerationRef.current = false;

    setTimeout(() => {
      if (cancelGenerationRef.current) {
        setIsGenerating(false);
        return;
      }

      const filteredTasks = allMonthTasks.filter(task => {
        if (!task.createdAt) return false;
        const taskDate = dayjs(task.createdAt);
        if (!taskDate.isValid()) return false;
        return taskDate.isSameOrAfter(dateRange.start, 'day') && taskDate.isSameOrBefore(dateRange.end, 'day');
      });

      const totalTasks = filteredTasks.length;
      const totalHours = filteredTasks.reduce((sum, t) => sum + (Number(t.timeInHours) || 0), 0);
      const aiTasks = filteredTasks.filter(t => t.aiUsed).length;
      const reworked = filteredTasks.filter(t => t.reworked).length;

      const tasksByMarket = filteredTasks.reduce((acc, task) => {
        const market = task.market || 'N/A';
        acc[market] = (acc[market] || 0) + 1;
        return acc;
      }, {});

      const tasksByProduct = filteredTasks.reduce((acc, task) => {
        const product = task.product || 'N/A';
        acc[product] = (acc[product] || 0) + 1;
        return acc;
      }, {});
      
      setReportData({
        summary: { totalTasks, totalHours, aiTasks, reworked, generatedAt: new Date().toISOString(), dateRange: { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() } },
        charts: {
          marketBarChart: { labels: Object.keys(tasksByMarket), datasets: [{ label: '# of Tasks', data: Object.values(tasksByMarket), backgroundColor: 'rgba(54, 162, 235, 0.6)' }] },
          productDoughnutChart: { labels: Object.keys(tasksByProduct), datasets: [{ data: Object.values(tasksByProduct), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }] },
        }
      });
      setIsGenerating(false);
    }, 1000);
  };
  
  const handleCancel = () => {
    cancelGenerationRef.current = true;
    setIsGenerating(false);
  };

  const handleSaveReport = async () => {
    if (!reportData?.summary) return;
    setIsSaving(true);
    try {
      const reportId = `${monthId}_${dateRange.start.format('YYYY-MM-DD')}_to_${dateRange.end.format('YYYY-MM-DD')}`;
      const reportRef = doc(db, 'reports', reportId);
      const docSnap = await getDoc(reportRef);

      if (docSnap.exists()) {
        alert('Error: A report for this exact date range has already been saved.');
      } else {
        await setDoc(reportRef, { ...reportData.summary, savedAt: serverTimestamp() });
        alert('Report saved successfully!');
      }
    } catch (error) {
      console.error("Error saving report: ", error);
      alert('Failed to save report.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadSpreadsheet = async () => {
    if (!reportData || !barChartRef.current || !doughnutChartRef.current) {
      alert("Report data or charts not available. Please generate the report first.");
      return;
    }
    setIsDownloading(true);

    try {
      // Get charts as Base64 images
      const barChartImage = barChartRef.current.toBase64Image();
      const doughnutChartImage = doughnutChartRef.current.toBase64Image();

      // Create a new workbook
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Your App Name';
      wb.created = new Date();

      // --- Create a Dashboard Sheet for Charts ---
      const dashboardSheet = wb.addWorksheet('Dashboard');
      dashboardSheet.getCell('A1').value = 'Monthly Report Dashboard';
      dashboardSheet.getCell('A1').font = { size: 16, bold: true };

      // Add chart images to the workbook
      const barImageId = wb.addImage({ base64: barChartImage, extension: 'png' });
      const doughnutImageId = wb.addImage({ base64: doughnutChartImage, extension: 'png' });

      // Place images on the dashboard sheet
      dashboardSheet.addImage(barImageId, {
        tl: { col: 0.5, row: 2 }, // Top-left corner
        ext: { width: 600, height: 400 } // Dimensions
      });
      dashboardSheet.addImage(doughnutImageId, {
        tl: { col: 8.5, row: 2 },
        ext: { width: 400, height: 400 }
      });

      // --- Add Data Sheets ---
      const { summary, charts } = reportData;

      const summarySheet = wb.addWorksheet('Summary Data');
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 25 },
      ];
      summarySheet.addRows([
        { metric: 'Date Range', value: `${dayjs(summary.dateRange.start).format('YYYY-MM-DD')} to ${dayjs(summary.dateRange.end).format('YYYY-MM-DD')}`},
        { metric: 'Total Tasks', value: summary.totalTasks },
        { metric: 'Total Hours', value: parseFloat(summary.totalHours.toFixed(2)) },
        { metric: 'AI Tasks', value: summary.aiTasks },
        { metric: 'Reworked Tasks', value: summary.reworked },
      ]);
      summarySheet.getRow(1).font = { bold: true };

      const marketSheet = wb.addWorksheet('Market Data');
      marketSheet.columns = [
        { header: 'Market', key: 'market', width: 20 },
        { header: 'Task Count', key: 'count', width: 15 },
      ];
      const marketData = charts.marketBarChart.labels.map((label, index) => ({
          market: label,
          count: charts.marketBarChart.datasets[0].data[index],
      }));
      marketSheet.addRows(marketData);
      marketSheet.getRow(1).font = { bold: true };

      const productSheet = wb.addWorksheet('Product Data');
      productSheet.columns = [
        { header: 'Product', key: 'product', width: 20 },
        { header: 'Task Count', key: 'count', width: 15 },
      ];
      const productData = charts.productDoughnutChart.labels.map((label, index) => ({
          product: label,
          count: charts.productDoughnutChart.datasets[0].data[index],
      }));
      productSheet.addRows(productData);
      productSheet.getRow(1).font = { bold: true };

      // --- Generate and Download the File ---
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Monthly_Report_${monthId}.xlsx`);
    
    } catch (error) {
      console.error("Error generating spreadsheet:", error);
      alert('Failed to generate spreadsheet.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Monthly Report</h2>
      
      <div className="flex flex-col md:flex-row gap-4 items-center mb-4 p-4 border rounded-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input type="date" value={dateRange.start.format('YYYY-MM-DD')} onChange={e => setDateRange(prev => ({ ...prev, start: dayjs(e.target.value) }))} className="border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" value={dateRange.end.format('YYYY-MM-DD')} onChange={e => setDateRange(prev => ({ ...prev, end: dayjs(e.target.value) }))} className="border rounded px-3 py-2" />
        </div>
        <div className="mt-auto">
          {!isGenerating ? (
            <DynamicButton variant="primary" onClick={handleGenerateReport} disabled={initialDataLoading}>
              {initialDataLoading ? 'Loading Data...' : 'Generate Report'}
            </DynamicButton>
          ) : (
            <DynamicButton variant="danger" onClick={handleCancel}>
              Cancel
            </DynamicButton>
          )}
        </div>
      </div>
      
      {isGenerating && <p className="text-center text-blue-600 animate-pulse">Generating report...</p>}

      {reportData && !isGenerating && (
        <div className="mt-6 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Report Generated</h3>
            <div className="flex gap-2">
              <DynamicButton variant="success" onClick={handleSaveReport} loading={isSaving}>Save to Firebase</DynamicButton>
              <DynamicButton variant="outline" onClick={handleDownloadSpreadsheet} loading={isDownloading}>
                Download Spreadsheet
              </DynamicButton>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
            <div className="bg-gray-100 p-4 rounded-lg"><p className="text-sm text-gray-600">Total Tasks</p><p className="text-2xl font-bold">{reportData.summary.totalTasks}</p></div>
            <div className="bg-gray-100 p-4 rounded-lg"><p className="text-sm text-gray-600">Total Hours</p><p className="text-2xl font-bold">{reportData.summary.totalHours.toFixed(1)}</p></div>
            <div className="bg-gray-100 p-4 rounded-lg"><p className="text-sm text-gray-600">AI Tasks</p><p className="text-2xl font-bold">{reportData.summary.aiTasks}</p></div>
            <div className="bg-gray-100 p-4 rounded-lg"><p className="text-sm text-gray-600">Reworked</p><p className="text-2xl font-bold">{reportData.summary.reworked}</p></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 border-t pt-8">
            <div>
              <h4 className="text-lg font-semibold text-center mb-2">Tasks by Market</h4>
              <Bar ref={barChartRef} data={reportData.charts.marketBarChart} />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-center mb-2">Tasks by Product</h4>
              <Doughnut ref={doughnutChartRef} data={reportData.charts.productDoughnutChart} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyReport;