// src/redux/features/tasks/tasksSlice.js
import { createEntitySlice } from '../../redux/utils/createEntitySlice';
import { fetchIncrementalData } from '../../utils/firestoreSync';

const { slice, fetchEntity: fetchTasks } = createEntitySlice({
  entityName: 'tasks',
  fetchFn: fetchIncrementalData,
});

export const tasksSlice = slice;
export const fetchTasksThunk = fetchTasks;
export default tasksSlice.reducer;
