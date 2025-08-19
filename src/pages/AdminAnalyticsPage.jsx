import React from 'react';
import { useListAllAnalyticsQuery, useGetMonthAnalyticsQuery } from '../redux/services/tasksApi';
import DynamicButton from '../components/DynamicButton';
import { jsPDF } from 'jspdf';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import useTime from '../hooks/useTime';

const AdminAnalyticsPage = () => {
  const { format } = useTime();
  const { data: all = [], isLoading } = useListAllAnalyticsQuery();
  const [selected, setSelected] = React.useState(null);
  const { data: current } = useGetMonthAnalyticsQuery(selected ? { monthId: selected } : { monthId: '' }, { skip: !selected });
  const COLORS = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#14b8a6', '#8b5cf6', '#3b82f6', '#22c55e'];

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
                      <td className="px-3 py-2">{format(row.savedAt, 'YYYY-MM-DD HH:mm')}</td>
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
              const marketData = Object.keys(markets).map(k => ({ name: k, count: markets[k]?.count || 0 }));
              const productData = Object.keys(products).map(k => ({ name: k, count: products[k]?.count || 0 }));
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-center">Tasks by Market</h4>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={marketData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-center">Tasks by Product</h4>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={productData} dataKey="count" nameKey="name" outerRadius={110} label>
                            {productData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
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


