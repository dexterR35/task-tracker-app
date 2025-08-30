# RTK Query + Firestore Implementation Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Setup & Configuration](#setup--configuration)
- [API Structure](#api-structure)
- [Data Flow](#data-flow)
- [Real-time Updates](#real-time-updates)
- [Caching Strategy](#caching-strategy)
- [Performance Optimizations](#performance-optimizations)
- [Usage Patterns](#usage-patterns)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

This application implements a sophisticated data management system using **RTK Query** with **Firestore** as the backend. The architecture provides:

- ✅ **Automatic caching** with intelligent invalidation
- ✅ **Real-time updates** via Firestore subscriptions
- ✅ **Zero manual state management** for data
- ✅ **Performance optimizations** out of the box
- ✅ **Clean component interfaces** with centralized data hooks

## Architecture

### Core Components

```
src/
├── app/
│   ├── store.js                 # Redux store with RTK Query middleware
│   └── firebase.js              # Firestore configuration
├── features/
│   ├── tasks/tasksApi.js        # Tasks API with real-time subscriptions
│   ├── users/usersApi.js        # Users API with caching
│   └── reporters/reportersApi.js # Reporters API
├── shared/
│   ├── hooks/
│   │   ├── useUnifiedLoading.js           # Unified loading state management
│   │   ├── useCentralizedDataAnalytics.js # Centralized data access
│   │   └── useCacheManagement.js          # Cache utilities
│   └── components/
│       └── dashboard/           # Components using the data
```

### Data Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │    │  RTK Query APIs  │    │    Firestore    │
│                 │    │                  │    │                 │
│ DashboardPage   │───▶│  tasksApi        │───▶│  tasks/         │
│ DashboardMetrics│    │  usersApi        │    │  users/         │
│ DashboardTable  │    │  reportersApi    │    │  reporters/     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │   Redux Store    │             │
         │              │   (Cache)        │             │
         │              └──────────────────┘             │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │ Real-time Updates│
                    │ (onSnapshot)     │
                    └──────────────────┘
```

## Setup & Configuration

### 1. Store Configuration

```javascript
// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import { tasksApi } from "../features/tasks/tasksApi";
import { usersApi } from "../features/users/usersApi";
import { reportersApi } from "../features/reporters/reportersApi";

const store = configureStore({
  reducer: {
    [tasksApi.reducerPath]: tasksApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [reportersApi.reducerPath]: reportersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: [
          'tasksApi.queries.subscribeToMonthTasks.data',
          'usersApi.queries.getUsers.data',
        ],
      },
    }).concat([
      tasksApi.middleware,
      usersApi.middleware,
      reportersApi.middleware,
    ]),
});
```

### 2. API Configuration

```javascript
// src/features/tasks/tasksApi.js
export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["MonthTasks", "Charts", "Analytics"],
  keepUnusedDataFor: 300, // 5 minutes
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({
    // Endpoints defined here
  }),
});
```

## API Structure

### Tasks API

```javascript
// Real-time subscription for tasks
subscribeToMonthTasks: builder.query({
  async queryFn({ monthId, userId = null }) {
    // Initial data fetch
  },
  async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded }) {
    // Real-time subscription setup
    const unsubscribe = onSnapshot(query, (snapshot) => {
      // Update cache with real-time data
      updateCachedData(() => ({ tasks, boardExists: true, monthId }));
    });
  },
  providesTags: (result, error, arg) => [
    { type: "MonthTasks", id: arg.monthId },
  ],
}),

// CRUD operations
createTask: builder.mutation({
  async queryFn(task) {
    // Transaction-based task creation
  },
  // No cache invalidation needed - real-time handles updates
}),

updateTask: builder.mutation({
  async queryFn({ monthId, id, updates }) {
    // Transaction-based task update
  },
}),

deleteTask: builder.mutation({
  async queryFn({ monthId, id }) {
    // Transaction-based task deletion
  },
}),
```

### Users API

```javascript
getUsers: builder.query({
  async queryFn() {
    // Fetch all users with deduplication
  },
  providesTags: ["Users"],
  keepUnusedDataFor: Infinity, // Never expire
  refetchOnFocus: false,
  refetchOnReconnect: false,
  refetchOnMountOrArgChange: false,
}),

getUserByUID: builder.query({
  async queryFn({ userUID }) {
    // Fetch single user by UID
  },
  providesTags: (result, error, { userUID }) => [
    { type: "Users", id: userUID }
  ],
}),
```

## Data Flow

### 1. Component Data Access

```javascript
// Components use centralized hooks for clean data access
const DashboardPage = () => {
  const {
    isLoading,
    message: loadingMessage,
    progress,
    monthId,
    monthName,
    dashboardData
  } = useUnifiedLoading(userId, !!user);

  // Clean, simple data access
  const { tasks, users, analytics } = dashboardData || {};
};
```

### 2. Unified Loading Hook

```javascript
// src/shared/hooks/useUnifiedLoading.js
export const useUnifiedLoading = (userId = null, isAuthenticated = false) => {
  const { monthId, monthName, boardExists, isLoading: monthLoading } = useCurrentMonth();
  
  const dashboardData = useCentralizedDataAnalytics(
    shouldFetchDashboard ? userId : null
  );

  // Unified loading state calculation
  const unifiedLoading = useMemo(() => {
    if (!isAuthenticated) return { isLoading: false, phase: 'not_authenticated' };
    if (monthLoading) return { isLoading: true, phase: 'month', progress: 50 };
    if (dashboardData.isLoading) return { isLoading: true, phase: 'dashboard', progress: 90 };
    return { isLoading: false, phase: 'complete', progress: 100 };
  }, [isAuthenticated, monthLoading, dashboardData.isLoading]);

  return { ...unifiedLoading, dashboardData };
};
```

### 3. Centralized Data Analytics

```javascript
// src/shared/hooks/analytics/useCentralizedDataAnalytics.js
export const useCentralizedDataAnalytics = (userId = null) => {
  // RTK Query hooks
  const { data: tasksData, isLoading: tasksLoading } = useSubscribeToMonthTasksQuery(
    { monthId, userId },
    { skip: shouldSkipMonthData }
  );

  const { data: allUsers } = useGetUsersQuery({}, { skip: shouldSkip });
  const { data: reporters } = useGetReportersQuery({}, { skip: shouldSkip });

  // Analytics calculation
  const analytics = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;
    return calculateAnalyticsFromTasks(tasks, monthId, userId);
  }, [tasks, monthId, userId]);

  // Helper functions
  const getMetric = useCallback((type, category = null) => {
    return getMetricForCard(type, analytics, category);
  }, [analytics]);

  return {
    tasks, users, reporters, analytics,
    isLoading, isFetching, error,
    getMetric, getFilteredData, getUserById,
    // ... all helper functions
  };
};
```

## Real-time Updates

### Firestore Subscription Setup

```javascript
async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
  let unsubscribe = null;
  let lastUpdateTime = 0;
  const updateDebounce = 100; // Debounce updates by 100ms

  try {
    await cacheDataLoaded;

    const colRef = collection(db, "tasks", arg.monthId, "monthTasks");
    let query = fsQuery(colRef, orderBy("createdAt", "desc"));

    if (arg.userId) {
      query = fsQuery(colRef, where("userUID", "==", arg.userId), orderBy("createdAt", "desc"));
    }

    unsubscribe = onSnapshot(query, (snapshot) => {
      // Debounce rapid updates
      const now = Date.now();
      if (now - lastUpdateTime < updateDebounce) return;
      lastUpdateTime = now;

      const tasks = snapshot.docs
        .map((d) => normalizeTask(arg.monthId, d.id, d.data()))
        .filter((task) => task !== null);

      // Update cache with real-time data
      updateCachedData(() => ({ tasks, boardExists: true, monthId: arg.monthId }));

      // Trigger analytics recalculation
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("task-changed", {
          detail: { monthId: arg.monthId, userId: arg.userId, tasksCount: tasks.length }
        }));
      }, 50);
    });

    await cacheEntryRemoved;
  } finally {
    if (unsubscribe) unsubscribe();
  }
}
```

### Real-time Benefits

- **Automatic cache updates** when data changes in Firestore
- **Debounced updates** prevent excessive re-renders
- **No manual cache invalidation** needed for CRUD operations
- **Cross-tab synchronization** via Firestore
- **Offline support** with automatic sync when online

## Caching Strategy

### Cache Configuration

```javascript
// Different cache strategies for different data types
const cacheConfig = {
  tasks: {
    keepUnusedDataFor: 300, // 5 minutes - frequently changing
    refetchOnFocus: false,
    refetchOnReconnect: false,
  },
  users: {
    keepUnusedDataFor: Infinity, // Never expire - static data
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  },
  reporters: {
    keepUnusedDataFor: Infinity, // Never expire - static data
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  }
};
```

### Cache Tags

```javascript
// Optimized cache tags for efficient invalidation
providesTags: (result, error, arg) => {
  const tags = [
    { type: "MonthTasks", id: arg.monthId }, // All tasks for this month
  ];
  
  // Only add user-specific tag if userId is provided
  if (arg.userId) {
    tags.push({ type: "MonthTasks", id: `${arg.monthId}_user_${arg.userId}` });
  }
  
  return tags;
}
```

### Cache Management

```javascript
// src/shared/hooks/useCacheManagement.js
export const useCacheManagement = () => {
  const dispatch = useDispatch();

  const clearCacheOnDataChange = useCallback((dataType, operation) => {
    switch (dataType) {
      case 'tasks':
        dispatch(tasksApi.util.invalidateTags([{ type: 'MonthTasks' }]));
        break;
      case 'users':
        dispatch(usersApi.util.invalidateTags([{ type: 'Users' }]));
        break;
      case 'reporters':
        dispatch(reportersApi.util.invalidateTags([{ type: 'Reporters' }]));
        break;
    }
  }, [dispatch]);

  return { clearCacheOnDataChange };
};
```

## Performance Optimizations

### 1. Request Deduplication

```javascript
const pendingRequests = new Map();

const deduplicateRequest = async (key, requestFn) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = requestFn();
  pendingRequests.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
};
```

### 2. Memoized Components

```javascript
// Prevent unnecessary re-renders
const MemoizedOptimizedSmallCard = React.memo(OptimizedSmallCard);

// Memoized data calculations
const analytics = useMemo(() => {
  if (!tasks || tasks.length === 0) return null;
  return calculateAnalyticsFromTasks(tasks, monthId, userId);
}, [tasks, monthId, userId]);
```

### 3. Conditional Data Fetching

```javascript
// Only fetch when needed
const shouldFetchDashboard = isAuthenticated && monthReady;
const dashboardData = useCentralizedDataAnalytics(
  shouldFetchDashboard ? userId : null
);

// Skip queries when not authenticated
const { data: tasksData } = useSubscribeToMonthTasksQuery(
  { monthId, userId },
  { skip: shouldSkipMonthData }
);
```

### 4. Debounced Updates

```javascript
// Prevent excessive real-time updates
let lastUpdateTime = 0;
const updateDebounce = 100; // 100ms debounce

const handleSnapshot = (snapshot) => {
  const now = Date.now();
  if (now - lastUpdateTime < updateDebounce) return;
  lastUpdateTime = now;
  
  // Process update
  updateCachedData(() => ({ tasks, boardExists: true, monthId }));
};
```

## Usage Patterns

### 1. Component Data Access

```javascript
// Clean, simple component interface
const DashboardMetrics = ({ userId }) => {
  const {
    tasks,
    users,
    analytics,
    getMetric,
    isLoading,
    error
  } = useCentralizedDataAnalytics(userId);

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {analytics && (
        <MetricCard
          title="Total Tasks"
          value={getMetric('total-tasks')}
        />
      )}
    </div>
  );
};
```

### 2. CRUD Operations

```javascript
// Mutations with automatic cache updates
const [createTask] = useCreateTaskMutation();
const [updateTask] = useUpdateTaskMutation();
const [deleteTask] = useDeleteTaskMutation();

const handleCreateTask = async (taskData) => {
  try {
    await createTask(taskData).unwrap();
    // Cache automatically updated via real-time subscription
    showSuccess("Task created successfully!");
  } catch (error) {
    showError(`Failed to create task: ${error.message}`);
  }
};
```

### 3. Real-time Data

```javascript
// Real-time data automatically available
const { data: tasksData } = useSubscribeToMonthTasksQuery({
  monthId: "2024-01",
  userId: "user123"
});

// Data updates automatically when Firestore changes
// No manual refresh needed
```

## Error Handling

### 1. API Error Handling

```javascript
// Comprehensive error categorization
const handleFirestoreError = (error, operation) => {
  if (error.code === 'permission-denied') {
    return { error: { message: 'Access denied', code: 'PERMISSION_DENIED' } };
  }
  
  if (error.code === 'unavailable') {
    return { error: { message: 'Service temporarily unavailable', code: 'SERVICE_UNAVAILABLE' } };
  }
  
  return { error: { message: error?.message || `Failed to ${operation}` } };
};
```

### 2. Component Error States

```javascript
// Graceful error handling in components
const DashboardPage = () => {
  const { dashboardData } = useUnifiedLoading(userId, !!user);

  if (dashboardData?.error) {
    return (
      <div className="card mt-10">
        <div className="text-center py-8">
          <h2>Error Loading Dashboard</h2>
          <p className="text-sm">
            {dashboardData.error?.message || "Failed to load dashboard data."}
          </p>
        </div>
      </div>
    );
  }
};
```

### 3. Middleware Error Handling

```javascript
// Global error notification middleware
const errorNotificationMiddleware = (storeAPI) => (next) => (action) => {
  const result = next(action);
  
  if (/_rejected$/i.test(action.type) && !action.meta?.suppressGlobalError) {
    const error = action.error || action.payload;
    const errorMessage = error?.message || error || "Operation failed";
    
    // Categorize errors for better UX
    if (error?.code === 'PERMISSION_DENIED') {
      showWarning("You don't have permission to perform this action.");
    } else {
      showError(errorMessage);
    }
  }
  
  return result;
};
```

## Best Practices

### 1. Data Normalization

```javascript
// Normalize data for Redux compatibility
const normalizeTask = (monthId, id, data) => {
  const createdAt = normalizeTimestamp(data.createdAt);
  const updatedAt = normalizeTimestamp(data.updatedAt);
  
  return {
    id,
    monthId,
    ...data,
    createdAt: createdAt ? createdAt.toISOString() : null,
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
    timeInHours: Number(data.timeInHours) || 0,
    timeSpentOnAI: Number(data.timeSpentOnAI) || 0,
  };
};
```

### 2. Transaction-based Operations

```javascript
// Atomic operations for data consistency
const createTask = async (task) => {
  return await runTransaction(db, async (transaction) => {
    // Read operation first
    const monthDocRef = doc(db, "tasks", monthId);
    const monthDoc = await transaction.get(monthDocRef);

    if (!monthDoc.exists()) {
      throw new Error("Month board not generated");
    }

    // Write operation
    const colRef = collection(db, "tasks", monthId, "monthTasks");
    const ref = await addDoc(colRef, payload);
    
    return normalizeTask(monthId, ref.id, savedSnap.data());
  });
};
```

### 3. Conditional Rendering

```javascript
// Only render when data is available
const DashboardMetrics = ({ userId }) => {
  const { analytics, isLoading, error } = useCentralizedDataAnalytics(userId);

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;
  if (!analytics) return <NoDataMessage />;

  return <MetricsDisplay analytics={analytics} />;
};
```

### 4. Performance Monitoring

```javascript
// Track slow operations
const performanceMiddleware = (storeAPI) => (next) => (action) => {
  const startTime = performance.now();
  const result = next(action);
  const endTime = performance.now();
  
  const duration = endTime - startTime;
  if (duration > 100) {
    logger.warn(`Slow action detected: ${action.type} took ${duration.toFixed(2)}ms`);
  }
  
  return result;
};
```

## Troubleshooting

### Common Issues

#### 1. Cache Not Updating

**Problem**: Data changes in Firestore but UI doesn't update.

**Solution**: Check real-time subscription setup:
```javascript
// Ensure onCacheEntryAdded is properly configured
async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded }) {
  await cacheDataLoaded;
  
  const unsubscribe = onSnapshot(query, (snapshot) => {
    updateCachedData(() => ({ tasks, boardExists: true, monthId }));
  });
}
```

#### 2. Excessive Re-renders

**Problem**: Components re-render too frequently.

**Solution**: Implement debouncing and memoization:
```javascript
// Debounce real-time updates
let lastUpdateTime = 0;
const updateDebounce = 100;

const handleSnapshot = (snapshot) => {
  const now = Date.now();
  if (now - lastUpdateTime < updateDebounce) return;
  lastUpdateTime = now;
  // Process update
};
```

#### 3. Authentication Issues

**Problem**: Queries fail due to authentication.

**Solution**: Use skip parameter:
```javascript
const { data } = useSubscribeToMonthTasksQuery(
  { monthId, userId },
  { skip: !auth.currentUser }
);
```

#### 4. Memory Leaks

**Problem**: Real-time subscriptions not cleaned up.

**Solution**: Proper cleanup in onCacheEntryAdded:
```javascript
async onCacheEntryAdded(arg, { cacheEntryRemoved }) {
  let unsubscribe = null;
  
  try {
    // Setup subscription
    unsubscribe = onSnapshot(query, callback);
    await cacheEntryRemoved;
  } finally {
    if (unsubscribe) unsubscribe();
  }
}
```

### Debug Tools

#### 1. Redux DevTools

Enable Redux DevTools for debugging:
```javascript
const store = configureStore({
  // ... other config
  devTools: process.env.NODE_ENV !== 'production',
});
```

#### 2. Logging

Use structured logging for debugging:
```javascript
logger.log('[useCentralizedDataAnalytics] Data updated:', {
  tasksCount: result.tasks?.length,
  usersCount: result.users?.length,
  hasAnalytics: !!result.analytics,
  userId: normalizedUserId
});
```

#### 3. Performance Monitoring

Track slow operations:
```javascript
const startTime = performance.now();
// ... operation
const endTime = performance.now();
logger.warn(`Slow operation: ${endTime - startTime}ms`);
```

## Conclusion

This RTK Query + Firestore implementation provides:

- **Zero manual state management** for data
- **Automatic real-time updates** via Firestore subscriptions
- **Intelligent caching** with optimized invalidation
- **Performance optimizations** out of the box
- **Clean component interfaces** with centralized data access
- **Robust error handling** with user-friendly messages
- **Production-ready** architecture with best practices

The architecture successfully abstracts away the complexity of data management while providing excellent performance and developer experience.
