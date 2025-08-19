import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useComputeMonthAnalyticsMutation, useSaveMonthAnalyticsMutation, useGetMonthAnalyticsQuery } from '../redux/services/tasksApi';
import DynamicButton from '../components/DynamicButton';
import { useNotifications } from '../hooks/useNotifications';
import { jsPDF } from 'jspdf';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line, ScatterChart, Scatter } from 'recharts';
import Skeleton from '../components/ui/Skeleton';

const PreviewPage = () => {
  const { monthId } = useParams();
  const navigate = useNavigate();
  const { addError, addSuccess } = useNotifications();
  
  const [analyticsPreview, setAnalyticsPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [computeAnalytics, { isLoading: computing }] = useComputeMonthAnalyticsMutation();
  const [saveAnalytics, { isLoading: saving }] = useSaveMonthAnalyticsMutation();
  const { data: existingAnalytics } = useGetMonthAnalyticsQuery({ monthId });
  
  const COLORS = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#14b8a6', '#8b5cf6', '#3b82f6', '#22c55e'];

  useEffect(() => {
    if (monthId) {
      handleGenerateAnalytics();
    }
  }, [monthId]);

  const handleGenerateAnalytics = async () => {
    setIsGenerating(true);
    try {
      const res = await computeAnalytics({ monthId }).unwrap();
      setAnalyticsPreview(res);
    } catch (error) {
      addError('Failed to generate analytics');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAnalytics = async () => {
    if (!analyticsPreview) return;
    
    try {
      await saveAnalytics({ monthId, data: analyticsPreview, overwrite: false }).unwrap();
      addSuccess('Analytics saved successfully!');
      navigate('/admin/analytics');
    } catch (error) {
      const code = error?.data?.code || error?.code;
      if (code === 'ANALYTICS_EXISTS') {
        addError('Analytics already exist for this month. Cannot save again.');
      } else {
        addError('Failed to save analytics');
      }
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  const handleDownloadPdf = () => {
    if (!analyticsPreview) return;
    
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = margin;

    doc.setFontSize(18);
    doc.text(`Monthly Analytics Preview - ${monthId}`, margin, y);
    y += 24;

    doc.setFontSize(12);
    const s = analyticsPreview;
    const lines = [
      `Total Tasks: ${s.totalTasks || 0}`,
      `Total Hours: ${Math.round((s.totalHours || 0) * 10) / 10}`,
      `AI Tasks: ${s.ai?.tasks || 0}  |  AI Hours: ${Math.round((s.ai?.hours || 0) * 10) / 10}`,
      `Reworked: ${s.reworked || 0}`,
    ];
    lines.forEach(line => { doc.text(line, margin, y); y += 18; });
    doc.save(`Analytics_Preview_${monthId}.pdf`);
  };

  if (isGenerating || computing) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-xl font-semibold mb-4">Generating Analytics Preview...</div>
            <div className="flex justify-center">
              <Skeleton variant="title" width="256px" height="32px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsPreview) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-xl font-semibold mb-4">No Analytics Preview Available</div>
            <DynamicButton variant="primary" onClick={handleGenerateAnalytics}>Generate Preview</DynamicButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-900">Analytics Preview ({monthId})</h2>
            <div className="flex gap-3">
              {existingAnalytics ? (
                <DynamicButton 
                  variant="danger" 
                  disabled={true}
                  title="Analytics already exist for this month"
                >
                  Already Saved
                </DynamicButton>
              ) : (
                <DynamicButton 
                  variant="success" 
                  onClick={handleSaveAnalytics} 
                  loading={saving}
                >
                  Save Analytics
                </DynamicButton>
              )}
              <DynamicButton variant="outline" onClick={handleDownloadPdf}>
                Download PDF
              </DynamicButton>
              <DynamicButton variant="danger" onClick={handleCancel}>
                Cancel
              </DynamicButton>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="bg-white rounded-lg shadow p-6">
          {(() => {
            const flatten = (obj) => ({ labels: Object.keys(obj || {}), values: Object.values(obj || {}) });
            const markets = (analyticsPreview.markets) || {};
            const products = (analyticsPreview.products) || {};
            const aiModels = (analyticsPreview.aiModels) || {};
            const deliverables = (analyticsPreview.deliverables) || {};
            const aiByProduct = analyticsPreview.aiBreakdownByProduct || {};
            const aiByMarket = analyticsPreview.aiBreakdownByMarket || {};
            const daily = analyticsPreview.daily || {};
            const m = flatten(markets); const p = flatten(products); const ai = flatten(aiModels); const d = flatten(deliverables);
            const prodKeys = Object.keys(aiByProduct);
            const prodAiTasks = prodKeys.map(k => aiByProduct[k]?.aiTasks || 0);
            const prodNonAiTasks = prodKeys.map(k => aiByProduct[k]?.nonAiTasks || 0);
            const marketKeys = Object.keys(aiByMarket);
            const marketAiTasks = marketKeys.map(k => aiByMarket[k]?.aiTasks || 0);
            const marketNonAiTasks = marketKeys.map(k => aiByMarket[k]?.nonAiTasks || 0);
            const dayKeys = Object.keys(daily).sort();
            const dayCounts = dayKeys.map(k => daily[k]?.count || 0);
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center">Tasks by Market</h4>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={m.labels.map((name, i) => ({ name, count: m.values[i]?.count || 0 }))}>
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
                        <Pie data={p.labels.map((name, i) => ({ name, count: p.values[i]?.count || 0 }))} dataKey="count" nameKey="name" outerRadius={110} label>
                          {p.labels.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center">AI Models (count)</h4>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={ai.labels.map((name, i) => ({ name, count: ai.values[i] || 0 }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center">Deliverables (count)</h4>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={d.labels.map((name, i) => ({ name, count: d.values[i] || 0 }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center">AI vs Non-AI by Product (tasks)</h4>
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart data={prodKeys.map((name, i) => ({ name, ai: prodAiTasks[i] || 0, nonAi: prodNonAiTasks[i] || 0 }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="ai" stackId="a" fill="#6366f1" name="AI Tasks" />
                        <Bar dataKey="nonAi" stackId="a" fill="#cbd5e1" name="Non-AI Tasks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-center">AI vs Non-AI by Market (tasks)</h4>
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart data={marketKeys.map((name, i) => ({ name, ai: marketAiTasks[i] || 0, nonAi: marketNonAiTasks[i] || 0 }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="ai" stackId="a" fill="#10b981" name="AI Tasks" />
                        <Bar dataKey="nonAi" stackId="a" fill="#cbd5e1" name="Non-AI Tasks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-medium mb-2 text-center">Daily Tasks Trend</h4>
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <LineChart data={dayKeys.map((name, i) => ({ name, count: dayCounts[i] || 0 }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-medium mb-2 text-center">Product Hours vs AI Hours (bubble)</h4>
                  <div style={{ width: '100%', height: 340 }}>
                    <ResponsiveContainer>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" name="Total Hours" />
                        <YAxis type="number" dataKey="y" name="AI Hours" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Products" data={prodKeys.map((k) => ({ x: aiByProduct[k]?.totalHours || 0, y: aiByProduct[k]?.aiHours || 0, z: Math.max(4, Math.min(20, (aiByProduct[k]?.totalTasks || 0))) }))} fill="#ea580c" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
