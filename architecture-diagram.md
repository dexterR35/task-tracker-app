# Task Tracker App - Current Architecture

## Mermaid Diagram

```mermaid
graph TB
    %% App Entry Point
    App[App.jsx] --> Router[Router Provider]
    Router --> RootLayout[Root Layout - Auth Check Only]
    RootLayout --> AppLayout[App Layout - Navigation Only]
    AppLayout --> Outlet[Outlet]

    %% Route Structure
    Outlet --> PublicRoutes[Public Routes]
    Outlet --> ProtectedRoutes[Protected Routes]
    
    PublicRoutes --> HomePage[Home Page - No Data]
    PublicRoutes --> LoginPage[Login Page - No Data]
    
    ProtectedRoutes --> UserRoutes[User Routes]
    ProtectedRoutes --> AdminRoutes[Admin Routes]
    
    %% User Routes
    UserRoutes --> UserDashboard[User Dashboard]
    UserRoutes --> UserTasks[User Tasks]
    
    %% Admin Routes
    AdminRoutes --> AdminDashboard[Admin Dashboard]
    AdminRoutes --> AdminTasks[Admin Tasks]
    AdminRoutes --> AdminManagement[Admin Management]
    AdminRoutes --> AdminAnalytics[Admin Analytics]

    %% Data Fetching Layer
    UserDashboard --> UserDataHook[useUserData Hook]
    UserTasks --> UserDataHook
    
    AdminDashboard --> AdminDataHook[useAdminData Hook]
    AdminTasks --> AdminDataHook
    AdminManagement --> AdminDataHook
    AdminAnalytics --> AdminDataHook

    %% API Layer
    UserDataHook --> UsersAPI[Users API]
    UserDataHook --> TasksAPI[Tasks API]
    
    AdminDataHook --> UsersAPI
    AdminDataHook --> ReportersAPI[Reporters API]
    AdminDataHook --> TasksAPI

    %% Redux Store
    UsersAPI --> ReduxStore[Redux Store]
    ReportersAPI --> ReduxStore
    TasksAPI --> ReduxStore
    AuthSlice[Auth Slice] --> ReduxStore
    CurrentMonthSlice[Current Month Slice] --> ReduxStore

    %% Authentication
    AuthSlice --> FirebaseAuth[Firebase Auth]
    FirebaseAuth --> Firestore[Firestore Database]

    %% Styling
    classDef appLayer fill:#e1f5fe
    classDef routeLayer fill:#f3e5f5
    classDef dataLayer fill:#e8f5e8
    classDef apiLayer fill:#fff3e0
    classDef storeLayer fill:#fce4ec

    class App,Router,RootLayout,AppLayout appLayer
    class PublicRoutes,ProtectedRoutes,UserRoutes,AdminRoutes,UserDashboard,UserTasks,AdminDashboard,AdminTasks,AdminManagement,AdminAnalytics routeLayer
    class UserDataHook,AdminDataHook dataLayer
    class UsersAPI,ReportersAPI,TasksAPI apiLayer
    class ReduxStore,AuthSlice,CurrentMonthSlice,FirebaseAuth,Firestore storeLayer
```

## Architecture Summary

### 🏗️ **Clean Architecture Principles**

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Data Flow**: Unidirectional data flow from API → Store → Components
3. **Role-Based Access**: Different data hooks for different user roles
4. **Route Protection**: Centralized in ProtectedRoute component

### 📊 **Data Fetching Strategy**

- **useUserData**: Fetches current user's data and tasks only
- **useAdminData**: Fetches all users, reporters, and tasks
- **No Redundant Fetching**: Each page fetches only what it needs
- **Cached Data**: RTK Query handles caching and deduplication

### 🔐 **Security & Access Control**

- **Route-Level Protection**: ProtectedRoute handles authentication
- **Role-Based Data**: Users only see their own data, admins see all
- **No Client-Side Security**: All security is enforced at the API level

### 🎯 **Key Benefits**

1. **Performance**: No over-fetching of data
2. **Maintainability**: Clear separation of concerns
3. **Scalability**: Easy to add new features and roles
4. **Security**: Proper access control at every level
