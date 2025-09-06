┌─────────────────────────────────────────────────────────────────────────────────┐
│                                APPLICATION FLOW                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LOGIN PAGE    │───▶│   AUTH CHECK    │───▶│  ROLE CHECK     │
│   /login        │    │   (useAuth)     │    │  (canAccess)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APPLAYOUT                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    ROLE-BASED DATA FETCHING                            │   │
│  │                                                                         │   │
│  │  Admin Users:                                                          │   │
│  │  ├─ useGetUsersQuery() → All users                                     │   │
│  │  ├─ useGetReportersQuery() → All reporters                             │   │
│  │  └─ useGetMonthTasksQuery(userId: adminUID, role: 'admin') → All tasks │   │
│  │                                                                         │   │
│  │  Regular Users:                                                        │   │
│  │  ├─ useGetUserByUIDQuery(user.uid) → Own user data                     │   │
│  │  ├─ useGetReportersQuery() → SKIPPED (empty array)                     │   │
│  │  └─ useGetMonthTasksQuery(userId: user.uid, role: 'user') → Own tasks  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        NAVIGATION RENDERING                            │   │
│  │                                                                         │   │
│  │  Admin Users See:                                                      │   │
│  │  ├─ Admin Dashboard (/admin/dashboard)                                 │   │
│  │  ├─ Analytics (/admin/analytics)                                       │   │
│  │  ├─ User Management (/admin/users)                                     │   │
│  │  └─ Task Management (/admin/tasks)                                     │   │
│  │                                                                         │   │
│  │  Regular Users See:                                                    │   │
│  │  ├─ My Dashboard (/dashboard)                                          │   │
│  │  └─ My Tasks (/tasks)                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ROUTER                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        PROTECTED ROUTES                                │   │
│  │                                                                         │   │
│  │  User Routes:                                                          │   │
│  │  ├─ /dashboard → ProtectedRoute(requiredRole="user") → UserDashboardPage │   │
│  │  └─ /tasks → ProtectedRoute(requiredRole="user") → UserDashboardPage    │   │
│  │                                                                         │   │
│  │  Admin Routes:                                                         │   │
│  │  ├─ /admin/dashboard → ProtectedRoute(requiredRole="admin") → AdminDashboardPage │
│  │  ├─ /admin/analytics → ProtectedRoute(requiredRole="admin") → AnalyticsPage     │
│  │  ├─ /admin/users → ProtectedRoute(requiredRole="admin") → AdminManagementPage   │
│  │  └─ /admin/tasks → ProtectedRoute(requiredRole="admin") → AdminTasksPage        │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DASHBOARD PAGES                                     │
│                                                                                 │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────┐   │
│  │        USER DASHBOARD           │    │       ADMIN DASHBOARD           │   │
│  │      (UserDashboardPage)        │    │     (AdminDashboardPage)        │   │
│  │                                 │    │                                 │   │
│  │  Data Access:                   │    │  Data Access:                   │   │
│  │  ├─ Redux: getUserByUID query   │    │  ├─ Redux: getUsers query       │   │
│  │  ├─ Redux: user-specific tasks  │    │  ├─ Redux: getReporters query   │   │
│  │  └─ No reporters access         │    │  └─ Redux: all tasks query      │   │
│  │                                 │    │                                 │   │
│  │  Features:                      │    │  Features:                      │   │
│  │  ├─ Task creation form          │    │  ├─ Overall statistics          │   │
│  │  ├─ Personal task stats         │    │  ├─ All users overview          │   │
│  │  └─ Own task management         │    │  ├─ All tasks table             │   │
│  │                                 │    │  └─ Board generation controls   │   │
│  └─────────────────────────────────┘    └─────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────┐   │
│  │       ADMIN MANAGEMENT          │    │        ADMIN TASKS              │   │
│  │     (AdminManagementPage)       │    │      (AdminTasksPage)           │   │
│  │                                 │    │                                 │   │
│  │  Features:                      │    │  Features:                      │   │
│  │  ├─ User table (view only)      │    │  ├─ Task creation form          │   │
│  │  ├─ Reporter table (CRUD)       │    │  ├─ All tasks table             │   │
│  │  ├─ User selection cards        │    │  ├─ User filtering              │   │
│  │  └─ Reporter management         │    │  └─ Full task CRUD              │   │
│  └─────────────────────────────────┘    └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW                                            │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        REDUX STORE                                     │   │
│  │                                                                         │   │
│  │  usersApi:                                                             │   │
│  │  ├─ queries['getUsers(undefined)'] → All users (admin only)            │   │
│  │  └─ queries['getUserByUID({"userUID":"..."})'] → User data (user only) │   │
│  │                                                                         │   │
│  │  reportersApi:                                                         │   │
│  │  └─ queries['getReporters(undefined)'] → All reporters (admin only)    │   │
│  │                                                                         │   │
│  │  tasksApi:                                                             │   │
│  │  ├─ queries['getMonthTasks({"userId":null,"role":"admin"})'] → All tasks │   │
│  │  └─ queries['getMonthTasks({"userId":"...","role":"user"})'] → User tasks │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY & ACCESS CONTROL                             │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        ROLE-BASED ACCESS                               │   │
│  │                                                                         │   │
│  │  Route Level:                                                          │   │
│  │  ├─ ProtectedRoute checks authentication                               │   │
│  │  ├─ ProtectedRoute checks role (user/admin)                           │   │
│  │  └─ Redirects to /unauthorized if access denied                       │   │
│  │                                                                         │   │
│  │  Data Level:                                                           │   │
│  │  ├─ AppLayout fetches data based on user role                         │   │
│  │  ├─ Admin: Gets all data (users, reporters, tasks)                    │   │
│  │  └─ User: Gets only own data (user, tasks)                            │   │
│  │                                                                         │   │
│  │  UI Level:                                                             │   │
│  │  ├─ Navigation shows different links based on role                    │   │
│  │  ├─ Admin: Sees admin navigation                                      │   │
│  │  └─ User: Sees user navigation                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘





graph TB
    %% Clean Architecture - ACHIEVED!
    App[App.jsx] --> Router[Router Provider]
    Router --> RootLayout[Root Layout - Auth Check Only]
    RootLayout --> AppLayout[App Layout - Navigation Only]
    AppLayout --> Outlet[Outlet]
    
    %% Route-specific data fetching
    Outlet --> PublicRoutes[Public Routes]
    Outlet --> ProtectedRoutes[Protected Routes]
    
    PublicRoutes --> HomePage[Home Page - No Data]
    PublicRoutes --> LoginPage[Login Page - No Data]
    
    ProtectedRoutes --> UserRoutes[User Routes]
    ProtectedRoutes --> AdminRoutes[Admin Routes]
    
    UserRoutes --> UserDataFetch[User Data Fetch]
    AdminRoutes --> AdminDataFetch[Admin Data Fetch]
    
    %% Clean separation
    AppLayout --> Navigation[Navigation Only]
    UserDataFetch --> UserPages[User Pages]
    AdminDataFetch --> AdminPages[Admin Pages]