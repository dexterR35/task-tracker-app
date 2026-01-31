# Task Tracker – PERN Backend

Express + PostgreSQL backend with JWT auth API.

## Setup

1. **Install dependencies**

   ```bash
   cd server && npm install
   ```

2. **PostgreSQL**

   - Install PostgreSQL and create a database, e.g. `task_tracker`.
   - Copy `env.example` to `.env` and set:

   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/task_tracker
   JWT_SECRET=your-long-random-secret
   PORT=5000
   ```

3. **Run migrations**

   ```bash
   npm run db:migrate
   ```

4. **Optional: seed admin user**

   ```bash
   npm run db:seed
   # Default: admin@example.com / admin123 (dev only)
   ```

5. **Start server**

   ```bash
   npm run dev
   ```

## API

| Method | Endpoint            | Auth | Description        |
|--------|---------------------|------|--------------------|
| POST   | `/api/auth/register` | No   | Register user       |
| POST   | `/api/auth/login`    | No   | Login, returns JWT |
| GET    | `/api/auth/me`       | Yes  | Current user       |

**Register body:** `{ "email", "password", "name", "role" }` (role: `admin` or `user`).  
**Login body:** `{ "email", "password" }`.  
**Protected routes:** `Authorization: Bearer <token>`.

## Health

- `GET /health` – app status  
- `GET /health/db` – database connectivity
