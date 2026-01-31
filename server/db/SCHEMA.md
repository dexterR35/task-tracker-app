# Database schema

## Where data is stored

- **Database:** PostgreSQL
- **Connection:** Set in `server/.env` as `DATABASE_URL`
  - Example: `postgresql://USER:PASSWORD@localhost:5432/task_tracker`
- **Default DB name:** `task_tracker` (you create it; see server README)

The Node server (`server/index.js`) uses the `pg` pool in `server/config/db.js`, which reads `DATABASE_URL` from the environment.

---

## Table diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ users                                                            │
├─────────────────────────────────────────────────────────────────┤
│ id              UUID          PRIMARY KEY, DEFAULT gen_random_uuid()
│ email           VARCHAR(255)  UNIQUE NOT NULL
│ password_hash   VARCHAR(255)  NOT NULL
│ name            VARCHAR(255)  NOT NULL
│ role            VARCHAR(50)   NOT NULL, DEFAULT 'user', CHECK (admin|user)
│ is_active       BOOLEAN       DEFAULT true
│ color_set       VARCHAR(20)   nullable
│ created_by      VARCHAR(100)  nullable
│ occupation      VARCHAR(100)  nullable
│ office          VARCHAR(100)  nullable
│ manager_id      UUID          nullable, REFERENCES users(id)
│ email_verified_at TIMESTAMPTZ nullable
│ created_at      TIMESTAMPTZ   DEFAULT NOW()
│ updated_at      TIMESTAMPTZ   DEFAULT NOW()
├─────────────────────────────────────────────────────────────────┤
│ INDEX: idx_users_email, idx_users_role, idx_users_is_active, idx_users_manager_id │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1
                                    │
                                    │ N
┌─────────────────────────────────────────────────────────────────┐
│ refresh_tokens (optional – for future refresh-token support)      │
├─────────────────────────────────────────────────────────────────┤
│ id              UUID          PRIMARY KEY, DEFAULT gen_random_uuid()
│ user_id         UUID          NOT NULL, REFERENCES users(id) ON DELETE CASCADE
│ token           VARCHAR(500)  NOT NULL
│ expires_at      TIMESTAMPTZ   NOT NULL
│ created_at      TIMESTAMPTZ   DEFAULT NOW()
├─────────────────────────────────────────────────────────────────┤
│ INDEX: idx_refresh_tokens_user_id, idx_refresh_tokens_expires_at │
└─────────────────────────────────────────────────────────────────┘
```

**Relationships:** One user can have many refresh tokens. `refresh_tokens.user_id` → `users.id`. Users can have a manager: `users.manager_id` → `users.id`.
