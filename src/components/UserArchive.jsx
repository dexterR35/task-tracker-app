import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';

export default function UserArchive({ userId }) {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const getAvailableMonths = () => {
      const monthsList = [];
      const currentDate = new Date();
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsList.push(monthStr);
      }
      setMonths(monthsList);
    };

    getAvailableMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthTasks();
    }
  }, [selectedMonth]);

  const fetchMonthTasks = async () => {
    try {
      setLoading(true);
      // Mock API call
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
          createdAt: new Date(selectedMonth + '-15'),
          isOldTask: 'Yes'
        },
        // Add more mock tasks here
      ];
      setTasks(mockTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-archive">
      <h2>Task Archive</h2>
      
      <div className="archive-controls">
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="month-select"
        >
          <option value="">Select Month</option>
          {months.map(month => (
            <option key={month} value={month}>
              {new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>Loading archived tasks...</div>
      ) : selectedMonth ? (
        tasks.length > 0 ? (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>No tasks found for this month</div>
        )
      ) : (
        <div>Select a month to view archived tasks</div>
      )}
    </div>
  );
}
