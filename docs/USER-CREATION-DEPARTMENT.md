# User Creation & Department Assignment

## Overview

When creating a user, you **MUST** select/assign a department. The user will be:
1. **REFERENCED** to that department (via `department_id` foreign key)
2. **AUTHENTICATED** in that department (login requires `department_id`)

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,  -- MANDATORY
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Constraints

1. **`department_id NOT NULL`** - Department assignment is MANDATORY
2. **`REFERENCES departments(id) ON DELETE RESTRICT`** - Must reference a valid department
3. **Cannot delete department** if users reference it (RESTRICT prevents deletion)

## User Creation Process

### Step 1: Select Department

When creating a user, you **MUST** select/assign a department from the available departments:
- Design
- Food
- Customer Support
- (or any other department in the system)

### Step 2: User is Referenced to Department

The user's `department_id` field stores the UUID of the selected department, creating a foreign key relationship:

```
users.department_id → departments.id
```

This means:
- User is **linked** to that department
- User **belongs** to that department
- User's data is **scoped** to that department

### Step 3: User is Authenticated in Department

When the user logs in:
1. Login requires `department_id` to be set (login fails if missing)
2. Auth returns user + department information (name, slug)
3. User's access is **scoped to their assigned department**

## Authentication Flow

```
User Login
  ↓
Check: department_id exists? → NO → Login FAILS
  ↓ YES
Check: is_active = true? → NO → Login FAILS
  ↓ YES
Check: password correct? → NO → Login FAILS
  ↓ YES
Login SUCCESS → Return user + department info
  ↓
Frontend uses user.departmentSlug to:
  - Show correct dashboard
  - Show correct sidebar
  - Filter data by department_id
```

## Data Scoping

After login, all user data is **scoped to their assigned department**:

### Department-Scoped Data

- **Dashboard**: Shows data for user's department only
- **Tasks**: Filtered by `department_id`
- **Orders**: Filtered by `department_id` (Food department)
- **Task Boards**: Filtered by `department_id`
- **Order Boards**: Filtered by `department_id`
- **Reporters**: Filtered by `department_id`
- **Deliverables**: Filtered by `department_id`

### Global Data (Not Scoped)

- **Settings/Users**: Shows all users (admin only)
- **Settings/Departments**: Shows all departments (admin only)
- **Settings/UI Showcase**: Static UI components

### Super-User Exception

- **Super-user**: Sees ALL data across ALL departments (no filtering)

## UI Determination

The user's assigned department determines:

1. **Dashboard URL**: `/design/dashboard` or `/food/dashboard` or `/customer-support/dashboard`
2. **Sidebar Links**: Different menu items per department
3. **Data Display**: Different cards, tables, and metrics per department
4. **Forms**: Different forms and fields per department

## Examples

### Example 1: Create Design User

```sql
INSERT INTO users (email, password_hash, role, department_id)
VALUES (
  'john@example.com',
  crypt('password123', gen_salt('bf')),
  'user',
  (SELECT id FROM departments WHERE name = 'Design')
);
```

**Result:**
- User is **referenced** to Design department
- User will **authenticate** in Design department
- User sees Design dashboard at `/design/dashboard`
- User sees Design sidebar with Analytics links
- User's tasks are filtered to Design department only

### Example 2: Create Food User

```sql
INSERT INTO users (email, password_hash, role, department_id)
VALUES (
  'jane@example.com',
  crypt('password123', gen_salt('bf')),
  'user',
  (SELECT id FROM departments WHERE name = 'Food')
);
```

**Result:**
- User is **referenced** to Food department
- User will **authenticate** in Food department
- User sees Food dashboard at `/food/dashboard`
- User sees Food sidebar with Orders and History links
- User's orders are filtered to Food department only

## API Considerations

### Creating Users via API

If you implement a user creation API endpoint, ensure:

1. **Validate department_id** - Must be provided and must exist in `departments` table
2. **Set department_id** - Cannot be NULL
3. **Return department info** - Include department name and slug in response

### Updating Department

**Note:** Currently, department cannot be updated via API (see `usersController.js` line 145-148). Department changes must be done via direct database update.

If you need to change a user's department:
```sql
UPDATE users 
SET department_id = (SELECT id FROM departments WHERE name = 'New Department')
WHERE email = 'user@example.com';
```

## Best Practices

1. **Always assign department** when creating users
2. **Validate department exists** before creating user
3. **Use department slug** for routing and UI determination
4. **Filter data by department_id** in all queries (except super-user)
5. **Don't allow NULL department_id** - enforce at application level too

## Summary

- ✅ **department_id is MANDATORY** - Must be set when creating user
- ✅ **User is REFERENCED** to department via foreign key
- ✅ **User is AUTHENTICATED** in that department - login requires department_id
- ✅ **User's access is SCOPED** to their assigned department
- ✅ **User's UI is DETERMINED** by their assigned department
- ✅ **Cannot delete department** if users reference it
