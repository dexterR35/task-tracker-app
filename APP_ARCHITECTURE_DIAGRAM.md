


graph TB
    %% User Interface Layer
    subgraph "User Interface Layer"
        UI[User Interface Components]
        LoginPage[Login Page]
        Dashboard[Admin/User Dashboard]
        TaskForm[Task Form]
        TaskTable[Tasks Table]
        Charts[Analytics Charts]
    end

    %% Authentication Flow
    subgraph "Authentication Flow"
        AuthProvider[AuthProvider Context]
        AuthSlice[Auth Redux Slice]
        FirebaseAuth[Firebase Auth]
        FirestoreUsers[Firestore Users Collection]
        
        LoginPage --> AuthProvider
        AuthProvider --> AuthSlice
        AuthSlice --> FirebaseAuth
        FirebaseAuth --> FirestoreUsers
        FirestoreUsers --> AuthSlice
        AuthSlice --> AuthProvider
        AuthProvider --> Dashboard
    end

    %% State Management
    subgraph "Redux State Management"
        Store[Redux Store]
        AuthReducer[Auth Reducer]
        NotificationReducer[Notification Reducer]
        TasksApi[Tasks RTK Query API]
        UsersApi[Users RTK Query API]
        
        AuthSlice --> AuthReducer
        AuthReducer --> Store
        NotificationReducer --> Store
        TasksApi --> Store
        UsersApi --> Store
    end

    %% Data Flow & CRUD Operations
    subgraph "Data Flow & CRUD"
        TaskForm --> TasksApi
        TaskTable --> TasksApi
        TasksApi --> FirestoreTasks[Firestore Tasks Collection]
        
        %% CRUD Operations
        CreateTask[Create Task Mutation]
        UpdateTask[Update Task Mutation]
        DeleteTask[Delete Task Mutation]
        GetTasks[Get Tasks Query]
        SubscribeTasks[Subscribe to Tasks]
        
        TasksApi --> CreateTask
        TasksApi --> UpdateTask
        TasksApi --> DeleteTask
        TasksApi --> GetTasks
        TasksApi --> SubscribeTasks
        
        CreateTask --> FirestoreTasks
        UpdateTask --> FirestoreTasks
        DeleteTask --> FirestoreTasks
        GetTasks --> FirestoreTasks
        SubscribeTasks --> FirestoreTasks
    end

    %% Real-time Updates
    subgraph "Real-time Updates"
        FirebaseListener[Firebase onSnapshot]
        TaskChangedEvent[Task Changed Event]
        CacheInvalidation[Cache Invalidation]
        
        FirestoreTasks --> FirebaseListener
        FirebaseListener --> TaskChangedEvent
        TaskChangedEvent --> CacheInvalidation
    end

    %% Analytics & Calculations
    subgraph "Analytics & Calculations"
        AnalyticsCalculator[Analytics Calculator]
        CentralizedAnalytics[useCentralizedAnalytics Hook]
        AnalyticsCache[Analytics Cache Manager]
        
        %% Calculation Types
        SummaryCalc[Summary Calculations]
        CategoryCalc[Category Analytics]
        PerformanceCalc[Performance Analytics]
        MarketCalc[Market Analytics]
        ProductCalc[Product Analytics]
        AICalc[AI Analytics]
        TrendCalc[Trend Analytics]
        
        AnalyticsCalculator --> SummaryCalc
        AnalyticsCalculator --> CategoryCalc
        AnalyticsCalculator --> PerformanceCalc
        AnalyticsCalculator --> MarketCalc
        AnalyticsCalculator --> ProductCalc
        AnalyticsCalculator --> AICalc
        AnalyticsCalculator --> TrendCalc
        
        CentralizedAnalytics --> AnalyticsCalculator
        AnalyticsCache --> AnalyticsCalculator
    end

    %% Caching Strategy
    subgraph "Caching Strategy"
        ReduxCache[Redux RTK Query Cache]
        AnalyticsCache[Analytics In-Memory Cache]
        MemoizationCache[Memoization Cache]
        
        TasksApi --> ReduxCache
        AnalyticsCalculator --> AnalyticsCache
        AnalyticsCalculator --> MemoizationCache
    end

    %% Data Processing Pipeline
    subgraph "Data Processing Pipeline"
        TaskNormalization[Task Normalization]
        TimestampSerialization[Timestamp Serialization]
        DataValidation[Data Validation]
        
        FirestoreTasks --> TaskNormalization
        TaskNormalization --> TimestampSerialization
        TimestampSerialization --> DataValidation
        DataValidation --> AnalyticsCalculator
    end

    %% Error Handling & Notifications
    subgraph "Error Handling & Notifications"
        ErrorMiddleware[Error Middleware]
        AuthMiddleware[Auth Middleware]
        NotificationSlice[Notification Slice]
        ErrorBoundary[Error Boundary]
        
        TasksApi --> ErrorMiddleware
        ErrorMiddleware --> AuthMiddleware
        AuthMiddleware --> NotificationSlice
        NotificationSlice --> UI
        ErrorBoundary --> UI
    end

    %% Performance Optimization
    subgraph "Performance Optimization"
        Debouncing[Calculation Debouncing]
        Memoization[React Memoization]
        LazyLoading[Lazy Loading]
        Pagination[Pagination]
        
        AnalyticsCalculator --> Debouncing
        CentralizedAnalytics --> Memoization
        TasksApi --> LazyLoading
        TasksApi --> Pagination
    end

    %% Routing & Navigation
    subgraph "Routing & Navigation"
        Router[React Router]
        ProtectedRoutes[Protected Routes]
        RoleBasedAccess[Role-Based Access]
        
        UI --> Router
        Router --> ProtectedRoutes
        ProtectedRoutes --> RoleBasedAccess
        RoleBasedAccess --> Dashboard
    end

    %% External Services
    subgraph "External Services"
        Firebase[Firebase Project]
        Firestore[Firestore Database]
        FirebaseAuth[Firebase Authentication]
        
        Firebase --> Firestore
        Firebase --> FirebaseAuth
    end

    %% Connections between major systems
    Dashboard --> CentralizedAnalytics
    CentralizedAnalytics --> AnalyticsCalculator
    AnalyticsCalculator --> CacheInvalidation
    CacheInvalidation --> AnalyticsCache
    
    TaskChangedEvent --> CentralizedAnalytics
    CentralizedAnalytics --> Charts
    
    Store --> UI
    UI --> Store
    
    %% Data flow arrows
    FirestoreTasks -.->|Real-time Updates| FirebaseListener
    FirebaseListener -.->|Events| TaskChangedEvent
    TaskChangedEvent -.->|Invalidate| AnalyticsCache
    AnalyticsCache -.->|Recalculate| AnalyticsCalculator
    AnalyticsCalculator -.->|Results| Charts

    %% Styling
    classDef uiClass fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef authClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef stateClass fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef dataClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef analyticsClass fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef cacheClass fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef errorClass fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef perfClass fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    classDef routingClass fill:#fafafa,stroke:#424242,stroke-width:2px
    classDef externalClass fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px

    class UI,LoginPage,Dashboard,TaskForm,TaskTable,Charts uiClass
    class AuthProvider,AuthSlice,FirebaseAuth,FirestoreUsers authClass
    class Store,AuthReducer,NotificationReducer,TasksApi,UsersApi stateClass
    class TaskForm,TaskTable,FirestoreTasks,CreateTask,UpdateTask,DeleteTask,GetTasks,SubscribeTasks dataClass
    class AnalyticsCalculator,CentralizedAnalytics,SummaryCalc,CategoryCalc,PerformanceCalc,MarketCalc,ProductCalc,AICalc,TrendCalc analyticsClass
    class ReduxCache,AnalyticsCache,MemoizationCache,CacheInvalidation cacheClass
    class ErrorMiddleware,AuthMiddleware,NotificationSlice,ErrorBoundary errorClass
    class Debouncing,Memoization,LazyLoading,Pagination perfClass
    class Router,ProtectedRoutes,RoleBasedAccess routingClass
    class Firebase,Firestore,FirebaseAuth externalClass
