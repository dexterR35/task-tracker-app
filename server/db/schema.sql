-- =============================================================================
-- Task Tracker DB – PostgreSQL
-- Run: psql -d task_tracker -f server/db/schema.sql  (or psql "$DATABASE_URL" -f server/db/schema.sql)
-- Then optionally: psql -d task_tracker -f server/db/seed-user.sql
-- WARNING: Drops all tables and recreates them (start over). All data is lost.
--
-- Tables (order matters for DROP):
--   departments  – Departments (Design, QA, etc.); users belong to one via users.department_id
--   users        – Auth + department (email, password_hash, role, department_id, is_active)
--   profiles     – One per user (name, office, job_position, etc.); no department (lives in users)
--   refresh_tokens – Sessions: SHA-256 hash of refresh token, user_id, expires_at, user_agent, ip
--   task_boards  – One per department per month (year/month)
--   tasks        – Tasks on a board; optional assignee
-- =============================================================================

-- Drop existing tables (reverse dependency order)
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS task_boards;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

-- =============================================================================
-- DEPARTMENTS: Design, Customer Support, QA, etc. (users belong to one)
-- =============================================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_slug ON departments(slug);

-- Seed core departments (run after schema)
INSERT INTO departments (name, slug) VALUES
  ('Design', 'design'),
  ('Customer Support', 'customer-support'),
  ('QA', 'qa'),
  ('Development', 'development'),
  ('Marketing', 'marketing'),
  ('Product', 'product'),
  ('Other', 'other');

-- =============================================================================
-- AUTH: users (login + department; set department when creating user)
-- =============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- =============================================================================
-- PROFILE: one row per user (name, job, office, etc.; department is in users)
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

-- =============================================================================
-- TASK BOARDS: one per department per month (year/month)
-- =============================================================================
CREATE TABLE task_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  year SMALLINT NOT NULL,
  month SMALLINT NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (department_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_task_boards_department_id ON task_boards(department_id);
CREATE INDEX IF NOT EXISTS idx_task_boards_year_month ON task_boards(year, month);

-- =============================================================================
-- TASKS: belong to a board (department + year/month); optional assignee
-- =============================================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  due_date DATE,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
