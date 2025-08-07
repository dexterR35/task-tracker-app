import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';

export default function UserTaskTable({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const { currentUser, isAdmin } = useAuth();

  // Mock data for testing
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // Simulating API call
        const mockTasks = [
          {
            id: '1',
            jiraLink: 'https://jira.example.com/TEST-1',
            market: 'Market 1',
            department: 'Engineering',
            aiUsed: 'Yes',
            aiModel: 'GPT-4',
            timeUser: 2,
            timeAi: 0.5,
            taskType: 'LP',
            lpNumber: 3,
            createdAt: new Date(),
            isOldTask: 'Yes'
          },
          {
            id: '2',
            jiraLink: 'https://jira.example.com/TEST-2',
            market: 'Market 2',
            department: 'Marketing',
            aiUsed: 'No',
            timeUser: 1.5,
            taskType: 'Banners',
            bannerNumber: 5,
            createdAt: new Date(),
            isOldTask: 'No'
          }
        ];
        setTasks(mockTasks);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setLoading(false);
      }
    };

    fetchTasks();
  }, [userId]);

  const handleEdit = (task) => {
    setEditingTask(task);
  };

  const handleUpdate = async (updatedTask) => {
    try {
      // Mock API call
      const updatedTasks = tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      );
      setTasks(updatedTasks);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      // Mock API call
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="user-tasks">
      <h2>Current Month Tasks</h2>
      <div className="table-container">
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Jira Link</th>
              <th>Market</th>
              <th>Department</th>
              <th>Task Type</th>
              <th>Details</th>
              <th>Time</th>
              <th>AI Used</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td>{task.createdAt.toLocaleDateString()}</td>
                <td>
                  <a href={task.jiraLink} target="_blank" rel="noopener noreferrer">
                    View Ticket
                  </a>
                </td>
                <td>{task.market}</td>
                <td>{task.department}</td>
                <td>{task.taskType}</td>
                <td>
                  {task.taskType === 'LP' && `${task.lpNumber} Landing Pages`}
                  {task.taskType === 'Banners' && `${task.bannerNumber} Banners`}
                  {task.taskType === 'Misc' && task.miscInfo}
                </td>
                <td>{task.timeUser}h</td>
                <td>
                  {task.aiUsed === 'Yes' ? (
                    <>
                      {task.aiModel === 'Other' ? task.otherAiModel : task.aiModel}
                      <br />
                      ({task.timeAi}h)
                    </>
                  ) : 'No'}
                </td>
                <td>
                  {task.isOldTask === 'Yes' && (
                    <div className="task-actions">
                      <button 
                        onClick={() => handleEdit(task)}
                        className="edit-button"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(task.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingTask && (
        <div className="edit-modal">
          {/* Add your edit form here */}
        </div>
      )}
    </div>
  );
}
