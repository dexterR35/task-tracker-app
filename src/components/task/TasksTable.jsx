import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import { useDispatch } from 'react-redux';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useUpdateTaskMutation, useDeleteTaskMutation } from '../../redux/services/tasksApi';
import { taskNameOptions, marketOptions, productOptions, aiModelOptions } from '../../constants/taskOptions';
import dayjs from 'dayjs';

const formatDay = (ts) => ts ? dayjs(ts).format('MMM D') : '-';
const numberFmt = (n) => (Number.isFinite(n) ? (Math.round(n * 10) / 10) : 0);

const TasksTable = ({ tasks, onSelect }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleSelect = (t) => {
    if (typeof onSelect === 'function') return onSelect(t);
    navigate(`/task/${t.monthId}/${t.id}`);
  };
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [rowActionId, setRowActionId] = useState(null);
  const params = new URLSearchParams(window.location.search);
  const initialPageSize = parseInt(params.get('ps') || localStorage.getItem('tt_pageSize') || '25', 10);
  const initialPage = parseInt(params.get('p') || localStorage.getItem('tt_page') || '0', 10);
  const [page, setPage] = useState(isNaN(initialPage) ? 0 : initialPage);
  const [pageSize, setPageSize] = useState(isNaN(initialPageSize) ? 25 : initialPageSize);
  const pageCount = Math.ceil(tasks.length / pageSize) || 1;
  const startIdx = page * pageSize;
  const currentPageTasks = tasks.slice(startIdx, startIdx + pageSize);

  const syncState = (newPage, newSize) => {
    const search = new URLSearchParams(window.location.search);
    search.set('p', String(newPage));
    search.set('ps', String(newSize));
    const newUrl = `${window.location.pathname}?${search.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
    localStorage.setItem('tt_page', String(newPage));
    localStorage.setItem('tt_pageSize', String(newSize));
  };
  const handlePageChange = (sel) => { const np = sel.selected; setPage(np); syncState(np, pageSize); };
  const handlePageSizeChange = (e) => { const ns = parseInt(e.target.value, 10) || 25; setPageSize(ns); setPage(0); syncState(0, ns); };
  const startEdit = (t) => { setEditingId(t.id); setForm({ taskName: t.taskName || '', markets: t.markets || [], product: t.product || '', timeInHours: t.timeInHours || 0, timeSpentOnAI: t.timeSpentOnAI || 0, aiUsed: !!t.aiUsed, aiModels: t.aiModels || [], reworked: !!t.reworked, deliverable: t.deliverable || '' }); };
  const cancelEdit = () => { setEditingId(null); setForm({}); };
  const saveEdit = async (t) => {
    try {
      setRowActionId(t.id);
      await updateTask({ monthId: t.monthId, id: t.id, updates: { ...form, timeInHours: Number(form.timeInHours) || 0, timeSpentOnAI: form.aiUsed ? (Number(form.timeSpentOnAI) || 0) : 0, aiModels: form.aiUsed ? (form.aiModels || []) : [], deliverable: form.deliverable || '', markets: form.markets || [] } }).unwrap();
    } catch (e) {
      console.error(e);
    } finally {
      setEditingId(null);
      setRowActionId(null);
    }
  };
  const removeTask = async (t) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      setRowActionId(t.id);
      await deleteTask({ monthId: t.monthId, id: t.id }).unwrap();
    } catch (e) {
      console.error(e);
    } finally {
      setRowActionId(null);
    }
  };
  if (!tasks.length) return <div className="bg-white border rounded-lg p-6 text-center text-sm text-gray-500">No tasks found for selected filters.</div>;
  return (
    <div className="bg-white border rounded-lg overflow-x-auto shadow-sm">
      <div className="flex items-center justify-between p-3 text-xs text-gray-600">
        <div>
          Showing {Math.min(startIdx + 1, tasks.length)}–{Math.min(startIdx + pageSize, tasks.length)} of {tasks.length}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">Page size:
            <select value={pageSize} onChange={handlePageSizeChange} className="border rounded px-1 py-0.5 text-xs">
              {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-3 py-2 text-left">Task</th>
            <th className="px-3 py-2 text-left">Market</th>
            <th className="px-3 py-2 text-left">Product</th>
            <th className="px-3 py-2 text-left">Created</th>
            <th className="px-3 py-2 text-right">Hours</th>
            <th className="px-3 py-2 text-right">AI Hours</th>
            <th className="px-3 py-2">AI Model</th>
            <th className="px-3 py-2">AI?</th>
            <th className="px-3 py-2">Reworked</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentPageTasks.map(t => {
            const isEdit = editingId === t.id;
            return (
              <tr key={t.id} className={`border-t ${isEdit ? 'bg-yellow-50' : 'hover:bg-blue-50'}`}>
                <td className="px-3 py-2 font-medium text-gray-800 truncate max-w-[160px]">
                  {isEdit ? (
                    <select className="border px-2 py-1 rounded w-full" value={form.taskName} onChange={e => setForm(f => ({ ...f, taskName: e.target.value }))}>
                      <option value="">Select task</option>
                      {taskNameOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : <button className="text-left w-full" onClick={() => handleSelect(t)}>{t.taskName}</button>}
                </td>
                <td className="px-3 py-2">{isEdit ? (
                  <select className="border px-2 py-1 rounded w-full" value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value }))}>
                    <option value="">Select market</option>
                    {marketOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (t.market || '-')}</td>
                <td className="px-3 py-2">{isEdit ? (
                  <select className="border px-2 py-1 rounded w-full" value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}>
                    <option value="">Select product</option>
                    {productOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (t.product || '-')}</td>
                <td className="px-3 py-2">{formatDay(t.createdAt)}</td>
                <td className="px-3 py-2 text-right">{isEdit ? <input type="number" step="0.1" className="border px-2 py-1 rounded w-20 text-right" value={form.timeInHours} onChange={e => setForm(f => ({ ...f, timeInHours: e.target.value }))} /> : numberFmt(parseFloat(t.timeInHours) || 0)}</td>
                <td className="px-3 py-2 text-right">{isEdit ? (
                  form.aiUsed ? <input type="number" step="0.1" className="border px-2 py-1 rounded w-20 text-right" value={form.timeSpentOnAI} onChange={e => setForm(f => ({ ...f, timeSpentOnAI: e.target.value }))} /> : <span className="text-gray-400">-</span>
                ) : numberFmt(parseFloat(t.timeSpentOnAI) || 0)}</td>
                <td className="px-3 py-2">{isEdit ? (
                  form.aiUsed ? (
                    <select className="border px-2 py-1 rounded w-full" value={form.aiModel} onChange={e => setForm(f => ({ ...f, aiModel: e.target.value }))}>
                      <option value="">Select model</option>
                      {aiModelOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : <span className="text-gray-400 text-xs">AI off</span>
                ) : (t.aiModel || (t.aiUsed ? '—' : '-'))}</td>
                <td className="px-3 py-2 text-center">{isEdit ? <input type="checkbox" checked={form.aiUsed} onChange={e => setForm(f => ({
                  ...f,
                  aiUsed: e.target.checked,
                  ...(e.target.checked ? {} : { timeSpentOnAI: 0, aiModel: '' })
                }))} /> : (t.aiUsed ? '✓' : '-')}</td>
                <td className="px-3 py-2 text-center">{isEdit ? <input type="checkbox" checked={form.reworked} onChange={e => setForm(f => ({ ...f, reworked: e.target.checked }))} /> : (t.reworked ? '✓' : '-')}</td>
                <td className="px-3 py-2 text-right space-x-2">
                  {isEdit ? (
                    <>
                      <button disabled={rowActionId === t.id} onClick={() => saveEdit(t)} className={`inline-flex items-center px-2 py-1 rounded text-white ${rowActionId === t.id ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`} title="Save"><CheckIcon className="w-4 h-4" /></button>
                      <button onClick={cancelEdit} className="inline-flex items-center px-2 py-1 bg-gray-400 text-white rounded" title="Cancel"><XMarkIcon className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
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
          className="flex items-center gap-1 flex-wrap text-xs"
          pageClassName=""
          activeClassName="!bg-blue-600 !text-white"
          pageLinkClassName="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
          activeLinkClassName="px-2 py-1 rounded border border-blue-600 bg-blue-600 text-white"
          breakLinkClassName="px-2 py-1"
          previousLinkClassName="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
          nextLinkClassName="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
          disabledLinkClassName="opacity-40 cursor-not-allowed"
          previousLabel="Prev"
          nextLabel="Next"
          breakLabel="..."
          onPageChange={handlePageChange}
          forcePage={page}
          pageCount={pageCount}
          marginPagesDisplayed={1}
          pageRangeDisplayed={3}
        />
      </div>
    </div>
  );
};

export default TasksTable;
