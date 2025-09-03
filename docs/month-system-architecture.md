# Month System Architecture

## Overview
Real-time month management system with automatic month detection, board status monitoring, and seamless month transitions.

## Core Components

### 1. Redux Store (`currentMonthSlice`)
```javascript
// State Structure
{
  monthId: '2025-09',           // Current month (YYYY-MM format)
  monthName: 'September 2025',  // Human-readable month name
  boardExists: true,            // Board availability status
  isLoading: false,             // Initialization state
  isGenerating: false,          // Board creation state
  startDate: '2025-08-31T21:00:00.000Z',  // Month start
  endDate: '2025-09-30T20:59:59.999Z',    // Month end
  daysInMonth: 30,              // Days in current month
  lastChecked: 1756941409836,   // Last board check timestamp
  lastUpdated: 1756941409836    // Last state update timestamp
}
```

### 2. Month Change Detection (`useCurrentMonth`)
```javascript
// Purpose: Detect calendar month changes
const { monthId, currentMonthId, hasMonthChanged } = useCurrentMonth();

// Automatically detects when September → October
// Triggers month reinitialization
// Only used for detection, not data access
```

### 3. Data Access (Redux Selectors)
```javascript
// Direct Redux access - no hook overhead
const monthId = useSelector(selectCurrentMonthId);
const monthName = useSelector(selectCurrentMonthName);
const boardExists = useSelector(selectBoardExists);
```

## Key Features

### ✅ Real-Time Updates
- **Board Status**: Firebase real-time listener
- **Month Changes**: Automatic detection and reinitialization
- **Task Updates**: RTK Query real-time subscriptions

### ✅ Automatic Month Handling
- **Calendar Changes**: September 1st → October 1st
- **Month Detection**: Uses system date for accuracy
- **Seamless Transitions**: No manual intervention needed

### ✅ Board Management
- **Status Monitoring**: Real-time board existence tracking
- **Admin Creation**: Generate month boards (admin only)
- **Automatic Updates**: Board changes reflected instantly

## Architecture Flow

```
User Authentication → Month Initialization → Board Check → Real-time Setup
       ↓                    ↓              ↓           ↓
   Auth Check         Calculate Month   Check Board   Setup Listener
       ↓                    ↓              ↓           ↓
   Month Data         Update State    Update State   Monitor Changes
```

## Usage Examples

### Dashboard Page
```javascript
// Month change detection
const { monthId: hookMonthId } = useCurrentMonth();

// Data access via Redux
const monthId = useSelector(selectCurrentMonthId);
const boardExists = useSelector(selectBoardExists);

// Month change monitoring
useEffect(() => {
  if (hookMonthId && monthId && hookMonthId !== monthId) {
    dispatch(initializeCurrentMonth());
  }
}, [hookMonthId, monthId, dispatch]);
```

### Board Generation (Admin)
```javascript
const handleGenerateBoard = async () => {
  const result = await dispatch(generateMonthBoard({
    monthId,
    meta: { createdBy: user?.uid }
  })).unwrap();
};
```

## API Endpoints

### Month Management
- `initializeCurrentMonth()` - Initialize current month
- `checkMonthBoardExists(monthId)` - Check board existence
- `generateMonthBoard({ monthId, meta })` - Create month board (admin)

### Real-Time Features
- `setupBoardListener(monthId)` - Setup Firebase real-time listener
- `cleanupBoardListener(monthId)` - Cleanup listener on month change

## Performance Optimizations

### ✅ Smart Caching
- **Board Status**: 5-second cache for duplicate checks
- **Month Data**: Memoized selectors prevent unnecessary re-renders
- **Real-time**: Only fires on actual changes, not initial setup

### ✅ Efficient Updates
- **Conditional Updates**: Only update state when values actually change
- **Generation Guard**: Skip real-time updates during board creation
- **Change Detection**: Prevent duplicate month initializations

## Error Handling

### Graceful Degradation
- **Board Check Failures**: Fallback to `boardExists: false`
- **Listener Errors**: Assume board doesn't exist on error
- **Month Calculation**: Uses system date as fallback

### Logging & Debugging
- **Comprehensive Logging**: All operations logged with timestamps
- **State Tracking**: Monitor state changes and updates
- **Performance Metrics**: Track initialization and update times

## Best Practices

### ✅ Do's
- Use Redux selectors for data access
- Use `useCurrentMonth` only for month change detection
- Monitor real-time listener performance
- Implement proper error boundaries

### ❌ Don'ts
- Don't use `useCurrentMonth` for data access
- Don't manually manage month transitions
- Don't skip board existence checks
- Don't ignore real-time listener cleanup

## Future Enhancements

### 🚀 Planned Features
- **Multi-month Support**: Handle multiple months simultaneously
- **Advanced Caching**: Implement month data caching strategies
- **Performance Monitoring**: Track month system performance metrics
- **Offline Support**: Handle month changes during offline periods

### 🔧 Technical Improvements
- **WebSocket Integration**: Replace Firebase listeners with WebSockets
- **State Persistence**: Persist month state across sessions
- **Advanced Analytics**: Track month usage patterns
- **A/B Testing**: Test different month detection strategies

## Troubleshooting

### Common Issues
1. **Month Not Updating**: Check `useCurrentMonth` hook usage
2. **Board Status Stuck**: Verify Firebase listener setup
3. **Duplicate Updates**: Check generation state guards
4. **Performance Issues**: Monitor selector memoization

### Debug Commands
```javascript
// Check current month state
console.log(store.getState().currentMonth);

// Monitor month changes
console.log('Month changed:', monthId, '→', hookMonthId);

// Verify board status
console.log('Board exists:', boardExists);
```

---

**Last Updated**: September 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team
