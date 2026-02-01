-- Users table for auth (PERN)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  color_set VARCHAR(20),
  created_by VARCHAR(100),
  occupation VARCHAR(100),
  office VARCHAR(100),
  phone VARCHAR(50),
  avatar_url VARCHAR(500),
  manager_id UUID REFERENCES users(id),
  email_verified_at TIMESTAMPTZ,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to existing DBs first (so indexes below succeed; CREATE TABLE does not add columns to existing tables)
ALTER TABLE users ADD COLUMN IF NOT EXISTS office VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;
ALTER TABLE users ADD CONSTRAINT users_gender_check CHECK (gender IS NULL OR gender IN ('male', 'female'));

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Optional: refresh token table for future use
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
