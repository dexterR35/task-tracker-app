import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import DynamicButton from '../components/DynamicButton';
import dayjs from 'dayjs';

const TaskDetailPage = () => {
  const { taskId, monthId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const ref = doc(db, 'tasks', monthId, 'monthTasks', taskId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError('Task not found');
          return;
        }
        const data = snap.data();
        setTask({ id: snap.id, ...data });
      } catch (e) {
        setError(e.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId, monthId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!task) return null;

  const formatValue = (val) => {
    if (val == null || val === '') return '—';
    if (typeof val === 'object') {
      // Firestore Timestamp
      if (val?.toDate) {
        try { return dayjs(val.toDate()).format('YYYY-MM-DD HH:mm'); } catch { return 'Invalid Date'; }
      }
      return JSON.stringify(val);
    }
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    return String(val);
  };

  // Build full field list (including id) from task object
  const allFields = Object.entries({ id: task.id, ...task });

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
        <DynamicButton variant="outline" onClick={() => navigate(-1)}>Back</DynamicButton>
      </div>
      <div className="space-y-4 text-sm mb-8">
        <div><span className="font-medium text-gray-700">ID:</span> {task.id}</div>
        <div><span className="font-medium text-gray-700">Jira Link:</span> <a href={task.jiraLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">{task.jiraLink}</a></div>
        <div><span className="font-medium text-gray-700">Markets:</span> {Array.isArray(task.markets) ? task.markets.join(', ') : (task.market || '-')}</div>
        <div><span className="font-medium text-gray-700">Product:</span> {task.product}</div>
        <div><span className="font-medium text-gray-700">Task Name:</span> {task.taskName}</div>
        <div><span className="font-medium text-gray-700">User UID:</span> {task.userUID}</div>
        <div><span className="font-medium text-gray-700">Month ID:</span> {task.monthId}</div>
        <div><span className="font-medium text-gray-700">Created By:</span> {task.createdByName || task.createdBy}</div>
        <div><span className="font-medium text-gray-700">AI Used:</span> {task.aiUsed ? 'Yes' : 'No'}</div>
        <div><span className="font-medium text-gray-700">AI Models:</span> {task.aiUsed ? ((Array.isArray(task.aiModels) ? task.aiModels.join(', ') : (task.aiModel || 'Unknown'))) : 'Unknown'}</div>
        <div><span className="font-medium text-gray-700">Deliverable:</span> {task.deliverable || '-'}</div>
        <div><span className="font-medium text-gray-700">Time Spent On AI (h):</span> {task.timeSpentOnAI}</div>
        <div><span className="font-medium text-gray-700">Time In Hours:</span> {task.timeInHours}</div>
        <div><span className="font-medium text-gray-700">Reworked:</span> {task.reworked ? 'Yes' : 'No'}</div>
        <div><span className="font-medium text-gray-700">Created At:</span> {task.createdAt ? dayjs(task.createdAt?.toDate?.() || task.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'}</div>
        <div><span className="font-medium text-gray-700">Updated At:</span> {task.updatedAt ? dayjs(task.updatedAt?.toDate?.() || task.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A'}</div>
      </div>
  
    </div>
  );
};

export default TaskDetailPage;
