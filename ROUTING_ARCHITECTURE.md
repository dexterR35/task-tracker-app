# Routing Architecture - Improved Nested Routes

## Overview

The routing structure has been completely restructured to provide better separation between public and authenticated routes, with proper nested layouts and improved navigation.

## New Routing Structure

### Route Hierarchy

```
/ (RootLayout)
├── / (PublicLayout)
│   ├── / (HomePage)
│   ├── /login (LoginPage)
│   └── /unauthorized (UnauthorizedPage)
└── /user (AuthenticatedLayout)
    ├── /user (DashboardPage)
    └── /admin (AuthenticatedLayout)
        ├── /admin (DashboardPage)
        ├── /admin/management (AdminManagementPage)
        └── /admin/analytics (ComingSoonPage)
```

## Key Improvements

### 1. **RootLayout - Centralized Auth Management**

```javascript
const RootLayout = () => {
  const { user, isAuthChecking } = useAuthState();
  const location = useLocation();

  // Show loading during auth check
  if (isAuthChecking) {
    return <Loader text="Checking authentication..." />;
  }

  // Auto-redirect authenticated users from public routes
  if (user) {
    const isOnPublicRoute = ['/', '/login', '/unauthorized'].includes(location.pathname);
    
    if (isOnPublicRoute) {
      if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
      } else {
        return <Navigate to="/user" replace />;
      }
    }
  }

  // Redirect unauthenticated users to login
  if (!user && !['/', '/login', '/unauthorized'].includes(location.pathname)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
```

**Benefits:**
- ✅ **Centralized auth logic** - All auth decisions in one place
- ✅ **Automatic redirects** - Users go to appropriate dashboard
- ✅ **Clean separation** - Public vs authenticated routes
- ✅ **No layout conflicts** - Each route type has its own layout

### 2. **PublicLayout - Clean Public Pages**

```javascript
const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-primary">
      {/* Simple navigation - only logo and dark mode */}
      <nav>
        <Link to="/">Task Tracker</Link>
        <DarkModeToggle />
      </nav>
      
      <main>
        <Outlet />
      </main>
    </div>
  );
};
```

**Benefits:**
- ✅ **Simple navigation** - Only essential elements
- ✅ **No auth checks** - Clean and fast
- ✅ **Consistent branding** - Logo and dark mode always available

### 3. **AuthenticatedLayout - Rich Navigation**

```javascript
const AuthenticatedLayout = () => {
  const { user, canAccess, logout } = useAuth();
  
  // Role-based navigation items
  const navigationItems = useMemo(() => {
    if (canAccess('admin')) {
      return [
        { name: "Dashboard", href: "/admin", icon: ViewColumnsIcon },
        { name: "Management", href: "/admin/management", icon: UsersIcon },
        { name: "Analytics", href: "/admin/analytics", icon: ChartBarIcon },
      ];
    } else {
      return [
        { name: "My Dashboard", href: "/user", icon: HomeIcon },
      ];
    }
  }, [canAccess]);

  return (
    <div className="min-h-screen bg-white dark:bg-primary">
      {/* Rich navigation with user info */}
      <nav>
        <Link to="/">Task Tracker</Link>
        {navigationItems.map(item => (
          <Link key={item.name} to={item.href}>
            <item.icon />
            {item.name}
          </Link>
        ))}
        <UserInfo user={user} />
        <LogoutButton onClick={logout} />
      </nav>
      
      <main>
        <Outlet />
      </main>
    </div>
  );
};
```

**Benefits:**
- ✅ **Role-based navigation** - Different menus for different roles
- ✅ **User information** - Profile, role badge, logout
- ✅ **Rich interactions** - Full navigation experience
- ✅ **Consistent layout** - All authenticated pages share same layout

## Route Protection

### 1. **ProtectedRoute Component**

```javascript
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthChecking, error, canAccess } = useAuthState();

  if (isAuthChecking) {
    return <Loader text="Checking authentication..." />;
  }

  if (error) {
    return <Navigate to="/login" replace state={{ error }} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !canAccess(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
```

### 2. **Route Creation Helpers**

```javascript
// Create user routes (accessible by both users and admins)
const createUserRoute = (Component, loadingText = "Loading...") => 
  createProtectedRoute(Component, "user", loadingText);

// Create admin-only routes
const createAdminRoute = (Component, loadingText = "Loading admin...") => 
  createProtectedRoute(Component, "admin", loadingText);
```

## Navigation Flow

### 1. **Unauthenticated User**
```
1. User visits any route
2. RootLayout checks auth state
3. If not authenticated → redirect to /login
4. LoginPage renders with PublicLayout
```

### 2. **Authenticated User - Public Route**
```
1. User visits / or /login
2. RootLayout detects authenticated user
3. Auto-redirect to appropriate dashboard:
   - Admin → /admin
   - User → /user
4. DashboardPage renders with AuthenticatedLayout
```

### 3. **Authenticated User - Protected Route**
```
1. User visits /admin or /user
2. RootLayout allows access (user is authenticated)
3. AuthenticatedLayout renders with navigation
4. ProtectedRoute checks role permissions
5. Page renders if authorized
```

## Layout Benefits

### 1. **Clear Separation of Concerns**
- **PublicLayout**: Simple, clean, fast
- **AuthenticatedLayout**: Rich, feature-complete
- **RootLayout**: Auth management and redirects

### 2. **Better User Experience**
- **Automatic redirects** - Users go where they should
- **Role-based navigation** - Relevant menu items
- **Consistent layouts** - No layout switching issues
- **Loading states** - Clear feedback during auth checks

### 3. **Developer Experience**
- **Cleaner code** - Each layout has a single responsibility
- **Easier maintenance** - Auth logic centralized
- **Better testing** - Each layout can be tested independently
- **Type safety** - Clear route structure

## Migration Benefits

### Before (Issues):
- ❌ Mixed layouts in same route structure
- ❌ Complex auth checks scattered throughout
- ❌ Layout conflicts and flashing
- ❌ Inconsistent navigation
- ❌ Hard to maintain and debug

### After (Improvements):
- ✅ Clear separation of public and authenticated routes
- ✅ Centralized auth management
- ✅ Consistent layouts per route type
- ✅ Role-based navigation
- ✅ Automatic redirects
- ✅ Better performance and UX

## Usage Examples

### Adding New Public Routes
```javascript
// In router.jsx
{
  element: <PublicLayout />,
  children: [
    { index: true, element: <HomePage /> },
    { path: "login", element: <LoginPage /> },
    { path: "about", element: <AboutPage /> }, // New public route
    { path: "unauthorized", element: <UnauthorizedPage /> },
  ],
}
```

### Adding New User Routes
```javascript
// In router.jsx
{
  element: <AuthenticatedLayout />,
  children: [
    {
      path: "user",
      children: [
        { index: true, element: createUserRoute(DashboardPage) },
        { path: "profile", element: createUserRoute(ProfilePage) }, // New user route
      ],
    },
  ],
}
```

### Adding New Admin Routes
```javascript
// In router.jsx
{
  element: <AuthenticatedLayout />,
  children: [
    {
      path: "admin",
      children: [
        { index: true, element: createAdminRoute(DashboardPage) },
        { path: "management", element: createAdminRoute(AdminManagementPage) },
        { path: "settings", element: createAdminRoute(AdminSettingsPage) }, // New admin route
      ],
    },
  ],
}
```

## Best Practices

### 1. **Route Organization**
- Keep public routes in PublicLayout
- Keep authenticated routes in AuthenticatedLayout
- Use role-based route protection
- Use lazy loading for heavy components

### 2. **Navigation**
- Use role-based navigation items
- Keep navigation consistent within each layout
- Provide clear visual feedback for current page
- Include user information in authenticated layout

### 3. **Auth Management**
- Centralize auth logic in RootLayout
- Use proper loading states
- Handle auth errors gracefully
- Provide clear redirect paths

### 4. **Performance**
- Use lazy loading for route components
- Memoize navigation items
- Avoid unnecessary re-renders
- Use proper loading indicators

This new routing architecture provides a much cleaner, more maintainable, and user-friendly experience while following React Router best practices.
