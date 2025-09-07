# Task Tracker App - Complete Architecture Diagram

## 🏗️ Application Architecture Overview

```
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
│                              APP LAYOUT                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    ROLE-BASED DATA FETCHING                            │   │
│  │                                                                         │   │
│  │  Admin Users:                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │   All Users     │  │   All Tasks     │  │   All Reporters │        │   │
│  │  │   (usersApi)    │  │   (tasksApi)    │  │   (reportersApi)│        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  │                                                                         │   │
│  │  Regular Users:                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │   Own User      │  │   Own Tasks     │  │   All Reporters │        │   │
│  │  │   (usersApi)    │  │   (tasksApi)    │  │   (reportersApi)│        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PAGES                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │ Admin Pages     │  │ User Pages      │  │ Public Pages    │                │
│  │                 │  │                 │  │                 │                │
│  │ • AdminTasks    │  │ • UserDashboard │  │ • HomePage      │                │
│  │ • Management    │  │                 │  │ • LoginPage     │                │
│  │ • Analytics     │  │                 │  │                 │                │
│  │ • Debug         │  │                 │  │                 │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            TABLE COMPONENTS                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   TaskTable     │  │   UserTable     │  │ ReporterTable   │                │
│  │                 │  │                 │  │                 │                │
│  │ • Receives data │  │ • Receives data │  │ • Receives data │                │
│  │   as props      │  │   as props      │  │   as props      │                │
│  │ • Handles CRUD  │  │ • Read-only     │  │ • Handles CRUD  │                │
│  │ • Uses Dynamic  │  │ • Uses Dynamic  │  │ • Uses Dynamic  │                │
│  │   Table         │  │   Table         │  │   Table         │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DYNAMIC TABLE                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    PRESENTATION LAYER                                  │   │
│  │                                                                         │   │
│  │  • TanStack Table (React Table)                                        │   │
│  │  • Sorting, Filtering, Pagination                                      │   │
│  │  • Column Management                                                   │   │
│  │  • Export to CSV                                                       │   │
│  │  • Responsive Design                                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │───▶│   RTK Query     │───▶│   useAppData    │
│   Firestore     │    │   APIs          │    │   Hook          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Redux Store   │    │   Cache Layer   │    │   Pages         │
│                 │    │                 │    │                 │
│ • auth          │    │ • Request       │    │ • AdminTasks    │
│ • currentMonth  │    │   Deduplication │    │ • Management    │
│ • tasksApi      │    │ • Cache Config  │    │ • UserDashboard │
│ • usersApi      │    │ • Error Handling│    │ • Analytics     │
│ • reportersApi  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Table Props   │    │   Table Actions │    │   UI Updates    │
│                 │    │                 │    │                 │
│ • data          │    │ • onEdit        │    │ • Loading States│
│ • isLoading     │    │ • onDelete      │    │ • Error States  │
│ • error         │    │ • onSelect      │    │ • Success Toast │
│ • monthId       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Key Architecture Patterns

### 1. **Unified Data Fetching**
- **Single Hook**: `useAppData()` handles all data fetching
- **Role-Based**: Automatically fetches appropriate data based on user role
- **Centralized**: All API calls managed in one place

### 2. **Separation of Concerns**
- **Pages**: Data fetching and business logic
- **Tables**: Presentation and user interactions
- **APIs**: Data access and caching

### 3. **RTK Query Integration**
- **Automatic Caching**: Built-in cache management
- **Request Deduplication**: Prevents duplicate API calls
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Centralized error management

### 4. **Role-Based Access Control**
- **Admin Users**: Access to all data (users, tasks, reporters)
- **Regular Users**: Access to own data only
- **Automatic Filtering**: Data filtered at API level

## 📁 File Structure & Responsibilities

```
src/
├── app/
│   ├── store.js              # Redux store configuration
│   ├── router.jsx            # React Router setup
│   └── firebase.js           # Firebase configuration
├── hooks/
│   ├── useAppData.js         # 🎯 MAIN DATA HOOK
│   └── useMonthData.js       # Month data from Redux
├── features/
│   ├── auth/                 # Authentication
│   ├── users/                # User management
│   ├── tasks/                # Task management
│   ├── reporters/            # Reporter management
│   └── currentMonth/         # Month state management
├── pages/
│   ├── admin/                # Admin pages (use useAppData)
│   ├── user/                 # User pages (use useAppData)
│   └── auth/                 # Authentication pages
├── components/
│   ├── ui/Table/             # Table components
│   └── layout/               # Layout components
└── context/
    ├── AuthProvider.jsx      # Auth context
    └── DarkModeProvider.jsx  # Theme context
```

## 🔧 Data Fetching Flow

### For Admin Users:
1. `useAppData()` calls `useGetUsersQuery()` → All users
2. `useAppData()` calls `useGetMonthTasksQuery(role: 'admin')` → All tasks
3. `useAppData()` calls `useGetReportersQuery()` → All reporters
4. Pages receive all data as props
5. Tables display filtered data

### For Regular Users:
1. `useAppData()` calls `useGetUserByUIDQuery()` → Own user data
2. `useAppData()` calls `useGetMonthTasksQuery(role: 'user')` → Own tasks
3. `useAppData()` calls `useGetReportersQuery()` → All reporters (for forms)
4. Pages receive filtered data as props
5. Tables display user's own data

## 🎨 Table Data Flow

```
Page Component (useAppData) 
    ↓ (props)
Table Component (TaskTable/UserTable/ReporterTable)
    ↓ (props)
DynamicTable Component
    ↓ (TanStack Table)
UI Rendering
```

## 🚀 Benefits of This Architecture

✅ **Centralized Data Management**: Single source of truth
✅ **Role-Based Security**: Automatic data filtering
✅ **Performance Optimized**: Caching and deduplication
✅ **Maintainable**: Clear separation of concerns
✅ **Scalable**: Easy to add new features
✅ **Type Safe**: Consistent data structures
✅ **Error Resilient**: Centralized error handling

## 🔍 Key Components

### useAppData Hook
- **Purpose**: Unified data fetching for entire app
- **Input**: User role, month ID
- **Output**: Filtered data based on role
- **Benefits**: Single hook, automatic role handling

### DynamicTable Component
- **Purpose**: Reusable table with advanced features
- **Features**: Sorting, filtering, pagination, export
- **Input**: Data array, columns, actions
- **Output**: Interactive table UI

### RTK Query APIs
- **Purpose**: Data access layer
- **Features**: Caching, deduplication, optimistic updates
- **Integration**: Firebase Firestore
- **Benefits**: Automatic cache management

This architecture provides a clean, maintainable, and scalable foundation for your task tracking application!
