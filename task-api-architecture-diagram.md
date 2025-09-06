# 🔥 Task API Architecture Diagram

## 📊 **OVERALL SYSTEM FLOW**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TASK TRACKER APPLICATION                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   USER DASHBOARD │    │  ADMIN DASHBOARD │    │   TASK TABLE    │            │
│  │                 │    │                 │    │                 │            │
│  │ useGetMonthTasks│    │ useGetMonthTasks│    │ useGetMonthTasks│            │
│  │ (userId, 'user')│    │ (userId, 'admin')│   │ (userId, 'user')│            │
│  └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘            │
│            │                      │                      │                    │
│            └──────────────────────┼──────────────────────┘                    │
│                                   │                                           │
│  ┌─────────────────────────────────▼─────────────────────────────────┐        │
│  │                    REDUX TOOLKIT QUERY                            │        │
│  │                                                                   │        │
│  │  ┌─────────────────────────────────────────────────────────────┐  │        │
│  │  │                tasksApi.js                                  │  │        │
│  │  │                                                             │  │        │
│  │  │  ┌─────────────────────────────────────────────────────┐   │  │        │
│  │  │  │            getMonthTasks Query                      │   │  │        │
│  │  │  │                                                     │   │  │        │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │  │        │
│  │  │  │  │         onCacheEntryAdded                   │   │   │  │        │
│  │  │  │  │                                             │   │   │  │        │
│  │  │  │  │  1. Authentication Check                    │   │   │  │        │
│  │  │  │  │  2. User Data Validation                    │   │   │  │        │
│  │  │  │  │  3. Role & Permission Check                 │   │   │  │        │
│  │  │  │  │  4. Board Existence Check                   │   │   │  │        │
│  │  │  │  │  5. Setup onSnapshot Listener               │   │   │  │        │
│  │  │  │  └─────────────────────────────────────────────┘   │   │  │        │
│  │  │  └─────────────────────────────────────────────────────┘   │  │        │
│  │  │                                                             │  │        │
│  │  │  ┌─────────────────────────────────────────────────────┐   │  │        │
│  │  │  │            CRUD Mutations                           │   │  │        │
│  │  │  │                                                     │   │  │        │
│  │  │  │  • createTask (Permission: create_task)            │   │  │        │
│  │  │  │  • updateTask (Permission: update_task)            │   │  │        │
│  │  │  │  • deleteTask (Permission: delete_task)            │   │  │        │
│  │  │  │  • generateCharts (Permission: generate_charts)    │   │  │        │
│  │  │  └─────────────────────────────────────────────────────┘   │  │        │
│  │  └─────────────────────────────────────────────────────────────┘  │        │
│  └───────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FIREBASE FIRESTORE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        Database Structure                               │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    /tasks/{monthId}                            │   │   │
│  │  │                                                                 │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │              /monthTasks/{taskId}                      │   │   │   │
│  │  │  │                                                         │   │   │   │
│  │  │  │  • taskName: string                                    │   │   │   │
│  │  │  │  • userUID: string                                     │   │   │   │
│  │  │  │  • timeInHours: number                                 │   │   │   │
│  │  │  │  • createdAt: timestamp                                │   │   │   │
│  │  │  │  • updatedAt: timestamp                                │   │   │   │
│  │  │  │  • ... other task fields                               │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    /users/{userId}                             │   │   │
│  │  │                                                                 │   │   │
│  │  │  • userUID: string                                             │   │   │
│  │  │  • email: string                                               │   │   │
│  │  │  • name: string                                                │   │   │
│  │  │  • role: 'admin' | 'user'                                      │   │   │
│  │  │  • permissions: string[]                                       │   │   │
│  │  │  • isActive: boolean                                           │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 **REAL-TIME DATA FLOW**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           REAL-TIME UPDATE FLOW                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐                                                           │
│  │   USER CREATES  │                                                           │
│  │      TASK       │                                                           │
│  └─────────┬───────┘                                                           │
│            │                                                                   │
│            ▼                                                                   │
│  ┌─────────────────┐                                                           │
│  │  createTask()   │                                                           │
│  │  Mutation       │                                                           │
│  │                 │                                                           │
│  │  1. Auth Check  │                                                           │
│  │  2. Permission  │                                                           │
│  │  3. Transaction │                                                           │
│  │  4. Save to DB  │                                                           │
│  └─────────┬───────┘                                                           │
│            │                                                                   │
│            ▼                                                                   │
│  ┌─────────────────┐                                                           │
│  │  FIRESTORE      │                                                           │
│  │  DOCUMENT       │                                                           │
│  │  CREATED        │                                                           │
│  └─────────┬───────┘                                                           │
│            │                                                                   │
│            ▼                                                                   │
│  ┌─────────────────┐                                                           │
│  │ onSnapshot      │                                                           │
│  │ Listener        │                                                           │
│  │                 │                                                           │
│  │  🔥 FIREBASE    │                                                           │
│  │  REAL-TIME      │                                                           │
│  │  TRIGGER        │                                                           │
│  └─────────┬───────┘                                                           │
│            │                                                                   │
│            ▼                                                                   │
│  ┌─────────────────┐                                                           │
│  │  updateCached   │                                                           │
│  │  Data()         │                                                           │
│  │                 │                                                           │
│  │  Redux Cache    │                                                           │
│  │  Updated        │                                                           │
│  └─────────┬───────┘                                                           │
│            │                                                                   │
│            ▼                                                                   │
│  ┌─────────────────┐                                                           │
│  │  UI COMPONENTS  │                                                           │
│  │                 │                                                           │
│  │  • Task Table   │                                                           │
│  │  • Dashboard    │                                                           │
│  │  • Cards        │                                                           │
│  │                 │                                                           │
│  │  ⚡ INSTANT     │                                                           │
│  │  UPDATE         │                                                           │
│  └─────────────────┘                                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔐 **SECURITY LAYERS**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        LAYER 1: AUTHENTICATION                         │   │
│  │                                                                         │   │
│  │  • Firebase Auth (auth.currentUser)                                    │   │
│  │  • Valid JWT Token                                                     │   │
│  │  • Active Session                                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                   │                                           │
│                                   ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        LAYER 2: USER VALIDATION                        │   │
│  │                                                                         │   │
│  │  • User exists in Firestore                                            │   │
│  │  • User data is complete                                               │   │
│  │  • User account is active (isActive: true)                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                   │                                           │
│                                   ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        LAYER 3: PERMISSION CHECK                       │   │
│  │                                                                         │   │
│  │  • create_task permission                                              │   │
│  │  • update_task permission                                              │   │
│  │  • delete_task permission                                              │   │
│  │  • generate_charts permission                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                   │                                           │
│                                   ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        LAYER 4: ROLE-BASED FILTERING                   │   │
│  │                                                                         │   │
│  │  Admin Role:                                                           │   │
│  │  • role: 'admin' + userUID → Fetches ALL tasks                        │   │
│  │  • No userUID filter applied                                          │   │
│  │                                                                         │   │
│  │  User Role:                                                            │   │
│  │  • role: 'user' + userUID → Fetches only own tasks                    │   │
│  │  • userUID filter: where("userUID", "==", userUID)                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📊 **ROLE-BASED DATA ACCESS**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ROLE-BASED ACCESS CONTROL                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        ADMIN USER                                       │   │
│  │                                                                         │   │
│  │  useGetMonthTasksQuery({                                                │   │
│  │    monthId: '2025-01',                                                  │   │
│  │    userId: 'adminUID',                                                  │   │
│  │    role: 'admin'                                                        │   │
│  │  })                                                                      │   │
│  │                                                                         │   │
│  │  Result:                                                                │   │
│  │  • userFilter = null                                                    │   │
│  │  • Query: collection().orderBy().limit()                               │   │
│  │  • Fetches ALL tasks for the month                                     │   │
│  │  • Can see all users' tasks                                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                   │                                           │
│                                   ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        REGULAR USER                                     │   │
│  │                                                                         │   │
│  │  useGetMonthTasksQuery({                                                │   │
│  │    monthId: '2025-01',                                                  │   │
│  │    userId: 'userUID',                                                   │   │
│  │    role: 'user'                                                         │   │
│  │  })                                                                      │   │
│  │                                                                         │   │
│  │  Result:                                                                │   │
│  │  • userFilter = 'userUID'                                               │   │
│  │  • Query: collection().where("userUID", "==", userUID).orderBy().limit()│   │
│  │  • Fetches only own tasks                                               │   │
│  │  • Cannot see other users' tasks                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## ⚡ **PERFORMANCE OPTIMIZATIONS**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PERFORMANCE FEATURES                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        REAL-TIME EFFICIENCY                            │   │
│  │                                                                         │   │
│  │  • onSnapshot listener (always active)                                 │   │
│  │  • Instant updates on any change                                       │   │
│  │  • No manual refresh needed                                            │   │
│  │  • Automatic reconnection handling                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        QUERY OPTIMIZATIONS                             │   │
│  │                                                                         │   │
│  │  • Limit: 500 tasks (covers 300-400/month)                            │   │
│  │  • OrderBy: createdAt desc (most recent first)                        │   │
│  │  • Role-based filtering (reduces data transfer)                       │   │
│  │  • Proper indexing on userUID and createdAt                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        CACHE MANAGEMENT                                │   │
│  │                                                                         │   │
│  │  • RTK Query cache with 5-minute retention                            │   │
│  │  • Real-time updates (no cache invalidation needed)                   │   │
│  │  • Proper cleanup on component unmount                                │   │
│  │  • Memory-efficient listener management                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 **HELPER FUNCTIONS**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           HELPER FUNCTIONS                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    getCurrentUserData()                                 │   │
│  │                                                                         │   │
│  │  • Fetches user data from Firestore                                    │   │
│  │  • Used in all CRUD operations                                         │   │
│  │  • Validates user exists and is active                                 │   │
│  │  • Returns null if user not found                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    hasPermission(userData, permission)                  │   │
│  │                                                                         │   │
│  │  • Checks if user has specific permission                              │   │
│  │  • Used in all CRUD operations                                         │   │
│  │  • Returns boolean                                                     │   │
│  │  • Handles missing permissions gracefully                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    normalizeTask(monthId, id, data)                    │   │
│  │                                                                         │   │
│  │  • Converts Firestore data to Redux-compatible format                  │   │
│  │  • Handles timestamps (converts to ISO strings)                        │   │
│  │  • Ensures arrays are properly formatted                               │   │
│  │  • Used in real-time updates and chart generation                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 **KEY FEATURES SUMMARY**

- ✅ **Real-time updates** via onSnapshot listeners
- ✅ **Multi-layer security** (auth, validation, permissions, roles)
- ✅ **Role-based data filtering** (admin sees all, users see own)
- ✅ **Permission-based CRUD** (granular access control)
- ✅ **Transaction-based operations** (data consistency)
- ✅ **Performance optimized** (efficient queries, caching)
- ✅ **Comprehensive logging** (debug and monitoring)
- ✅ **Proper cleanup** (memory management)
- ✅ **Error handling** (graceful failures)
- ✅ **Scalable architecture** (handles 300-400 tasks/month)

This architecture provides a robust, secure, and performant task management system! 🚀
