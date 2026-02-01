-- Migration: remove super_admin role – only admin and user.
-- Run if your DB was created with the old schema (role IN ('super_admin', 'admin', 'user')).
-- 1. Convert any super_admin users to admin
-- 2. Drop old CHECK and add new one

UPDATE users SET role = 'admin' WHERE role = 'super_admin';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));
