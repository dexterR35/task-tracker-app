# API Logic, Flow & Relations

Overview of all API endpoints, middleware flow, IDs, and database relations.

---

## Why auth for boards, tasks, and orders?

We need to know **who** is calling the API so we can:

1. **Scope data by department**  
   All board/task/order APIs use `req.user.departmentId`. Without auth we wouldn’t know which department’s boards, tasks, or orders to return. No user → no department → no safe way to serve the right data.

2. **Enforce which “app” they use**  
   Design (and other non‑Food departments) use **task boards + tasks**. Food uses **order boards + orders**. Middleware checks `req.user.departmentSlug`: Food users get 403 on task APIs; non‑Food users get 403 on order APIs. That’s why those routes require auth (and then the department guard).

3. **Security**  
   If task/order APIs were public, anyone could read or change any department’s data. Auth + department scoping keeps each department’s data isolated.

So: **auth first** (user + department), **then** boards/tasks or boards/orders, all tied to that same user and profile.

---

## Data model (user → profile → department → tasks or orders)

- **Auth user table** (`users`): login (email, password_hash), role, department, is_active. One row per person.
- **User profile** (`profiles`): one row per user (name, office, job, etc.). **Same profile** for that user everywhere — no separate profile per department or per “app”.
- **Department** (`users.department_id`): decides which app they use:
  - **Design (and other non‑Food):** use **task boards** and **tasks**. “History” = past task boards / tasks (same tables; filter by year/month or add a history view).
  - **Food:** use **order boards** and **orders**. “History” = past order boards / orders (same tables; filter by period or add a history view).

So: **one user → one profile**. That user has a department. Depending on department they have either **task references** (tasks on task boards) or **order references** (orders on order boards). History for tasks = old tasks/boards; history for orders = old orders/boards. Same profile for both; no extra “history” table required unless you add one later (e.g. archived tasks/orders).

---

## Monthly Board system (parent → child)

- **task_boards** = **parent** (“bucket” per department per month). Columns: `id`, `department_id`, `year`, `month`, `month_name` (e.g. "March 2026"), `created_at`, `updated_at`. Defines the bucket (e.g. March 2026).
- **tasks** = **child**. Columns: `id`, `board_id` (FK → task_boards.id), `title`, `status`, assignee_id, description, due_date, position, … The actual work item, tied to a specific month via `board_id`.

Same for orders:

- **order_boards** = **parent** (bucket per department per month). `id`, `department_id`, `year`, `month`, `month_name`, `created_at`, `updated_at`.
- **orders** = **child**. `id`, `board_id` (FK → order_boards.id), `user_id`, `order_date`, `summary`, `items`, `status`, … The order is tied to a specific month via `board_id`.

So: **board = bucket (month/year + optional month_name); tasks/orders = children linked by board_id.**

---

## 1. API Endpoints Overview

```
Base: /api
├── /auth          (rate-limited login; optional auth on logout)
├── /users         (authenticate)
├── /departments   (authenticate)
├── /task-boards   (authenticate + reject department slug "food")
├── /tasks         (authenticate + reject department slug "food")
├── /order-boards  (authenticate + require department slug "food")
└── /orders        (authenticate + require department slug "food")
```

### Endpoint Table (Method, Path, IDs, Body/Query, Response)

| Method | Path | Route param / Query / Body IDs | Auth / Guard | Response |
|--------|------|--------------------------------|--------------|----------|
| **Auth** |
| POST | `/api/auth/login` | body: `email`, `password` | — | `{ token, user }` |
| GET | `/api/auth/me` | — | Bearer | `{ user }` |
| POST | `/api/auth/refresh` | cookie: `refresh_token` | — | `{ token, user }` |
| POST | `/api/auth/logout` | cookie | optional | `{ message }` |
| POST | `/api/auth/logout-all` | — | Bearer | `{ message }` |
| **Users** |
| GET | `/api/users` | — | Bearer | `{ users }` |
| GET | `/api/users/:id` | param: `id` (user UUID) | Bearer | `{ user }` |
| PATCH | `/api/users/:id` | param: `id`; body: profile/user fields | Bearer (admin or self) | `{ user }` |
| **Departments** |
| GET | `/api/departments` | — | Bearer | `{ departments }` |
| **Task boards** (Design etc.; Food **rejected**) |
| GET | `/api/task-boards` | query: `year?`, `month?` | Bearer + not Food | `{ boards }` |
| GET | `/api/task-boards/:id` | param: `id` (board UUID) | Bearer + not Food | board object |
| POST | `/api/task-boards` | body: `year`, `month`, `name?` | Bearer + not Food | board (201) |
| **Tasks** (Design etc.; Food **rejected**) |
| GET | `/api/tasks` | query: `boardId` (required) | Bearer + not Food | `{ tasks }` |
| GET | `/api/tasks/:id` | param: `id` (task UUID) | Bearer + not Food | task object |
| POST | `/api/tasks` | body: `boardId`, `title`, … | Bearer + not Food | task (201) |
| PATCH | `/api/tasks/:id` | param: `id`; body: task fields | Bearer + not Food | task object |
| DELETE | `/api/tasks/:id` | param: `id` | Bearer + not Food | 204 |
| **Order boards** (Food **only**) |
| GET | `/api/order-boards` | query: `year?`, `month?` | Bearer + Food | `{ boards }` |
| GET | `/api/order-boards/:id` | param: `id` (board UUID) | Bearer + Food | board object |
| POST | `/api/order-boards` | body: `year`, `month`, `name?` | Bearer + Food | board (201) |
| **Orders** (Food **only**) |
| GET | `/api/orders` | query: `boardId` (required) | Bearer + Food | `{ orders }` |
| GET | `/api/orders/:id` | param: `id` (order UUID) | Bearer + Food | order object |
| POST | `/api/orders` | body: `boardId`, … | Bearer + Food | order (201) |
| PATCH | `/api/orders/:id` | param: `id`; body: order fields | Bearer + Food | order object |
| DELETE | `/api/orders/:id` | param: `id` | Bearer + Food | 204 |

---

## 2. Request Flow (Middleware → Controller → DB)

```mermaid
flowchart LR
  subgraph Auth["/api/auth"]
    A1[POST /login] --> AC[authController]
    A2[GET /me] --> AuthM[authenticate] --> AC
    A3[POST /refresh] --> AC
    A4[POST /logout] --> OptAuth[optionalAuthenticate] --> AC
    A5[POST /logout-all] --> AuthM
  end

  subgraph Users["/api/users"]
    U1[GET /] --> AuthM2[authenticate] --> UC[usersController]
    U2[GET /:id] --> AuthM2
    U3[PATCH /:id] --> AuthM2
  end

  subgraph Depts["/api/departments"]
    D1[GET /] --> AuthM3[authenticate] --> DC[departmentsController]
  end

  subgraph TaskBoards["/api/task-boards"]
    TB1[any] --> AuthM4[authenticate] --> RejectFood[rejectDepartmentSlug('food')] --> TBC[taskBoardsController]
  end

  subgraph Tasks["/api/tasks"]
    T1[any] --> AuthM5[authenticate] --> RejectFood2[rejectDepartmentSlug('food')] --> TC[tasksController]
  end

  subgraph OrderBoards["/api/order-boards"]
    OB1[any] --> AuthM6[authenticate] --> ReqFood[requireDepartmentSlug('food')] --> OBC[orderBoardsController]
  end

  subgraph Orders["/api/orders"]
    O1[any] --> AuthM7[authenticate] --> ReqFood2[requireDepartmentSlug('food')] --> OC[ordersController]
  end

  UC --> DB[(PostgreSQL)]
  DC --> DB
  TBC --> DB
  TC --> DB
  OBC --> DB
  OC --> DB
  AC --> DB
```

### Middleware order (per route)

1. **Auth routes**  
   - `/login`, `/refresh`: rate limit → controller.  
   - `/me`, `/logout-all`: `authenticate` → controller.  
   - `/logout`: `optionalAuthenticate` → controller.

2. **All other routes**  
   - `authenticate` (JWT → `req.user` with `id`, `departmentId`, `departmentSlug`, etc.).  
   - Then (if applied):  
     - `rejectDepartmentSlug('food')` → 403 if `req.user.departmentSlug === 'food'`.  
     - `requireDepartmentSlug('food')` → 403 if `req.user.departmentSlug !== 'food'`.  
   - Then controller → DB.

---

## 3. Database Schema & Relations (IDs)

```mermaid
erDiagram
  departments ||--o{ users : "users.department_id"
  departments ||--o{ task_boards : "task_boards.department_id"
  departments ||--o{ order_boards : "order_boards.department_id"

  users ||--o| profiles : "profiles.user_id"
  users ||--o{ refresh_tokens : "refresh_tokens.user_id"
  users ||--o{ tasks : "tasks.assignee_id (optional)"
  users ||--o{ orders : "orders.user_id"

  task_boards ||--o{ tasks : "tasks.board_id"
  order_boards ||--o{ orders : "orders.board_id"

  departments {
    uuid id PK
    varchar name
    varchar slug UK
    timestamptz created_at
    timestamptz updated_at
  }

  users {
    uuid id PK
    varchar email UK
    varchar password_hash
    varchar role "admin|user"
    uuid department_id FK
    boolean is_active
    timestamptz created_at
    timestamptz updated_at
  }

  profiles {
    uuid id PK
    uuid user_id FK_UK
    varchar name
    varchar username UK
    varchar office
    varchar job_position
    varchar phone
    varchar avatar_url
    varchar gender
    varchar color_set
    timestamptz created_at
    timestamptz updated_at
  }

  refresh_tokens {
    uuid id PK
    uuid user_id FK
    varchar token UK "SHA-256 hash"
    timestamptz expires_at
    varchar user_agent
    varchar ip
    timestamptz last_used_at
    timestamptz created_at
  }

  task_boards {
    uuid id PK
    uuid department_id FK
    smallint year
    smallint month
    varchar month_name "e.g. March 2026"
    timestamptz created_at
    timestamptz updated_at
    UK department_id year month
  }

  tasks {
    uuid id PK
    uuid board_id FK "task_boards.id child"
    uuid assignee_id FK "users.id nullable"
    varchar title
    text description
    varchar status "default todo"
    date due_date
    int position
    timestamptz created_at
    timestamptz updated_at
  }

  order_boards {
    uuid id PK
    uuid department_id FK
    smallint year
    smallint month
    varchar month_name "e.g. March 2026"
    timestamptz created_at
    timestamptz updated_at
    UK department_id year month
  }

  orders {
    uuid id PK
    uuid board_id FK "order_boards.id child"
    uuid user_id FK
    date order_date
    varchar summary
    jsonb items
    varchar status "default pending"
    timestamptz created_at
    timestamptz updated_at
  }
```

### ID usage summary

| Resource      | Primary ID | Foreign IDs / Scoping |
|---------------|------------|------------------------|
| departments   | `id` (UUID) | — |
| users         | `id` (UUID) | `department_id` → departments.id |
| profiles      | `id` (UUID) | `user_id` → users.id (1:1) |
| refresh_tokens| `id` (UUID) | `user_id` → users.id |
| task_boards   | `id` (UUID) | `department_id` → departments.id; scope in API by `req.user.departmentId` |
| tasks         | `id` (UUID) | `board_id` → task_boards.id, `assignee_id` → users.id (optional); board checked against user's department |
| order_boards  | `id` (UUID) | `department_id` → departments.id; scope in API by `req.user.departmentId` |
| orders        | `id` (UUID) | `board_id` → order_boards.id, `user_id` → users.id; board checked against user's department |

---

## 4. Auth Flow (Login, Refresh, Logout)

```mermaid
sequenceDiagram
  participant C as Client
  participant API as Express API
  participant DB as PostgreSQL
  participant IO as Socket.IO

  Note over C,IO: Login
  C->>API: POST /api/auth/login { email, password }
  API->>DB: users + profiles + departments by email
  DB-->>API: user row
  API->>API: bcrypt.compare(password)
  API->>API: jwt.sign({ userId, email })
  API->>DB: INSERT refresh_tokens (hash, user_id, expires_at)
  API->>C: Set-Cookie refresh_token, { token, user }

  Note over C,IO: Authenticated request
  C->>API: GET /api/users (Authorization: Bearer &lt;token&gt;)
  API->>API: verifyToken → req.user (from users+profiles+departments)
  API->>DB: SELECT users...
  API->>C: { users }

  Note over C,IO: Refresh
  C->>API: POST /api/auth/refresh (Cookie: refresh_token)
  API->>DB: SELECT refresh_tokens WHERE token_hash, expires_at > NOW()
  DB-->>API: session row
  API->>API: jwt.sign; create new refresh token
  API->>DB: DELETE old refresh, INSERT new refresh
  API->>C: Set-Cookie, { token, user }

  Note over C,IO: Logout all
  C->>API: POST /api/auth/logout-all (Bearer)
  API->>DB: DELETE refresh_tokens WHERE user_id
  API->>IO: io.to('user:'+userId).emit('forceLogout'), forceDisconnectUser
  API->>C: { message }
```

- **JWT payload**: `{ userId, email }`; verified with `JWT_SECRET` (optional key rotation with `JWT_SECRET_PREVIOUS`).  
- **Refresh token**: stored as SHA-256 hash in `refresh_tokens`; cookie `refresh_token` (httpOnly, secure, sameSite=none).  
- **Scoping**: All board/task/order APIs resolve department from `req.user.departmentId` (no cross-department access).

---

## 5. Department Access Matrix

| API              | Design (slug: design) | Customer Support | Food (slug: food) |
|------------------|------------------------|------------------|---------------------|
| /api/auth/*      | ✅                     | ✅               | ✅                  |
| /api/users       | ✅                     | ✅               | ✅                  |
| /api/departments | ✅                     | ✅               | ✅                  |
| /api/task-boards | ✅                     | ✅               | ❌ (403)            |
| /api/tasks       | ✅                     | ✅               | ❌ (403)            |
| /api/order-boards| ❌ (403)               | ❌ (403)         | ✅                  |
| /api/orders      | ❌ (403)               | ❌ (403)         | ✅                  |

- **Task boards / tasks**: `rejectDepartmentSlug('food')` → only departments whose slug is **not** `food` can access.  
- **Order boards / orders**: `requireDepartmentSlug('food')` → only department with slug `food` can access.

---

## 6. Controller → DB (Key IDs and Queries)

| Controller   | List | Get One | Create / GetOrCreate | Update | Delete |
|-------------|------|---------|----------------------|--------|--------|
| **users**   | —    | `:id` → users.id | — | PATCH `:id` (admin or self) | — |
| **departments** | — | — | — | — | — |
| **taskBoards** | `department_id = req.user.departmentId`; optional `year`, `month` query | `:id` + `department_id = req.user.departmentId` | body `year`, `month`; department from `req.user` | — | — |
| **tasks**   | query `boardId`; board must belong to `req.user.departmentId` | `:id` + board.department_id = user.departmentId | body `boardId`, `title`, …; board checked | PATCH `:id` (board scoped) | DELETE `:id` (board scoped) |
| **orderBoards** | same pattern as task_boards, `department_id = req.user.departmentId` | `:id` + department check | body `year`, `month` | — | — |
| **orders**  | query `boardId`; board must belong to `req.user.departmentId` | `:id` + board.department_id = user.departmentId | body `boardId`, …; `user_id = req.user.id` | PATCH `:id` (board scoped) | DELETE `:id` (board scoped) |

All board and item (task/order) access is scoped by `req.user.departmentId`; no cross-department data is returned.

---

## 7. Socket.IO (Same Auth, No Department in Events)

- **Auth**: Same JWT as HTTP (`auth.token` or `query.token`).  
- **Events**: `task:subscribe`, `task:unsubscribe` (user/admin); `admin:broadcast` (admin).  
- **Rooms**: Socket joined to `user:${userId}`.  
- **Logout**: `forceLogout` emitted to `user:${userId}`; `forceDisconnectUser(userId)` disconnects all sockets for that user.

No department slug checks on Socket events; identity is `userId` and `role` from JWT.
