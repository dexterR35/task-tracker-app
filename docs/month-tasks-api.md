# Month System with Tasks API

## Overview
The month system in this application organizes tasks by calendar months, allowing for efficient data management and real-time updates. The system automatically detects month changes and handles transitions seamlessly.

## How It Works

### 1. Month Structure
- **Month ID Format**: `YYYY-MM` (e.g., "2025-08" for August 2025)
- **Collection Path**: `tasks/{monthId}/monthTasks`
- **Data Organization**: All tasks for a specific month are stored in a single collection

### 2. Month Detection & Change Management
The application automatically detects the current month and switches when needed:

#### Automatic Month Change Detection
```javascript
// Check for month changes 
useEffect(() => {
  if (!monthId) return;

  // Get current month ID
  const currentMonthId = format(new Date(), 'yyyy-MM');
  
  // Check if month has changed
  if (monthId !== currentMonthId) {
    logger.log(`[useCurrentMonth] Month changed from ${monthId} to ${currentMonthId}, reinitializing`);
    
    // Clean up old month's listener before switching
    if (lastMonthIdRef.current) {
      cleanupBoardListener(lastMonthIdRef.current);
    }
    
    dispatch(initializeCurrentMonth());
  }
  
  // Store current month for next check
  lastMonthIdRef.current = monthId;
}, [monthId, dispatch]);
```

#### What Happens on Month Change
- **Detects month change** - Compares stored month vs current date
- **Logs the change** - Debug information
- **Cleans up old month** - Removes Firebase listeners
- **Reinitializes** - Sets up new month automatically
- **Updates all components** - Everything gets new month data

### 3. Tasks API Integration

#### Collection Paths
```javascript
// Tasks are stored in month-specific collections
`tasks/${monthId}/monthTasks`
```

#### Query Parameters
```javascript
// All task queries require monthId
useGetMonthTasksQuery(monthId)
subscribeToMonthTasks(monthId)
```

#### Data Structure
```javascript
// Each task includes monthId for organization
{
  id: "task123",
  title: "Sample Task",
  monthId: "2025-08",  // Links task to specific month
  // ... other task properties
}
```

### 4. Real-Time Updates
- **Firebase Listeners**: Each month has its own real-time listener
- **Automatic Cleanup**: Old month listeners are cleaned up when switching
- **Cache Management**: RTK Query manages month-specific caching

### 5. Month Switching Process
1. **Detection**: `useCurrentMonth` hook detects month change
2. **Cleanup**: Removes old month's Firebase listener
3. **Initialization**: Sets up new month's data and listeners
4. **Data Fetch**: Automatically fetches tasks for new month

### 6. Why tasksApi Uses monthId Parameters


```javascript
// This would be problematic:
const tasksApi = createApi({
  endpoints: (builder) => ({
    getMonthTasks: builder.query({
      // ❌ BAD: Directly accessing Redux state
      async queryFn({ monthId, userId } = {}, { getState }) {
        const currentMonthId = getState().currentMonth.monthId; // Direct slice access
        
        // What if monthId parameter is different from currentMonth?
        // What if user wants to view a different month?
        // What if month changes while query is running?
      }
    })
  })
});
```

#### ✅ Why Your Current Approach is Better
```javascript
// ✅ GOOD: Uses monthId parameter
getMonthTasks: builder.query({
  async queryFn({ monthId, userId = null } = {}) {
    // monthId comes from the component that calls this query
    // NOT from the Redux slice
  }
});
```

#### 🔄 The Flow
```
1. useCurrentMonth() → Gets monthId from Redux slice
2. useFetchData() → Calls useGetMonthTasksQuery({ monthId })
3. tasksApi → Receives monthId as parameter
4. Firebase query → Uses the passed monthId
```

#### 🎯 Benefits of Parameter-Based Design
- **Flexibility**: Query ANY month, not just current month
- **Predictable**: Always uses the monthId you pass
- **No Race Conditions**: Old queries continue, new queries start clean
- **Reusable**: Same query for different months and components
- **Testable**: Easy to test with different monthId values

## Real-World Scenarios

### Scenario 1: User stays up past midnight
- **11:59 PM** - July 31st: `monthId: "2025-07"`
- **12:00 AM** - August 1st: ✅ **AUTOMATICALLY DETECTED!** `monthId: "2025-08"`

### Scenario 2: User opens app in new month
- User closes app on July 15th
- User opens app on August 3rd
- ✅ **AUTOMATICALLY DETECTED!** App switches to August

### Scenario 3: Cross-month navigation
- User manually navigates to different month
- ✅ Hook detects the change and updates all components

## Usage Examples

### Getting Current Month Tasks
```javascript
const { monthId } = useCurrentMonth();
const { data: tasks } = useGetMonthTasksQuery(monthId);
```

### Subscribing to Month Updates
```javascript
const { data: tasks } = subscribeToMonthTasks(monthId);
```

### Creating Month-Specific Tasks
```javascript
const [createTask] = useCreateTaskMutation();
createTask({ ...taskData, monthId: "2025-08" });
```

### Real-time Month Updates
```javascript
const { monthId, monthName, boardExists } = useCurrentMonth();

// When month changes from July to August:
// monthId: "2025-07" → "2025-08"
// monthName: "July 2025" → "August 2025"
// boardExists: true/false (for new month)
```

## Key Components

- **`currentMonthSlice`**: Manages month state and logic
- **`useCurrentMonth`**: Hook for month detection and management
- **`tasksApi`**: Handles month-specific task operations
- **Firebase Listeners**: Real-time updates per month

## Benefits

✅ **Zero user intervention** - Month changes are automatic  
✅ **Real-time updates** - All components stay in sync  
✅ **Memory efficient** - Cleans up old month resources  
✅ **Debug friendly** - Logs all month changes  
✅ **Production ready** - Handles edge cases automatically  
✅ **Performance** - Only loads data for current month  
✅ **Scalability** - Each month's data is isolated  
✅ **Efficiency** - Automatic cleanup prevents memory leaks  

## User Experience

- **User doesn't need to do anything** - Month changes automatically
- **All data updates** - Tasks, analytics, etc. switch to new month
- **Seamless transition** - No manual refresh needed
- **Consistent state** - Everything stays in sync

This system ensures efficient data management while maintaining real-time capabilities for each month's tasks. Your app is **intelligent** - it knows when months change and handles everything automatically! 🚀
