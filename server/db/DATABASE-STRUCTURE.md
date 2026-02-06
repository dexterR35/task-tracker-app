# Database Structure Overview

## Core Tables

### 1. Authentication & Users

```
departments
├── id (UUID, PK)
├── name (VARCHAR, UNIQUE)
└── timestamps

users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR)
├── role (ENUM: 'admin', 'user', 'super-user')
├── department_id (UUID, FK → departments)
├── manager_id (UUID, FK → users) [SELF-REFERENTIAL, MANDATORY for admin role]
├── is_active (BOOLEAN)
└── timestamps
CONSTRAINT: check_admin_has_manager (admin role MUST have manager_id)

profiles
├── id (UUID, PK)
├── user_id (UUID, FK → users, UNIQUE)
├── name, username, office, job_position, phone, avatar_url, etc.
└── timestamps

refresh_tokens
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── token (VARCHAR, SHA-256 hash)
├── expires_at (TIMESTAMPTZ)
└── metadata (user_agent, ip, etc.)
```

### 2. Reporters & Deliverables

```
reporters
├── id (UUID, PK)
├── name (VARCHAR)
├── email (VARCHAR, NULLABLE)
├── department_id (UUID, FK → departments, NULLABLE)
├── is_active (BOOLEAN)
└── timestamps

deliverables_settings
├── id (UUID, PK)
├── name (VARCHAR)
├── estimated_time_hours (DECIMAL)
├── description (TEXT, NULLABLE)
├── department_id (UUID, FK → departments, NULLABLE)
├── is_active (BOOLEAN)
└── timestamps
```

### 3. Monthly Boards

```
task_boards (Design, Customer Support, etc.)
├── id (UUID, PK)
├── department_id (UUID, FK → departments)
├── year (SMALLINT)
├── month (SMALLINT)
├── month_name (VARCHAR)
├── created_by (UUID, FK → users, NULLABLE)
├── status (VARCHAR)
├── start_date, end_date (DATE, NULLABLE)
└── timestamps
UNIQUE (department_id, year, month)

order_boards (Food department only)
├── id (UUID, PK)
├── department_id (UUID, FK → departments)
├── year (SMALLINT)
├── month (SMALLINT)
├── month_name (VARCHAR)
├── created_by (UUID, FK → users, NULLABLE)
├── status (VARCHAR)
├── start_date, end_date (DATE, NULLABLE)
└── timestamps
UNIQUE (department_id, year, month)

dashboard_boards (All departments)
├── id (UUID, PK)
├── department_id (UUID, FK → departments)
├── year (SMALLINT)
├── month (SMALLINT)
├── month_name (VARCHAR)
├── created_by (UUID, FK → users, NULLABLE)
├── status (VARCHAR)
├── metadata (JSONB) [Flexible data storage]
└── timestamps
UNIQUE (department_id, year, month)
```

### 4. Tasks & Relations

```
tasks
├── id (UUID, PK)
├── board_id (UUID, FK → task_boards)
├── created_by (UUID, FK → users) [Who created the task]
├── assignee_id (UUID, FK → users, NULLABLE) [Who is assigned]
├── title (VARCHAR)
├── description (TEXT, NULLABLE)
├── status (VARCHAR, DEFAULT 'todo')
├── due_date (DATE, NULLABLE)
├── position (INT)
└── timestamps

task_reporters (Junction Table)
├── id (UUID, PK)
├── task_id (UUID, FK → tasks)
├── reporter_id (UUID, FK → reporters)
├── assigned_at (TIMESTAMPTZ)
└── created_at (TIMESTAMPTZ)
UNIQUE (task_id, reporter_id)

task_deliverables (Junction Table)
├── id (UUID, PK)
├── task_id (UUID, FK → tasks)
├── deliverable_id (UUID, FK → deliverables_settings)
├── actual_time_hours (DECIMAL, NULLABLE)
├── completed_at (TIMESTAMPTZ, NULLABLE)
└── timestamps
UNIQUE (task_id, deliverable_id)
```

### 5. Orders (Food Department Only)

```
orders
├── id (UUID, PK)
├── board_id (UUID, FK → order_boards)
├── user_id (UUID, FK → users)
├── order_date (DATE)
├── summary (VARCHAR, NULLABLE)
├── items (JSONB) [Array of order items]
├── status (VARCHAR, DEFAULT 'pending')
└── timestamps
```

### 6. History Tables

```
task_history
├── id (UUID, PK)
├── user_id (UUID, FK → users) [Who performed the action]
├── task_id (UUID, FK → tasks)
├── action (VARCHAR) [e.g., 'created', 'updated', 'assigned']
├── details (JSONB) [Additional action details]
└── created_at (TIMESTAMPTZ)

order_history
├── id (UUID, PK)
├── user_id (UUID, FK → users) [Who performed the action]
├── order_id (UUID, FK → orders)
├── action (VARCHAR) [e.g., 'created', 'updated', 'completed']
├── details (JSONB) [Additional action details]
└── created_at (TIMESTAMPTZ)
```

## Relationships Diagram

```
┌─────────────┐
│ departments │
└──────┬──────┘
       │
       ├─────────────────────────────────────────────┐
       │                                             │
       │                                             │
┌──────▼──────┐                              ┌──────▼──────────┐
│    users    │◄──────────────────────────────│    users        │
│             │  manager_id (self-ref)        │  (managers)     │
└──────┬──────┘                              └─────────────────┘
       │
       ├───► profiles (1:1)
       ├───► refresh_tokens (1:many)
       ├───► tasks.created_by (1:many)
       ├───► tasks.assignee_id (1:many)
       └───► orders.user_id (1:many)

┌─────────────┐
│ departments │
└──────┬──────┘
       │
       ├───► task_boards (1:many)
       ├───► order_boards (1:many)
       ├───► dashboard_boards (1:many)
       ├───► reporters (1:many)
       └───► deliverables_settings (1:many)

┌──────────────┐
│ task_boards  │
└──────┬───────┘
       │
       └───► tasks (1:many)

┌──────────────┐
│    tasks     │
└──────┬───────┘
       │
       ├───► task_reporters (1:many) ──► reporters (many:many)
       ├───► task_deliverables (1:many) ──► deliverables_settings (many:many)
       └───► task_history (1:many)

┌──────────────┐
│ order_boards │
└──────┬───────┘
       │
       └───► orders (1:many) ──► order_history (1:many)
```

## Access Control Logic

### Role-Based Access

1. **super-user**
   - **Sees ALL data in the app** - ALL departments, ALL users, ALL tasks, ALL orders, ALL dashboards
   - Can access all departments
   - **NO restrictions** - full access to everything in the application
   - Bypasses all department filters and access controls
   - Typically has no manager_id (top level)

2. **admin**
   - **MUST have manager_id set** (enforced by database constraint)
   - Sees all data in their department
   - Can see all users in their department
   - Can see their own data
   - Can manage users in their department
   - If manager_id is set and user is admin, they can see all department data where they manage

3. **user**
   - Sees only their own data
   - Can create tasks
   - Can view tasks assigned to them
   - Limited by manager hierarchy

### Department Filtering

- **Super-user**: Sees ALL data - NO filtering. Full access to all departments, all users, all tasks, all orders, all dashboards.
- **Dashboard Boards**: Filtered by `department_id` based on auth. Super-users see ALL.
- **Task Boards**: Department-scoped (Design, Customer Support, etc.). Super-users see ALL.
- **Order Boards**: Food department only. Super-users see ALL.
- **Orders**: Only Food department users and managers/admins. Super-users see ALL.

### Manager Hierarchy

- **manager_id is MANDATORY for admin role** - enforced by database constraint `check_admin_has_manager`
- Users have `manager_id` pointing to another user (usually an admin or super-user)
- Admins must have a manager_id set (they report to someone, typically super-user)
- If manager_id is set and user is admin, they can see all department data where they manage
- Admins can see data for users who report to them
- Self-referential relationship allows multi-level hierarchies
- Typical hierarchy: super-user (no manager) → admins (manager = super-user) → users (manager = their department admin)

## Monthly Board Structure

Each department gets three types of monthly boards:

1. **Task Board** (`task_boards`)
   - For Design, Customer Support, etc.
   - Contains tasks
   - Tasks can have reporters and deliverables

2. **Order Board** (`order_boards`)
   - For Food department only
   - Contains orders
   - No reporters, no deliverables

3. **Dashboard Board** (`dashboard_boards`)
   - For all departments
   - Shared structure but filtered by department/auth
   - Contains metadata (JSONB) for flexible data storage

All boards follow the pattern: `UNIQUE (department_id, year, month)`

## Scalability Patterns

### Adding New Tables

1. **User-related tables**: Always include `user_id` or `created_by` FK
2. **Department-scoped tables**: Always include `department_id` FK
3. **Many-to-many relations**: Use junction tables with UNIQUE constraints
4. **Flexible data**: Use JSONB columns for extensible fields
5. **Audit trails**: Include `created_at` and `updated_at` timestamps

### Example: Adding Comments

```sql
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Example: Adding Tags

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);
```

## Key Design Decisions

1. **Self-referential manager_id**: Allows flexible organizational hierarchies
2. **Junction tables**: Enables many-to-many relationships (tasks ↔ reporters, tasks ↔ deliverables)
3. **Separate boards**: Task boards, order boards, and dashboard boards are separate for clarity
4. **Department scoping**: All data is scoped by department for multi-tenant support
5. **JSONB fields**: Used for flexible data (items in orders, metadata in dashboard_boards, details in history)
6. **UNIQUE constraints**: Prevent duplicate monthly boards per department
7. **Cascade deletes**: Appropriate cascading ensures data integrity
