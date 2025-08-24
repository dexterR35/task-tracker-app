import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useUpdateTaskMutation, useDeleteTaskMutation } from '../tasksApi';
import { taskNameOptions, marketOptions, productOptions, aiModelOptions, deliverables } from '../../../shared/utils/taskOptions';
import { useFormat } from '../../../shared/hooks/useFormat';
import { sanitizeTaskData, sanitizeText } from '../../../shared/utils/sanitization';
import usePagination from '../../../shared/hooks/usePagination';
import { useNotifications } from '../../../shared/hooks/useNotifications';

import MultiValueInput from '../../../shared/components/ui/MultiValueInput';

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

// Helper function to safely display task data
const safeDisplay = (value, fallback = '-') => {
  if (!value) return fallback;
  if (Array.isArray(value)) {
    return value.map(v => sanitizeText(v)).join(', ') || fallback;
  }
  return sanitizeText(value) || fallback;
};

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
  const { format } = useFormat();
  
  // Use tasks passed from parent instead of making duplicate query
  const allTasks = tasks;
  
  // Debug: Log the first task to see its structure
  if (allTasks && allTasks.length > 0) {
    console.log('First task structure:', allTasks[0]);
    console.log('First task ID:', allTasks[0].id);
    console.log('First task keys:', Object.keys(allTasks[0]));
  }
  
  // Tasks are already filtered by the server query, so use them directly
  const filteredTasks = allTasks || [];

  const handleSelect = (t) => {
    if (typeof onSelect === 'function') return onSelect(t);
    // Extract the document ID from the task ID (in case it's a full path)
    let taskId = t.id;
    if (typeof taskId === 'string' && taskId.includes('/')) {
      const pathParts = taskId.split('/');
      taskId = pathParts[pathParts.length - 1];
    }
    
    // Ensure we have a valid monthId
    const monthId = t.monthId || format(new Date(), "yyyy-MM");
    
    // Check if we're on admin route and use appropriate path
    const isAdminRoute = window.location.pathname.includes('/admin');
    const route = isAdminRoute ? `/admin/task/${monthId}/${taskId}` : `/task/${monthId}/${taskId}`;
    navigate(route);
  };

  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [rowActionId, setRowActionId] = useState(null);
  const formatDay = useFormatDay();
  
  // Force re-render when form changes to update conditional columns
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Check if any task is being edited
  const isAnyTaskEditing = editingId !== null;
  
  useEffect(() => {
    if (isAnyTaskEditing) {
      setForceUpdate(prev => prev + 1);
    }
  }, [form.deliverables, form.aiUsed, isAnyTaskEditing]);
  
  // Force re-render when tasks change to ensure cache updates are reflected
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [filteredTasks.length]);
  
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
    // Extract the document ID from the task ID (in case it's a full path)
    let taskId = t.id;
    if (typeof taskId === 'string' && taskId.includes('/')) {
      const pathParts = taskId.split('/');
      taskId = pathParts[pathParts.length - 1];
    }
    setEditingId(taskId);
    
    // Sanitize the task data before setting it in the form
    const sanitizedTask = sanitizeTaskData(t);
    
    setForm({
      taskName: sanitizedTask.taskName || '',
      markets: Array.isArray(sanitizedTask.markets) ? sanitizedTask.markets : (sanitizedTask.market ? [sanitizedTask.market] : []),
      product: sanitizedTask.product || '',
      timeInHours: sanitizedTask.timeInHours || 0,
      timeSpentOnAI: sanitizedTask.timeSpentOnAI || 0,
      aiUsed: Boolean(sanitizedTask.aiUsed),
      aiModels: Array.isArray(sanitizedTask.aiModels) ? sanitizedTask.aiModels : (sanitizedTask.aiModels === false ? false : []),
      reworked: Boolean(sanitizedTask.reworked),
      deliverables: Array.isArray(sanitizedTask.deliverables) ? sanitizedTask.deliverables : (sanitizedTask.deliverable ? [String(sanitizedTask.deliverable)] : []),
      deliverablesOther: Array.isArray(sanitizedTask.deliverablesOther) ? sanitizedTask.deliverablesOther : (sanitizedTask.deliverablesOther === false ? false : []),
      deliverablesCount: Number(sanitizedTask.deliverablesCount) || 0,
    });
  };

  const cancelEdit = () => { 
    setEditingId(null); 
    setForm({}); 
  };

  const saveEdit = async (t) => {
    try {
      console.log('Task object for update:', t);
      console.log('Task ID type:', typeof t.id);
      console.log('Task ID value:', t.id);
      console.log('Task ID includes slash:', t.id.includes('/'));
      console.log('Task number:', t.taskNumber);
      console.log('Task monthId:', t.monthId);
      setRowActionId(t.id);
      
      // Prepare form data for sanitization
      const formData = {
        taskName: form.taskName || '',
        product: form.product || '',
        markets: Array.isArray(form.markets) ? form.markets : [],
        aiUsed: Boolean(form.aiUsed),
        aiModels: form.aiUsed ? (Array.isArray(form.aiModels) && form.aiModels.length > 0 ? form.aiModels : false) : false,
        deliverables: Array.isArray(form.deliverables) ? form.deliverables : [],
        reworked: Boolean(form.reworked),
        timeInHours: Number(form.timeInHours) || 0,
        timeSpentOnAI: form.aiUsed ? (Number(form.timeSpentOnAI) || 0) : 0,
        taskNumber: t.taskNumber || '', // Preserve the original task number
        jiraLink: t.jiraLink || '', // Preserve the original Jira link
        deliverablesOther: form.deliverables && form.deliverables.includes("others") ? (Array.isArray(form.deliverablesOther) && form.deliverablesOther.length > 0 ? form.deliverablesOther : false) : false,
        deliverablesCount: Number(form.deliverablesCount) || 0, // Use form value for deliverablesCount
        createdBy: t.createdBy || '', // Preserve creator info
        createdByName: t.createdByName || '', // Preserve creator name
        userUID: t.userUID || '', // Preserve user UID
      };
      
      console.log('Form data before sanitization:', formData);
      
      // Sanitize the form data
      const sanitizedUpdates = sanitizeTaskData(formData);
      console.log('Sanitized updates:', sanitizedUpdates);
      
      // Additional validation for required fields
      const errs = [];
      if (!sanitizedUpdates.taskName) errs.push('Task');
      if (!sanitizedUpdates.product) errs.push('Product');
      if (!sanitizedUpdates.markets.length) errs.push('Markets');
      if (!sanitizedUpdates.deliverables.length) errs.push('Deliverables');
      if (sanitizedUpdates.timeInHours < 0.5) errs.push('Hours ≥ 0.5');
      
      // Validate AI fields only if AI is used
      if (sanitizedUpdates.aiUsed) {
        if (!Array.isArray(sanitizedUpdates.aiModels) || sanitizedUpdates.aiModels.length === 0) {
          errs.push('AI Models (required when AI is used)');
        }
        if (sanitizedUpdates.timeSpentOnAI < 0.5) {
          errs.push('AI Hours ≥ 0.5 (required when AI is used)');
        }
      }
      
      // Validate "others" deliverables only if "others" is selected
      if (sanitizedUpdates.deliverables.includes("others")) {
        if (!Array.isArray(sanitizedUpdates.deliverablesOther) || sanitizedUpdates.deliverablesOther.length === 0) {
          errs.push('Other Deliverables (required when "others" is selected)');
        }
      }
      
      if (errs.length) {
        addError('Please complete: ' + errs.join(', '));
        setRowActionId(null);
        return;
      }

      // Quantize time values (round to nearest 0.5)
      const quant = (n) => Math.round((Number(n) || 0) * 2) / 2;
      const updates = {
        ...sanitizedUpdates,
        timeInHours: quant(sanitizedUpdates.timeInHours),
        timeSpentOnAI: sanitizedUpdates.aiUsed ? quant(sanitizedUpdates.timeSpentOnAI) : 0,
      };
      
      console.log('Final updates object:', updates);

      // Update task using Redux mutation (automatically updates cache)
      // Extract the document ID from the task ID (in case it's a full path)
      let taskId = t.id;
      if (typeof taskId === 'string' && taskId.includes('/')) {
        // If it's a full path like "tasks/monthTasks/gYMI5ZUOGgoY1isWCdPP"
        const pathParts = taskId.split('/');
        taskId = pathParts[pathParts.length - 1]; // Get the last part
      }
      
      // Preserve the original monthId from the task
      const taskMonthId = t.monthId || format(new Date(), "yyyy-MM");
      
      // Ensure the monthId is included in the updates
      const updatesWithMonthId = {
        ...updates,
        monthId: taskMonthId, // Ensure monthId is preserved
      };
      
      await updateTask({ monthId: taskMonthId, id: taskId, updates: updatesWithMonthId }).unwrap();
      console.log('[TasksTable] updated task', { id: t.id, monthId: taskMonthId, updates: updatesWithMonthId });
      addSuccess('Task updated successfully!');
    } catch (e) {
      console.error('Task update error:', e);
      addError(`Failed to update task: ${e.message || 'Please try again.'}`);
    } finally {
      setEditingId(null);
      setRowActionId(null);
    }
  };

  const removeTask = async (t) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      setRowActionId(t.id);
      
      // Extract the document ID from the task ID (in case it's a full path)
      let taskId = t.id;
      if (typeof taskId === 'string' && taskId.includes('/')) {
        const pathParts = taskId.split('/');
        taskId = pathParts[pathParts.length - 1];
      }
      
      // Preserve the original monthId from the task
      const taskMonthId = t.monthId || format(new Date(), "yyyy-MM");
      
      // Delete task using Redux mutation (automatically updates cache)
      await deleteTask({ monthId: taskMonthId, id: taskId }).unwrap();
      addSuccess('Task deleted successfully!');
    } catch (e) {
      console.error('Task delete error:', e);
      addError(`Failed to delete task: ${e.message || 'Please try again.'}`);
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
            {(currentPageTasks.some(t => {
              const deliverables = Array.isArray(t.deliverables) ? t.deliverables : (t.deliverable ? [t.deliverable] : []);
              return deliverables.includes("others");
            }) || (isAnyTaskEditing && form.deliverables && form.deliverables.includes("others"))) && (
              <th key={`others-header-${forceUpdate}`} className="px-3 py-2">Other Deliverables</th>
            )}
            <th className="px-3 py-2 text-center">Count</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentPageTasks.map(t => {
            let taskId = t.id;
            if (typeof taskId === 'string' && taskId.includes('/')) {
              const pathParts = taskId.split('/');
              taskId = pathParts[pathParts.length - 1];
            }
            const isEdit = editingId === taskId;
            return (
              <tr key={taskId} className={` cursor-pointer border-t ${isEdit ? 'bg-secondary' : 'hover:bg-primary-80'} ${rowActionId === taskId ? 'opacity-50' : ''}`}>
                <td className="px-3 py-2 font-medium text-center">
                  {safeDisplay(t.taskNumber)}
                </td>
                <td className="px-3 py-2 font-medium  truncate max-w-[160px] ">
                  {isEdit ? (
                    <select className="border px-2 py-1 rounded w-full" value={form.taskName} onChange={e => setForm(f => ({ ...f, taskName: sanitizeText(e.target.value) }))}>
                      <option value="">Select task</option>
                      {taskNameOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : safeDisplay(t.taskName)}
                </td>
                <td className="px-3 py-2">{isEdit ? (
                  <div>
                    <select className="border px-2 py-1 rounded w-full" value="" onChange={e => { const val = sanitizeText(e.target.value); if (!val) return; setForm(f => ({ ...f, markets: (f.markets||[]).includes(val) ? f.markets : [...(f.markets||[]), val] })); }}>
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
                ) : safeDisplay(t.markets || t.market)}</td>
                <td className="px-3 py-2">{isEdit ? (
                  <select className="border px-2 py-1 rounded w-full" value={form.product} onChange={e => setForm(f => ({ ...f, product: sanitizeText(e.target.value) }))}>
                    <option value="">Select product</option>
                    {productOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : safeDisplay(t.product)}</td>
                <td className="px-3 py-2">{formatDay(t.createdAt)}</td>
                <td className="px-3 py-2 text-right">{isEdit ? <input type="number" step="0.5" min="0.5" className="border px-2 py-1 rounded w-20 text-right" value={form.timeInHours} onChange={e => setForm(f => ({ ...f, timeInHours: e.target.value }))} /> : numberFmt(parseFloat(t.timeInHours) || 0)}</td>
                <td className="px-3 py-2 text-right">{isEdit ? (
                  form.aiUsed ? <input type="number" step="0.5" min="0.5" className="border px-2 py-1 rounded w-20 text-right" value={form.timeSpentOnAI} onChange={e => setForm(f => ({ ...f, timeSpentOnAI: e.target.value }))} /> : <span className="text-gray-400">-</span>
                ) : numberFmt(parseFloat(t.timeSpentOnAI) || 0)}</td>
                <td className="px-3 py-2">{isEdit ? (
                  form.aiUsed ? (
                    <div>
                      <select className="border px-2 py-1 rounded w-full" value="" onChange={e => { const v = sanitizeText(e.target.value); if (!v) return; setForm(f => ({ ...f, aiModels: (f.aiModels||[]).includes(v) ? f.aiModels : [...(f.aiModels||[]), v] })); }}>
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
                ) : (t.aiUsed ? (t.aiModels && t.aiModels !== false ? safeDisplay(t.aiModels || t.aiModel) : '-') : '-')}</td>
                <td className="px-3 py-2 text-center">{isEdit ? <input type="checkbox" checked={form.aiUsed} onChange={e => setForm(f => ({
                  ...f,
                  aiUsed: e.target.checked,
                  ...(e.target.checked ? {} : { timeSpentOnAI: 0, aiModels: false })
                }))} /> : (t.aiUsed ? '✓' : '-')}</td>
                <td className="px-3 py-2 text-center">{isEdit ? <input type="checkbox" checked={form.reworked} onChange={e => setForm(f => ({ ...f, reworked: e.target.checked }))} /> : (t.reworked ? '✓' : '-')}</td>
                <td className="px-3 py-2">{isEdit ? (
                  <div>
                                          <select className="border px-2 py-1 rounded w-full" value="" onChange={e => { const v = sanitizeText(e.target.value); if (!v) return; setForm(f => ({ ...f, deliverables: (f.deliverables||[]).includes(v) ? f.deliverables : [...(f.deliverables||[]), v] })); }}>
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
                ) : safeDisplay(t.deliverables || t.deliverable)}</td>
                {(() => {
                  const hasOthersInAnyTask = currentPageTasks.some(task => {
                    const deliverables = Array.isArray(task.deliverables) ? task.deliverables : (t.deliverable ? [t.deliverable] : []);
                    return deliverables.includes("others");
                  });
                  const isEditingWithOthers = isAnyTaskEditing && form.deliverables && form.deliverables.includes("others");
                  
                  if (!hasOthersInAnyTask && !isEditingWithOthers) return null;
                  
                  const deliverables = Array.isArray(t.deliverables) ? t.deliverables : (t.deliverable ? [t.deliverable] : []);
                  const isEditingThisTask = isAnyTaskEditing && editingId === taskId;
                  const shouldShowOthers = deliverables.includes("others") || (isEditingThisTask && form.deliverables && form.deliverables.includes("others"));
                  
                  return (
                    <td key={`others-cell-${forceUpdate}`} className="px-3 py-2">
                      {!shouldShowOthers ? "-" : (
                        isEditingThisTask ? (
                          <MultiValueInput
                            value={form.deliverablesOther || []}
                            onChange={(newValues) => setForm(f => ({ ...f, deliverablesOther: newValues }))}
                            placeholder="Enter other deliverables..."
                            maxValues={5}
                          />
                        ) : (
                          t.deliverablesOther && t.deliverablesOther !== false ? safeDisplay(t.deliverablesOther) : '-'
                        )
                      )}
                    </td>
                  );
                })()}
                <td className="px-3 py-2 text-center">
                  {isEdit ? (
                    <input 
                      type="number" 
                      min="1" 
                      className="border px-2 py-1 rounded w-20 text-center" 
                      value={form.deliverablesCount || 0} 
                      onChange={e => setForm(f => ({ ...f, deliverablesCount: parseInt(e.target.value) || 0 }))} 
                    />
                  ) : (
                    Number(t.deliverablesCount) || 0
                  )}
                </td>
                <td className="px-3 py-2 text-right space-x-2">
                  {isEdit ? (
                    <>
                      <button 
                        disabled={rowActionId === taskId || !(() => {
                          // Custom validation logic for table edit
                          if (!form.taskName || !form.product || !form.markets?.length || !form.deliverables?.length || !form.timeInHours || form.timeInHours < 0.5) {
                            return false;
                          }
                          
                          // AI validation only if AI is used
                          if (form.aiUsed) {
                            if (!form.aiModels?.length || !form.timeSpentOnAI || form.timeSpentOnAI < 0.5) {
                              return false;
                            }
                          }
                          
                          // Other deliverables validation only if "others" is selected
                          if (form.deliverables?.includes("others")) {
                            if (!form.deliverablesOther?.length) {
                              return false;
                            }
                          }
                          
                          return true;
                        })()} 
                        onClick={() => saveEdit(t)} 
                        className={`inline-flex items-center px-2 py-1 rounded text-white ${rowActionId === taskId ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`} 
                        title="Save"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="inline-flex items-center px-2 py-1 bg-gray-400 text-white rounded" title="Cancel"><XMarkIcon className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleSelect(t)} className="inline-flex items-center px-2 py-1 rounded text-white bg-blue-600 hover:bg-blue-700" title="View Task">View</button>
                      <button disabled={rowActionId === taskId} onClick={() => startEdit(t)} className={`inline-flex items-center px-2 py-1 rounded text-white ${rowActionId === taskId ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} title="Edit"><PencilIcon className="w-4 h-4" /></button>
                      <button disabled={rowActionId === taskId} onClick={() => removeTask(t)} className={`inline-flex items-center px-2 py-1 rounded text-white ${rowActionId === taskId ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`} title="Delete"><TrashIcon className="w-4 h-4" /></button>
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
