# 🗄️ Database Schema Documentation

## Task Tracker PostgreSQL Database

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     TASK TRACKER DATABASE SCHEMA                         │
│                         PostgreSQL + Raw SQL                             │
│                                                                           │
│  📌 For visual schema guide, see: SCHEMA_VISUAL_GUIDE.md                │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📊 Complete Entity Relationship Diagram

> **Note:** Some diagrams below may be outdated. Refer to `SCHEMA_VISUAL_GUIDE.md` for the most current schema visualization.

```
┌──────────────────────┐         ┌──────────────────────┐
│       USER           │◄────────│      SESSION         │
│  (Authentication)    │  1:N    │  (JWT Tokens)        │
├──────────────────────┤         ├──────────────────────┤
│ PK: id (UUID)        │         │ PK: id               │
│ UK: email            │         │ FK: userId           │
│    password (hash)   │         │ UK: accessToken      │
│    name              │         │ UK: refreshToken     │
│    role (ENUM)       │         │    expiresAt         │
│    permissions[]     │         │    isValid           │
│    department        │         │    ipAddress         │
│    isActive          │         │    userAgent         │
│    lastLoginAt       │         │    createdAt         │
│    failedLoginAttempts│         └──────────────────────┘
│    lockedUntil       │
│    createdAt         │
│    updatedAt         │
└──────┬───────────────┘
       │
       │ Creates/Owns
       │
       ├──────────────────────────────────────┐
       │                                      │
       │                                      │
       ▼                                      ▼
┌──────────────────────┐              ┌──────────────────────┐
│      REPORTER        │              │       BOARD          │
│   (Stakeholders)     │              │   (Month Boards)     │
├──────────────────────┤              ├──────────────────────┤
│ PK: id (UUID)        │              │ PK: id               │
│ UK: email            │              │ UK: boardId          │
│    name              │              │ UK: monthId          │
│    phoneNumber       │              │    year              │
│    department        │              │    month             │
│    company           │              │    department        │
│    isActive          │              │    title             │
│ FK: createdById      │              │    isActive          │
│    createdByName     │              │    isClosed          │
│    createdAt         │              │ FK: createdBy        │
│    updatedAt         │              │    createdAt         │
└──────┬───────────────┘              └──────┬───────────────┘
       │                                     │
       │                                     │
       │ Reports on                          │ Contains
       │                                     │
       ▼                                     ▼
┌─────────────────────────────────────────────────────────┐
│                        TASK                             │
│                   (Core Entity)                         │
├─────────────────────────────────────────────────────────┤
│ PK: id (UUID)                                           │
│ FK: userId          ◄───────────────┐                   │
│ FK: boardId         ◄───────────────┘ User owns         │
│ FK: reporterId                                          │
│                                                         │
│ Basic Info:                    Status:                 │
│  • name                        • status (ENUM)         │
│  • gimodear                    • priority (ENUM)       │
│  • description                 • isVip                 │
│  • taskType                    • reworked             │
│  • monthId                                            │
│                                                         │
│ Categorization:                Time/Metrics:           │
│  • products                    • complexity (1-10)     │
│  • departments[]               • estimatedTime         │
│  • deliverableNames[]          • actualTime            │
│  • tags[]                      • startDate             │
│                                • dueDate               │
│ AI Tracking:                   • completedAt           │
│  • hasAiUsed                                          │
│                                Audit:                 │
│                                • createdById           │
│ Reporter:                      • createdByName         │
│  • reporterId                  • createdAt             │
│  • reporterName                • updatedAt             │
│                                                         │
│ UK: [userId, gimodear, name] - Prevents duplicates    │
└──────┬──────────────────────────────────┬───────────────┘
       │                                  │
       │ M:N                              │ Logs
       │                                  │
       ▼                                  ▼
┌──────────────────────┐         ┌──────────────────────┐
│ TASK_DELIVERABLE     │         │   ACTIVITY_LOG       │
│  (Junction Table)    │         │   (Audit Trail)      │
├──────────────────────┤         ├──────────────────────┤
│ PK: id               │         │ PK: id               │
│ FK: taskId           │         │ FK: userId           │
│ FK: deliverableId    │         │ FK: taskId           │
│    quantity          │         │    userName          │
│    notes             │         │    action            │
│    createdAt         │         │    entity            │
│                      │         │    entityId          │
│ UK: [taskId,         │         │    changes (JSON)    │
│      deliverableId]  │         │    metadata (JSON)   │
└──────┬───────────────┘         │    ipAddress         │
       │                         │    userAgent         │
       │ M:N                     │    createdAt         │
       │                         └──────────────────────┘
       ▼
┌──────────────────────┐
│    DELIVERABLE       │
│  (Task Types)        │
├──────────────────────┤
│ PK: id               │
│ UK: name             │
│    description       │
│    category          │
│    estimatedTime     │
│    complexity        │
│    isActive          │
│    createdBy         │
│    createdByName     │
│    createdAt         │
│    updatedAt         │
└──────────────────────┘
```

---

## 📋 Tables Overview

| # | Table | Rows (est) | Purpose |
|---|-------|-----------|---------|
| 1️⃣ | **users** | 100-1000 | Authentication & user management |
| 2️⃣ | **sessions** | 100-500 | Active JWT sessions |
| 3️⃣ | **tasks** | 10K-100K+ | Core task/work items |
| 4️⃣ | **reporters** | 50-500 | External stakeholders |
| 5️⃣ | **deliverables** | 20-100 | Task deliverable types |
| 6️⃣ | **boards** | 50-200 | Monthly task boards |
| 7️⃣ | **task_deliverables** | 10K-100K+ | Task ↔ Deliverable links |
| 8️⃣ | **activity_logs** | 50K-500K+ | Complete audit trail |

---

## 1️⃣ USERS Table

**Purpose:** User authentication, profiles, and RBAC

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key (unique identifier) |
| `email` | String | UNIQUE | Email address (login) |
| `password` | String | NOT NULL | Bcrypt hashed password |
| `name` | String | NULLABLE | Full name |
| `displayName` | String | NULLABLE | Display name |
| `firstName` | String | NULLABLE | First name |
| `lastName` | String | NULLABLE | Last name |
| `photoURL` | String | NULLABLE | Profile photo URL |
| `phoneNumber` | String | NULLABLE | Phone number |
| `role` | Enum | DEFAULT: USER | USER, ADMIN, MANAGER, VIEWER |
| `permissions` | String[] | DEFAULT: [] | Additional permissions |
| `department` | String | NULLABLE | Department/team |
| `position` | String | NULLABLE | Job position |
| `isActive` | Boolean | DEFAULT: true | Account active status |
| `isVerified` | Boolean | DEFAULT: false | Email verified |
| `lastLoginAt` | DateTime | NULLABLE | Last login timestamp |
| `passwordChangedAt` | DateTime | NULLABLE | Password change timestamp |
| `failedLoginAttempts` | Int | DEFAULT: 0 | Failed login counter |
| `lockedUntil` | DateTime | NULLABLE | Account lock expiry |
| `createdAt` | DateTime | AUTO | Creation timestamp |
| `updatedAt` | DateTime | AUTO | Update timestamp |
| `deletedAt` | DateTime | NULLABLE | Soft delete timestamp |

**Indexes:**
- `email` (unique lookup)
- `role` (filtering)
- `isActive` (filtering)
- `createdAt` (sorting)

**Relations:**
- `sessions` → One-to-Many with Session
- `tasks` → One-to-Many with Task
- `createdTasks` → One-to-Many with Task (creator)
- `createdReporters` → One-to-Many with Reporter
- `updatedReporters` → One-to-Many with Reporter
- `createdBoards` → One-to-Many with Board
- `activityLogs` → One-to-Many with ActivityLog

---

## 2️⃣ SESSIONS Table

**Purpose:** JWT token management and session tracking

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `userId` | String | FK → users.id | User reference |
| `accessToken` | String | UNIQUE | JWT access token |
| `refreshToken` | String | UNIQUE, NULLABLE | JWT refresh token |
| `tokenType` | String | DEFAULT: Bearer | Token type |
| `ipAddress` | String | NULLABLE | Client IP address |
| `userAgent` | String | NULLABLE | Client user agent |
| `device` | String | NULLABLE | Device info |
| `location` | String | NULLABLE | Location info |
| `isValid` | Boolean | DEFAULT: true | Session validity |
| `expiresAt` | DateTime | NOT NULL | Token expiration |
| `lastActivityAt` | DateTime | DEFAULT: now() | Last activity time |
| `createdAt` | DateTime | AUTO | Creation timestamp |
| `updatedAt` | DateTime | AUTO | Update timestamp |

**Indexes:**
- `userId` (foreign key, user lookup)
- `accessToken` (unique, token verification)
- `refreshToken` (unique, token refresh)
- `expiresAt` (cleanup expired sessions)
- `isValid` (active sessions)

**Relations:**
- `user` → Many-to-One with User (CASCADE delete)

---

## 3️⃣ TASKS Table

**Purpose:** Core task/work item management

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `userId` | String | FK → users.id | Task owner |
| `boardId` | String | FK → boards.boardId | Board reference |
| `monthId` | String | NOT NULL | Month (YYYY-MM) |
| `name` | String | NOT NULL | Task name/title |
| `gimodear` | String | NULLABLE | Task code/identifier |
| `description` | Text | NULLABLE | Task description |
| `taskType` | String | NULLABLE | Task type |
| `products` | String | NULLABLE | Product type (marketing, acquisition, product) |
| `departments` | String[] | DEFAULT: [] | Departments involved |
| `reporterId` | String | FK → reporters.id | Reporter reference |
| `reporterName` | String | NULLABLE | Reporter name (denormalized) |
| `deliverableNames` | String[] | DEFAULT: [] | Deliverable names (denormalized) |
| `hasAiUsed` | Boolean | DEFAULT: false | AI usage flag |
| `aiUsed` | JSON | NULLABLE | AI usage details |
| `isVip` | Boolean | DEFAULT: false | VIP task flag |
| `reworked` | Boolean | DEFAULT: false | Rework flag |
| `useShutterstock` | Boolean | DEFAULT: false | Shutterstock usage |
| `priority` | Enum | DEFAULT: MEDIUM | LOW, MEDIUM, HIGH, URGENT |
| `status` | Enum | DEFAULT: PENDING | PENDING, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED |
| `complexity` | Int | NULLABLE | Complexity score (1-10) |
| `estimatedTime` | Float | NULLABLE | Estimated hours |
| `actualTime` | Float | NULLABLE | Actual hours spent |
| `startDate` | DateTime | NULLABLE | Start date |
| `dueDate` | DateTime | NULLABLE | Due date |
| `completedAt` | DateTime | NULLABLE | Completion timestamp |
| `tags` | String[] | DEFAULT: [] | Tags for categorization |
| `createdById` | String | NULLABLE | Creator user.id |
| `createdByName` | String | NULLABLE | Creator name |
| `createdAt` | DateTime | AUTO | Creation timestamp |
| `updatedAt` | DateTime | AUTO | Update timestamp |
| `deletedAt` | DateTime | NULLABLE | Soft delete timestamp |

**Indexes:**
- `userId` (owner lookup)
- `monthId` (month filtering)
- `boardId` (board filtering)
- `reporterId` (reporter filtering)
- `products` (product filtering)
- `hasAiUsed` (AI filtering)
- `isVip` (VIP filtering)
- `status` (status filtering)
- `priority` (priority filtering)
- `createdAt` (sorting)
- `dueDate` (sorting)

**Unique Constraint:**
- `[userId, gimodear, name]` → Prevents duplicate tasks per user

**Relations:**
- `user` → Many-to-One with User (CASCADE delete)
- `createdBy` → Many-to-One with User (SET NULL)
- `reporter` → Many-to-One with Reporter (SET NULL)
- `board` → Many-to-One with Board (CASCADE delete)
- `deliverables` → One-to-Many with TaskDeliverable
- `activityLogs` → One-to-Many with ActivityLog

---

## 4️⃣ REPORTERS Table

**Purpose:** External reporters/stakeholders management

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key (unique identifier) |
| `name` | String | NOT NULL | Reporter name |
| `email` | String | UNIQUE | Email address |
| `phoneNumber` | String | NULLABLE | Phone number |
| `department` | String | NULLABLE | Department |
| `company` | String | NULLABLE | Company name |
| `position` | String | NULLABLE | Job position |
| `isActive` | Boolean | DEFAULT: true | Active status |
| `createdById` | String | FK → users.id | Creator user.id |
| `createdByName` | String | NULLABLE | Creator name |
| `updatedById` | String | FK → users.id | Updater user.id |
| `updatedByName` | String | NULLABLE | Updater name |
| `createdAt` | DateTime | AUTO | Creation timestamp |
| `updatedAt` | DateTime | AUTO | Update timestamp |
| `deletedAt` | DateTime | NULLABLE | Soft delete timestamp |

**Indexes:**
- `email` (unique lookup)
- `isActive` (filtering)
- `createdAt` (sorting)

**Relations:**
- `tasks` → One-to-Many with Task
- `creator` → Many-to-One with User (SET NULL)
- `updater` → Many-to-One with User (SET NULL)

---

## 5️⃣ DELIVERABLES Table

**Purpose:** Task deliverable types/templates

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `name` | String | UNIQUE | Deliverable name |
| `description` | String | NULLABLE | Description |
| `category` | String | NULLABLE | Category |
| `estimatedTime` | Float | NULLABLE | Default estimated hours |
| `complexity` | Int | NULLABLE | Default complexity (1-10) |
| `isActive` | Boolean | DEFAULT: true | Active status |
| `createdById` | String | FK → users.id | Creator user.id |
| `createdByName` | String | NULLABLE | Creator name |
| `updatedById` | String | FK → users.id | Updater user.id |
| `updatedByName` | String | NULLABLE | Updater name |
| `createdAt` | DateTime | AUTO | Creation timestamp |
| `updatedAt` | DateTime | AUTO | Update timestamp |
| `deletedAt` | DateTime | NULLABLE | Soft delete timestamp |

**Indexes:**
- `name` (unique lookup)
- `category` (filtering)
- `isActive` (filtering)

**Relations:**
- `tasks` → One-to-Many with TaskDeliverable

---

## 6️⃣ BOARDS Table

**Purpose:** Monthly task boards/containers

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `boardId` | String | UNIQUE | Board unique identifier |
| `monthId` | String | UNIQUE | Month (YYYY-MM) |
| `year` | String | NOT NULL | Year (e.g., "2024") |
| `month` | String | NOT NULL | Month name |
| `department` | String | DEFAULT: design | Department |
| `title` | String | NULLABLE | Board title |
| `isActive` | Boolean | DEFAULT: true | Active status |
| `isClosed` | Boolean | DEFAULT: false | Closed status |
| `createdBy` | String | FK → users.id | Creator user.id |
| `createdByName` | String | NULLABLE | Creator name |
| `createdAt` | DateTime | AUTO | Creation timestamp |
| `updatedAt` | DateTime | AUTO | Update timestamp |

**Indexes:**
- `monthId` (unique lookup)
- `year` (filtering)
- `department` (filtering)
- `isActive` (filtering)

**Relations:**
- `tasks` → One-to-Many with Task
- `creator` → Many-to-One with User (SET NULL)

---

## 7️⃣ TASK_DELIVERABLES Table

**Purpose:** Many-to-Many relationship between Tasks and Deliverables

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `taskId` | String | FK → tasks.id | Task reference |
| `deliverableId` | String | FK → deliverables.id | Deliverable reference |
| `quantity` | Int | DEFAULT: 1 | Quantity |
| `notes` | String | NULLABLE | Additional notes |
| `createdAt` | DateTime | AUTO | Creation timestamp |

**Unique Constraint:**
- `[taskId, deliverableId]` → Prevents duplicate relationships

**Indexes:**
- `taskId` (task lookup)
- `deliverableId` (deliverable lookup)

**Relations:**
- `task` → Many-to-One with Task (CASCADE delete)
- `deliverable` → Many-to-One with Deliverable (CASCADE delete)

---

## 🔗 Relationship Summary

```
User (1) ──────── (N) Task            "One user owns many tasks"
User (1) ──────── (N) Reporter        "One user creates many reporters"
User (1) ──────── (N) Board           "One user creates many boards"

Board (1) ─────── (N) Task            "One board contains many tasks"

Reporter (1) ──── (N) Task            "One reporter assigned to many tasks"

Task (N) ─────── (N) Deliverable      "Many-to-many via task_deliverables"
  └──► task_deliverables (junction table)

Task (1) ─────── (N) ActivityLog      "One task generates many logs"
```

---

## 📊 Database Statistics

```
┌────────────────────────────────────────────┐
│  Total Tables:        8                    │
│    • Main Tables:     6                    │
│    • Junction:        1                    │
│    • Audit:           1                    │
│                                            │
│  Total Fields:        105 (25% reduction)  │
│  Relationships:       12                   │
│  Indexes:             20 (optimized)       │
│  Enums:               3                    │
│    • UserRole         (4 values)          │
│    • TaskStatus       (5 values)          │
│    • TaskPriority     (4 values)          │
│                                            │
│  Unique Constraints:  10                   │
│  Foreign Keys:        12                   │
│  Cascade Deletes:     5                    │
│  Soft Deletes:        5 tables            │
└────────────────────────────────────────────┘
```

---

## 🎯 Key Features

### ✅ Security
- Bcrypt password hashing (12 rounds)
- JWT token management with sessions
- Failed login tracking & account lockout
- IP and user agent logging
- Soft delete support

### ✅ Audit Trail
- Complete activity logging
- Before/after change tracking (JSON)
- User action tracking
- Timestamps on all tables

### ✅ Performance
- Strategic indexes on search fields
- Denormalized fields for quick filtering
- UUID primary keys for scalability
- Array fields for multi-value storage

### ✅ Data Integrity
- Foreign key constraints
- Unique constraints
- NOT NULL constraints
- Cascade delete rules
- Default values

### ✅ Flexibility
- JSON fields for metadata
- Array fields for collections
- Soft delete capability
- Extensible schema design

---

## 🔍 Common Queries

### Get user's tasks for a month
```sql
SELECT * FROM tasks 
WHERE userId = ? AND monthId = ? 
ORDER BY createdAt DESC;
```

### Get all VIP tasks
```sql
SELECT * FROM tasks 
WHERE isVip = true AND status = 'IN_PROGRESS'
ORDER BY priority DESC, dueDate ASC;
```

### Get reporter's tasks
```sql
SELECT * FROM tasks 
WHERE reporterId = ?
ORDER BY createdAt DESC;
```

### Get tasks with specific deliverable
```sql
SELECT t.* FROM tasks t
JOIN task_deliverables td ON t.id = td.taskId
JOIN deliverables d ON td.deliverableId = d.id
WHERE d.name = ?;
```

---

## 📝 Notes

- All IDs use UUID format for global uniqueness
- Timestamps are stored in UTC
- Arrays are PostgreSQL native arrays (not JSON)
- Soft delete uses `deletedAt` timestamp
- Indexes are created for all frequently queried fields

---

## 🔧 Maintenance

### Cleanup Expired Sessions
```sql
DELETE FROM sessions 
WHERE expiresAt < NOW() AND isValid = false;
```

### Archive Old Activity Logs
```sql
-- Move logs older than 1 year to archive table
INSERT INTO activity_logs_archive 
SELECT * FROM activity_logs 
WHERE createdAt < NOW() - INTERVAL '1 year';

DELETE FROM activity_logs 
WHERE createdAt < NOW() - INTERVAL '1 year';
```

### Vacuum and Analyze
```sql
VACUUM ANALYZE users;
VACUUM ANALYZE tasks;
VACUUM ANALYZE activity_logs;
```

---

For schema updates, see `database/schema.sql` file.

**Last Updated:** 2026-01-20
