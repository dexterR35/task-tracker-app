import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';

// Helper to safely normalize Firestore Timestamp / Date / string into ISO string
const toIsoString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    // Assume already string date or ISO
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  // Firestore Timestamp
  if (typeof value.toDate === 'function') {
    try { return value.toDate().toISOString(); } catch { /* ignore */ }
  }
  // Date instance
  if (value instanceof Date) {
    try { return value.toISOString(); } catch { /* ignore */ }
  }
  return null;
};

// Fetch all users for admin analytics
export const fetchUsersForAnalytics = createAsyncThunk(
  'admin/fetchUsersForAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(usersQuery);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: toIsoString(data.createdAt)
        };
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch tasks for analytics
export const fetchTasksForAnalytics = createAsyncThunk(
  'admin/fetchTasksForAnalytics',
  async ({ startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      let tasksQuery = collection(db, 'tasks');
      
      if (startDate && endDate) {
        tasksQuery = query(
          tasksQuery,
          where('createdAt', '>=', Timestamp.fromDate(new Date(startDate))),
          where('createdAt', '<=', Timestamp.fromDate(new Date(endDate))),
          orderBy('createdAt', 'desc')
        );
      } else {
        tasksQuery = query(tasksQuery, orderBy('createdAt', 'desc'));
      }
      
      const querySnapshot = await getDocs(tasksQuery);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
            ...data,
          createdAt: toIsoString(data.createdAt)
        };
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  users: [],
  tasks: [],
  analytics: {
    userStats: null,
    taskStats: null,
    monthlyData: null,
  },
  loading: {
    fetchUsersForAnalytics: false,
    fetchTasksForAnalytics: false,
  },
  error: {
    fetchUsersForAnalytics: null,
    fetchTasksForAnalytics: null,
  },
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state, action) => {
      const key = action.payload;
      if (key && state.error[key]) {
        state.error[key] = null;
      }
    },
    calculateAnalytics: (state) => {
      // Calculate user statistics
      state.analytics.userStats = {
        total: state.users.length,
        admins: state.users.filter(user => user.role === 'admin').length,
        users: state.users.filter(user => user.role === 'user').length,
        recentlyJoined: state.users.filter(user => {
          const joinDate = new Date(user.createdAt);
          if (isNaN(joinDate.getTime())) return false;
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return joinDate > thirtyDaysAgo;
        }).length
      };

      // Calculate task statistics
      state.analytics.taskStats = {
        total: state.tasks.length,
        byMarket: state.tasks.reduce((acc, task) => {
          acc[task.market] = (acc[task.market] || 0) + 1;
          return acc;
        }, {}),
        byProduct: state.tasks.reduce((acc, task) => {
          acc[task.product] = (acc[task.product] || 0) + 1;
          return acc;
        }, {}),
        byTaskType: state.tasks.reduce((acc, task) => {
          acc[task.taskName] = (acc[task.taskName] || 0) + 1;
          return acc;
        }, {}),
        aiUsageStats: {
          withAI: state.tasks.filter(task => task.aiUsed).length,
          withoutAI: state.tasks.filter(task => !task.aiUsed).length,
          averageAITime: state.tasks
            .filter(task => task.aiUsed && task.timeSpentOnAI)
            .reduce((sum, task) => sum + task.timeSpentOnAI, 0) / 
            state.tasks.filter(task => task.aiUsed && task.timeSpentOnAI).length || 0
        },
        averageCompletionTime: state.tasks
          .filter(task => task.timeInHours)
          .reduce((sum, task) => sum + task.timeInHours, 0) / 
          state.tasks.filter(task => task.timeInHours).length || 0,
        reworkRate: (state.tasks.filter(task => task.reworked).length / state.tasks.length * 100) || 0
      };

      // Calculate monthly data
      const monthlyData = {};
      state.tasks.forEach(task => {
        const dateObj = new Date(task.createdAt);
        if (isNaN(dateObj.getTime())) return; // skip invalid
        const month = dateObj.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = {
            tasks: 0,
            aiUsed: 0,
            totalTime: 0,
            reworked: 0
          };
        }
        monthlyData[month].tasks++;
        if (task.aiUsed) monthlyData[month].aiUsed++;
        if (task.timeInHours) monthlyData[month].totalTime += task.timeInHours;
        if (task.reworked) monthlyData[month].reworked++;
      });
      
      state.analytics.monthlyData = monthlyData;
    },
    resetAnalytics: (state) => {
      state.analytics = {
        userStats: null,
        taskStats: null,
        monthlyData: null,
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchUsersForAnalytics
      .addCase(fetchUsersForAnalytics.pending, (state) => {
        state.loading.fetchUsersForAnalytics = true;
        state.error.fetchUsersForAnalytics = null;
      })
      .addCase(fetchUsersForAnalytics.fulfilled, (state, action) => {
        state.loading.fetchUsersForAnalytics = false;
        state.users = action.payload;
      })
      .addCase(fetchUsersForAnalytics.rejected, (state, action) => {
        state.loading.fetchUsersForAnalytics = false;
        state.error.fetchUsersForAnalytics = action.payload;
      })
      
      // fetchTasksForAnalytics
      .addCase(fetchTasksForAnalytics.pending, (state) => {
        state.loading.fetchTasksForAnalytics = true;
        state.error.fetchTasksForAnalytics = null;
      })
      .addCase(fetchTasksForAnalytics.fulfilled, (state, action) => {
        state.loading.fetchTasksForAnalytics = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasksForAnalytics.rejected, (state, action) => {
        state.loading.fetchTasksForAnalytics = false;
        state.error.fetchTasksForAnalytics = action.payload;
      });
  },
});

export const { clearError, calculateAnalytics, resetAnalytics } = adminSlice.actions;
export default adminSlice.reducer;
