# Single department table – same auth, same user data

## Model

- **One department table** (`departments`) – list of all departments (Design, Food, QA, etc.).
- **Same auth, same user data** – one login, one `users` table, one `profiles` table. No per-department auth or user tables.
- **Only difference: department set when user is created** – each user has `users.department_id` (required). Admins set this when creating/editing the user manually. That is the **only** thing that changes per user for “which app” they see.
- **Each department → different dashboard and menu** – the department slug (from the department row) determines which dashboard, sidebar links, and routes the user gets. Same URL pattern per department (e.g. `/design/dashboard`, `/food/dashboard`) but different content and menu items.

## Flow

1. **Departments** – Stored in `departments` (id, name, slug). Shown in Settings → Departments. No “app type” column; the app (dashboard + menu) is determined in code by **department slug** (e.g. `food` → Food app, others → Design app).
2. **User creation** – Admin creates user and assigns **one** department (`users.department_id`). That’s the only department-specific field at user level.
3. **Login** – Same login for everyone. Auth returns user + department (name, slug). No separate “app” in the DB.
4. **After login** – Frontend uses `user.departmentSlug` to pick layout, sidebar, and routes (dashboard + menu). Same auth, same user data; only the **department** (set at user creation) decides the dashboard and links.

## Adding a new department

1. **DB** – Ensure the department exists in `departments` (insert or already seeded).
2. **Code** – Add a folder under `src/app/departments/<slug>/` with Layout, Sidebar, navConfig, routes, and register it in `src/app/departments/index.js` (`departmentsBySlug`).
3. **Constants** – If the new department has its own “app” (different from Design), add its slug to the mapping in `useDepartmentApp` / `DEPARTMENT_APP` (or extend the slug → app logic).
4. **Backend** – If the department has its own APIs (like Food has orders), add routes and guard them by department slug (or role).

No extra user tables or auth flows – same auth, same user data; only `users.department_id` (set when user is created) drives which dashboard and menu the user sees.
