-- =============================================================================
-- Task Tracker DB – PostgreSQL (schema + seed, SQL only)
-- Run: psql -d task_tracker -f server/db/schema.sql  (or psql "$DATABASE_URL" -f server/db/schema.sql)
-- WARNING: Drops all tables and recreates them, then seeds departments + users + profiles. All data is lost.
--
-- Database Structure:
--   - Users with manager hierarchy (manager_id self-reference)
--   - Roles: admin, user, super-user (super-user sees all departments)
--   - Departments: Design, Food, Customer Support
--   - Monthly boards: task_boards, order_boards, dashboard_boards
--   - Tasks with reporters and deliverables
--   - Orders (Food department only, no reporters, no deliverables)
--   - Scalable structure for easy table additions and relations
-- =============================================================================

-- Drop existing tables (reverse dependency order)
DROP TABLE IF EXISTS task_deliverables;
DROP TABLE IF EXISTS task_reporters;
DROP TABLE IF EXISTS deliverables_settings;
DROP TABLE IF EXISTS reporters;
DROP TABLE IF EXISTS dashboard_boards;
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
-- DEPARTMENTS: Design, Customer Support, Food, etc. (users belong to one)
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
-- AUTH: users (login + department + manager hierarchy)
-- Roles: 
--   - 'admin' (sees all data in their department)
--   - 'user' (sees own data)
--   - 'super-user' (sees ALL data in the app - ALL departments, ALL users, ALL tasks, ALL orders, etc.)
-- Manager: manager_id references users(id) - self-referential for hierarchy
-- IMPORTANT: manager_id is MANDATORY for 'admin' role - admins must have a manager
-- If manager_id is set and user is admin, they can see all department data where they manage
-- Super-user has NO restrictions - full access to everything in the application
--
-- DEPARTMENT ASSIGNMENT:
--   - department_id is REQUIRED for 'admin' and 'user' roles (NOT NULL)
--   - department_id is OPTIONAL (NULL) for 'super-user' role - super-users see ALL departments
--   - When creating a user, you MUST select/assign a department (department_id) UNLESS role is 'super-user'
--   - The user will be REFERENCED to that department via department_id FK (if set)
--   - After login, user's access is SCOPED to their assigned department (or ALL if super-user)
--   - User's dashboard, sidebar, and data are filtered by their department_id (or ALL if super-user)
--   - Cannot delete a department if users reference it (ON DELETE RESTRICT)
-- =============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'super-user')),
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_manager_not_self CHECK (manager_id != id),
  CONSTRAINT check_admin_has_manager CHECK (
    (role = 'admin' AND manager_id IS NOT NULL) OR 
    (role != 'admin')
  ),
  CONSTRAINT check_department_required CHECK (
    (role IN ('admin', 'user') AND department_id IS NOT NULL) OR
    (role = 'super-user')
  )
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
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
-- REPORTERS: People assigned to tasks (when task is added)
-- Scalable: Can be extended with additional fields (email, department, etc.)
-- =============================================================================
CREATE TABLE reporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reporters_name ON reporters(name);
CREATE INDEX IF NOT EXISTS idx_reporters_department_id ON reporters(department_id);
CREATE INDEX IF NOT EXISTS idx_reporters_is_active ON reporters(is_active);

-- =============================================================================
-- DELIVERABLES SETTINGS: Name and time settings, related to tasks
-- Scalable: Can be extended with additional fields (description, priority, etc.)
-- =============================================================================
CREATE TABLE deliverables_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  estimated_time_hours DECIMAL(10, 2),
  description TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_settings_name ON deliverables_settings(name);
CREATE INDEX IF NOT EXISTS idx_deliverables_settings_department_id ON deliverables_settings(department_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_settings_is_active ON deliverables_settings(is_active);

-- =============================================================================
-- TASK BOARDS: Monthly Board (parent "bucket" per department per month)
-- Each department has a task board for each month/year
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
-- Each user can put/create tasks
-- =============================================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
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
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- =============================================================================
-- TASK_REPORTERS: Junction table - Many-to-Many relationship
-- Links tasks to reporters (people assigned when task is added)
-- Scalable: Easy to add additional fields (assigned_at, role, etc.)
-- =============================================================================
CREATE TABLE task_reporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES reporters(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (task_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_task_reporters_task_id ON task_reporters(task_id);
CREATE INDEX IF NOT EXISTS idx_task_reporters_reporter_id ON task_reporters(reporter_id);
CREATE INDEX IF NOT EXISTS idx_task_reporters_assigned_at ON task_reporters(assigned_at);

-- =============================================================================
-- TASK_DELIVERABLES: Junction table - Many-to-Many relationship
-- Links tasks to deliverables_settings (name and time)
-- Scalable: Easy to add additional fields (completed_at, actual_time, etc.)
-- =============================================================================
CREATE TABLE task_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  deliverable_id UUID NOT NULL REFERENCES deliverables_settings(id) ON DELETE CASCADE,
  actual_time_hours DECIMAL(10, 2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (task_id, deliverable_id)
);

CREATE INDEX IF NOT EXISTS idx_task_deliverables_task_id ON task_deliverables(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deliverables_deliverable_id ON task_deliverables(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_task_deliverables_completed_at ON task_deliverables(completed_at);

-- =============================================================================
-- DASHBOARD BOARDS: Monthly Dashboard Board (per department per month)
-- Shared dashboard board for all departments, filtered by auth/department
-- =============================================================================
CREATE TABLE dashboard_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  year SMALLINT NOT NULL,
  month SMALLINT NOT NULL,
  month_name VARCHAR(100),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (department_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_boards_department_id ON dashboard_boards(department_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_boards_year_month ON dashboard_boards(year, month);
CREATE INDEX IF NOT EXISTS idx_dashboard_boards_created_by ON dashboard_boards(created_by);
CREATE INDEX IF NOT EXISTS idx_dashboard_boards_status ON dashboard_boards(status);

-- =============================================================================
-- ORDER BOARDS: Monthly Board (parent "bucket" per department per month) – Food
-- Only for Food department
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
-- Food department only - no reporters, no deliverables relation
-- Only users with department Food and managers/admins can access
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
-- Passwords: admin123 (admins), user123 (users), super123 (super-user)
-- One admin + one user per department + one super-user
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert users (super-user first, then admins, then regular users)
-- Super-user has no manager (top level)
INSERT INTO users (email, password_hash, role, department_id, manager_id)
VALUES
  ('super-user@netbet.ro', crypt('super123', gen_salt('bf')), 'super-user', NULL, NULL);

-- Admins must have a manager_id (they report to super-user)
INSERT INTO users (email, password_hash, role, department_id, manager_id)
VALUES
  ('admin-design@netbet.ro', crypt('admin123', gen_salt('bf')), 'admin', (SELECT id FROM departments WHERE name = 'Design'), (SELECT id FROM users WHERE email = 'super-user@netbet.ro')),
  ('admin-customer-support@netbet.ro', crypt('admin123', gen_salt('bf')), 'admin', (SELECT id FROM departments WHERE name = 'Customer Support'), (SELECT id FROM users WHERE email = 'super-user@netbet.ro')),
  ('admin-food@netbet.ro', crypt('admin123', gen_salt('bf')), 'admin', (SELECT id FROM departments WHERE name = 'Food'), (SELECT id FROM users WHERE email = 'super-user@netbet.ro'));

-- Regular users report to their department admin
INSERT INTO users (email, password_hash, role, department_id, manager_id)
VALUES
  ('user-design@netbet.ro', crypt('user123', gen_salt('bf')), 'user', (SELECT id FROM departments WHERE name = 'Design'), (SELECT id FROM users WHERE email = 'admin-design@netbet.ro' AND role = 'admin')),
  ('user-customer-support@netbet.ro', crypt('user123', gen_salt('bf')), 'user', (SELECT id FROM departments WHERE name = 'Customer Support'), (SELECT id FROM users WHERE email = 'admin-customer-support@netbet.ro' AND role = 'admin')),
  ('user-food@netbet.ro', crypt('user123', gen_salt('bf')), 'user', (SELECT id FROM departments WHERE name = 'Food'), (SELECT id FROM users WHERE email = 'admin-food@netbet.ro' AND role = 'admin'));

-- Insert profiles
INSERT INTO profiles (user_id, name)
SELECT u.id, v.display_name
FROM (VALUES
  ('admin-design@netbet.ro', 'Admin (design)'),
  ('user-design@netbet.ro', 'User (design)'),
  ('admin-customer-support@netbet.ro', 'Admin (customer-support)'),
  ('user-customer-support@netbet.ro', 'User (customer-support)'),
  ('admin-food@netbet.ro', 'Admin (food)'),
  ('user-food@netbet.ro', 'User (food)'),
  ('super-user@netbet.ro', 'Super User')
) AS v(email, display_name)
JOIN users u ON u.email = v.email;

-- Seed sample reporters
INSERT INTO reporters (name, email, department_id)
SELECT 
  v.name,
  v.email,
  d.id
FROM (VALUES
  ('John Reporter', 'john.reporter@netbet.ro', 'Design'),
  ('Jane Reporter', 'jane.reporter@netbet.ro', 'Design'),
  ('Bob Reporter', 'bob.reporter@netbet.ro', 'Customer Support')
) AS v(name, email, dept_name)
JOIN departments d ON d.name = v.dept_name;

-- Seed sample deliverables settings
INSERT INTO deliverables_settings (name, estimated_time_hours, description, department_id)
SELECT 
  v.name,
  v.hours,
  v.description,
  d.id
FROM (VALUES
  ('Design Mockup', 8.0, 'Create design mockup', 'Design'),
  ('Code Review', 2.0, 'Review code changes', 'Design'),
  ('Testing', 4.0, 'Perform testing', 'Design'),
  ('Documentation', 3.0, 'Write documentation', 'Customer Support')
) AS v(name, hours, description, dept_name)
JOIN departments d ON d.name = v.dept_name;
