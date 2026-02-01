# Database schema

## Overview

- **Database:** PostgreSQL
- **Connection:** `DATABASE_URL` in `server/.env`  
  Example: `postgresql://USER:PASSWORD@localhost:5432/task_tracker`
- **Migration:** Single source of truth is `schema.sql`. Run once: `npm run db:migrate` (from `server/`).

The server uses the `pg` pool in `server/config/db.js`, which reads `DATABASE_URL` from the environment.

---

## Tables

| Table            | Purpose                                      |
|-----------------|-----------------------------------------------|
| `users`         | Auth and profile (email, password_hash, role) |
| `refresh_tokens`| Optional; for future refresh-token support   |

**Relationships:** `refresh_tokens.user_id` → `users.id`. `users.manager_id` → `users.id` (self-reference).

---

## Table diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ users                                                            │
├─────────────────────────────────────────────────────────────────┤
│ id                UUID          PRIMARY KEY, DEFAULT gen_random_uuid()
│ email             VARCHAR(255)   UNIQUE NOT NULL
│ password_hash     VARCHAR(255)   NOT NULL
│ name              VARCHAR(255)   NOT NULL
│ username          VARCHAR(100)  UNIQUE, nullable (not in auth)
│ role              VARCHAR(50)   NOT NULL, DEFAULT 'user', CHECK (admin|user)
│ is_active         BOOLEAN       DEFAULT true
│ color_set         VARCHAR(20)   nullable
│ created_by        VARCHAR(100)  nullable
│ occupation        VARCHAR(100)  nullable
│ office            VARCHAR(100)  nullable
│ phone             VARCHAR(50)   nullable
│ avatar_url        VARCHAR(500)  nullable (URL to image, e.g. cloud storage)
│ manager_id        UUID          nullable, REFERENCES users(id)
│ email_verified_at TIMESTAMPTZ   nullable
│ gender            VARCHAR(10)   nullable, CHECK (male | female)
│ created_at        TIMESTAMPTZ   DEFAULT NOW()
│ updated_at        TIMESTAMPTZ   DEFAULT NOW()
├─────────────────────────────────────────────────────────────────┤
│ INDEX: idx_users_email, idx_users_username, idx_users_role,     │
│        idx_users_is_active, idx_users_manager_id                 │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1
                                    │
                                    │ N
┌─────────────────────────────────────────────────────────────────┐
│ refresh_tokens (optional – future refresh-token support)         │
├─────────────────────────────────────────────────────────────────┤
│ id              UUID          PRIMARY KEY, DEFAULT gen_random_uuid()
│ user_id         UUID          NOT NULL, REFERENCES users(id) ON DELETE CASCADE
│ token           VARCHAR(500)   NOT NULL
│ expires_at      TIMESTAMPTZ   NOT NULL
│ created_at      TIMESTAMPTZ   DEFAULT NOW()
├─────────────────────────────────────────────────────────────────┤
│ INDEX: idx_refresh_tokens_user_id, idx_refresh_tokens_expires_at  │
└─────────────────────────────────────────────────────────────────┘
```
