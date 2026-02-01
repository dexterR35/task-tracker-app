-- Seed 3 users for dev/auth: admin (Design), admin2 (Customer Support), super_admin (Other)
-- Run after schema: psql -d task_tracker -f server/db/seed-user.sql
-- Or: psql "$DATABASE_URL" -f server/db/seed-user.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Admin (Design department) – admin@netbet.ro / admin123
WITH dept AS (SELECT id FROM departments WHERE slug = 'design' LIMIT 1),
u AS (
  INSERT INTO users (email, password_hash, role, department_id)
  SELECT 'admin@netbet.ro', crypt('admin123', gen_salt('bf', 12)), 'admin', dept.id FROM dept
  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, department_id = EXCLUDED.department_id
  RETURNING id
)
INSERT INTO profiles (user_id, name)
SELECT u.id, 'Admin (Design)' FROM u
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Admin (Customer Support department) – admin2@netbet.ro / admin123
WITH dept AS (SELECT id FROM departments WHERE slug = 'customer-support' LIMIT 1),
u AS (
  INSERT INTO users (email, password_hash, role, department_id)
  SELECT 'admin2@netbet.ro', crypt('admin123', gen_salt('bf', 12)), 'admin', dept.id FROM dept
  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, department_id = EXCLUDED.department_id
  RETURNING id
)
INSERT INTO profiles (user_id, name)
SELECT u.id, 'Admin (Customer Support)' FROM u
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Super Admin (Other department) – superadmin@netbet.ro / super123 (sees all departments in app)
WITH dept AS (SELECT id FROM departments WHERE slug = 'other' LIMIT 1),
u AS (
  INSERT INTO users (email, password_hash, role, department_id)
  SELECT 'superadmin@netbet.ro', crypt('super123', gen_salt('bf', 12)), 'super_admin', dept.id FROM dept
  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, department_id = EXCLUDED.department_id
  RETURNING id
)
INSERT INTO profiles (user_id, name)
SELECT u.id, 'Super Admin' FROM u
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name;
