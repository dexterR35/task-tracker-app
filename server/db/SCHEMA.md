# Database schema

## Overview

- **Database:** PostgreSQL
- **Connection:** `DATABASE_URL` in `server/.env`  
  Example: `postgresql://USER:PASSWORD@localhost:5432/task_tracker`
- **Setup:** Run with psql (no Node). Users are added manually (e.g. seed script or admin); no public registration.

**Split:** Auth in `users` (login only). Profile in `profiles` (name, job, office, etc.). Sessions in `refresh_tokens` (hashed refresh token + metadata).

---

## Setup

```bash
# Create DB (if needed)
createdb task_tracker

# Run schema (creates tables, indexes, migration for existing DBs)
psql -d task_tracker -f server/db/schema.sql

# Or with DATABASE_URL
psql "$DATABASE_URL" -f server/db/schema.sql

# Optional: add default admin user (requires pgcrypto)
psql -d task_tracker -f server/db/seed-user.sql
```

---

## Tables

| Table            | Purpose |
|------------------|--------|
| `users`          | **Auth only** – email, password_hash, role, is_active. No profile fields. |
| `profiles`       | **Profile only** – one row per user (name, username, office, job_position, phone, avatar_url, gender, etc.). |
| `refresh_tokens` | **Sessions** – SHA-256 hash of refresh token, user_id, expires_at, user_agent, ip, last_used_at. Token stored as hash only; metadata for audit. |

**Relationships:** `profiles.user_id` → `users.id` (1:1). `refresh_tokens.user_id` → `users.id` (many per user).

---

## Table diagram

```
┌──────────────────────────────────────────┐
│ users (auth only)                        │
├──────────────────────────────────────────┤
│ id                UUID    PK, gen_random_uuid()
│ email             VARCHAR(255) UNIQUE NOT NULL
│ password_hash     VARCHAR(255) NOT NULL
│ role              VARCHAR(50)  NOT NULL, CHECK (admin|user)
│ is_active         BOOLEAN      DEFAULT true
│ created_at        TIMESTAMPTZ  DEFAULT NOW()
│ updated_at        TIMESTAMPTZ  DEFAULT NOW()
└──────────────────────────────────────────┘
         │ 1
         │
         │ 1
┌──────────────────────────────────────────┐
│ profiles (profile only)                  │
├──────────────────────────────────────────┤
│ id                UUID    PK
│ user_id           UUID    UNIQUE NOT NULL, REFERENCES users(id) ON DELETE CASCADE
│ name              VARCHAR(255) NOT NULL
│ username          VARCHAR(100) UNIQUE, nullable
│ office            VARCHAR(100) nullable
│ job_position      VARCHAR(100) nullable
│ phone             VARCHAR(50) nullable
│ avatar_url        VARCHAR(500) nullable
│ gender            VARCHAR(10) nullable, CHECK (male|female)
│ color_set         VARCHAR(20) nullable
│ created_by        VARCHAR(100) nullable
│ email_verified_at TIMESTAMPTZ nullable
│ created_at        TIMESTAMPTZ DEFAULT NOW()
│ updated_at        TIMESTAMPTZ DEFAULT NOW()
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ refresh_tokens (sessions)                 │
├──────────────────────────────────────────┤
│ id              UUID    PK
│ user_id         UUID    NOT NULL, REFERENCES users(id) ON DELETE CASCADE
│ token           VARCHAR(64) NOT NULL   (SHA-256 hex hash of token)
│ expires_at      TIMESTAMPTZ NOT NULL
│ user_agent      VARCHAR(500) nullable
│ ip              VARCHAR(45) nullable
│ last_used_at    TIMESTAMPTZ nullable
│ created_at      TIMESTAMPTZ DEFAULT NOW()
└──────────────────────────────────────────┘
```

---

## Indexes

| Table            | Index                         | Purpose |
|------------------|-------------------------------|--------|
| users            | idx_users_email               | Lookup by email (login) |
| users            | idx_users_role                | Filter by role |
| users            | idx_users_is_active           | Filter active users |
| profiles         | idx_profiles_user_id          | Join / lookup by user |
| profiles         | idx_profiles_username         | Lookup by username |
| refresh_tokens   | idx_refresh_tokens_user_id    | Revoke all for user |
| refresh_tokens   | idx_refresh_tokens_expires_at | Cleanup expired |
| refresh_tokens   | idx_refresh_tokens_token      | UNIQUE; lookup by hash (validate/revoke) |

---

## Notes

- **Refresh tokens:** The app stores only the SHA-256 hash (hex, 64 chars) in `refresh_tokens.token`. Raw token is sent to the client in an httpOnly cookie and never stored.
- **Roles:** `admin` and `user` only. Enforced in app and Socket.IO by role checks.
