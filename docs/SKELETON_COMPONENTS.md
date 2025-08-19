# Skeleton Components Documentation

This document explains how to use the skeleton loading components throughout the task tracker app to provide better user experience during loading states.

## Overview

The skeleton components provide visual placeholders that mimic the actual content structure while data is being fetched or processed. This creates a smoother, more professional user experience.

## Components

### 1. Base Skeleton Component

The main `Skeleton` component with multiple variants:

```jsx
import Skeleton from '../components/ui/Skeleton';

// Basic usage
<Skeleton variant="text" />
<Skeleton variant="title" />
<Skeleton variant="card" />

// With custom properties
<Skeleton 
  variant="avatar" 
  circle 
  width="w-16" 
  height="h-16" 
/>
```

#### Available Variants

- `text` - Basic text line
- `title` - Larger text line
- `subtitle` - Medium text line
- `avatar` - Circular or square avatar
- `button` - Button placeholder
- `card` - Card container
- `table` - Table row
- `form` - Form field
- `chart` - Chart area
- `list` - List item
- `image` - Image placeholder
- `badge` - Badge/tag placeholder
- `input` - Input field
- `select` - Select dropdown
- `checkbox` - Checkbox
- `radio` - Radio button
- `switch` - Toggle switch
- `progress` - Progress bar
- `divider` - Horizontal line
- `spacer` - Vertical space

### 2. LoadingWrapper Component

A wrapper component that automatically shows skeletons when loading:

```jsx
import LoadingWrapper from '../components/ui/LoadingWrapper';

<LoadingWrapper 
  loading={isLoading} 
  error={error} 
  skeleton="table"
  skeletonProps={{ rows: 5, columns: 4 }}
>
  <YourActualComponent />
</LoadingWrapper>
```

#### Skeleton Types

- `card` - Shows SkeletonCard
- `table` - Shows SkeletonTable
- `form` - Shows SkeletonForm
- `chart` - Shows SkeletonChart
- `list` - Shows SkeletonList
- `grid` - Shows SkeletonGrid
- `text` - Shows SkeletonText
- `title` - Shows SkeletonTitle
- `avatar` - Shows SkeletonAvatar
- `button` - Shows SkeletonButton
- `input` - Shows SkeletonInput
- `badge` - Shows SkeletonBadge
- `custom` - Use custom fallback

### 3. Pre-built Skeleton Components

#### SkeletonCard
```jsx
import { SkeletonCard } from '../components/ui/Skeleton';

<SkeletonCard className="mb-4" />
```

#### SkeletonTable
```jsx
import { SkeletonTable } from '../components/ui/Skeleton';

<SkeletonTable rows={8} columns={6} />
```

#### SkeletonForm
```jsx
import { SkeletonForm } from '../components/ui/Skeleton';

<SkeletonForm fields={8} />
```

#### SkeletonGrid
```jsx
import { SkeletonGrid } from '../components/ui/Skeleton';

<SkeletonGrid items={6} columns={3} />
```

#### SkeletonText
```jsx
import { SkeletonText } from '../components/ui/Skeleton';

<SkeletonText lines={4} />
```

### 4. User Dropdown Skeletons

Specialized skeletons for user interface elements:

```jsx
import UserDropdownSkeleton, { UserDropdownListSkeleton } from '../components/ui/UserDropdownSkeleton';

// Single user item
<UserDropdownSkeleton />

// List of users
<UserDropdownListSkeleton items={5} />
```

## Usage Examples

### 1. Table Loading State

```jsx
import LoadingWrapper from '../components/ui/LoadingWrapper';

const TasksTable = ({ tasks, loading, error }) => {
  return (
    <LoadingWrapper 
      loading={loading} 
      error={error} 
      skeleton="table"
      skeletonProps={{ rows: 10, columns: 5 }}
    >
      <table className="w-full">
        {/* Your actual table content */}
      </table>
    </LoadingWrapper>
  );
};
```

### 2. Form Loading State

```jsx
const TaskForm = ({ loading, error }) => {
  return (
    <LoadingWrapper 
      loading={loading} 
      error={error} 
      skeleton="form"
      skeletonProps={{ fields: 8 }}
    >
      <form>
        {/* Your actual form content */}
      </form>
    </LoadingWrapper>
  );
};
```

### 3. Cards Grid Loading

```jsx
const AnalyticsCards = ({ data, loading }) => {
  return (
    <LoadingWrapper 
      loading={loading} 
      skeleton="grid"
      skeletonProps={{ items: 6, columns: 3 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Your actual cards */}
      </div>
    </LoadingWrapper>
  );
};
```

### 4. Custom Loading States

```jsx
const CustomComponent = ({ loading }) => {
  return (
    <LoadingWrapper 
      loading={loading} 
      skeleton="custom"
      fallback={
        <div className="custom-skeleton">
          <Skeleton variant="title" className="mb-4" />
          <Skeleton variant="text" count={3} />
        </div>
      }
    >
      {/* Your actual content */}
    </LoadingWrapper>
  );
};
```

### 5. Error Handling

```jsx
const DataComponent = ({ data, loading, error }) => {
  return (
    <LoadingWrapper 
      loading={loading} 
      error={error}
      skeleton="card"
    >
      {/* Your content */}
    </LoadingWrapper>
  );
};
```

## Integration with Notifications

The skeleton components work seamlessly with the notification system:

```jsx
import { useNotifications } from '../hooks/useNotifications';

const TaskComponent = () => {
  const { addSuccess, addError } = useNotifications();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // API call
      addSuccess('Task created successfully!');
    } catch (error) {
      addError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingWrapper loading={loading} skeleton="form">
      <TaskForm onSubmit={handleSubmit} />
    </LoadingWrapper>
  );
};
```

## Styling and Customization

### Custom Colors
```jsx
<Skeleton 
  variant="card" 
  className="bg-blue-200 border-blue-300" 
/>
```

### Custom Animations
```jsx
<Skeleton 
  variant="card" 
  animation="animate-bounce" 
/>
```

### Custom Sizes
```jsx
<Skeleton 
  variant="avatar" 
  width="w-20" 
  height="h-20" 
/>
```

### Rounded Variants
```jsx
<Skeleton 
  variant="card" 
  rounded="rounded-full" 
/>
```

## Best Practices

1. **Match Content Structure**: Make sure skeleton shapes match your actual content layout
2. **Consistent Sizing**: Use consistent dimensions across similar skeleton elements
3. **Appropriate Count**: Show realistic numbers of skeleton items (e.g., 5-10 table rows)
4. **Loading States**: Always provide loading states for async operations
5. **Error Handling**: Include error states with helpful messages
6. **Accessibility**: Skeletons automatically handle screen reader announcements

## Performance Considerations

- Skeletons are lightweight and don't impact performance
- Use appropriate skeleton types to avoid unnecessary re-renders
- Consider lazy loading for large lists with many skeleton items

## Troubleshooting

### Common Issues

1. **Skeleton not showing**: Check that `loading` prop is `true`
2. **Wrong skeleton type**: Verify the `skeleton` prop value
3. **Custom fallback not working**: Use `skeleton="custom"` with `fallback` prop
4. **Styling conflicts**: Ensure Tailwind classes are properly configured

### Debug Mode

Enable debug logging to troubleshoot skeleton rendering:

```jsx
// Add to your component
console.log('Loading state:', loading);
console.log('Skeleton type:', skeleton);
```

## Examples in the Codebase

- `TaskForm.jsx` - Form loading with skeleton
- `TasksTable.jsx` - Table loading with skeleton
- `AnalyticsSummary.jsx` - Analytics cards with skeleton

## Migration from react-loading-skeleton

If you're migrating from `react-loading-skeleton`:

```jsx
// Old
import Skeleton from 'react-loading-skeleton';
<Skeleton count={3} />

// New
import Skeleton from '../components/ui/Skeleton';
<Skeleton variant="text" count={3} />
```

The new components provide better integration with your app's design system and notification handling.
