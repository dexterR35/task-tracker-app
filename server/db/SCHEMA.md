# Database schema

## Overview

- **Database:** PostgreSQL
- **Connection:** `DATABASE_URL` in `server/.env`  
  Example: `postgresql://USER:PASSWORD@localhost:5432/task_tracker`
- **Setup:** Run with psql (no Node). Users are added manually (e.g. seed script or admin); no public registration.

**Single department table; same auth, same user data.** One `departments` table; one login; one `users` table. The only difference per user is **department** – set when the user is created manually (`users.department_id`). Each department has a different dashboard and menu in the app. **Split:** Auth + department in `users` (login; set `users.department_id` when creating a user). Profile in `profiles` (name, job, office, etc.; no department). **Sessions** in `refresh_tokens` (cookie + DB). **Departments** is a table (`departments`); users are assigned to a department on creation via `users.department_id`; department is mandatory for login. Data (dashboard, analytics, tasks, kanban) is scoped by user's department.

### Auth & sessions (cookie + DB)

- **Access token:** Short-lived JWT (e.g. 10m), in memory only; sent as `Authorization: Bearer` on API calls. Not stored in DB.
- **Refresh token:** Long-lived (e.g. 7 days), stored in httpOnly cookie (`refresh_token`, path `/api`). **DB stores only the SHA-256 hash** in `refresh_tokens`; raw token is never stored. One row per session (per device).
- **Refresh flow:** Client sends cookie to `POST /api/auth/refresh` → server validates hash in DB → returns new JWT + user; optionally issues new refresh token (rotation). Logout = delete row + clear cookie (session dead immediately). Max sessions per user (e.g. 5) enforced by revoking oldest when exceeded.

### Used in auth (users table only)

| Used in auth | Where | Purpose |
|--------------|-------|---------|
| **email** | users | Look up user and send login response |
| **password** (password_hash) | users | Check password with bcrypt |
| **department_id** | users | **MANDATORY** - Must be set when creating user; login fails if missing. User is **REFERENCED** to this department and **AUTHENTICATED** in this department. |
| **is_active** | users | Must be true; login fails if false |
| **role** | users | Not used to allow/deny login; used after login for authorization (e.g. admin vs user vs super-user) |

**Not used in auth:** `name` lives in `profiles` only; used for display, not for login or session checks.

### Department Assignment & Authentication

**When creating a user:**
1. **MUST select/assign a department** - `department_id` is MANDATORY (NOT NULL constraint)
2. **User is REFERENCED to that department** - Foreign key relationship `users.department_id → departments.id`
3. **User is AUTHENTICATED in that department** - Login requires `department_id` to be set
4. **User's access is SCOPED to their department** - After login, all data (dashboard, tasks, orders) is filtered by `department_id`
5. **User's UI is determined by department** - Dashboard, sidebar, and routes are based on department slug

**Department cannot be deleted** if users reference it (`ON DELETE RESTRICT`).

---

## Setup

```bash
# Create DB (if needed)
createdb task_tracker

# Run schema (creates tables, indexes, seeds – start fresh; all data is replaced)
psql -d task_tracker -f server/db/schema.sql

# Or with DATABASE_URL
psql "$DATABASE_URL" -f server/db/schema.sql

# Optional: add dev users (from server/: npm run db:seed – uses DATABASE_URL + bcryptjs)
# One admin + one user per department: admin-{dept}@netbet.ro (admin123), user-{dept}@netbet.ro (user123)
# e.g. admin-design@netbet.ro, user-design@netbet.ro, admin-food@netbet.ro, user-food@netbet.ro
# Plus super-user@netbet.ro (super123)
```

---

## Tables (summary)

| Table                    | Purpose |
|--------------------------|---------|
| `departments`            | **Departments** – id, name. Seeded: Design, **Food**, Customer Support. Users are assigned to one department via `users.department_id`; data is scoped by department. **2-apps-in-1:** Design (and other non-Food) → task tracker; Food → office food orders. |
| `users`                  | **Auth + hierarchy** – id, email, password_hash, role (`admin`, `user`, `super-user`), **department_id NOT NULL** (MANDATORY - must be set when creating user), **manager_id** (self-reference, **MANDATORY for admin role**), is_active. Login uses: email + password; then requires department_id and is_active. **IMPORTANT:** When creating a user, you MUST select/assign a department - the user will be REFERENCED to that department and AUTHENTICATED in that department. User's access is scoped to their assigned department. Name is not in users (profile-only). Admins must have a manager_id set - if manager_id is set and user is admin, they can see all department data where they manage. |
| `profiles`               | **Profile only (not used in auth)** – one row per user. user_id → users(id), name, username, office, job_position, phone, avatar_url, gender, etc. Name is for display only; login does not use it. |
| `refresh_tokens`         | **Sessions (cookie + DB)** – id, user_id → users(id), token (SHA-256 hash, 64 chars), expires_at, user_agent, ip, last_used_at, created_at. One row per device; max per user configurable (e.g. 5). Raw token only in httpOnly cookie; DB stores hash only. |
| `reporters`              | **Reporters** – People assigned to tasks when tasks are added. id, name, email, department_id, is_active. Scalable structure for easy extension. |
| `deliverables_settings`  | **Deliverables Settings** – Name and time settings related to tasks. id, name, estimated_time_hours, description, department_id, is_active. Scalable structure. |
| `task_boards`            | **Monthly Task Board (parent)** – one "bucket" per department per month (Design and other non-Food). id, department_id, year, month, **month_name** (e.g. "March 2026"), created_at, updated_at. UNIQUE (department_id, year, month). **API:** reject DepartmentSlug `food`. |
| `tasks`                  | **Tasks (child)** – work item tied to a board. id, **board_id** → task_boards(id), **created_by** → users(id), title, status, assignee_id, description, due_date, position, created_at, updated_at. Each user can create tasks. **API:** reject DepartmentSlug `food`. |
| `task_reporters`         | **Task-Reporter Junction** – Many-to-Many relationship linking tasks to reporters. id, task_id → tasks(id), reporter_id → reporters(id), assigned_at. UNIQUE (task_id, reporter_id). |
| `task_deliverables`      | **Task-Deliverable Junction** – Many-to-Many relationship linking tasks to deliverables_settings. id, task_id → tasks(id), deliverable_id → deliverables_settings(id), actual_time_hours, completed_at. UNIQUE (task_id, deliverable_id). |
| `dashboard_boards`       | **Monthly Dashboard Board** – Shared dashboard board for all departments, filtered by auth/department. id, department_id, year, month, month_name, created_by, status, metadata (JSONB), created_at, updated_at. UNIQUE (department_id, year, month). |
| `order_boards`           | **Monthly Order Board (parent)** – one "bucket" per department per month (Food). id, department_id, year, month, **month_name** (e.g. "March 2026"), created_at, updated_at. UNIQUE (department_id, year, month). **API:** require DepartmentSlug `food`. |
| `orders`                 | **Orders (child)** – order tied to a board. id, **board_id** → order_boards(id), user_id, order_date, summary, items (JSONB), status, created_at, updated_at. **Food department only** - no reporters, no deliverables relation. **API:** require DepartmentSlug `food`. |
| `task_history`           | **Task History** – per auth user (Design); who did what to which task. id, user_id (auth user), task_id, action, details (JSONB), created_at. |
| `order_history`          | **Order History** – per auth user (Food); who did what to which order. id, user_id (auth user), order_id, action, details (JSONB), created_at. |

**Relationships:** 
- `users.department_id` → `departments.id` (required for login)
- `users.manager_id` → `users.id` (self-referential, **MANDATORY for admin role**, nullable for user/super-user)
- `profiles.user_id` → `users.id` (1:1)
- `refresh_tokens.user_id` → `users.id` (many per user)
- `task_boards.department_id` → `departments.id`
- **Monthly Board:** `task_boards` = parent (bucket); `tasks.board_id` → `task_boards.id` = child
- `tasks.created_by` → `users.id` (who created the task)
- `tasks.assignee_id` → `users.id` (who is assigned to the task)
- `task_reporters.task_id` → `tasks.id` and `task_reporters.reporter_id` → `reporters.id` (many-to-many)
- `task_deliverables.task_id` → `tasks.id` and `task_deliverables.deliverable_id` → `deliverables_settings.id` (many-to-many)
- Same for `order_boards` (parent) and `orders.board_id` → `order_boards.id` (child)
- `orders.user_id` → `users.id`
- `dashboard_boards.department_id` → `departments.id`

---

## Roles & Permissions

### Role Hierarchy

1. **super-user**: 
   - **Sees ALL data in the app** - ALL departments, ALL users, ALL tasks, ALL orders, ALL dashboards
   - Can access all departments' dashboards, task boards, order boards
   - **NO restrictions** - full access to everything in the application
   - Bypasses all department filters and access controls
   - Typically has no manager_id (top level)

2. **admin**: 
   - **MUST have manager_id set** (enforced by database constraint)
   - Sees all data in their department (including all users in their department)
   - Can see their own data
   - Manages users in their department
   - Can assign tasks, view all tasks in their department
   - If manager_id is set and user is admin, they can see all department data where they manage

3. **user**: 
   - Sees only their own data
   - Can create tasks
   - Can view tasks assigned to them
   - Limited access based on manager_id hierarchy

### Manager Hierarchy

- `users.manager_id` creates a self-referential hierarchy
- **manager_id is MANDATORY for admin role** - enforced by database constraint `check_admin_has_manager`
- If manager_id is set and user is admin, they can see all department data where they manage
- Managers (admins) can see data for users who report to them
- Users can only see their own data unless they are admins
- Super-users bypass all department restrictions and typically have no manager_id
- Hierarchy example: super-user → admins → users

### Data Access Rules

- **Super-user**: Sees ALL data - no filters, no restrictions. Full access to all departments, all users, all tasks, all orders, all dashboards.
- **Dashboard Boards**: Filtered by `department_id` based on auth. Super-users see ALL dashboard boards across all departments.
- **Task Boards**: Department-scoped. Admins see all tasks in their department. Users see their own tasks. Super-users see ALL task boards across all departments.
- **Order Boards**: Food department only. Users with Food department or managers/admins can access. Super-users see ALL order boards.
- **Orders**: No reporters, no deliverables. Only Food department users and managers/admins. Super-users see ALL orders.

---

## Table diagram

```mermaid
flowchart TB
  departments[(departments)]
  users[(users)]
  profiles[(profiles)]
  refresh_tokens[(refresh_tokens)]
  reporters[(reporters)]
  deliverables_settings[(deliverables_settings)]
  task_boards[("task_boards<br/>month_name, year, month")]
  tasks[("tasks<br/>board_id, title, status")]
  task_reporters[("task_reporters<br/>junction")]
  task_deliverables[("task_deliverables<br/>junction")]
  dashboard_boards[("dashboard_boards<br/>month_name, year, month")]
  order_boards[("order_boards<br/>month_name, year, month")]
  orders[("orders<br/>board_id, user_id")]
  task_history[(task_history)]
  order_history[(order_history)]

  users -- department_id --> departments
  users -- manager_id --> users
  users -- user_id 1:1 --> profiles
  users -- user_id --> refresh_tokens
  users -- created_by --> tasks
  users -- assignee_id --> tasks
  users -- user_id --> orders
  users -- user_id --> task_history
  users -- user_id --> order_history
  
  departments -- department_id --> task_boards
  departments -- department_id --> dashboard_boards
  departments -- department_id --> order_boards
  departments -- department_id --> reporters
  departments -- department_id --> deliverables_settings
  
  task_boards -- board_id --> tasks
  tasks -- task_id --> task_reporters
  tasks -- task_id --> task_deliverables
  tasks -- task_id --> task_history
  reporters -- reporter_id --> task_reporters
  deliverables_settings -- deliverable_id --> task_deliverables
  
  order_boards -- board_id --> orders
  orders -- order_id --> order_history
```

---

## Scalability Features

### Easy Table Addition

The schema is designed for easy extension:

1. **Junction Tables**: Use the pattern from `task_reporters` and `task_deliverables` for many-to-many relationships
2. **Department Relations**: Always include `department_id` for department-scoped data
3. **User Relations**: Use `user_id` or `created_by` for user-scoped data
4. **Metadata Fields**: Use JSONB `metadata` fields (like in `dashboard_boards`) for flexible data storage
5. **Timestamps**: Always include `created_at` and `updated_at` for audit trails

### Adding New Relations

**Example: Adding a "Comments" table to tasks:**

```sql
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
```

**Example: Adding a "Tags" table:**

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(20),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE task_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (task_id, tag_id)
);
```

---

## Indexes

| Table                  | Index                           | Purpose |
|------------------------|---------------------------------|---------|
| departments            | idx_departments_name            | Lookup by name |
| users                  | idx_users_email                 | Lookup by email (login) |
| users                  | idx_users_role                  | Filter by role |
| users                  | idx_users_department_id         | Join / filter by department |
| users                  | idx_users_manager_id            | Join / filter by manager |
| users                  | idx_users_is_active             | Filter active users |
| profiles               | idx_profiles_user_id            | Join / lookup by user |
| profiles               | idx_profiles_username           | Lookup by username |
| refresh_tokens         | idx_refresh_tokens_user_id      | Revoke all for user |
| refresh_tokens         | idx_refresh_tokens_expires_at   | Cleanup expired |
| refresh_tokens         | idx_refresh_tokens_token        | UNIQUE; lookup by hash (validate/revoke) |
| reporters              | idx_reporters_name              | Lookup by name |
| reporters              | idx_reporters_department_id     | Filter by department |
| deliverables_settings  | idx_deliverables_settings_name  | Lookup by name |
| deliverables_settings  | idx_deliverables_settings_department_id | Filter by department |
| task_boards            | idx_task_boards_department_id   | Filter by department |
| task_boards            | idx_task_boards_year_month      | Filter by year/month |
| tasks                  | idx_tasks_board_id              | List tasks for a board |
| tasks                  | idx_tasks_created_by            | Filter by creator |
| tasks                  | idx_tasks_assignee_id           | Filter by assignee |
| tasks                  | idx_tasks_status                | Filter by status |
| task_reporters         | idx_task_reporters_task_id      | List reporters for a task |
| task_reporters         | idx_task_reporters_reporter_id  | List tasks for a reporter |
| task_deliverables      | idx_task_deliverables_task_id   | List deliverables for a task |
| task_deliverables      | idx_task_deliverables_deliverable_id | List tasks for a deliverable |
| dashboard_boards       | idx_dashboard_boards_department_id | Filter by department |
| dashboard_boards       | idx_dashboard_boards_year_month | Filter by year/month |
| order_boards           | idx_order_boards_department_id  | Filter by department |
| order_boards           | idx_order_boards_year_month     | Filter by year/month |
| orders                 | idx_orders_board_id             | List orders for a board |
| orders                 | idx_orders_user_id              | Filter by user |
| orders                 | idx_orders_status               | Filter by status |
| task_history           | idx_task_history_task_id        | List history for a task |
| task_history           | idx_task_history_user_id        | List actions by user |
| order_history          | idx_order_history_order_id      | List history for an order |
| order_history          | idx_order_history_user_id       | List actions by user |

---

## Notes

- **Refresh tokens (sessions):** Raw token exists only in the httpOnly cookie; the app stores only the SHA-256 hash (hex, 64 chars) in `refresh_tokens.token`. Cookie: `refresh_token`, path `/api`, SameSite=None, Secure. Expiry and max devices: `REFRESH_TOKEN_EXPIRES_DAYS` (default 7), `REFRESH_TOKEN_MAX_DEVICES` (default 5). Logout = delete row + clear cookie.
- **Access token:** JWT, not stored in DB; lifetime `JWT_EXPIRES_IN` (e.g. 10m). Used for API and Socket.IO; refreshed via `POST /api/auth/refresh` (cookie sent automatically).
- **Roles:** `admin`, `user`, and `super-user`. Enforced in app and Socket.IO by role checks.
- **Departments:** Departments is a **table** (`departments`). Users are **assigned to a department when created** (set `users.department_id`); department is **mandatory for login** (no department ⇒ cannot log in). After login, users **see their data** (dashboard, analytics, tasks, kanban) **scoped to their department**. Same sidebar for everyone; Main Menu data is department-scoped. **Users** list and **UI Showcase** (Settings) are **global** (all departments).
- **Manager Hierarchy:** `users.manager_id` creates a self-referential relationship. **manager_id is MANDATORY for admin role** - enforced by database constraint. If manager_id is set and user is admin, they can see all department data where they manage. Admins can see all data in their department. Users see only their own data. Super-users see all departments and typically have no manager_id.
- **Reporters:** People assigned to tasks when tasks are added. Stored in `reporters` table and linked via `task_reporters` junction table.
- **Deliverables:** Settings stored in `deliverables_settings` and linked to tasks via `task_deliverables` junction table. Includes estimated and actual time tracking.
- **Dashboard Boards:** Monthly dashboard boards per department. Shared structure but filtered by department/auth.
- **Food Orders:** Separate from tasks. No reporters, no deliverables. Only accessible to Food department users and managers/admins.
