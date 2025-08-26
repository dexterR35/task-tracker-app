# Role-Based Authentication System Guide

This guide explains how to use the new role-based authentication system implemented in the Task Tracker app.

## Overview

The role-based authentication system provides:

- **Role-based access control** for routes and UI components
- **Permission-based authorization** for specific actions
- **Dynamic navigation** based on user roles
- **Enhanced security** with account status validation
- **Flexible access control** through reusable components and hooks

## User Roles

### Available Roles

1. **`admin`** - Full system access
   - Can access all features and data
   - Can manage users and system settings
   - Has all permissions by default

2. **`user`** - Limited access
   - Can access their own data and features
   - Cannot access admin-only features
   - Has basic permissions

### Role Permissions

#### Admin Permissions
- `read:all` - Read all data
- `write:all` - Write to all data
- `delete:all` - Delete any data
- `manage:users` - Manage user accounts
- `manage:system` - Manage system settings
- `view:analytics` - View all analytics
- `export:data` - Export data

#### User Permissions
- `read:own` - Read own data
- `write:own` - Write to own data
- `view:own_analytics` - View own analytics

## Core Components

### 1. RoleBasedAccess Component

Conditionally renders content based on user roles and permissions.

```jsx
import { RoleBasedAccess } from '../shared/components';

// Basic role-based rendering
<RoleBasedAccess roles="admin">
  <AdminOnlyContent />
</RoleBasedAccess>

// Multiple roles
<RoleBasedAccess roles={["admin", "user"]}>
  <SharedContent />
</RoleBasedAccess>

// With permissions
<RoleBasedAccess permissions="manage:users">
  <UserManagementContent />
</RoleBasedAccess>

// With fallback
<RoleBasedAccess 
  roles="admin" 
  fallback={<AccessDeniedMessage />}
>
  <AdminContent />
</RoleBasedAccess>

// Hide completely if access denied
<RoleBasedAccess roles="admin" hideOnDeny>
  <AdminOnlyButton />
</RoleBasedAccess>
```

### 2. DynamicNavigation Component

Automatically shows navigation items based on user roles.

```jsx
import { DynamicNavigation } from '../shared/components';

<DynamicNavigation 
  className="flex space-x-4"
  itemClassName="nav-link"
/>
```

### 3. useAuth Hook

Provides authentication state and actions.

```jsx
import { useAuth } from '../shared/hooks/useAuth';

const { 
  user, 
  isAuthenticated, 
  isLoading, 
  role, 
  isAdmin, 
  isUser,
  login, 
  logout 
} = useAuth();
```

### 4. useRoleAccess Hook

Provides role-based access control utilities.

```jsx
import { useRoleAccess } from '../shared/hooks/useRoleAccess';

const {
  canAccessRole,
  hasAnyRole,
  hasAllRoles,
  hasAnyPermission,
  hasAllPermissions,
  canPerformAction,
  getEffectivePermissions
} = useRoleAccess();

// Check if user can access admin features
const canAccessAdmin = canAccessRole('admin');

// Check if user has specific permissions
const canManageUsers = hasAnyPermission(['manage:users']);

// Check if user can perform specific actions
const canCreateTask = canPerformAction('create:task');
```

## Route Protection

### Protected Routes

Routes are automatically protected based on user roles:

```jsx
// Admin-only routes
<AdminRoute>
  <AdminDashboardPage />
</AdminRoute>

// User routes (accessible by both users and admins)
<UserRoute>
  <UserDashboardPage />
</UserRoute>

// Custom role requirements
<ProtectedRoute requiredRole="admin">
  <AdminOnlyPage />
</ProtectedRoute>
```

### Route Configuration

The router automatically handles:
- Authentication state checking
- Role-based redirects
- Account status validation
- Error handling and display

## Implementation Examples

### 1. Conditional UI Rendering

```jsx
import { RoleBasedAccess, useRoleAccess } from '../shared/hooks';

const MyComponent = () => {
  const { canPerformAction } = useRoleAccess();

  return (
    <div>
      {/* Show for all authenticated users */}
      <RoleBasedAccess roles={["admin", "user"]}>
        <h1>Welcome to the Dashboard</h1>
      </RoleBasedAccess>

      {/* Show only for admins */}
      <RoleBasedAccess roles="admin">
        <AdminPanel />
      </RoleBasedAccess>

      {/* Show based on permissions */}
      <RoleBasedAccess permissions="manage:users">
        <UserManagementSection />
      </RoleBasedAccess>

      {/* Conditional button based on action permissions */}
      {canPerformAction('create:task') && (
        <button onClick={createTask}>Create Task</button>
      )}
    </div>
  );
};
```

### 2. Dynamic Navigation

```jsx
import { DynamicNavigation } from '../shared/components';

const Header = () => {
  return (
    <header>
      <nav>
        <DynamicNavigation 
          className="flex space-x-4"
          itemClassName="nav-link"
        />
      </nav>
    </header>
  );
};
```

### 3. Permission-Based Actions

```jsx
import { useRoleAccess } from '../shared/hooks/useRoleAccess';

const TaskActions = ({ task }) => {
  const { canPerformAction, isAdmin } = useRoleAccess();

  const handleDelete = () => {
    if (canPerformAction('delete:task')) {
      deleteTask(task.id);
    }
  };

  return (
    <div className="task-actions">
      {canPerformAction('read:task') && (
        <button onClick={() => viewTask(task.id)}>View</button>
      )}
      
      {canPerformAction('update:task') && (
        <button onClick={() => editTask(task.id)}>Edit</button>
      )}
      
      {canPerformAction('delete:task') && (
        <button onClick={handleDelete}>Delete</button>
      )}
    </div>
  );
};
```

### 4. Form Validation Based on Permissions

```jsx
import { useRoleAccess } from '../shared/hooks/useRoleAccess';

const TaskForm = () => {
  const { canPerformAction } = useRoleAccess();

  const validationSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    description: Yup.string(),
    // Only validate priority if user can manage tasks
    priority: canPerformAction('manage:tasks') 
      ? Yup.string().required('Priority is required')
      : Yup.string(),
  });

  return (
    <Formik validationSchema={validationSchema}>
      {/* Form fields */}
    </Formik>
  );
};
```

## Error Handling

### Authentication Errors

The system automatically handles:
- Invalid credentials
- Account deactivation
- Role validation errors
- Permission denied errors

### Error Display

```jsx
// Errors are automatically displayed in the login page
// and can be accessed through the useAuth hook

const { error } = useAuth();

if (error) {
  console.error('Authentication error:', error);
}
```

## Security Features

### Account Status Validation

- Users with `isActive: false` are automatically blocked
- Deactivated accounts cannot log in
- Active status is checked on every request

### Role Validation

- Invalid roles are rejected during login
- Role changes require re-authentication
- Role-based redirects prevent unauthorized access

### Permission Inheritance

- Admins automatically have all permissions
- Permissions can be granularly controlled
- Permission checks are performed at multiple levels

## Best Practices

### 1. Always Use Role-Based Components

```jsx
// ✅ Good - Use RoleBasedAccess component
<RoleBasedAccess roles="admin">
  <AdminContent />
</RoleBasedAccess>

// ❌ Bad - Manual role checking
{user?.role === 'admin' && <AdminContent />}
```

### 2. Use Permission-Based Actions

```jsx
// ✅ Good - Use permission checks
const canDelete = canPerformAction('delete:task');

// ❌ Bad - Manual permission checking
const canDelete = user?.permissions?.includes('delete:task');
```

### 3. Implement Fallbacks

```jsx
// ✅ Good - Provide fallback content
<RoleBasedAccess 
  roles="admin" 
  fallback={<AccessDeniedMessage />}
>
  <AdminContent />
</RoleBasedAccess>
```

### 4. Use Hooks for Complex Logic

```jsx
// ✅ Good - Use useRoleAccess hook
const { canAccessRole, hasAnyPermission } = useRoleAccess();

// ❌ Bad - Direct state access
const canAccess = user?.role === 'admin';
```

## Testing

### Testing Role-Based Access

```jsx
import { render, screen } from '@testing-library/react';
import { RoleBasedAccess } from '../shared/components';

// Test admin access
test('shows admin content for admin users', () => {
  render(
    <RoleBasedAccess roles="admin">
      <div>Admin Content</div>
    </RoleBasedAccess>
  );
  
  expect(screen.getByText('Admin Content')).toBeInTheDocument();
});

// Test user access
test('hides admin content for regular users', () => {
  render(
    <RoleBasedAccess roles="admin">
      <div>Admin Content</div>
    </RoleBasedAccess>
  );
  
  expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
});
```

## Migration Guide

### From Old Authentication System

1. **Replace manual role checks** with `RoleBasedAccess` components
2. **Update route protection** to use new `ProtectedRoute` components
3. **Replace permission checks** with `useRoleAccess` hook
4. **Update navigation** to use `DynamicNavigation` component

### Example Migration

```jsx
// Old way
{user?.role === 'admin' && <AdminPanel />}

// New way
<RoleBasedAccess roles="admin">
  <AdminPanel />
</RoleBasedAccess>
```

## Troubleshooting

### Common Issues

1. **Component not rendering**: Check if user has required role/permissions
2. **Navigation not showing**: Verify user is authenticated and has valid role
3. **Permission denied**: Check if user has required permissions
4. **Route access denied**: Verify route protection configuration

### Debug Tools

```jsx
// Debug user state
const { user, isAuthenticated, role } = useAuth();
console.log('User state:', { user, isAuthenticated, role });

// Debug permissions
const { getEffectivePermissions } = useRoleAccess();
console.log('Effective permissions:', getEffectivePermissions());
```

## Conclusion

The role-based authentication system provides a robust, secure, and flexible way to manage user access throughout the application. By using the provided components and hooks, you can easily implement role-based access control while maintaining clean, maintainable code.

For additional support or questions, refer to the component documentation or contact the development team.

