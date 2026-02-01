-- Add Food department if missing (so it shows in Settings → Departments).
-- Run: psql -d task_tracker -f server/db/add-food-department.sql
-- Or: psql "$DATABASE_URL" -f server/db/add-food-department.sql
-- Safe to run multiple times.

INSERT INTO departments (name, slug) VALUES ('Food', 'food')
ON CONFLICT (slug) DO NOTHING;
