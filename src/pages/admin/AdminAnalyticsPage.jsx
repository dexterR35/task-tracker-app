
import {
  useListAllAnalyticsQuery,
  useGetMonthAnalyticsQuery,
  useDeleteMonthAnalyticsMutation,
} from "../../redux/services/tasksApi";
import DynamicButton from "../../components/button/DynamicButton";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  React
} from "../../hooks/useImports";
import { useFormat } from "../../hooks/useImports";
import { useNotifications } from "../../hooks/useNotifications";
import Skeleton from "../../components/ui/Skeleton";

const AdminAnalyticsPage = () => {
  const { format } = useFormat();
  const { addError, addSuccess } = useNotifications();
  const { data: all = [], isLoading } = useListAllAnalyticsQuery();
  const [selected, setSelected] = React.useState(null);
  const { data: current } = useGetMonthAnalyticsQuery(
    selected ? { monthId: selected } : { monthId: "" },
    { skip: !selected }
  );
  const [deleteAnalytics, { isLoading: deleting }] =
    useDeleteMonthAnalyticsMutation();
  const COLORS = [
    "#6366f1",
    "#10b981",
    "#ef4444",
    "#f59e0b",
    "#14b8a6",
    "#8b5cf6",
    "#3b82f6",
    "#22c55e",
  ];

  // const handleDownloadPdf = () => {
  //   if (!current) return;
  //   const doc = new jsPDF({ unit: "pt", format: "a4" });
  //   const margin = 40;
  //   let y = margin;
  //   doc.setFontSize(18);
  //   doc.text(`Monthly Analytics - ${current.monthId}`, margin, y);
  //   y += 24;
  //   doc.setFontSize(12);
  //   const s = current;
  //   [
  //     `Total Tasks: ${s.totalTasks || 0}`,
  //     `Total Hours: ${Math.round((s.totalHours || 0) * 10) / 10}`,
  //     `AI Tasks: ${s.ai?.tasks || 0}  |  AI Hours: ${Math.round((s.ai?.hours || 0) * 10) / 10}`,
  //     `Reworked: ${s.reworked || 0}`,
  //   ].forEach((line) => {
  //     doc.text(line, margin, y);
  //     y += 18;
  //   });
  //   doc.save(`Analytics_${current.monthId}.pdf`);
  // };

  const handleDeleteAnalytics = async (monthId) => {
    if (
      window.confirm(
        `Are you sure you want to delete analytics for ${monthId}?`
      )
    ) {
      try {
        await deleteAnalytics({ monthId }).unwrap();
        addSuccess("Analytics deleted successfully");
        if (selected === monthId) {
          setSelected(null);
        }
      } catch (error) {
        addError("Failed to delete analytics");
      }
    }
  };

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">
        <div className="card">
          <h2>Saved Analytics</h2>
        </div>

        <div className="card rounded-lg shadow p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className=" text-gray-200 uppercase text-xs">
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
                      <div className="space-y-2">
                        <Skeleton variant="text" width="160px" height="20px" />
                        <Skeleton variant="text" width="256px" height="20px" />
                      </div>
                    </td>
                  </tr>
                ) : all.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={3}>
                      No analytics saved yet.
                    </td>
                  </tr>
                ) : (
                  all.map((row) => (
                    <tr key={row.monthId} className="border-t">
                      <td className="px-3 py-2 font-medium">{row.monthId}</td>
                      <td className="px-3 py-2">
                        {format(row.savedAt, "yyyy-MM-dd HH:mm")}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <DynamicButton
                            variant="outline"
                            onClick={() => setSelected(row.monthId)}
                          >
                            Preview
                          </DynamicButton>
                          <DynamicButton
                            variant="danger"
                            onClick={() => handleDeleteAnalytics(row.monthId)}
                            loading={deleting}
                          >
                            Delete
                          </DynamicButton>
                        </div>
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
              <h2 className=" !text-gray-900">
                Analytics ({current.monthId})
              </h2>
     
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
              <div className="card p-3 rounded text-gray-200">
                <div className="text-xs">Total Tasks</div>
                <div className="text-xl font-semibold">
                  {current.totalTasks || 0}
                </div>
              </div>
              <div className="card p-3 rounded text-gray-200">
                <div className="text-xs ">Total Hours</div>
                <div className="text-xl font-semibold">
                  {Math.round((current.totalHours || 0) * 10) / 10}
                </div>
              </div>
              <div className="card p-3 rounded text-gray-200">
                <div className="text-xs">AI Tasks</div>
                <div className="text-xl font-semibold">
                  {current.ai?.tasks || 0}
                </div>
              </div>
              <div className="card p-3 rounded text-gray-200">
                <div className="text-xs">Reworked</div>
                <div className="text-xl font-semibold">
                  {current.reworked || 0}
                </div>
              </div>
            </div>
            {(() => {
              const flatten = (obj) => ({
                labels: Object.keys(obj || {}),
                values: Object.values(obj || {}),
              });
              const markets = current.markets || {};
              const products = current.products || {};
              const aiModels = current.aiModels || {};
              const deliverables = current.deliverables || {};
              const aiByProduct = current.aiBreakdownByProduct || {};
              const aiByMarket = current.aiBreakdownByMarket || {};
              const daily = current.daily || {};
              const m = flatten(markets);
              const p = flatten(products);
              const ai = flatten(aiModels);
              const d = flatten(deliverables);
              const prodKeys = Object.keys(aiByProduct);
              const prodAiTasks = prodKeys.map(
                (k) => aiByProduct[k]?.aiTasks || 0
              );
              const prodNonAiTasks = prodKeys.map(
                (k) => aiByProduct[k]?.nonAiTasks || 0
              );
              const marketKeys = Object.keys(aiByMarket);
              const marketAiTasks = marketKeys.map(
                (k) => aiByMarket[k]?.aiTasks || 0
              );
              const marketNonAiTasks = marketKeys.map(
                (k) => aiByMarket[k]?.nonAiTasks || 0
              );
              const dayKeys = Object.keys(daily).sort();
              const dayCounts = dayKeys.map((k) => daily[k]?.count || 0);
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-center">
                      Tasks by Market
                    </h4>
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={m.labels.map((name, i) => ({
                            name,
                            count: m.values[i]?.count || 0,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-center">
                      Tasks by Product
                    </h4>
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={p.labels.map((name, i) => ({
                              name,
                              count: p.values[i]?.count || 0,
                            }))}
                            dataKey="count"
                            nameKey="name"
                            outerRadius={110}
                            label
                          >
                            {p.labels.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-center">
                      AI Models (count)
                    </h4>
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={ai.labels.map((name, i) => ({
                            name,
                            count: ai.values[i] || 0,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-center">
                      Deliverables (count)
                    </h4>
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={d.labels.map((name, i) => ({
                            name,
                            count: d.values[i] || 0,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-center">
                      AI vs Non-AI by Product (tasks)
                    </h4>
                    <div style={{ width: "100%", height: 320 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={prodKeys.map((name, i) => ({
                            name,
                            ai: prodAiTasks[i] || 0,
                            nonAi: prodNonAiTasks[i] || 0,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="ai"
                            stackId="a"
                            fill="#6366f1"
                            name="AI Tasks"
                          />
                          <Bar
                            dataKey="nonAi"
                            stackId="a"
                            fill="#cbd5e1"
                            name="Non-AI Tasks"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-center">
                      AI vs Non-AI by Market (tasks)
                    </h4>
                    <div style={{ width: "100%", height: 320 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={marketKeys.map((name, i) => ({
                            name,
                            ai: marketAiTasks[i] || 0,
                            nonAi: marketNonAiTasks[i] || 0,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="ai"
                            stackId="a"
                            fill="#10b981"
                            name="AI Tasks"
                          />
                          <Bar
                            dataKey="nonAi"
                            stackId="a"
                            fill="#cbd5e1"
                            name="Non-AI Tasks"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <h4 className="text-sm font-medium mb-2 text-center">
                      Daily Tasks Trend
                    </h4>
                    <div style={{ width: "100%", height: 320 }}>
                      <ResponsiveContainer>
                        <LineChart
                          data={dayKeys.map((name, i) => ({
                            name,
                            count: dayCounts[i] || 0,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <h4 className="text-sm font-medium mb-2 text-center">
                      Product Hours vs AI Hours (bubble)
                    </h4>
                    <div style={{ width: "100%", height: 340 }}>
                      <ResponsiveContainer>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" dataKey="x" name="Total Hours" />
                          <YAxis type="number" dataKey="y" name="AI Hours" />
                          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                          <Scatter
                            name="Products"
                            data={prodKeys.map((k) => ({
                              x: aiByProduct[k]?.totalHours || 0,
                              y: aiByProduct[k]?.aiHours || 0,
                              z: Math.max(
                                4,
                                Math.min(20, aiByProduct[k]?.totalTasks || 0)
                              ),
                            }))}
                            fill="#ea580c"
                          />
                        </ScatterChart>
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
