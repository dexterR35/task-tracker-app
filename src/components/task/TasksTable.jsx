import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useUpdateTaskMutation, useDeleteTaskMutation } from '../../redux/services/tasksApi';
import { taskNameOptions, marketOptions, productOptions, aiModelOptions, deliverables } from '../../utils/taskOptions';
import { useFormat } from '../../hooks/useImports';
import usePagination from '../../hooks/usePagination';
import { useNotifications } from '../../hooks/useNotifications';
import LoadingWrapper from '../ui/LoadingWrapper';

const useFormatDay = () => {
  const { format } = useFormat();
  return useMemo(() => ((ts) => {
    if (!ts) return '-';
    try {
      return format(ts, 'MMM d');
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Invalid Date';
    }
  }), [format]);
};

const numberFmt = (n) => (Number.isFinite(n) ? (Math.round(n * 10) / 10) : 0);

const TasksTable = ({ 
  monthId, 
  onSelect, 
  loading = false, 
  error = null,
  userFilter = null, // Optional user filter
  showUserFilter = false, // Whether to show user filter
  isAdmin = false, // Whether user is admin
  boardExists = false, // Board existence status from parent
  boardLoading = false, // Board loading status from parent
  tasks = [] // Tasks passed from parent component
}) => {
  const navigate = useNavigate();
  const { addSuccess, addError } = useNotifications();
  
  // Use tasks passed from parent instead of making duplicate query
  const allTasks = tasks;
  
  // Tasks are already filtered by the server query, so use them directly
  const filteredTasks = allTasks || [];

  const handleSelect = (t) => {
    if (typeof onSelect === 'function') return onSelect(t);
    // Check if we're on admin route and use appropriate path
    const isAdminRoute = window.location.pathname.includes('/admin');
    const route = isAdminRoute ? `/admin/task/${t.monthId}/${t.id}` : `/task/${t.monthId}/${t.id}`;
    navigate(route);
  };

  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [rowActionId, setRowActionId] = useState(null);
  const formatDay = useFormatDay();
  
  const { 
    page, 
    pageSize, 
    pageCount, 
    currentPageItems: currentPageTasks, 
    handlePageChange, 
    handlePageSizeChange 
  } = usePagination(filteredTasks, {
    defaultSize: 25,
    queryParamPage: 'p',
    queryParamSize: 'ps',
    storageKeyPrefix: 'tt_'
  });
  
  const startIdx = page * pageSize;

  const startEdit = (t) => {
    setEditingId(t.id);
    setForm({
      taskName: t.taskName || '',
      markets: Array.isArray(t.markets) ? t.markets : (t.market ? [t.market] : []),
      product: t.product || '',
      timeInHours: t.timeInHours || 0,
      timeSpentOnAI: t.timeSpentOnAI || 0,
      aiUsed: Boolean(t.aiUsed),
      aiModels: Array.isArray(t.aiModels) ? t.aiModels : (t.aiModel ? [t.aiModel] : []),
      reworked: Boolean(t.reworked),
      deliverables: Array.isArray(t.deliverables) ? t.deliverables : (t.deliverable ? [String(t.deliverable)] : []),
    });
  };

  const cancelEdit = () => { 
    setEditingId(null); 
    setForm({}); 
  };

  const saveEdit = async (t) => {
    try {
      setRowActionId(t.id);
      
      // validate & normalize
      const errs = [];
      const quant = (n) => Math.round((Number(n) || 0) * 2) / 2;
      const updates = {
        taskName: form.taskName || '',
        product: form.product || '',
        markets: Array.isArray(form.markets) ? form.markets : [],
        aiUsed: Boolean(form.aiUsed),
        aiModels: form.aiUsed ? (Array.isArray(form.aiModels) ? form.aiModels : []) : [],
        deliverables: Array.isArray(form.deliverables) ? form.deliverables : [],
        reworked: Boolean(form.reworked),
        timeInHours: quant(form.timeInHours),
        timeSpentOnAI: form.aiUsed ? quant(form.timeSpentOnAI) : 0,
      };
      
      if (!updates.taskName) errs.push('Task');
      if (!updates.product) errs.push('Product');
      if (!updates.markets.length) errs.push('Markets');
      if (!updates.deliverables.length) errs.push('Deliverables');
      if (updates.timeInHours < 0.5) errs.push('Hours ≥ 0.5');
      if (updates.aiUsed) {
        if (!updates.aiModels.length) errs.push('AI Models');
        if (updates.timeSpentOnAI < 0.5) errs.push('AI Hours ≥ 0.5');
      }
      
      if (errs.length) {
        addError('Please complete: ' + errs.join(', '));
        setRowActionId(null);
        return;
      }

      // Update task using Redux mutation (automatically updates cache)
      await updateTask({ monthId: t.monthId, id: t.id, updates }).unwrap();
      console.log('[TasksTable] updated task', { id: t.id, monthId: t.monthId, updates });
      addSuccess('Task updated successfully!');
    } catch (e) {
      console.error(e);
      addError('Failed to update task. Please try again.');
    } finally {
      setEditingId(null);
      setRowActionId(null);
    }
  };

  const removeTask = async (t) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      setRowActionId(t.id);
      
      // Delete task using Redux mutation (automatically updates cache)
      await deleteTask({ monthId: t.monthId, id: t.id }).unwrap();
      addSuccess('Task deleted successfully!');
    } catch (e) {
      console.error(e);
      addError('Failed to delete task. Please try again.');
    } finally {
      setRowActionId(null);
    }
  };

  // Determine loading state
  const isLoading = loading;
  const hasError = error;

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-primary border rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        <p className="mt-2 text-sm text-gray-200">Loading tasks...</p>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="bg-red-500 border rounded-lg p-6 text-center text-white">
        <p className="text-sm">Error loading tasks: {hasError.message || 'Unknown error'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-white text-red-500 rounded hover:bg-gray-100"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show empty state
  if (!filteredTasks.length) {
    return (
      <div className="bg-primary border rounded-lg p-6 text-center text-sm text-gray-200">
        {allTasks.length > 0 
          ? 'No tasks found for selected filters.' 
          : 'No tasks found for this month.'
        }
      </div>
    );
  }

  return (
    <div className="bg-primary border rounded-lg overflow-x-auto shadow-sm">
      <div className="flex-center !mx-0 !justify-between p-3 text-xs text-gray-200">
        <div>
          Showing {Math.min(startIdx + 1, filteredTasks.length)}–{Math.min(startIdx + pageSize, filteredTasks.length)} of {filteredTasks.length}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">Page size:
            <select value={pageSize} onChange={handlePageSizeChange} className="border rounded px-1 py-0.5 text-xs">
              {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </div>
      
      <table className="min-w-full text-sm " >
        <thead className="bg-primary text-gray-200 uppercase">
          <tr>
            <th className="px-3 py-2 text-left">Task #</th>
            <th className="px-3 py-2 text-left">Task</th>
            <th className="px-3 py-2 text-left">Markets</th>
            <th className="px-3 py-2 text-left">Product</th>
            <th className="px-3 py-2 text-left">Created</th>
            <th className="px-3 py-2 text-right">Hours</th>
            <th className="px-3 py-2 text-right">AI HR</th>
            <th className="px-3 py-2">AI Model(s)</th>
            <th className="px-3 py-2">AI?</th>
            <th className="px-3 py-2">Reworked?</th>
            <th className="px-3 py-2">Deliverables</th>
            <th className="px-3 py-2 text-center">Count</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentPageTasks.map(t => {
            const isEdit = editingId === t.id;
            return (
              <tr key={t.id} className={` cursor-pointer border-t ${isEdit ? 'bg-secondary' : 'hover:bg-primary-80'} ${rowActionId === t.id ? 'opacity-50' : ''}`}>
                <td className="px-3 py-2 font-medium text-center">
                  {t.taskNumber || '-'}
                </td>
                <td className="px-3 py-2 font-medium  truncate max-w-[160px] ">
                  {isEdit ? (
                    <select className="border px-2 py-1 rounded w-full" value={form.taskName} onChange={e => setForm(f => ({ ...f, taskName: e.target.value }))}>
                      <option value="">Select task</option>
                      {taskNameOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : t.taskName}
                </td>
                <td className="px-3 py-2">{isEdit ? (
                  <div>
                    <select className="border px-2 py-1 rounded w-full" value="" onChange={e => { const val = e.target.value; if (!val) return; setForm(f => ({ ...f, markets: (f.markets||[]).includes(val) ? f.markets : [...(f.markets||[]), val] })); }}>
                      <option value="">Add market…</option>
                      {marketOptions.filter(o => !(form.markets||[]).includes(o.value)).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(form.markets||[]).map(m => (
                        <span key={m} className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">
                          {m}
                          <button type="button" className="ml-1" onClick={() => setForm(f => ({ ...f, markets: (f.markets||[]).filter(x => x !== m) }))}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (Array.isArray(t.markets) ? (t.markets.join(', ') || '-') : (t.market || '-'))}</td>
                <td className="px-3 py-2">{isEdit ? (
                  <select className="border px-2 py-1 rounded w-full" value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}>
                    <option value="">Select product</option>
                    {productOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (t.product || '-')}</td>
                <td className="px-3 py-2">{formatDay(t.createdAt)}</td>
                <td className="px-3 py-2 text-right">{isEdit ? <input type="number" step="0.5" min="0.5" className="border px-2 py-1 rounded w-20 text-right" value={form.timeInHours} onChange={e => setForm(f => ({ ...f, timeInHours: e.target.value }))} /> : numberFmt(parseFloat(t.timeInHours) || 0)}</td>
                <td className="px-3 py-2 text-right">{isEdit ? (
                  form.aiUsed ? <input type="number" step="0.5" min="0.5" className="border px-2 py-1 rounded w-20 text-right" value={form.timeSpentOnAI} onChange={e => setForm(f => ({ ...f, timeSpentOnAI: e.target.value }))} /> : <span className="text-gray-400">-</span>
                ) : numberFmt(parseFloat(t.timeSpentOnAI) || 0)}</td>
                <td className="px-3 py-2">{isEdit ? (
                  form.aiUsed ? (
                    <div>
                      <select className="border px-2 py-1 rounded w-full" value="" onChange={e => { const v = e.target.value; if (!v) return; setForm(f => ({ ...f, aiModels: (f.aiModels||[]).includes(v) ? f.aiModels : [...(f.aiModels||[]), v] })); }}>
                        <option value="">Add model…</option>
                        {aiModelOptions.filter(o => !(form.aiModels||[]).includes(o.value)).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(form.aiModels||[]).map(m => (
                          <span key={m} className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">
                            {m}
                            <button type="button" className="ml-1" onClick={() => setForm(f => ({ ...f, aiModels: (f.aiModels||[]).filter(x => x !== m) }))}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : <span className="text-gray-400 text-xs">AI off</span>
                ) : (Array.isArray(t.aiModels) ? (t.aiModels.join(', ') || (t.aiUsed ? '—' : '-')) : (t.aiModel || (t.aiUsed ? '—' : '-')))}</td>
                <td className="px-3 py-2 text-center">{isEdit ? <input type="checkbox" checked={form.aiUsed} onChange={e => setForm(f => ({
                  ...f,
                  aiUsed: e.target.checked,
                  ...(e.target.checked ? {} : { timeSpentOnAI: 0, aiModels: [] })
                }))} /> : (t.aiUsed ? '✓' : '-')}</td>
                <td className="px-3 py-2 text-center">{isEdit ? <input type="checkbox" checked={form.reworked} onChange={e => setForm(f => ({ ...f, reworked: e.target.checked }))} /> : (t.reworked ? '✓' : '-')}</td>
                <td className="px-3 py-2">{isEdit ? (
                  <div>
                    <select className="border px-2 py-1 rounded w-full" value="" onChange={e => { const v = e.target.value; if (!v) return; setForm(f => ({ ...f, deliverables: (f.deliverables||[]).includes(v) ? f.deliverables : [...(f.deliverables||[]), v] })); }}>
                      <option value="">Add deliverable…</option>
                      {deliverables.filter(o => !(form.deliverables||[]).includes(o.value)).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(form.deliverables||[]).map(d => (
                        <span key={d} className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-xs">
                          {d}
                          <button type="button" className="ml-1" onClick={() => setForm(f => ({ ...f, deliverables: (f.deliverables||[]).filter(x => x !== d) }))}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (Array.isArray(t.deliverables) ? (t.deliverables.join(', ') || '-') : (t.deliverable || '-'))}</td>
                <td className="px-3 py-2 text-center">
                  {t.deliverablesCount || '-'}
                </td>
                <td className="px-3 py-2 text-right space-x-2">
                  {isEdit ? (
                    <>
                      <button disabled={rowActionId === t.id} onClick={() => saveEdit(t)} className={`inline-flex items-center px-2 py-1 rounded text-white ${rowActionId === t.id ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`} title="Save"><CheckIcon className="w-4 h-4" /></button>
                      <button onClick={cancelEdit} className="inline-flex items-center px-2 py-1 bg-gray-400 text-white rounded" title="Cancel"><XMarkIcon className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleSelect(t)} className="inline-flex items-center px-2 py-1 rounded text-white bg-blue-600 hover:bg-blue-700" title="View Task">View</button>
                      <button disabled={rowActionId === t.id} onClick={() => startEdit(t)} className={`inline-flex items-center px-2 py-1 rounded text-white ${rowActionId === t.id ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} title="Edit"><PencilIcon className="w-4 h-4" /></button>
                      <button disabled={rowActionId === t.id} onClick={() => removeTask(t)} className={`inline-flex items-center px-2 py-1 rounded text-white ${rowActionId === t.id ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`} title="Delete"><TrashIcon className="w-4 h-4" /></button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className="p-3">
        <ReactPaginate
          pageCount={pageCount}
          pageRangeDisplayed={5}
          marginPagesDisplayed={2}
          onPageChange={handlePageChange}
          containerClassName="flex justify-center space-x-1"
          pageClassName="px-3 py-1 border rounded hover:bg-gray-100"
          activeClassName="bg-blue-500 text-white"
          previousClassName="px-3 py-1 border rounded hover:bg-gray-100"
          nextClassName="px-3 py-1 border rounded hover:bg-gray-100"
          disabledClassName="opacity-50 cursor-not-allowed"
        />
      </div>
    </div>
  );
};

export default TasksTable;
