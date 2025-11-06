# Task Tracker App - Complete Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [Quick Summary](#quick-summary)
3. [Architecture & Folder Structure](#architecture--folder-structure)
4. [Core Logic & Data Flow](#core-logic--data-flow)
5. [Authentication & Authorization](#authentication--authorization)
6. [Months & Forms System](#months--forms-system)
7. [Analytics System](#analytics-system)
8. [Cards System](#cards-system)
9. [Filters System](#filters-system)
10. [Tables System](#tables-system)
11. [Tasks Management](#tasks-management)
12. [API Layer](#api-layer)
13. [Utilities](#utilities)
14. [Components & Fields](#components--fields)
15. [Key Logic Patterns](#key-logic-patterns)
16. [Security Considerations](#security-considerations)
17. [Performance Optimizations](#performance-optimizations)
18. [Error Handling](#error-handling)
19. [Conclusion](#conclusion)
20. [Credits & Acknowledgments](#credits--acknowledgments)

---

## Application Overview

This is a **Task Tracking and Analytics Application** built with React, Firebase/Firestore, and modern web technologies. The app enables teams to:
- Track tasks with detailed metadata (reporter, deliverables, AI usage, markets, products)
- Generate comprehensive analytics reports
- Manage monthly boards and task data
- Filter and analyze data by users, reporters, months, and weeks
- View real-time task dashboards

**Tech Stack:**
- **Frontend:** React 18, Vite, TailwindCSS
- **Backend:** Firebase (Authentication + Firestore)
- **State Management:** React Context API
- **Forms:** React Hook Form + Yup validation
- **Tables:** TanStack Table (React Table v8)
- **Charts:** Recharts
- **Routing:** React Router v7

---

## Quick Summary

| # | Component | Description | Key Features |
|---|-----------|-------------|-------------|
| 1 | **Architecture** | Feature-based modular structure | Context providers, Router guards, API hooks, Real-time listeners |
| 2 | **Authentication** | Firebase Auth with session management | 8-hour sessions, CSRF protection, Role-based & explicit permissions |
| 3 | **Data Management** | Firestore with real-time sync | Month boards, Tasks subcollections, Caching system, Listener manager |
| 4 | **Forms System** | React Hook Form + Yup validation | 8 field types, Conditional validation, Permission checks, Duplicate prevention |
| 5 | **Analytics** | Multi-dimensional analytics engine | 6 analytics types, Real-time calculations, Chart visualizations, Memoized processing |
| 6 | **Tables** | TanStack Table implementation | Sorting, Filtering, Pagination, CSV export, Row selection, Column visibility |
| 7 | **Filters** | Independent filter combination system | Month, User, Reporter, Week filters, URL parameter sync, AND logic |
| 8 | **Cards** | Dynamic card generation system | Small cards (filters/stats), Analytics cards (charts/tables), Hash-based colors |
| 9 | **Utilities** | Comprehensive utility library | Data caching, Date/month calculations, Permission validation, Form helpers |
| 10 | **Components** | Reusable UI component library | 8 form fields, 5 UI components, Layout components, Error boundaries |

---

## Architecture & Folder Structure

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│              Context Providers                  │
│  (AuthContext, AppDataContext, DarkModeProvider)│
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              Router & Routes                    │
│  (Public/Protected/Admin routes with guards)    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              Pages & Components                 │
│  (Dashboard, Analytics, Forms, Tables, Cards)   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              API Layer (Hooks)                  │
│  (tasksApi, monthsApi, usersApi, reportersApi)  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              Firebase/Firestore                 │
│  (Real-time listeners, CRUD operations)         │
└─────────────────────────────────────────────────┘
```

### Folder Structure Explained

```
src/
├── app/                    # App initialization
│   ├── firebase.js        # Firebase configuration & initialization
│   └── router.jsx         # Route definitions with protection
│
├── context/                # Global state management
│   ├── AuthContext.jsx    # Authentication state & permissions
│   ├── AppDataContext.jsx  # Global app data (tasks, users, months)
│   └── DarkModeProvider.jsx
│
├── features/               # Feature-based modules
│   ├── tasks/             # Task management
│   │   ├── tasksApi.js    # Task CRUD operations
│   │   └── components/   # Task-specific components
│   ├── months/            # Month board management
│   │   └── monthsApi.js   # Month board CRUD
│   ├── users/            # User management
│   │   └── usersApi.js   # User CRUD operations
│   ├── reporters/        # Reporter management
│   │   └── reportersApi.js
│   ├── deliverables/     # Deliverables management
│   │   └── useDeliverablesApi.js
│   └── utils/            # Feature utilities
│       ├── authUtils.js   # Permission checking
│       └── firebaseListenerManager.js
│
├── components/            # Reusable UI components
│   ├── Cards/            # Analytics cards (Marketing, Product, AI, etc.)
│   ├── Card/             # Small cards (filters, stats)
│   ├── forms/            # Form field components
│   ├── Table/            # Table components
│   ├── Charts/           # Chart components
│   └── ui/               # Basic UI components (Button, Badge, Modal)
│
├── pages/                # Page components
│   ├── admin/           # Admin-only pages
│   ├── auth/            # Authentication pages
│   └── errorPages/      # Error pages
│
└── utils/                # Utility functions
    ├── dataCache.js     # Caching system
    ├── dateUtils.js     # Date formatting & parsing
    ├── monthUtils.jsx   # Month/week calculations
    ├── permissionValidation.js
    └── formUtils.js     # Form helpers
```

---

## Core Logic & Data Flow

### Application Initialization Flow

1. **App.jsx** initializes:
   - ErrorBoundary (catches React errors)
   - DarkModeProvider (theme management)
   - AuthProvider (authentication state)
   - AppDataProvider (global data state)
   - RouterProvider (navigation)

2. **AuthContext** initializes:
   - Checks for existing session (localStorage)
   - Sets up Firebase auth state listener
   - Fetches user data from Firestore
   - Validates user permissions

3. **AppDataContext** initializes:
   - Fetches current month data
   - Loads available months
   - Fetches users, reporters, deliverables
   - Sets up tasks listener for current month
   - Provides global data to all components

### Data Flow Pattern

When a user performs an action, the flow follows this sequence: the component event handler triggers, which calls an API hook. The API hook validates permissions before executing the Firestore operation. After the operation completes, real-time listeners detect the change and update the state in context, which causes components to re-render with the new data.

### Real-time Updates

The app uses **Firestore real-time listeners** (onSnapshot) for:
- Tasks (updates when tasks are created/updated/deleted)
- Users (when viewing single user)
- Month data (monthly board status)

**Caching Strategy:**
- Static data (users, reporters, deliverables): Infinite cache (manually invalidated)
- Month data: 30-day cache (changes once per month)
- Tasks: Real-time (no cache, always fresh)

---

## Authentication & Authorization

### Authentication System

**AuthContext** manages:
- Login/logout functionality
- Session management (8-hour sessions with refresh)
- User data fetching from Firestore
- CSRF protection via session tokens

**Session Flow:**
1. User logs in → Firebase Auth creates session
2. Fetch user data from Firestore `users` collection
3. Store encrypted session in localStorage
4. Session refreshes every 30 minutes
5. Session expires after 8 hours of inactivity

### Permission System

**Two-Tier Permission Model:**

1. **Role-Based Permissions:**
   - `admin`: Full access to all features
   - `user`: Limited access (can create/edit own tasks)

2. **Explicit Permissions Array:**
   - Users can have specific permissions: `['create_tasks', 'update_tasks', 'view_analytics']`
   - Special permission: `has_permission` (universal admin access)

**Permission Checking:**
The system provides functions to check if a user has a specific permission by checking both explicit permissions and role, verify if a user can access a specific role, and validate permissions for task operations.

**Permission Hierarchy:**
The permission system follows a hierarchy: admin role grants all permissions, followed by the special has_permission flag which also grants all permissions. Explicit permissions arrays grant specific permissions, and the default user role only allows creating and viewing own tasks.

### Route Protection

**Three Route Types:**

1. **Public Routes** (`PublicRoute`):
   - Accessible to unauthenticated users
   - Redirects authenticated users to dashboard
   - Examples: `/login`, `/`

2. **Protected Routes** (`ProtectedRoute`):
   - Requires authentication
   - Redirects to login if not authenticated
   - Examples: `/dashboard`, `/profile`

3. **Admin Routes** (`AdminRoute`):
   - Requires authentication + admin role
   - Redirects to `/unauthorized` if not admin
   - Examples: `/analytics`, `/users`

---

## Months & Forms System

### Month Board System

**Concept:**
A "month board" is a Firestore document that represents a work period (month). Tasks can only be created for months that have an active board.

**Firestore Structure:**
Month boards are stored in a hierarchical structure: departments/design/{yearId}/{monthId}. Each month document contains monthId, monthName, boardId, daysInMonth, startDate, endDate, timestamps, and creator information. The taskdata collection exists as a subcollection under each month document, containing individual task documents.

**Month Board Lifecycle:**

1. **Creation** (Admin only):
   Administrators create month boards through the month board creation hook. The system validates the monthId format to ensure it follows the YYYY-MM pattern, creates the document with all necessary metadata, and generates a unique boardId for the month.

2. **Validation**:
   Before allowing task creation, the system validates that a month board exists for the selected month. Users cannot create tasks without an active board, and clear error messages guide users to contact an administrator if a board is missing.

3. **Current Month Detection**:
   The system automatically detects the current month using month utility functions. The current month is pre-selected in the user interface, but users can switch to previous months using a dropdown selector.

### Month Selection Logic

**Month Selection Flow:**

When a user selects a month from the dropdown, the selection updates the context state. The AppDataContext then switches the tasks listener to the new month, filters tasks by the selected monthId, and updates the UI to display tasks from the selected month.

**Month States:**
The system maintains three month-related states: the current month which is automatically detected, the selected month which is the user's choice and can be the current month or any past month, and a boolean flag indicating whether the selected month is the current month.

### Forms System

**Task Form Structure:**

The task form uses **React Hook Form** with **Yup validation**:

**Form Fields:**
- `jiraLink` (required): Jira ticket URL
- `products` (required): Product category (marketing/acquisition/product)
- `departments` (required): Department name
- `markets` (required, multi-select): Market codes
- `timeInHours` (required): Time spent (0.5 hour increments)
- `startDate` / `endDate` (required): Task date range
- `reporters` (required): Reporter selection
- `deliverables` (conditional): Only if `_hasDeliverables` is true
- `aiModels` (conditional): Only if `_usedAIEnabled` is true
- `isVip`, `reworked`: Boolean flags

**Form Validation Logic:**

1. **Schema Validation** (Yup):
   The form uses Yup schema validation to check required fields, validate formats for dates, URLs, and numbers, enforce business rules like ensuring end date is after start date and time is in valid increments, and apply conditional validation such as requiring deliverables only when the deliverables option is enabled.

2. **Permission Validation**:
   Before form submission, the system validates task permissions by checking if the user is active and verifying they have the required explicit permissions or appropriate role.

3. **Board Validation**:
   Before creating a task, the system checks if the month board exists for the selected month. If the board is missing, an error is thrown to prevent task creation without a valid board.

4. **Duplicate Check**:
   For new tasks, the system checks for duplicates by comparing the gimodear field, task name, and user. If a duplicate is found, task creation is prevented.

**Form Submission Flow:**

When a user submits the form, the system first validates the form data using Yup schema validation. Then it checks user permissions, verifies the month board exists, and for new tasks, checks for duplicates. After preparing and normalizing the data, it performs the Firestore create or update operation. Real-time listeners detect the change and update the UI, followed by a success notification and modal closure.

**Form Field Components:**

The form system includes various field components: TextField for text input, SelectField for simple dropdowns, SearchableSelectField for searchable dropdowns used with users and reporters, MultiSelectField for multiple selection used with markets, NumberField for numeric input with validation, SimpleDateField for date selection, CheckboxField for boolean values, and SearchableDeliverablesField for selecting deliverables with search functionality.

---

## Analytics System

### Analytics Architecture

The analytics system processes task data to generate insights across multiple dimensions:

**Analytics Dimensions:**
1. **Marketing Analytics**: Marketing subcategories, markets, hours
2. **Acquisition Analytics**: Acquisition subcategories, markets, hours
3. **Product Analytics**: Product subcategories, markets, hours
4. **AI Analytics**: AI models usage, time spent, users
5. **Reporter Analytics**: Reporter performance (tasks, hours, markets, products)
6. **Markets by Users**: Task distribution by users and markets

### Analytics Data Processing

**Data Flow:**

Analytics processing starts with raw tasks data, which is filtered by month, user, reporter, or week as needed. The filtered data is then grouped by category (marketing, acquisition, or product), and metrics are aggregated (counts, sums, averages). Percentages are calculated, chart data is generated, and finally displayed in the analytics cards.

**Key Calculations:**

1. **Category Breakdown**:
   Tasks are grouped by product category such as "marketing poker" or "acquisition casino". For each category, the system calculates task count, total hours, and market distribution.

2. **Market Distribution**:
   Within each category, tasks are counted per market, and color-coded charts are generated to visualize the distribution.

3. **User Distribution**:
   Tasks are grouped by user, and totals are calculated for each user to show individual contributions.

4. **AI Usage**:
   The system tracks which AI models are used per task, calculates total AI time spent, and identifies the most frequently used AI models.

### Analytics Cards

Each analytics type has a dedicated card component:

**Card Components:**
- `MarketingAnalyticsCard`: Marketing performance
- `AcquisitionAnalyticsCard`: Acquisition metrics
- `ProductAnalyticsCard`: Product breakdown
- `AIAnalyticsCard`: AI usage analytics
- `ReporterAnalyticsCard`: Reporter performance
- `MarketsByUsersCard`: User-market distribution

**Card Props Calculation:**

Each analytics card type has a dedicated function that processes raw tasks data: it filters by the selected month, user, or reporter; calculates relevant metrics; generates chart data; and returns formatted props ready for card display.

**Caching Strategy:**
Analytics calculations are memoized using React's useMemo hook, ensuring they only recalculate when the source data actually changes, which prevents unnecessary re-renders and improves performance.

### Analytics Page Structure

**AnalyticsPage** (`/analytics`):
- Tab-based navigation (6 analytics types)
- Month selector dropdown
- Month progress bar
- Dynamic card rendering based on active tab
- Loading states and error handling

**DynamicAnalyticsPage** (`/analytics-detail`):
- URL-parameter based filtering (?user=, ?reporter=, ?month=, ?week=)
- Generates analytics cards dynamically
- Shows weekly task breakdown
- Week selector for filtering

---

## Cards System

### Card Types

**1. Small Cards** (Filter/Selection Cards):
- `MONTH_SELECTION`: Month dropdown selector
- `USER_FILTER`: User filter dropdown
- `REPORTER_FILTER`: Reporter filter dropdown
- `WEEK_SELECTION`: Week filter dropdown
- `TOTAL_TASKS`: Total tasks count
- `TOTAL_HOURS`: Total hours sum
- `TOTAL_DELIVERABLES`: Total deliverables count
- `TOTAL_VARIATIONS`: Total variations count
- `AI_USAGE`: AI usage statistics

**Small Card Configuration:**
Each card type has a configuration that defines its title, icon, color scheme, value calculation method, and content (which can include form fields). Cards are created dynamically through a centralized card creation function.

**2. Analytics Cards** (Large Cards):
These cards display charts, tables, and detailed metrics. Each analytics card type has its own component and configuration file, with all configurations organized in a dedicated configs directory.

### Card Color System

**Color Assignment:**
- Cards use a hash-based color assignment
- Colors from palette: green, blue, purple, amber, pink, red, yellow, orange, crimson
- Color determined by card type string hash
- Ensures consistent colors for same card types

**Color Mapping:**
The color system uses a centralized color map containing hex codes for all available colors. These colors are consistently applied across card backgrounds, icons, charts, and badges to maintain visual consistency.

### Card Dynamic Generation

**Small Cards:**
The card generation process iterates through all card types, retrieves the configuration for each type, calculates the value using the configured getValue function, generates the content (form fields or statistics), returns an array of card objects, and finally renders them via the SmallCard component.

**Data Flow:**
Cards receive their data from the AppDataContext, which provides global application state. When data changes, cards update in real-time. When filters are applied (month, user, or reporter selection), cards update immediately to reflect the filtered data.

---

## Filters System

### Filter Architecture

**Filter Types:**

1. **Month Filter**:
   - Dropdown with available months
   - Switches entire app context to selected month
   - Updates tasks data to selected month

2. **User Filter**:
   - Admin: Can filter by any user
   - Regular users: Can only view own data
   - Updates URL parameter `?user=`
   - Filters tasks by `userUID`

3. **Reporter Filter**:
   - Filters tasks by reporter
   - Updates URL parameter `?reporter=`
   - Independent from user filter (can combine)

4. **Week Filter**:
   - Filters tasks by week number
   - Updates URL parameter `?week=`
   - Works with month selection
   - Calculates weeks using `getWeeksInMonth()`

### Filter Combination Logic

**Independent Filters:**
- User, Reporter, Week, and Month filters are **independent**
- Can be combined (e.g., User=John + Reporter=Alex + Week=2)
- Filters apply sequentially (AND logic)

**Filter Application:**

Filters are applied sequentially using AND logic: all tasks are first filtered by month if selected, then by user if selected, then by reporter if selected, and finally by week if selected. The result is the intersection of all active filters, displaying only tasks that match all selected criteria.

### URL Parameter Management

**Filter State in URL:**
Filters are stored as URL search parameters, enabling bookmarking and sharing of filtered views. The URL format includes query parameters for user, reporter, and week selections, which are updated through React Router's search parameter management.

**Filter Persistence:**
- Filters persist across page navigation
- Filters cleared when manually reset
- URL parameters sync with filter UI state

---

## Tables System

### Table Architecture

**TanStackTable Component:**

The app uses **TanStack Table (React Table v8)** for all data tables:

**Features:**
- Sorting (click column headers)
- Filtering (global search + column filters)
- Pagination (configurable page sizes)
- Column visibility toggle
- Row selection (single selection mode)
- CSV export
- Responsive design

### Table Configuration

**Table Props:**
Tables accept an array of row data, column definitions, a table type identifier, feature toggles for pagination/filters/column visibility, enable flags for sorting and filtering, bulk action button configurations, and optional custom filter components.

### Table Features

**1. Global Search:**
- Text input that filters across all columns
- Updates `globalFilter` state
- Real-time filtering

**2. Column Sorting:**
- Click column header to sort
- Supports ascending/descending/toggle
- Visual indicators (arrows) for sort direction

**3. Pagination:**
- Configurable page sizes (10, 25, 50, 100)
- Previous/Next navigation
- Page count display

**4. Row Selection:**
- Single selection mode (only one row at a time)
- Selected row highlighted with green border
- Click outside table to deselect
- Bulk actions bar appears when row selected

**5. CSV Export:**
- Exports filtered/visible rows
- Includes all visible columns
- Progress modal during export
- Filename includes table type and date

### Table Column Definitions

**Column Structure:**
Each table column defines a data field name for access, a header text for display, an optional custom cell renderer, sorting capabilities, visibility toggling, and column width configuration.

**Common Column Types:**
Tables support various column types including simple text display, color-coded badge columns for markets and AI models, clickable link columns for Jira tickets, formatted date columns, and formatted number columns.

---

## Tasks Management

### Task Data Structure

**Firestore Document Structure:**

Each task document contains a data_task object with task details including taskName (Jira ticket ID), products category, departments, markets array, timeInHours, startDate, endDate, reporter information, deliverablesUsed array, aiUsed array with AI models and time, boolean flags for isVip and reworked, and observations. The document also includes metadata: userUID (task owner), monthId, boardId, creator information (createbyUID, createdByName), and timestamps (createdAt, updatedAt).

### Task CRUD Operations

**Create Task:**
1. User fills form
2. Validate permissions (`create_tasks`)
3. Check month board exists
4. Check for duplicates (gimodear + name + user)
5. Auto-resolve reporter name if reporter ID provided
6. Create Firestore document
7. Real-time listener updates UI

**Update Task:**
1. User edits form
2. Validate permissions (`update_tasks`)
3. Check for actual changes (skip if no changes)
4. Auto-resolve reporter name if changed
5. Update Firestore document
6. Real-time listener updates UI

**Delete Task:**
1. User clicks delete
2. Validate permissions (`delete_tasks`)
3. Delete Firestore document
4. Real-time listener updates UI

**Read Tasks:**
Tasks are fetched using a real-time listener that filters by month, user role, and userUID. Administrators can see all tasks or filter by a selected user, while regular users only see their own tasks.

### Task Filtering

**Filter Levels:**

Tasks can be filtered at multiple levels: by month using monthId, by user using userUID, by reporter using reporterUID or reporters field, and by week using the createdAt date to check if it falls within the week's date range.

**Query Building:**

When an admin views all tasks, no filter is applied to the query. When an admin views a specific user's tasks, the query filters by userUID. Regular users always see only their own tasks, so the query is filtered by their userUID.

### Task Listener Management

**Firebase Listener Manager:**

The app uses a custom `firebaseListenerManager` to:
- Prevent duplicate listeners
- Pause/resume listeners when tab hidden/visible
- Clean up listeners on unmount
- Track listener keys for management

**Listener Lifecycle:**

When a component mounts, it sets up a listener if one doesn't already exist. When the browser tab becomes hidden, the listener is paused to save resources. When the tab becomes visible again, the listener resumes. When the component unmounts, the listener is cleaned up to prevent memory leaks.

---

## API Layer

### API Architecture

**Pattern: Custom React Hooks**

All API operations are exposed as React hooks that provide data fetching for tasks with real-time updates, task creation/update/delete operations, one-time fetching of users and reporters, and month data retrieval for current and available months.

### API Features

**1. Real-time Updates:**
Tasks use Firestore snapshot listeners for automatic real-time updates. Single user views also use real-time listeners, while other data uses one-time fetches for efficiency.

**2. Caching:**
Static data like users and reporters are cached indefinitely, month data is cached for 30 days, and caches are invalidated whenever data is created, updated, or deleted.

**3. Permission Validation:**
All mutation operations validate permissions before execution using centralized validation functions, throwing errors if permissions are insufficient.

**4. Error Handling:**
All API functions use try/catch blocks for error handling, log errors via the logger utility, and return errors to components for user-friendly display.

### API Modules

**1. tasksApi.js:**
Provides real-time tasks listener that filters by month, role, and user, plus mutation hooks for creating, updating, and deleting tasks.

**2. monthsApi.js:**
Offers current month data retrieval, available months listing, and month board creation functionality.

**3. usersApi.js:**
Provides one-time fetching of all users, real-time listener for single user by UID, and complete CRUD operations for user management.

**4. reportersApi.js:**
Offers one-time fetching of all reporters and complete CRUD operations for reporter management.

**5. useDeliverablesApi.js:**
Provides deliverables data and CRUD operations, with data stored in a single Firestore document at the settings/app/data/deliverables path.

---

## Utilities

### Data Cache System

**Purpose:**
Reduce redundant Firestore reads by caching static/rarely-changing data.

**Cache Types:**

1. **Static Data Cache** (Infinite TTL):
   - Users, Reporters, Deliverables
   - Only invalidated on create/update/delete
   - Cleaned up after 7 days of inactivity

2. **Month Data Cache** (30-day TTL):
   - Month board data
   - Changes once per month
   - Extended TTL for performance

3. **Default Cache** (5-minute TTL):
   - General purpose caching
   - Auto-expires after 5 minutes

**Cache Operations:**
The cache system provides methods to store data with a time-to-live, retrieve cached data, invalidate specific cache entries, and clean up expired entries automatically.

**Memory Management:**
- Max cache size: 1000 entries
- Max memory: 50MB
- Aggressive cleanup at 80% threshold
- Removes oldest 30% when limit reached

### Date Utilities

**Functions:**
Date utilities include parsing month IDs to Date objects, formatting months for display, getting the current year, normalizing Firestore timestamps to standard formats, and serializing timestamps for consistent API responses.

### Month Utilities

**Functions:**
Month utilities provide functions to get month metadata including month ID, name, number of days, and date ranges; calculate weeks within a month considering only weekdays; determine the current week number; and filter tasks that fall within a specific week.

**Week Calculation:**
Weeks are calculated starting on Monday, and only weekdays (Monday through Friday) are included in week calculations. Weeks that partially overlap with a month are included if they contain any days that fall within that month.

### Permission Validation

**Centralized Validation:**
The permission validation system provides generic validation functions, task-specific validation, and user management validation. All validation functions return an object containing a boolean isValid flag and an array of error messages.

**Validation Logic:**
The validation process checks if user data exists, verifies the user is active when required, checks for admin bypass when enabled, evaluates explicit permissions or role-based permissions, and returns a validation result with success status and any error messages.

### Form Utilities

**Functions:**
Form utilities provide standardized form submission handling with consistent error management, validation error processing, and data normalization to ensure consistent data formats.

**Form Submission Handler:**
The form submission handler wraps async operations, manages loading states during submission, displays success or error notifications, automatically resets forms upon successful submission, and catches and displays any errors that occur during the process.

---

## Components & Fields

### Form Field Components

**1. TextField:**
- Standard text input
- Validation error display
- Required field indicator

**2. SearchableSelectField:**
- Dropdown with search functionality
- Used for users, reporters, months
- Badge display for selected value
- Clear button to reset selection

**3. SelectField:**
- Simple dropdown select
- No search functionality
- Used for static options

**4. MultiSelectField:**
- Multiple selection dropdown
- Badge display for selected values
- Used for markets selection

**5. NumberField:**
- Number input with validation
- Supports min/max values
- Used for timeInHours (0.5 increments)

**6. SimpleDateField:**
- Date picker component
- Returns YYYY-MM-DD format
- Used for startDate/endDate

**7. CheckboxField:**
- Boolean checkbox
- Used for flags (isVip, reworked, _hasDeliverables)

**8. SearchableDeliverablesField:**
- Specialized deliverable selector
- Search functionality
- Quantity input per deliverable
- Variations support

### UI Components

**1. DynamicButton:**
- Configurable button component
- Supports variants (primary, outline, etc.)
- Icon support (left/right positioning)
- Link support (React Router)

**2. Badge:**
- Color-coded badges
- Used for markets, AI models, status
- Size variants (sm, md, lg)

**3. Modal:**
- Reusable modal component
- Backdrop and close functionality
- Used for forms and confirmations

**4. Loader:**
- Loading spinner component
- Size and variant options
- Text support

**5. Skeleton:**
Skeleton components provide loading placeholders that mimic the structure of cards and tables, displayed during data loading to improve perceived performance and user experience.

### Layout Components

**1. AuthLayout:**
- Main app layout wrapper
- Includes: Sidebar, FixedHeader
- Only visible to authenticated users

**2. Sidebar:**
- Navigation sidebar
- Menu items based on permissions
- Active route highlighting

**3. FixedHeader:**
- Top navigation bar
- User profile dropdown
- Logout button

**4. ErrorBoundary:**
- React error boundary
- Catches component errors
- Displays error UI

---

## Key Logic Patterns

### 1. Data Fetching Pattern

Real-time data fetching uses Firestore listeners that automatically update when data changes. The listener is set up when a component mounts, processes snapshot data, updates state, and cleans up when the component unmounts.

### 2. Permission Checking Pattern

Before any data mutation operation, the system validates user permissions using centralized validation functions. If validation fails, an error is thrown with descriptive messages, preventing unauthorized operations.

### 3. Form Submission Pattern

Form submissions are handled through a standardized handler that wraps the async operation, manages loading states, handles validation (already completed by Yup), performs permission checks via the API layer, executes the operation, and handles success/error states with appropriate notifications.

### 4. Filter Combination Pattern

Filters operate independently and can be combined. Each filter checks if a selection is active, and if so, filters the data accordingly. Multiple filters apply sequentially using AND logic, meaning only items matching all active filters are displayed.

### 5. Caching Pattern

Before fetching data from Firestore, the system checks the cache using a key. If cached data exists and is valid, it returns immediately. Otherwise, data is fetched from Firestore, cached with an appropriate time-to-live, and then returned.

---

## Security Considerations

### 1. Authentication
- Firebase Auth handles authentication
- Session management with encryption
- CSRF protection via tokens

### 2. Authorization
- Permission checks on all mutations
- Role-based access control
- Route protection at router level

### 3. Data Validation
- Client-side: Yup schema validation
- Server-side: Firestore security rules (firestore.rules)
- Input sanitization in form utilities

### 4. User Data Isolation
- Regular users can only see/edit own tasks
- Admin can view all tasks
- User filter enforced at API level

---

## Performance Optimizations

### 1. Caching
- Static data cached indefinitely
- Month data cached for 30 days
- Reduces Firestore reads

### 2. Memoization
- React.useMemo for expensive calculations
- useCallback for event handlers
- Prevents unnecessary re-renders

### 3. Real-time Listeners
- Listener manager prevents duplicates
- Listeners paused when tab hidden
- Efficient cleanup on unmount

### 4. Data Pagination
- Tables use pagination (10-100 rows/page)
- Prevents rendering large datasets
- Improves initial load time

### 5. Lazy Loading
- Components loaded on demand
- Code splitting via Vite
- Reduces initial bundle size

---

## Error Handling

### Error Types

1. **Authentication Errors:**
   - Handled by AuthContext
   - Redirects to login
   - Shows error toast

2. **Permission Errors:**
   - Caught in API hooks
   - Shows auth error toast
   - Prevents operation

3. **Validation Errors:**
   - Form validation errors
   - Displayed inline in forms
   - Prevents submission

4. **Network Errors:**
   - Firestore connection errors
   - Displayed as error toast
   - Retry mechanisms

5. **Data Errors:**
   - Missing data errors
   - Displayed as empty states
   - User-friendly messages

### Error Display

- **Toasts**: Success/error notifications (react-toastify)
- **Inline Errors**: Form validation errors
- **Error Pages**: 404, 401, 500 pages
- **Error Boundaries**: React component errors

---

## Conclusion

This documentation covers the core logic, architecture, and systems of the Task Tracker App. The app follows modern React patterns with:
- Context-based state management
- Real-time data synchronization
- Comprehensive permission system
- Flexible filtering and analytics
- Reusable component architecture

For specific implementation details, refer to the source code files mentioned in each section.

---

## Credits & Acknowledgments

### Core Technologies
- **React** (v18.3.1) - UI framework by Meta
- **Vite** (v7.1.3) - Build tool and dev server
- **Firebase** (v12.1.0) - Backend services (Auth & Firestore) by Google
- **React Router** (v7.8.0) - Client-side routing
- **TailwindCSS** (v4.1.11) - Utility-first CSS framework

### Key Libraries
- **React Hook Form** (v7.62.0) - Form state management
- **Yup** (v1.7.0) - Schema validation
- **TanStack Table** (v8.21.3) - Table component library
- **Recharts** (v3.2.0) - Chart library for React
- **React Toastify** (v11.0.5) - Toast notifications
- **date-fns** (v4.1.0) - Date utility library
- **Framer Motion** (v12.23.12) - Animation library
- **React Icons** (v5.5.0) - Icon library

### Development Tools
- **ESLint** (v9.37.0) - Code linting
- **Prettier** (v3.6.2) - Code formatting
- **TypeScript** (via @types/node) - Type definitions

### Fonts
- **Inter** - Primary font family
- **Roboto** - Secondary font family

### Documentation
- This documentation was generated and maintained for the Task Tracker App
- Last updated: 2024
- Total source files: 109 files in `/src` directory

---

**Note:** This application is built with modern web technologies and follows React best practices for scalability, maintainability, and performance.

