# Database Schema Objects

This document provides an overview of all database objects created by `schema.sql`.

## Table of Contents
- [Extensions](#extensions)
- [Enums](#enums)
- [Tables](#tables)
- [Indexes](#indexes)
- [Functions](#functions)
- [Triggers](#triggers)

---

## Extensions

### uuid-ossp
PostgreSQL extension for generating UUIDs, used for primary keys across all tables.

---

## Enums

### user_role
User role enumeration with the following values:
- `USER` - Standard user
- `ADMIN` - Administrator
- `MANAGER` - Manager
- `VIEWER` - Read-only viewer

---

## Tables

### 1. users
**RocketTeam Members Table**

Stores information about internal team members who are assigned tasks.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `email` | VARCHAR(255) | Unique email address |
| `password` | VARCHAR(255) | Hashed password |
| `name` | VARCHAR(255) | Full name |
| `displayName` | VARCHAR(255) | Display name |
| `firstName` | VARCHAR(255) | First name |
| `lastName` | VARCHAR(255) | Last name |
| `photoURL` | TEXT | Profile photo URL |
| `phoneNumber` | VARCHAR(50) | Phone number |
| `role` | user_role | User role (default: USER) |
| `permissions` | TEXT[] | Array of permissions |
| `department` | VARCHAR(255) | RocketTeam department (design, video, developer) |
| `position` | VARCHAR(255) | Job position |
| `isActive` | BOOLEAN | Account active status (default: true) |
| `lastLoginAt` | TIMESTAMP | Last login timestamp |
| `createdAt` | TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | Last update timestamp |
| `deletedAt` | TIMESTAMP | Soft delete timestamp |

**Constraints:**
- Unique: `email`
- Default role: `USER`

---

### 2. reporters
**External Stakeholders Table**

Stores information about external stakeholders from channel departments who request work.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `name` | VARCHAR(255) | Reporter name |
| `email` | VARCHAR(255) | Unique email address |
| `phoneNumber` | VARCHAR(50) | Phone number |
| `department` | VARCHAR(255) | Channel department (acquisition, marketing, CRM, etc.) |
| `company` | VARCHAR(255) | Company name |
| `position` | VARCHAR(255) | Job position |
| `isActive` | BOOLEAN | Active status (default: true) |
| `createdById` | UUID | User who created this reporter (FK to users) |
| `createdByName` | VARCHAR(255) | Name of creator |
| `updatedById` | UUID | User who last updated (FK to users) |
| `updatedByName` | VARCHAR(255) | Name of updater |
| `createdAt` | TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | Last update timestamp |
| `deletedAt` | TIMESTAMP | Soft delete timestamp |

**Constraints:**
- Unique: `email`
- Foreign Key: `createdById` → `users(id)` ON DELETE SET NULL
- Foreign Key: `updatedById` → `users(id)` ON DELETE SET NULL

---

### 3. deliverables
**RocketTeam Work Outputs Table**

Defines types of work outputs that can be produced, filtered by RocketTeam department.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `name` | VARCHAR(255) | Unique deliverable name |
| `department` | VARCHAR(255) | RocketTeam department filter |
| `timePerUnit` | FLOAT | Time per unit (default: 1.0) |
| `timeUnit` | VARCHAR(10) | Time unit (default: 'hr') |
| `variationsTime` | FLOAT | Additional time for variations |
| `requiresQuantity` | BOOLEAN | Whether quantity is required (default: false) |
| `isActive` | BOOLEAN | Active status (default: true) |
| `createdById` | UUID | User who created (FK to users) |
| `createdByName` | VARCHAR(255) | Name of creator |
| `updatedById` | UUID | User who last updated (FK to users) |
| `updatedByName` | VARCHAR(255) | Name of updater |
| `createdAt` | TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | Last update timestamp |
| `deletedAt` | TIMESTAMP | Soft delete timestamp |

**Constraints:**
- Unique: `name`
- Foreign Key: `createdById` → `users(id)` ON DELETE SET NULL
- Foreign Key: `updatedById` → `users(id)` ON DELETE SET NULL

---

### 4. boards
**Monthly Work Boards Table**

Organizes tasks by month and year, following the hierarchy: rocketeam → year → month → board.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `boardId` | VARCHAR(255) | Unique board identifier |
| `monthId` | VARCHAR(50) | Unique month identifier |
| `year` | VARCHAR(10) | Year (e.g., "2026") |
| `month` | VARCHAR(50) | Month name |
| `department` | VARCHAR(255) | Department (default: 'design') |
| `title` | VARCHAR(255) | Board title |
| `isActive` | BOOLEAN | Active status (default: true) |
| `isClosed` | BOOLEAN | Closed status (default: false) |
| `createdBy` | UUID | User who created board (FK to users) |
| `createdByName` | VARCHAR(255) | Name of creator |
| `createdAt` | TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | Last update timestamp |

**Constraints:**
- Unique: `boardId`
- Unique: `monthId`
- Foreign Key: `createdBy` → `users(id)` ON DELETE SET NULL

---

### 5. tasks
**Work Items Table**

Main table linking RocketTeam users, channel reporters, and deliverables together.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `userId` | UUID | Assigned RocketTeam user (FK to users) |
| `boardId` | VARCHAR(255) | Board this task belongs to (FK to boards) |
| `monthId` | VARCHAR(50) | Month identifier |
| `name` | VARCHAR(255) | Task name |
| `gimodear` | VARCHAR(255) | Gimodear reference |
| `description` | TEXT | Task description |
| `taskType` | VARCHAR(255) | Type of task |
| `products` | VARCHAR(255) | Related products |
| `departments` | TEXT[] | Channel departments requesting work |
| `reporterId` | UUID | Reporter who requested task (FK to reporters) |
| `reporterName` | VARCHAR(255) | Reporter name |
| `deliverableNames` | TEXT[] | Array of deliverable names |
| `hasAiUsed` | BOOLEAN | AI usage flag (default: false) |
| `isVip` | BOOLEAN | VIP priority flag (default: false) |
| `reworked` | BOOLEAN | Rework flag (default: false) |
| `useShutterstock` | BOOLEAN | Shutterstock usage flag (default: false) |
| `isCompleted` | BOOLEAN | Completion status (default: false) |
| `complexity` | INTEGER | Complexity rating |
| `estimatedTime` | FLOAT | Estimated time to complete |
| `actualTime` | FLOAT | Actual time spent |
| `startDate` | TIMESTAMP | Task start date |
| `dueDate` | TIMESTAMP | Task due date |
| `completedAt` | TIMESTAMP | Completion timestamp |
| `tags` | TEXT[] | Array of tags |
| `createdById` | UUID | User who created task (FK to users) |
| `createdByName` | VARCHAR(255) | Name of creator |
| `createdAt` | TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | Last update timestamp |
| `deletedAt` | TIMESTAMP | Soft delete timestamp |

**Constraints:**
- Unique: `(userId, gimodear, name)` - Composite unique constraint
- Foreign Key: `userId` → `users(id)` ON DELETE CASCADE
- Foreign Key: `boardId` → `boards(boardId)` ON DELETE CASCADE
- Foreign Key: `reporterId` → `reporters(id)` ON DELETE SET NULL
- Foreign Key: `createdById` → `users(id)` ON DELETE SET NULL

---

### 6. task_deliverables
**Task-Deliverable Junction Table**

Many-to-many relationship between tasks and deliverables, supporting quantity and variations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `taskId` | UUID | Task reference (FK to tasks) |
| `deliverableId` | UUID | Deliverable reference (FK to deliverables) |
| `quantity` | INTEGER | Number of deliverables (default: 1) |
| `variationsEnabled` | BOOLEAN | Has variations flag (default: false) |
| `variationsCount` | INTEGER | Number of variations (default: 0) |
| `notes` | TEXT | Variation details (e.g., "300x250, 728x90, 160x600") |
| `createdAt` | TIMESTAMP | Creation timestamp |

**Constraints:**
- Unique: `(taskId, deliverableId)` - Composite unique constraint
- Foreign Key: `taskId` → `tasks(id)` ON DELETE CASCADE
- Foreign Key: `deliverableId` → `deliverables(id)` ON DELETE CASCADE

**Example:**
- 5 banners × 3 sizes = 15 total deliverables
  - `quantity`: 5
  - `variationsEnabled`: true
  - `variationsCount`: 3
  - `notes`: "Sizes: 300x250, 728x90, 160x600"

---

## Indexes

### Users Table Indexes
- `idx_users_email` on `email`
- `idx_users_role` on `role`
- `idx_users_is_active` on `isActive`
- `idx_users_created_at` on `createdAt`

### Reporters Table Indexes
- `idx_reporters_email` on `email`
- `idx_reporters_is_active` on `isActive`
- `idx_reporters_created_at` on `createdAt`

### Deliverables Table Indexes
- `idx_deliverables_name` on `name`
- `idx_deliverables_department` on `department`
- `idx_deliverables_is_active` on `isActive`

### Boards Table Indexes
- `idx_boards_month_id` on `monthId`
- `idx_boards_year` on `year`
- `idx_boards_department` on `department`
- `idx_boards_is_active` on `isActive`

### Tasks Table Indexes
- `idx_tasks_user_id` on `userId`
- `idx_tasks_month_id` on `monthId`
- `idx_tasks_board_id` on `boardId`
- `idx_tasks_reporter_id` on `reporterId`
- `idx_tasks_products` on `products`
- `idx_tasks_has_ai_used` on `hasAiUsed`
- `idx_tasks_is_vip` on `isVip`
- `idx_tasks_is_completed` on `isCompleted`
- `idx_tasks_created_at` on `createdAt`
- `idx_tasks_due_date` on `dueDate`

### Task Deliverables Table Indexes
- `idx_task_deliverables_task_id` on `taskId`
- `idx_task_deliverables_deliverable_id` on `deliverableId`

---

## Functions

### update_updated_at_column()
Automatically updates the `updatedAt` timestamp whenever a record is modified.

**Returns:** TRIGGER  
**Language:** plpgsql

```sql
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
```

---

## Triggers

Triggers that automatically update the `updatedAt` column on UPDATE operations:

1. `update_users_updated_at` - Applied to `users` table
2. `update_reporters_updated_at` - Applied to `reporters` table
3. `update_deliverables_updated_at` - Applied to `deliverables` table
4. `update_boards_updated_at` - Applied to `boards` table
5. `update_tasks_updated_at` - Applied to `tasks` table

---

## Summary

### Total Database Objects Created:
- **1** PostgreSQL Extension (uuid-ossp)
- **1** Enum Type (user_role)
- **6** Tables (users, reporters, deliverables, boards, tasks, task_deliverables)
- **27** Indexes (for optimizing queries)
- **1** Function (for timestamp updates)
- **5** Triggers (for automatic timestamp updates)

### Database Hierarchy:
```
rocketeam
└── year (e.g., 2026)
    └── month (e.g., January)
        └── board
            └── tasks
                ├── assigned to: RocketTeam user
                ├── requested by: Channel reporter
                └── produces: Deliverables (with variations)
```

### Key Relationships:
- **Users** (RocketTeam) ← assigned to → **Tasks**
- **Reporters** (Channels) ← request → **Tasks**
- **Tasks** ← contain → **Deliverables** (via task_deliverables junction)
- **Boards** ← organize → **Tasks** (by month/year)
