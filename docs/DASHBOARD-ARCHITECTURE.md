# Dashboard Architecture & Department-Specific UI

## Overview

The application uses a **department-scoped dashboard system** where each department has its own UI, layout, sidebar, and data, while sharing common components and global settings pages.

## Architecture Principles

### 1. Department-Specific Dashboards

Each department has:
- **Unique UI/Layout**: Different visual presentation per department
- **Unique Sidebar**: Different navigation links and menu items
- **Unique Data**: Different data sources and cards
- **Same Components**: Shared TanStack table, cards, forms, etc. but with different data

### 2. Global Pages (Outside Department Auth)

These pages are **accessible to all departments** and are **not department-scoped**:
- **Settings** (`/settings/*`)
  - Users (`/settings/users`) - Admin only
  - Departments (`/settings/departments`) - Admin only
  - UI Showcase (`/settings/ui-showcase`) - Admin only
- **Profile** (`/design/profile`, `/food/profile`) - User's own profile

These pages use the same `DepartmentLayout` but are **not filtered by department** - they show global data.

## Dashboard Structure

### Design Department (`/design/dashboard`)

**UI/Layout:**
- Task-focused dashboard
- Month progress banner (shows task completion, progress metrics)
- Overview cards (task statistics, user metrics, reporter metrics)
- Task board with TanStack table

**Sidebar Links:**
- Dashboard
- Analytics (with sub-items: Overview, Acquisition, Marketing, Product, User overview, Reporter overview, Month comparison, Misc)
- Profile

**Data Sources:**
- `task_boards` API
- `tasks` API
- Task-related cards (task count, completed tasks, pending tasks, etc.)

**TanStack Table:**
- Same table component (`TanStackTable`)
- Different columns: `TASK_COLUMNS` (title, status, assignee, due_date, etc.)
- Different data: Tasks from selected task board

### Food Department (`/food/dashboard`)

**UI/Layout:**
- Order-focused dashboard
- Month progress banner (shows order statistics, monthly progress)
- Overview cards (order statistics, user orders, order history)
- Order board with TanStack table

**Sidebar Links:**
- Dashboard
- Orders (`/food/orders`)
- History (`/food/history`)
- Profile

**Data Sources:**
- `order_boards` API
- `orders` API
- Order-related cards (order count, pending orders, completed orders, etc.)

**TanStack Table:**
- Same table component (`TanStackTable`)
- Different columns: `ORDER_COLUMNS` (order_date, summary, items, status, user, etc.)
- Different data: Orders from selected order board

### Customer Support & Other Departments

**UI/Layout:**
- Similar to Design department
- Task-focused dashboard
- Month progress banner
- Task board with TanStack table

**Sidebar Links:**
- Dashboard
- Analytics
- Profile

**Data Sources:**
- `task_boards` API
- `tasks` API

## Month Progress Banner

**Global Component** - Same UI across all departments but **different data**:

- **Design/Customer Support**: Shows task completion percentage, tasks completed vs total, reporter activity
- **Food**: Shows order statistics, orders placed this month, order completion rate

**Implementation:**
- Component: `MonthProgressBanner` (to be created)
- Props: `variant` ("design" | "food" | "customer-support")
- Data: Fetched from respective APIs based on variant

## Overview Cards

**Same Component** (`SmallCard`) but **different data** per department:

### Design Department Cards:
1. **Total Tasks** - Count of all tasks in current month
2. **Completed Tasks** - Tasks with status "completed"
3. **Pending Tasks** - Tasks with status "todo" or "in-progress"
4. **Active Reporters** - Count of reporters assigned to tasks
5. **Deliverables** - Count of deliverables linked to tasks

### Food Department Cards:
1. **Total Orders** - Count of all orders in current month
2. **Pending Orders** - Orders with status "pending"
3. **Completed Orders** - Orders with status "completed"
4. **My Orders** - Current user's orders
5. **Order History** - Link to history page

### Customer Support Cards:
1. **Total Tasks** - Count of all tasks
2. **Open Tickets** - Tasks with status "todo"
3. **Resolved** - Tasks with status "completed"
4. **In Progress** - Tasks with status "in-progress"
5. **Assigned to Me** - Tasks assigned to current user

## TanStack Table

**Same Code, Different Data:**

The `TanStackTable` component is reused across all departments but receives:
- **Different columns** based on department variant
- **Different data** from department-specific APIs
- **Same features**: Filtering, column toggle, pagination, sorting

**Column Configuration:**

```javascript
// Design Department
const TASK_COLUMNS = [
  { key: "title", header: "Title" },
  { key: "status", header: "Status" },
  { key: "assignee", header: "Assignee" },
  { key: "due_date", header: "Due Date" },
  { key: "reporters", header: "Reporters" },
  { key: "deliverables", header: "Deliverables" },
];

// Food Department
const ORDER_COLUMNS = [
  { key: "order_date", header: "Date" },
  { key: "summary", header: "Summary" },
  { key: "items", header: "Items" },
  { key: "status", header: "Status" },
  { key: "user", header: "User" },
];
```

## Global Settings Pages

### `/settings/users` - Users Management

**Access:** Admin only (all departments)
**Scope:** Global - shows all users across all departments
**Features:**
- List all users
- Filter by department, role, status
- Create/edit/delete users
- Assign managers
- Set department

**Data:** Not filtered by department - shows all users

### `/settings/departments` - Departments Management

**Access:** Admin only (all departments)
**Scope:** Global - manages all departments
**Features:**
- List all departments
- Create/edit/delete departments
- Configure department settings

**Data:** All departments

### `/settings/ui-showcase` - UI Showcase

**Access:** Admin only (all departments)
**Scope:** Global - UI component showcase
**Features:**
- Display all UI components
- Test component variations
- Design system reference

**Data:** Static UI components

## Implementation Details

### Dashboard Configuration

```javascript
const DASHBOARD_CONFIG = {
  design: {
    boardsApi: taskBoardsApi,
    itemsApi: tasksApi,
    columns: TASK_COLUMNS,
    boardTitle: "Task board",
    cardMode: "main",
    // ... other config
  },
  food: {
    boardsApi: orderBoardsApi,
    itemsApi: ordersApi,
    columns: ORDER_COLUMNS,
    boardTitle: "Order board",
    cardMode: "food",
    // ... other config
  },
};
```

### Navigation Configuration

```javascript
// Design navigation
export const designNavConfig = {
  basePath: "/design",
  slug: "design",
  mainMenuItems: [
    { name: "Dashboard", href: "/design/dashboard" },
    { name: "Analytics", href: "/design/analytics", subItems: [...] },
  ],
};

// Food navigation
export const foodNavConfig = {
  basePath: "/food",
  slug: "food",
  mainMenuItems: [
    { name: "Dashboard", href: "/food/dashboard" },
    { name: "Orders", href: "/food/orders" },
    { name: "History", href: "/food/history" },
  ],
};
```

### Route Structure

```
/ (root)
├── /login (public)
├── /design (protected, department-scoped)
│   ├── /dashboard (Design dashboard)
│   ├── /analytics (Design analytics)
│   └── /profile (User profile)
├── /food (protected, department-scoped)
│   ├── /dashboard (Food dashboard)
│   ├── /orders (Food orders)
│   ├── /history (Food history)
│   └── /profile (User profile)
└── /settings (protected, global - all departments)
    ├── /users (Global users - admin only)
    ├── /departments (Global departments - admin only)
    └── /ui-showcase (Global UI showcase - admin only)
```

## Data Filtering

### Department-Scoped Data

- **Dashboard data**: Filtered by `user.departmentId`
- **Task boards**: Filtered by `department_id`
- **Order boards**: Filtered by `department_id` (Food only)
- **Cards data**: Filtered by department

### Global Data

- **Settings/Users**: No department filter - shows all users
- **Settings/Departments**: No filter - shows all departments
- **Settings/UI Showcase**: No data - static UI

### Super-User Access

- **Super-user**: Sees ALL data across ALL departments
- No department filtering applied
- Can access all department dashboards
- Can see all users, all tasks, all orders

## Adding a New Department

1. **Add department to database** (`departments` table)
2. **Create navigation config** (`src/config/navConfig.js`)
3. **Create routes** (`src/app/routes/{department}Routes.jsx`)
4. **Register in departments config** (`src/config/departments.js`)
5. **Add dashboard config** (if different from Design)
6. **Update router** (`src/app/router.jsx`)

## Best Practices

1. **Reuse Components**: Use same TanStack table, cards, forms across departments
2. **Variant-Based Logic**: Use `variant` prop to determine data source and columns
3. **Department Scoping**: Always filter data by `department_id` unless it's a global page
4. **Global Pages**: Keep settings pages global - accessible to all departments
5. **Consistent UI**: Maintain consistent UI patterns while allowing department-specific customization
