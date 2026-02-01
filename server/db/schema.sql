-- =============================================================================
-- Task Tracker DB – PostgreSQL
-- Run: psql -d task_tracker -f server/db/schema.sql  (or psql "$DATABASE_URL" -f server/db/schema.sql)
-- Then optionally: psql -d task_tracker -f server/db/seed-user.sql
-- WARNING: Drops all tables and recreates them (start over). All data is lost.
-- =============================================================================

-- Drop existing tables (reverse dependency order)
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;

-- =============================================================================
-- AUTH: users (login only – no profile data)
-- =============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- =============================================================================
-- PROFILE: one row per user (name, job, office, etc.)
-- =============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE,
  office VARCHAR(100),
  job_position VARCHAR(100),
  phone VARCHAR(50),
  avatar_url VARCHAR(500),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  color_set VARCHAR(20),
  created_by VARCHAR(100),
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- =============================================================================
-- SESSIONS: refresh tokens (SHA-256 hash stored; metadata for audit)
-- =============================================================================
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent VARCHAR(500),
  ip VARCHAR(45),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
