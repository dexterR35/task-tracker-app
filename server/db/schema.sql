-- =============================================================================
-- Task Tracker DB – PostgreSQL (schema + seed, SQL only)
-- Run: psql -d task_tracker -f server/db/schema.sql  (or psql "$DATABASE_URL" -f server/db/schema.sql)
-- WARNING: Drops all tables and recreates them, then seeds departments + users + profiles. All data is lost.
--
-- Tables (order matters for DROP):
--   departments  – Departments (Design, Food, etc.); id, name only (no slug); users belong to one via users.department_id
--   users        – Auth + department (email, password_hash, role, department_id, is_active)
--   profiles     – One per user (name, office, job_position, etc.); no department (lives in users)
--   refresh_tokens – Sessions: SHA-256 hash of refresh token, user_id, expires_at, user_agent, ip
--   task_boards  – Monthly Board (parent bucket): id, department_id, year, month, month_name, created_at
--   tasks        – Child of task_boards: id, board_id (FK), title, status, assignee_id, …
--   order_boards – Monthly Board (parent bucket): id, department_id, year, month, month_name, created_at
--   orders       – Child of order_boards: id, board_id (FK), user_id, order_date, summary, status, …
--   task_history – History of task actions; references auth user (user_id); Design department
--   order_history – History of order actions; references auth user (user_id); Food department
-- =============================================================================

-- Drop existing tables (reverse dependency order)
DROP TABLE IF EXISTS task_history;
DROP TABLE IF EXISTS order_history;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_boards;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS task_boards;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

-- =============================================================================
-- DEPARTMENTS: Design, Customer Support, Food, etc. (users belong to one); name only (no slug)
-- =============================================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- Seed core departments: Design, Customer Support, Food only (rest can be added later)
INSERT INTO departments (name) VALUES
  ('Design'),
  ('Food'),
  ('Customer Support');

-- =============================================================================
-- AUTH: users (login + department; set department when creating user)
-- =============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
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
-- TASK BOARDS: Monthly Board (parent "bucket" per department per month)
-- id, department_id, year, month, month_name, created_by, status, start_date, end_date, created_at
-- =============================================================================
CREATE TABLE task_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  year SMALLINT NOT NULL,
  month SMALLINT NOT NULL,
  month_name VARCHAR(100),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (department_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_task_boards_department_id ON task_boards(department_id);
CREATE INDEX IF NOT EXISTS idx_task_boards_year_month ON task_boards(year, month);
CREATE INDEX IF NOT EXISTS idx_task_boards_created_by ON task_boards(created_by);
CREATE INDEX IF NOT EXISTS idx_task_boards_status ON task_boards(status);

-- =============================================================================
-- TASKS: child of task_boards (board_id FK); work item tied to a specific month
-- id, board_id, title, status, assignee_id, description, due_date, position
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

-- =============================================================================
-- ORDER BOARDS: Monthly Board (parent "bucket" per department per month) – Food
-- id, department_id, year, month, month_name, created_by, status, start_date, end_date, created_at
-- =============================================================================
CREATE TABLE order_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  year SMALLINT NOT NULL,
  month SMALLINT NOT NULL,
  month_name VARCHAR(100),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (department_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_order_boards_department_id ON order_boards(department_id);
CREATE INDEX IF NOT EXISTS idx_order_boards_year_month ON order_boards(year, month);
CREATE INDEX IF NOT EXISTS idx_order_boards_created_by ON order_boards(created_by);
CREATE INDEX IF NOT EXISTS idx_order_boards_status ON order_boards(status);

-- =============================================================================
-- ORDERS: child of order_boards (board_id FK); order tied to a specific month
-- id, board_id, user_id, order_date, summary, items, status
-- =============================================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES order_boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_date DATE DEFAULT CURRENT_DATE,
  summary VARCHAR(500),
  items JSONB DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_board_id ON orders(board_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

-- =============================================================================
-- TASK HISTORY: per auth user (Design); who did what to which task
-- id, user_id (auth user), task_id, action, details (optional), created_at
-- =============================================================================
CREATE TABLE task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_history_user_id ON task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON task_history(created_at);

-- =============================================================================
-- ORDER HISTORY: per auth user (Food); who did what to which order
-- id, user_id (auth user), order_id, action, details (optional), created_at
-- =============================================================================
CREATE TABLE order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_user_id ON order_history(user_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON order_history(created_at);

-- =============================================================================
-- SEED: departments (above) + users + profiles (bcrypt via pgcrypto)
-- Passwords: admin123 (admins), user123 (users). One admin + one user per department.
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (email, password_hash, role, department_id)
VALUES
  ('admin-design@netbet.ro', crypt('admin123', gen_salt('bf')), 'admin', (SELECT id FROM departments WHERE name = 'Design')),
  ('user-design@netbet.ro', crypt('user123', gen_salt('bf')), 'user', (SELECT id FROM departments WHERE name = 'Design')),
  ('admin-customer-support@netbet.ro', crypt('admin123', gen_salt('bf')), 'admin', (SELECT id FROM departments WHERE name = 'Customer Support')),
  ('user-customer-support@netbet.ro', crypt('user123', gen_salt('bf')), 'user', (SELECT id FROM departments WHERE name = 'Customer Support')),
  ('admin-food@netbet.ro', crypt('admin123', gen_salt('bf')), 'admin', (SELECT id FROM departments WHERE name = 'Food')),
  ('user-food@netbet.ro', crypt('user123', gen_salt('bf')), 'user', (SELECT id FROM departments WHERE name = 'Food'));

INSERT INTO profiles (user_id, name)
SELECT u.id, v.display_name
FROM (VALUES
  ('admin-design@netbet.ro', 'Admin (design)'),
  ('user-design@netbet.ro', 'User (design)'),
  ('admin-customer-support@netbet.ro', 'Admin (customer-support)'),
  ('user-customer-support@netbet.ro', 'User (customer-support)'),
  ('admin-food@netbet.ro', 'Admin (food)'),
  ('user-food@netbet.ro', 'User (food)')
) AS v(email, display_name)
JOIN users u ON u.email = v.email;
