# API Documentation

Complete REST API documentation for Task Tracker Backend.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-app.herokuapp.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

---

## 🔐 Authentication Endpoints

### Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "displayName": "John",
  "department": "design",
  "role": "USER"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "createdAt": "2024-01-20T10:00:00.000Z"
    }
  }
}
```

### Login

**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "permissions": []
    },
    "tokens": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here",
      "tokenType": "Bearer",
      "expiresIn": "8h"
    }
  }
}
```

### Logout

**POST** `/auth/logout`

Logout and invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Get Current User

**GET** `/auth/me`

Get current authenticated user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "displayName": "John",
      "role": "USER",
      "permissions": [],
      "department": "design",
      "isActive": true,
      "lastLoginAt": "2024-01-20T10:00:00.000Z"
    }
  }
}
```

### Refresh Token

**POST** `/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_token",
    "tokenType": "Bearer",
    "expiresIn": "8h"
  }
}
```

---

## 📋 Tasks Endpoints

### Get All Tasks

**GET** `/tasks`

Get all tasks with optional filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `monthId` - Filter by month (e.g., "2024-09")
- `boardId` - Filter by board ID
- `reporterId` - Filter by reporter ID
- `department` - Filter by department
- `deliverable` - Filter by deliverable name
- `products` - Filter by product type (marketing, acquisition, product)
- `status` - Filter by status (PENDING, IN_PROGRESS, COMPLETED, etc.)
- `priority` - Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `hasAiUsed` - Filter by AI usage (true/false)
- `isVip` - Filter by VIP status (true/false)
- `search` - Search in name, description, gimodear
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order (asc/desc, default: desc)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "name": "Design Homepage Banner",
        "gimodear": "TASK-001",
        "description": "Create banner for homepage",
        "monthId": "2024-09",
        "boardId": "board_uuid",
        "userId": "user_uuid",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "hasAiUsed": true,
        "isVip": false,
        "deliverableNames": ["Banner Design"],
        "createdAt": "2024-01-20T10:00:00.000Z",
        "user": {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "reporter": {
          "id": "reporter_uuid",
          "name": "Jane Smith",
          "email": "jane@example.com"
        }
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 50,
      "pages": 2
    }
  }
}
```

### Get Task by ID

**GET** `/tasks/:id`

Get a specific task by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "uuid",
      "name": "Design Homepage Banner",
      "description": "Create banner for homepage",
      "user": { ... },
      "reporter": { ... },
      "board": { ... },
      "deliverables": [ ... ]
    }
  }
}
```

### Create Task

**POST** `/tasks`

Create a new task.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Design Homepage Banner",
  "gimodear": "TASK-001",
  "description": "Create banner for homepage",
  "monthId": "2024-09",
  "boardId": "board_uuid",
  "reporterId": "reporter_uuid",
  "deliverableNames": ["Banner Design"],
  "hasAiUsed": true,
  "isVip": false,
  "priority": "HIGH",
  "status": "PENDING",
  "complexity": 7,
  "estimatedTime": 5.5,
  "departments": ["design", "marketing"],
  "products": "marketing",
  "tags": ["homepage", "banner"]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": { ... }
  }
}
```

### Update Task

**PUT** `/tasks/:id`

Update an existing task.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Task Name",
  "status": "COMPLETED",
  "actualTime": 6.0,
  "completedAt": "2024-01-20T15:00:00.000Z"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": { ... }
  }
}
```

### Delete Task

**DELETE** `/tasks/:id`

Delete a task.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## 👥 Users Endpoints

### Get All Users (Admin Only)

**GET** `/users`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `search` - Search by name or email
- `role` - Filter by role
- `isActive` - Filter by active status
- `page`, `limit` - Pagination

**Response:** `200 OK`

### Get User by ID

**GET** `/users/:id`

**Headers:** `Authorization: Bearer <token>`

### Update User

**PUT** `/users/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "phoneNumber": "+1234567890",
  "department": "marketing"
}
```

### Update Password

**PUT** `/users/:id/password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

### Delete User (Admin Only)

**DELETE** `/users/:id`

**Headers:** `Authorization: Bearer <token>`

---

## 📊 Reporters Endpoints

### Get All Reporters

**GET** `/reporters`

### Create Reporter (Admin Only)

**POST** `/reporters`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phoneNumber": "+1234567890",
  "department": "marketing",
  "company": "Company Name"
}
```

### Update Reporter (Admin Only)

**PUT** `/reporters/:id`

### Delete Reporter (Admin Only)

**DELETE** `/reporters/:id`

---

## 📦 Deliverables Endpoints

### Get All Deliverables

**GET** `/deliverables`

### Create Deliverable (Admin Only)

**POST** `/deliverables`

**Request Body:**
```json
{
  "name": "Banner Design",
  "description": "Website banner design",
  "category": "Design",
  "estimatedTime": 2.5,
  "complexity": 5
}
```

### Update Deliverable (Admin Only)

**PUT** `/deliverables/:id`

### Delete Deliverable (Admin Only)

**DELETE** `/deliverables/:id`

---

## 📅 Boards Endpoints

### Get All Boards

**GET** `/boards`

### Get Board by Month

**GET** `/boards/month/:monthId`

Example: `/boards/month/2024-09`

### Create Board (Admin Only)

**POST** `/boards`

**Request Body:**
```json
{
  "monthId": "2024-09",
  "year": "2024",
  "month": "September",
  "department": "design",
  "title": "September 2024 Board"
}
```

---

## ⚠️ Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Optional, for validation errors
}
```

**Common Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 🔌 Socket.IO Events

### Connection

```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'your_jwt_token' }
});
```

### Client → Server Events

- `task:subscribe` - Subscribe to task updates
  ```javascript
  socket.emit('task:subscribe', { boardId: 'board_id', monthId: '2024-09' });
  ```

- `task:unsubscribe` - Unsubscribe from updates
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `presence:update` - Update user status

### Server → Client Events

- `connected` - Connection successful
- `task:created` - New task created
- `task:updated` - Task updated
- `task:deleted` - Task deleted
- `user:typing` - Another user is typing
- `user:presence` - User presence update
- `user:offline` - User went offline

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- UUIDs are used for all IDs
- Rate limit: 100 requests per 15 minutes
- Maximum request body size: 10MB
- CORS enabled for configured origins

---

For more details, see the [README.md](README.md) and [SETUP_GUIDE.md](SETUP_GUIDE.md).
