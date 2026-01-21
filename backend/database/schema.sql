-- ============================================================================
-- ROCKET TEAM TASK TRACKER DATABASE SCHEMA
-- ============================================================================
-- PostgreSQL Database Schema for Raw SQL Implementation
--
-- STRUCTURE:
-- rocketeam → year → month → board → tasks
--
-- ROCKET TEAM: Internal creative/development team
--   - Departments: design, video, developer (ROCKET_TEAM_DEPARTMENTS)
--   - Users: RocketTeam members assigned to tasks
--
-- CHANNELS: External departments requesting work
--   - Departments: acquisition, marketing, CRM, etc. (CHANNEL_DEPARTMENTS)
--   - Reporters: External stakeholders from channels
--
-- DELIVERABLES: Work outputs filtered by RocketTeam department
--   - Examples: Banner Ad (design), Video Edit (video), Landing Page (developer)
--   - Support: quantity, variations (e.g., 5 banners × 3 sizes = 15 total)
--
-- TASKS: Work items linking everything together
--   - Assigned to: RocketTeam user
--   - Requested by: Channel reporter
--   - Produces: Deliverables (with variations)
--   - Organized in: Monthly boards
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User Role Enum
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'MANAGER', 'VIEWER');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users Table (RocketTeam Members)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    
    -- Profile Information
    name VARCHAR(255),
    "displayName" VARCHAR(255),
    "firstName" VARCHAR(255),
    "lastName" VARCHAR(255),
    "photoURL" TEXT,
    "phoneNumber" VARCHAR(50),
    
    -- Role & Permissions
    role user_role DEFAULT 'USER',
    permissions TEXT[] DEFAULT '{}',
    
    -- RocketTeam Department (design, video, developer)
    department VARCHAR(255),
    position VARCHAR(255),
    
    -- Account Status
    "isActive" BOOLEAN DEFAULT true,
    "lastLoginAt" TIMESTAMP,
    
    -- Timestamps
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "deletedAt" TIMESTAMP
);

-- Reporters Table
CREATE TABLE IF NOT EXISTS reporters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reporter Information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    "phoneNumber" VARCHAR(50),
    department VARCHAR(255),
    company VARCHAR(255),
    position VARCHAR(255),
    
    -- Status
    "isActive" BOOLEAN DEFAULT true,
    
    -- Audit Trail
    "createdById" UUID REFERENCES users(id) ON DELETE SET NULL,
    "createdByName" VARCHAR(255),
    "updatedById" UUID REFERENCES users(id) ON DELETE SET NULL,
    "updatedByName" VARCHAR(255),
    
    -- Timestamps
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "deletedAt" TIMESTAMP
);

-- Deliverables Table (RocketTeam Work Outputs)
CREATE TABLE IF NOT EXISTS deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    
    -- RocketTeam Department Filter (design, video, developer)
    department VARCHAR(255) NOT NULL,
    
    -- Time Estimation
    "timePerUnit" FLOAT NOT NULL DEFAULT 1.0,
    "timeUnit" VARCHAR(10) NOT NULL DEFAULT 'hr',
    "variationsTime" FLOAT DEFAULT 0,
    
    -- Quantity & Variations
    "requiresQuantity" BOOLEAN DEFAULT false,
    
    -- Status
    "isActive" BOOLEAN DEFAULT true,
    
    -- Audit Trail
    "createdById" UUID REFERENCES users(id) ON DELETE SET NULL,
    "createdByName" VARCHAR(255),
    "updatedById" UUID REFERENCES users(id) ON DELETE SET NULL,
    "updatedByName" VARCHAR(255),
    
    -- Timestamps
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "deletedAt" TIMESTAMP
);

-- Boards Table
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "boardId" VARCHAR(255) UNIQUE NOT NULL,
    "monthId" VARCHAR(50) UNIQUE NOT NULL,
    
    -- Board Details
    year VARCHAR(10) NOT NULL,
    month VARCHAR(50) NOT NULL,
    department VARCHAR(255) DEFAULT 'design',
    title VARCHAR(255),
    
    -- Status
    "isActive" BOOLEAN DEFAULT true,
    "isClosed" BOOLEAN DEFAULT false,
    
    -- Audit Trail
    "createdBy" UUID REFERENCES users(id) ON DELETE SET NULL,
    "createdByName" VARCHAR(255),
    
    -- Timestamps
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Tasks Table (RocketTeam Work Items)
-- Path: rocketeam → year → month → board → tasks
-- Links: RocketTeam user + Channel reporter + Deliverables (with variations)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- RocketTeam Assignment
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "boardId" VARCHAR(255) NOT NULL REFERENCES boards("boardId") ON DELETE CASCADE,
    "monthId" VARCHAR(50) NOT NULL,
    
    -- Task Basic Information
    name VARCHAR(255) NOT NULL,
    gimodear VARCHAR(255),
    description TEXT,
    "taskType" VARCHAR(255),
    
    -- Categorization
    products VARCHAR(255),
    departments TEXT[] DEFAULT '{}',  -- Channel departments requesting work
    
    -- Reporter/Stakeholder
    "reporterId" UUID REFERENCES reporters(id) ON DELETE SET NULL,
    "reporterName" VARCHAR(255),
    
    -- Deliverables
    "deliverableNames" TEXT[] DEFAULT '{}',
    
    -- AI Usage Tracking
    "hasAiUsed" BOOLEAN DEFAULT false,
    
    -- Task Properties/Flags
    "isVip" BOOLEAN DEFAULT false,
    reworked BOOLEAN DEFAULT false,
    "useShutterstock" BOOLEAN DEFAULT false,
    "isCompleted" BOOLEAN DEFAULT false,
    
    -- Time & Complexity Metrics
    complexity INTEGER,
    "estimatedTime" FLOAT,
    "actualTime" FLOAT,
    "startDate" TIMESTAMP,
    "dueDate" TIMESTAMP,
    "completedAt" TIMESTAMP,
    
    -- Tags
    tags TEXT[] DEFAULT '{}',
    
    -- Audit Trail
    "createdById" UUID REFERENCES users(id) ON DELETE SET NULL,
    "createdByName" VARCHAR(255),
    
    -- Timestamps
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "deletedAt" TIMESTAMP,
    
    -- Unique constraint
    UNIQUE ("userId", gimodear, name)
);

-- Task Deliverables Junction Table (RocketTeam Work Outputs per Task)
-- Supports quantity and variations (e.g., 5 banners × 3 sizes = 15 total)
CREATE TABLE IF NOT EXISTS task_deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "taskId" UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    "deliverableId" UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    
    -- Quantity & Variations
    quantity INTEGER DEFAULT 1,  -- Number of deliverables
    "variationsEnabled" BOOLEAN DEFAULT false,  -- Has variations?
    "variationsCount" INTEGER DEFAULT 0,  -- Number of variations (e.g., 3 banner sizes)
    notes TEXT,  -- Variation details (e.g., "300x250, 728x90, 160x600")
    
    -- Timestamp
    "createdAt" TIMESTAMP DEFAULT NOW(),
    
    UNIQUE ("taskId", "deliverableId")
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users("isActive");
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users("createdAt");

-- Reporters Indexes
CREATE INDEX IF NOT EXISTS idx_reporters_email ON reporters(email);
CREATE INDEX IF NOT EXISTS idx_reporters_is_active ON reporters("isActive");
CREATE INDEX IF NOT EXISTS idx_reporters_created_at ON reporters("createdAt");

-- Deliverables Indexes
CREATE INDEX IF NOT EXISTS idx_deliverables_name ON deliverables(name);
CREATE INDEX IF NOT EXISTS idx_deliverables_department ON deliverables(department);
CREATE INDEX IF NOT EXISTS idx_deliverables_is_active ON deliverables("isActive");

-- Boards Indexes
CREATE INDEX IF NOT EXISTS idx_boards_month_id ON boards("monthId");
CREATE INDEX IF NOT EXISTS idx_boards_year ON boards(year);
CREATE INDEX IF NOT EXISTS idx_boards_department ON boards(department);
CREATE INDEX IF NOT EXISTS idx_boards_is_active ON boards("isActive");

-- Tasks Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks("userId");
CREATE INDEX IF NOT EXISTS idx_tasks_month_id ON tasks("monthId");
CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks("boardId");
CREATE INDEX IF NOT EXISTS idx_tasks_reporter_id ON tasks("reporterId");
CREATE INDEX IF NOT EXISTS idx_tasks_products ON tasks(products);
CREATE INDEX IF NOT EXISTS idx_tasks_has_ai_used ON tasks("hasAiUsed");
CREATE INDEX IF NOT EXISTS idx_tasks_is_vip ON tasks("isVip");
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks("isCompleted");
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks("createdAt");
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks("dueDate");

-- Task Deliverables Indexes
CREATE INDEX IF NOT EXISTS idx_task_deliverables_task_id ON task_deliverables("taskId");
CREATE INDEX IF NOT EXISTS idx_task_deliverables_deliverable_id ON task_deliverables("deliverableId");

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reporters_updated_at BEFORE UPDATE ON reporters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON deliverables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
