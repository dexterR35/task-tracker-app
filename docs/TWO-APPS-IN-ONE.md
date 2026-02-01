# 2-apps-in-1: Department-based routing and security

## Overview

**Single department table; same auth, same user data.** Only difference: department is set when the user is created manually (`users.department_id`). Each department has a different dashboard and menu.

One auth, one user table; two app experiences by department:

- **Design (and other non-Food departments):** Task tracker – Dashboard, Analytics, task_boards, tasks. Routes under `/design/*`.
- **Food department:** Office food orders – Order board, Orders, History. Routes under `/food/*`.
- **Shared (no department in path):** Settings – Users, Departments, UI Showcase. Routes under `/settings/*`.

Same users and login; different menus, data, and APIs per app.

## URL structure

| Department | App home | Example routes |
|------------|----------|----------------|
| Design (or other) | `/design/dashboard` | `/design/dashboard`, `/design/analytics`, `/design/profile` |
| Food | `/food/order-board` | `/food/order-board`, `/food/orders`, `/food/history`, `/food/profile` |
| Shared | – | `/settings/users`, `/settings/departments`, `/settings/ui-showcase` |

- After login: Design users → `/design/dashboard`; Food users → `/food/order-board`.
- If a Food user hits `/design/*`, they are redirected to `/food/order-board` (and vice versa for Design on `/food/*`).

## Backend security

- **Tasks APIs** (`/api/task-boards`, `/api/tasks`): `rejectDepartmentSlug('food')` – Food users get **403**.
- **Orders APIs** (`/api/order-boards`, `/api/orders`): `requireDepartmentSlug('food')` – non-Food users get **403**.

Department is taken from the authenticated user (`req.user.departmentSlug`). No trust of client “app type”.

## Frontend

- **useDepartmentApp()** – centralizes app type from `user.departmentSlug`: `appType`, `basePath`, `isFoodApp`, `isDesignApp`, `loginRedirectPath`.
- **DesignLayout** – Sidebar with `/design/...` links + TopNavbar + Outlet.
- **FoodLayout** – FoodSidebar (Order board, Orders, History, Profile, Settings) + TopNavbar + Outlet.
- **SettingsLayout** – Renders Design or Food layout (and sidebar) based on user department; outlet for `/settings/*`.
- **DepartmentGuard** – Redirects to correct app when user hits the other app’s routes.

## Database

- **Food department:** slug `food` (in `departments`).
- **order_boards:** One per department per month (same pattern as task_boards); used by Food app.
- **orders:** Belong to an order_board; `user_id`, `order_date`, `summary`, `items` (JSONB), `status`.

See `server/db/schema.sql` and `server/db/migrate-order-boards.sql` for schema and migration.
