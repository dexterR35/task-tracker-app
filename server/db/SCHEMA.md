# Database schema

## Overview

- **Database:** PostgreSQL
- **Connection:** `DATABASE_URL` in `server/.env`  
  Example: `postgresql://USER:PASSWORD@localhost:5432/task_tracker`
- **Setup:** Run with psql (no Node). Users are added manually (e.g. seed script or admin); no public registration.

**Single department table; same auth, same user data.** One `departments` table; one login; one `users` table. The only difference per user is **department** – set when the user is created manually (`users.department_id`). Each department has a different dashboard and menu in the app. **Split:** Auth + department in `users` (login; set `users.department_id` when creating a user). Profile in `profiles` (name, job, office, etc.; no department). **Sessions** in `refresh_tokens` (cookie + DB). **Departments** is a table (`departments`); users are assigned to a department on creation via `users.department_id`; department is mandatory for login. Data (dashboard, analytics, tasks, kanban) is scoped by user’s department.

### Auth & sessions (cookie + DB)

- **Access token:** Short-lived JWT (e.g. 10m), in memory only; sent as `Authorization: Bearer` on API calls. Not stored in DB.
- **Refresh token:** Long-lived (e.g. 7 days), stored in httpOnly cookie (`refresh_token`, path `/api`). **DB stores only the SHA-256 hash** in `refresh_tokens`; raw token is never stored. One row per session (per device).
- **Refresh flow:** Client sends cookie to `POST /api/auth/refresh` → server validates hash in DB → returns new JWT + user; optionally issues new refresh token (rotation). Logout = delete row + clear cookie (session dead immediately). Max sessions per user (e.g. 5) enforced by revoking oldest when exceeded.

### Used in auth (users table only)

| Used in auth | Where | Purpose |
|--------------|-------|--------|
| **email** | users | Look up user and send login response |
| **password** (password_hash) | users | Check password with bcrypt |
| **department_id** | users | Must be set; login fails if missing |
| **is_active** | users | Must be true; login fails if false |
| **role** | users | Not used to allow/deny login; used after login for authorization (e.g. admin vs user) |

**Not used in auth:** `name` lives in `profiles` only; used for display, not for login or session checks.

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
```

---

## Tables (summary)

| Table            | Purpose |
|------------------|--------|
| `departments`    | **Departments** – id, name, slug. Seeded: Design, **Food**, Customer Support, QA, Development, Marketing, Product, Other. Users are assigned to one department via `users.department_id`; data is scoped by department. **2-apps-in-1:** Design (and other non-Food) → task tracker; Food → office food orders. |
| `users`          | **Auth only** – id, email, password_hash, role, **department_id** NOT NULL, is_active. Login uses: email + password; then requires department_id and is_active. Name is not in users (profile-only). |
| `profiles`       | **Profile only (not used in auth)** – one row per user. user_id → users(id), name, username, office, job_position, phone, avatar_url, gender, etc. Name is for display only; login does not use it. |
| `refresh_tokens` | **Sessions (cookie + DB)** – id, user_id → users(id), token (SHA-256 hash, 64 chars), expires_at, user_agent, ip, last_used_at, created_at. One row per device; max per user configurable (e.g. 5). Raw token only in httpOnly cookie; DB stores hash only. |
| `task_boards`    | **Monthly Board (parent)** – one “bucket” per department per month (Design and other non-Food). id, department_id, year, month, **month_name** (e.g. "March 2026"), created_at, updated_at. UNIQUE (department_id, year, month). **API:** reject DepartmentSlug `food`. |
| `tasks`          | **Tasks (child)** – work item tied to a board. id, **board_id** → task_boards(id), title, status, assignee_id, description, due_date, position, created_at, updated_at. **API:** reject DepartmentSlug `food`. |
| `order_boards`   | **Monthly Board (parent)** – one “bucket” per department per month (Food). id, department_id, year, month, **month_name** (e.g. "March 2026"), created_at, updated_at. UNIQUE (department_id, year, month). **API:** require DepartmentSlug `food`. |
| `orders`         | **Orders (child)** – order tied to a board. id, **board_id** → order_boards(id), user_id, order_date, summary, items (JSONB), status, created_at, updated_at. **API:** require DepartmentSlug `food`. |

**Relationships:** `users.department_id` → `departments.id` (required for login). `profiles.user_id` → `users.id` (1:1). `refresh_tokens.user_id` → `users.id` (many per user). `task_boards.department_id` → `departments.id`. **Monthly Board:** `task_boards` = parent (bucket); `tasks.board_id` → `task_boards.id` = child. Same for `order_boards` (parent) and `orders.board_id` → `order_boards.id` (child). `tasks.assignee_id` → `users.id`. `orders.user_id` → `users.id`.

---

## Table diagram

Tables in order: **users** + **refresh_tokens** (auth & sessions) → **profiles** → **departments** (users belong to) → **task_boards** → **tasks**.

```mermaid
flowchart LR
  users[(users)]
  refresh_tokens[(refresh_tokens)]
  profiles[(profiles)]
  departments[(departments)]
  task_boards[("task_boards<br/>month_name, year, month — bucket")]
  tasks[("tasks<br/>board_id, title, status")]

  users -- user_id 1:1 --> profiles
  users -- user_id --> refresh_tokens
  users -- department_id --> departments
  departments -- department_id --> task_boards
  task_boards -- board_id --> tasks
  users -. assignee_id .-> tasks
```

### Session lifecycle (refresh token + cookie)

1. **Login** – Validate password → create refresh token (random 32 bytes, hash stored in `refresh_tokens`) → set httpOnly cookie (`path=/api`) → return JWT + user.
2. **Refresh** – Client sends cookie to `POST /api/auth/refresh` → server looks up hash in `refresh_tokens` → if valid, return new JWT + user and optionally rotate refresh token (new cookie + new row, old row deleted).
3. **Logout** – Revoke token in DB (delete row), clear cookie (path `/api` and legacy path `/`).
4. **Logout all** – Delete all `refresh_tokens` for user, clear cookie; Socket.IO emits `forceLogout` to all that user’s clients.

---

## Indexes

| Table            | Index                         | Purpose |
|------------------|-------------------------------|--------|
| departments      | idx_departments_slug          | Lookup by slug |
| users            | idx_users_email               | Lookup by email (login) |
| users            | idx_users_role                | Filter by role |
| users            | idx_users_department_id       | Join / filter by department |
| users            | idx_users_is_active           | Filter active users |
| profiles         | idx_profiles_user_id          | Join / lookup by user |
| profiles         | idx_profiles_username         | Lookup by username |
| refresh_tokens   | idx_refresh_tokens_user_id    | Revoke all for user |
| refresh_tokens   | idx_refresh_tokens_expires_at | Cleanup expired |
| refresh_tokens   | idx_refresh_tokens_token      | UNIQUE; lookup by hash (validate/revoke) |
| task_boards      | idx_task_boards_department_id | Filter by department |
| task_boards      | idx_task_boards_year_month    | Filter by year/month |
| tasks            | idx_tasks_board_id            | List tasks for a board |
| tasks            | idx_tasks_assignee_id         | Filter by assignee |
| tasks            | idx_tasks_status              | Filter by status |

---

## Notes

- **Refresh tokens (sessions):** Raw token exists only in the httpOnly cookie; the app stores only the SHA-256 hash (hex, 64 chars) in `refresh_tokens.token`. Cookie: `refresh_token`, path `/api`, SameSite=None, Secure. Expiry and max devices: `REFRESH_TOKEN_EXPIRES_DAYS` (default 7), `REFRESH_TOKEN_MAX_DEVICES` (default 5). Logout = delete row + clear cookie.
- **Access token:** JWT, not stored in DB; lifetime `JWT_EXPIRES_IN` (e.g. 10m). Used for API and Socket.IO; refreshed via `POST /api/auth/refresh` (cookie sent automatically).
- **Roles:** `admin` and `user`. Enforced in app and Socket.IO by role checks.
- **Departments:** Departments is a **table** (`departments`). Users are **assigned to a department when created** (set `users.department_id`); department is **mandatory for login** (no department ⇒ cannot log in). After login, users **see their data** (dashboard, analytics, tasks, kanban) **scoped to their department**. Same sidebar for everyone; Main Menu data is department-scoped. **Users** list and **UI Showcase** (Settings) are **global** (all departments).
