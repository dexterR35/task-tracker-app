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

3. **Database**

   Schema (psql): `psql -d task_tracker -f db/schema.sql` (or use `$DATABASE_URL`).  
   Seed users (Node – same DB as app, bcryptjs): from `server/` run `npm run db:seed`.  
   Creates one admin + one user per department (design, customer-support, food). Emails: admin-{dept}@netbet.ro (admin123), user-{dept}@netbet.ro (user123).

4. **Start server**

   ```bash
   npm run dev
   ```

## API

| Method | Endpoint            | Auth | Description        |
|--------|---------------------|------|--------------------|
| POST   | `/api/auth/login`   | No   | Login; returns JWT + sets httpOnly refresh cookie |
| GET    | `/api/auth/me`      | Yes  | Current user       |
| POST   | `/api/auth/refresh` | No   | Cookie sent; validates against sessions table; returns new JWT |
| POST   | `/api/auth/logout`     | No   | Cookie sent; deletes session, clears cookie; emits Socket.IO `forceLogout` |
| POST   | `/api/auth/logout-all` | Yes  | Revokes all sessions for user; emits `forceLogout` to all devices           |

**Access token:** JWT, 5–10 min (high security) or 10–15 min default; stored in memory on client.  
**Refresh token:** Opaque, httpOnly secure cookie; stored as **SHA-256 hash** in `refresh_tokens`; validated against DB.  
**Session metadata:** `user_agent`, `ip`, `last_used_at` stored per session for monitoring.  
**Protected routes:** `Authorization: Bearer <JWT>`.

**Key rotation:** Set `JWT_SECRET_PREVIOUS` to the old secret when rotating; server verifies with current then previous.

## Socket.IO

- Connect with JWT only: `io(API_URL, { auth: { token: <JWT> } })`.
- Server verifies JWT on handshake (supports key rotation); loads `role` from DB; attaches `userId`, `role` to socket (identity from JWT, not `socket.id`).
- **Event validation:** Only events in `SOCKET_EVENT_ROLES` are accepted; each event requires the socket’s role to be in the allowed list.
- Optional event: `forceLogout` → client clears token and redirects to login.

### Common mistakes (avoid)

- ❌ Using refresh token in socket auth – use JWT only.
- ❌ Long-lived JWTs just for sockets – use same short-lived access token.
- ❌ Skipping auth on reconnect – server verifies JWT on every connection.
- ❌ Trusting `socket.id` as identity – use `socket.userId` from verified JWT.

## Logging & monitoring

- **Auth events** (login, logout, refresh, logout-all, register) are logged as JSON lines to stdout: `event`, `userId`, `ip`, `userAgent`, `success`/`reason`.
- Pipe to a log aggregator or file for monitoring and audit.

## Health

- `GET /health` – app status  
- `GET /health/db` – database connectivity
