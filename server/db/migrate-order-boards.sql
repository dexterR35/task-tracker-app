-- Migration: add Food department, order_boards and orders (2-apps-in-1: Food = orders)
-- Run on existing DB: psql -d task_tracker -f server/db/migrate-order-boards.sql
-- Safe to run multiple times (IF NOT EXISTS / ON CONFLICT DO NOTHING).

-- Food department (if missing)
INSERT INTO departments (name, slug) VALUES ('Food', 'food')
ON CONFLICT (slug) DO NOTHING;

-- order_boards: one per department per month (same pattern as task_boards)
CREATE TABLE IF NOT EXISTS order_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  year SMALLINT NOT NULL,
  month SMALLINT NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (department_id, year, month)
);
CREATE INDEX IF NOT EXISTS idx_order_boards_department_id ON order_boards(department_id);
CREATE INDEX IF NOT EXISTS idx_order_boards_year_month ON order_boards(year, month);

-- orders: belong to an order_board
CREATE TABLE IF NOT EXISTS orders (
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
