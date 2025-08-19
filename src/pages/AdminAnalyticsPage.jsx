import React, { useMemo, useRef } from 'react';
import { useListAllAnalyticsQuery, useGetMonthAnalyticsQuery } from '../redux/services/tasksApi';
import DynamicButton from '../components/DynamicButton';
import { Chart, registerables } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
Chart.register(...registerables);

const AdminAnalyticsPage = () => {
  const formatSavedAt = (ms) => {
    if (!Number.isFinite(ms)) return '-';
    const d = new Date(ms);
    const datePart = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    const tzOffsetMin = -d.getTimezoneOffset();
    const sign = tzOffsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(tzOffsetMin);
    const hrs = Math.floor(abs / 60);
    const mins = abs % 60;
    const tz = `UTC${sign}${hrs}${mins ? ':' + String(mins).padStart(2, '0') : ''}`;
    return `${datePart} at ${timePart} ${tz}`;
  };
  const { data: all = [], isLoading } = useListAllAnalyticsQuery();
  const [selected, setSelected] = React.useState(null);
  const { data: current } = useGetMonthAnalyticsQuery(selected ? { monthId: selected } : { monthId: '' }, { skip: !selected });
  const barRef = useRef(null);
  const doughnutRef = useRef(null);

  const handleDownloadPdf = () => {
    if (!current) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40; let y = margin;
    doc.setFontSize(18); doc.text(`Monthly Analytics - ${current.monthId}`, margin, y); y += 24;
    doc.setFontSize(12);
    const s = current;
    [
      `Total Tasks: ${s.totalTasks || 0}`,
      `Total Hours: ${Math.round((s.totalHours || 0) * 10) / 10}`,
      `AI Tasks: ${s.ai?.tasks || 0}  |  AI Hours: ${Math.round((s.ai?.hours || 0) * 10) / 10}`,
      `Reworked: ${s.reworked || 0}`,
    ].forEach(line => { doc.text(line, margin, y); y += 18; });
    y += 10;
    const barImg = barRef.current?.toBase64Image?.();
    const doughnutImg = doughnutRef.current?.toBase64Image?.();
    const imgWidth = 240; const imgHeight = 160;
    if (barImg) doc.addImage(barImg, 'PNG', margin, y, imgWidth, imgHeight);
    if (doughnutImg) doc.addImage(doughnutImg, 'PNG', margin + imgWidth + 20, y, imgWidth, imgHeight);
    doc.save(`Analytics_${current.monthId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Saved Analytics</h2>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Month</th>
                  <th className="px-3 py-2 text-left">Saved At</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={3}>
                      <div className="h-5 w-40 skeleton rounded mb-2" />
                      <div className="h-5 w-64 skeleton rounded" />
                    </td>
                  </tr>
                ) : all.length === 0 ? (
                  <tr><td className="px-3 py-3" colSpan={3}>No analytics saved yet.</td></tr>
                ) : (
                  all.map(row => (
                    <tr key={row.monthId} className="border-t">
                      <td className="px-3 py-2 font-medium">{row.monthId}</td>
                      <td className="px-3 py-2">{formatSavedAt(row.savedAt)}</td>
                      <td className="px-3 py-2">
                        <DynamicButton variant="outline" onClick={() => setSelected(row.monthId)}>Preview</DynamicButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {current && (
          <div className="bg-white rounded-lg shadow p-4 mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Analytics ({current.monthId})</h3>
              <DynamicButton variant="outline" onClick={handleDownloadPdf}>Download PDF</DynamicButton>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
              <div className="bg-gray-100 p-3 rounded"><div className="text-xs text-gray-600">Total Tasks</div><div className="text-xl font-semibold">{current.totalTasks || 0}</div></div>
              <div className="bg-gray-100 p-3 rounded"><div className="text-xs text-gray-600">Total Hours</div><div className="text-xl font-semibold">{Math.round((current.totalHours || 0) * 10) / 10}</div></div>
              <div className="bg-gray-100 p-3 rounded"><div className="text-xs text-gray-600">AI Tasks</div><div className="text-xl font-semibold">{current.ai?.tasks || 0}</div></div>
              <div className="bg-gray-100 p-3 rounded"><div className="text-xs text-gray-600">Reworked</div><div className="text-xl font-semibold">{current.reworked || 0}</div></div>
            </div>
            {(() => {
              const markets = current.markets || {};
              const products = current.products || {};
              const marketData = { labels: Object.keys(markets), datasets: [{ label: '# Tasks', data: Object.values(markets).map(v => v.count || 0), backgroundColor: 'rgba(99,102,241,0.6)'}] };
              const productData = { labels: Object.keys(products), datasets: [{ label: '# Tasks', data: Object.values(products).map(v => v.count || 0), backgroundColor: 'rgba(16,185,129,0.6)'}] };
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-center">Tasks by Market</h4>
                    <Bar ref={barRef} data={marketData} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-center">Tasks by Product</h4>
                    <Doughnut ref={doughnutRef} data={productData} />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;


