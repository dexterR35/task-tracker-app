# Socket Events Guide

## Overview

This application uses **Socket.IO** for real-time, bidirectional communication between the server and all connected clients. All CRUD operations across the application emit socket events, allowing multiple users to see changes instantly without refreshing the page.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Client A       │◄────────┤   Socket.IO      ├────────►│  Client B       │
│  (React/Vite)   │  WebSocket  Server (Node.js) │  WebSocket  (React/Vite)   │
└─────────────────┘         └──────────────────┘         └─────────────────┘
         │                          │                            │
         │  1. HTTP Request         │                            │
         ├─────────────────────────►│                            │
         │                          │                            │
         │  2. Perform Action       │                            │
         │     (Create/Update/Delete)│                           │
         │                          │                            │
         │  3. Emit Socket Event    │                            │
         │                          ├───────────────────────────►│
         │                          │  4. Receive Event          │
         │  5. HTTP Response        │                            │
         ◄─────────────────────────┤                            │
         │                          │  5. Update UI              │
         │  6. Update UI            │                            │
```

## Socket Events Reference

### Task Events

| Event | Description | Payload |
|-------|-------------|---------|
| `task:created` | Fired when a new task is created | `{ task, userId, userName, timestamp }` |
| `task:updated` | Fired when a task is modified | `{ task, userId, userName, timestamp }` |
| `task:deleted` | Fired when a task is deleted | `{ taskId, userId, userName, timestamp }` |
| `task:status_changed` | Fired when task status changes | `{ taskId, oldStatus, newStatus, userId, userName, timestamp }` |
| `task:assigned` | Fired when a task is assigned to a user | `{ taskId, assignedTo, assignedBy, timestamp }` |

### Deliverable Events

| Event | Description | Payload |
|-------|-------------|---------|
| `deliverable:created` | Fired when a new deliverable is created | `{ deliverable, userId, userName, timestamp }` |
| `deliverable:updated` | Fired when a deliverable is modified | `{ deliverable, userId, userName, timestamp }` |
| `deliverable:deleted` | Fired when a deliverable is deleted | `{ deliverableId, deliverableName, userId, userName, timestamp }` |

### Reporter Events

| Event | Description | Payload |
|-------|-------------|---------|
| `reporter:created` | Fired when a new reporter is created | `{ reporter, userId, userName, timestamp }` |
| `reporter:updated` | Fired when a reporter is modified | `{ reporter, userId, userName, timestamp }` |
| `reporter:deleted` | Fired when a reporter is deleted | `{ reporterId, reporterName, userId, userName, timestamp }` |

### User Events

| Event | Description | Payload |
|-------|-------------|---------|
| `user:created` | Fired when a new user is registered | `{ user, timestamp }` |
| `user:updated` | Fired when a user profile is updated | `{ user, userId, userName, timestamp }` |
| `user:deleted` | Fired when a user is deleted | `{ userId, deletedBy, deletedByName, timestamp }` |
| `user:role_changed` | Fired when a user's role changes | `{ userId, oldRole, newRole, changedBy, changedByName, timestamp }` |
| `user:status_changed` | Fired when a user is activated/deactivated | `{ userId, isActive, changedBy, changedByName, timestamp }` |

### Board Events

| Event | Description | Payload |
|-------|-------------|---------|
| `board:created` | Fired when a new board is created | `{ board, userId, userName, timestamp }` |
| `board:updated` | Fired when a board is modified | `{ board, userId, userName, timestamp }` |
| `board:deleted` | Fired when a board is deleted | `{ boardId, monthId, userId, userName, timestamp }` |

### Authentication Events

| Event | Description | Payload |
|-------|-------------|---------|
| `auth:user_login` | Fired when a user logs in | `{ userId, userName, userEmail, role, timestamp }` |
| `auth:user_logout` | Fired when a user logs out | `{ userId, userName, userEmail, timestamp }` |
| `auth:session_expired` | Fired when a user's session expires | `{ userId, timestamp }` |

### Collaboration Events

| Event | Description | Payload |
|-------|-------------|---------|
| `filter:applied` | Fired when filters are applied | `{ filters, userId, timestamp }` |
| `bulk:action` | Fired when bulk operations are performed | `{ action, affectedIds, userId, timestamp }` |
| `data:refresh` | Request all clients to refresh their data | `{ entity, timestamp }` |

## Room System

The application uses **rooms** to organize and target specific groups of users:

### Room Types

1. **User Rooms**: `user:{userId}`
   - Personal notifications for a specific user
   - Used for: assigned tasks, mentions, direct notifications

2. **Role Rooms**: `role:{role}`
   - Broadcast to all users with a specific role (ADMIN, MANAGER, USER, VIEWER)
   - Used for: role-specific announcements

3. **Board Rooms**: `board:{boardId}`
   - Users viewing/working on a specific board
   - Used for: real-time task updates on that board

4. **Month Rooms**: `month:{monthId}`
   - Users viewing tasks for a specific month
   - Used for: month-specific updates

### Example Usage

```javascript
// Backend: Emit to specific room
req.io.to(`board:${boardId}`).emit('task:created', taskData);

// Backend: Emit to all users with ADMIN role
req.io.to('role:ADMIN').emit('user:created', userData);

// Client: Join a room
socket.emit('task:subscribe', { boardId: 'abc-123' });
```

## Backend Implementation

### 1. Controllers Emit Events

All controllers now emit socket events after successful CRUD operations:

```javascript
// Example: tasks.controller.js
import { SOCKET_EVENTS } from '../constants/index.js';

export const createTask = asyncHandler(async (req, res) => {
  // ... create task logic ...
  
  // Emit real-time event
  req.io.emit(SOCKET_EVENTS.TASK_CREATED, { 
    task: completeTask, 
    userId: user.id,
    userName: user.name,
    timestamp: new Date()
  });
  
  res.status(201).json({ success: true, data: { task } });
});
```

### 2. Socket Configuration

The socket server is initialized in `server.js` and attached to all requests:

```javascript
// server.js
const io = initializeSocket(httpServer);

app.use((req, res, next) => {
  req.io = io;  // Make io accessible in all routes
  next();
});
```

### 3. Authentication

Socket connections require authentication:

```javascript
// src/config/socket.js
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = verifyToken(token);
  socket.user = await getUserById(decoded.userId);
  next();
});
```

## Frontend Integration Guide

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Create Socket Manager

Create `src/services/socketService.js`:

```javascript
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../constants';

class SocketService {
  socket = null;

  connect(token) {
    this.socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to specific events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Unsubscribe from events
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Join a room
  joinRoom(roomData) {
    if (this.socket) {
      this.socket.emit('task:subscribe', roomData);
    }
  }

  // Leave a room
  leaveRoom(roomData) {
    if (this.socket) {
      this.socket.emit('task:unsubscribe', roomData);
    }
  }
}

export default new SocketService();
```

### 3. Connect on Login

```javascript
// In your authentication context/hook
import socketService from './services/socketService';

const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  const { accessToken, user } = response.data;
  
  // Save token and user
  localStorage.setItem('token', accessToken);
  
  // Connect socket
  socketService.connect(accessToken);
};

const logout = () => {
  socketService.disconnect();
  localStorage.removeItem('token');
};
```

### 4. Listen to Events in Components

```javascript
// Example: TaskList component
import { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Subscribe to board
    socketService.joinRoom({ boardId: currentBoardId });

    // Listen for task created
    const handleTaskCreated = (data) => {
      setTasks(prev => [data.task, ...prev]);
      toast.success(`New task created by ${data.userName}`);
    };

    // Listen for task updated
    const handleTaskUpdated = (data) => {
      setTasks(prev => 
        prev.map(task => task.id === data.task.id ? data.task : task)
      );
      toast.info(`Task updated by ${data.userName}`);
    };

    // Listen for task deleted
    const handleTaskDeleted = (data) => {
      setTasks(prev => prev.filter(task => task.id !== data.taskId));
      toast.warning(`Task deleted by ${data.userName}`);
    };

    socketService.on(SOCKET_EVENTS.TASK_CREATED, handleTaskCreated);
    socketService.on(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdated);
    socketService.on(SOCKET_EVENTS.TASK_DELETED, handleTaskDeleted);

    // Cleanup
    return () => {
      socketService.off(SOCKET_EVENTS.TASK_CREATED, handleTaskCreated);
      socketService.off(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdated);
      socketService.off(SOCKET_EVENTS.TASK_DELETED, handleTaskDeleted);
      socketService.leaveRoom({ boardId: currentBoardId });
    };
  }, [currentBoardId]);

  return <div>{/* render tasks */}</div>;
};
```

### 5. Create a Custom Hook

```javascript
// src/hooks/useSocketEvents.js
import { useEffect } from 'react';
import socketService from '../services/socketService';

export const useSocketEvents = (eventHandlers) => {
  useEffect(() => {
    // Register all event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socketService.on(event, handler);
    });

    // Cleanup
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socketService.off(event, handler);
      });
    };
  }, [eventHandlers]);
};

// Usage:
const TaskList = () => {
  const [tasks, setTasks] = useState([]);

  useSocketEvents({
    [SOCKET_EVENTS.TASK_CREATED]: (data) => {
      setTasks(prev => [data.task, ...prev]);
    },
    [SOCKET_EVENTS.TASK_UPDATED]: (data) => {
      setTasks(prev => 
        prev.map(task => task.id === data.task.id ? data.task : task)
      );
    },
    [SOCKET_EVENTS.TASK_DELETED]: (data) => {
      setTasks(prev => prev.filter(task => task.id !== data.taskId));
    },
  });

  return <div>{/* render tasks */}</div>;
};
```

## Frontend Constants

Create `src/constants/socketEvents.js` to mirror backend constants:

```javascript
export const SOCKET_EVENTS = {
  // Task Events
  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  TASK_DELETED: "task:deleted",
  TASK_STATUS_CHANGED: "task:status_changed",
  TASK_ASSIGNED: "task:assigned",
  
  // Deliverable Events
  DELIVERABLE_CREATED: "deliverable:created",
  DELIVERABLE_UPDATED: "deliverable:updated",
  DELIVERABLE_DELETED: "deliverable:deleted",
  
  // Reporter Events
  REPORTER_CREATED: "reporter:created",
  REPORTER_UPDATED: "reporter:updated",
  REPORTER_DELETED: "reporter:deleted",
  
  // User Events
  USER_CREATED: "user:created",
  USER_UPDATED: "user:updated",
  USER_DELETED: "user:deleted",
  USER_ROLE_CHANGED: "user:role_changed",
  USER_STATUS_CHANGED: "user:status_changed",
  
  // Board Events
  BOARD_CREATED: "board:created",
  BOARD_UPDATED: "board:updated",
  BOARD_DELETED: "board:deleted",
  
  // Authentication Events
  USER_LOGIN: "auth:user_login",
  USER_LOGOUT: "auth:user_logout",
  SESSION_EXPIRED: "auth:session_expired",
  
  // Collaboration
  FILTER_APPLIED: "filter:applied",
  BULK_ACTION: "bulk:action",
  DATA_REFRESH: "data:refresh",
};
```

## Best Practices

### 1. Prevent Duplicate Updates

Don't update the UI if the event was triggered by the current user:

```javascript
const handleTaskCreated = (data) => {
  // Skip if this user created the task
  if (data.userId === currentUser.id) return;
  
  setTasks(prev => [data.task, ...prev]);
  toast.success(`New task created by ${data.userName}`);
};
```

### 2. Optimistic Updates

Update the UI immediately, then sync on event:

```javascript
const createTask = async (taskData) => {
  // Optimistic update
  const tempTask = { ...taskData, id: 'temp-' + Date.now() };
  setTasks(prev => [tempTask, ...prev]);
  
  try {
    const response = await api.post('/tasks', taskData);
    // Replace temp with real task
    setTasks(prev => 
      prev.map(t => t.id === tempTask.id ? response.data.task : t)
    );
  } catch (error) {
    // Rollback on error
    setTasks(prev => prev.filter(t => t.id !== tempTask.id));
    toast.error('Failed to create task');
  }
};
```

### 3. Debounce Rapid Updates

```javascript
import { debounce } from 'lodash';

const handleTaskUpdated = debounce((data) => {
  setTasks(prev => 
    prev.map(task => task.id === data.task.id ? data.task : task)
  );
}, 300);
```

### 4. Handle Connection Errors

```javascript
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
  toast.error('Lost connection to server. Reconnecting...');
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  toast.success('Reconnected to server');
  // Refresh data
  fetchTasks();
});
```

## Testing Socket Events

### Backend Testing

```javascript
// Test socket emission
describe('Task Controller', () => {
  it('should emit socket event on task creation', async () => {
    const mockIo = { emit: jest.fn() };
    req.io = mockIo;
    
    await createTask(req, res);
    
    expect(mockIo.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.TASK_CREATED,
      expect.objectContaining({
        task: expect.any(Object),
        userId: expect.any(String),
      })
    );
  });
});
```

### Frontend Testing

```javascript
// Mock socket service
jest.mock('../services/socketService', () => ({
  on: jest.fn(),
  off: jest.fn(),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn(),
}));

it('should update tasks when socket event is received', () => {
  const { result } = renderHook(() => useTaskList());
  
  // Simulate socket event
  const handler = socketService.on.mock.calls[0][1];
  handler({ task: newTask, userId: '123', userName: 'John' });
  
  expect(result.current.tasks).toContain(newTask);
});
```

## Troubleshooting

### Connection Issues

1. **CORS errors**: Ensure socket server CORS is configured
2. **Authentication failures**: Check token format and validity
3. **Firewall/proxy issues**: Try enabling `transports: ['websocket']`

### Performance Issues

1. **Too many events**: Consider debouncing or batching updates
2. **Large payloads**: Only send necessary data in events
3. **Memory leaks**: Always clean up event listeners in `useEffect` cleanup

### Debug Mode

Enable socket.io debug logs:

```javascript
// Frontend
import { io } from 'socket.io-client';

const socket = io(url, {
  auth: { token },
  debug: true,
});

// Backend
const io = new Server(httpServer, {
  cors: { /* ... */ },
  logLevel: 'debug',
});
```

## Monitoring

Track socket metrics in production:

```javascript
io.on('connection', (socket) => {
  console.log(`Active connections: ${io.sockets.sockets.size}`);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected. Active: ${io.sockets.sockets.size}`);
  });
});
```

## Security Considerations

1. **Authentication**: Always verify tokens before connecting
2. **Authorization**: Check permissions before emitting sensitive events
3. **Rate limiting**: Prevent socket event spam
4. **Data sanitization**: Sanitize all socket event data
5. **Room access control**: Verify user can join requested rooms

## Conclusion

The real-time socket event system provides:

- ✅ **Instant updates** across all connected clients
- ✅ **Collaborative features** like presence and typing indicators
- ✅ **Better UX** with live notifications
- ✅ **Scalable architecture** with room-based targeting
- ✅ **Type-safe events** using centralized constants

For questions or issues, refer to the [Socket.IO documentation](https://socket.io/docs/v4/).
