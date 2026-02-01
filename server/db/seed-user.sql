-- Add admin user: auth in users, profile in profiles (psql only)
-- Run: psql -d task_tracker -f server/db/seed-user.sql
-- Or: psql "$DATABASE_URL" -f db/seed-user.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH u AS (
  INSERT INTO users (email, password_hash, role)
  VALUES ('admin@netbet.ro', crypt('admin123', gen_salt('bf', 12)), 'admin')
  ON CONFLICT (email) DO NOTHING
  RETURNING id
)
INSERT INTO profiles (user_id, name)
SELECT id, 'Admin (Netbet)' FROM u
ON CONFLICT (user_id) DO NOTHING;
