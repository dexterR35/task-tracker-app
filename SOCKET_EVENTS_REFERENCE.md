# Socket Events Quick Reference

## 📋 Complete Event List

### 🎯 Task Events (5)
```
task:created          → When a new task is created
task:updated          → When a task is modified
task:deleted          → When a task is removed
task:status_changed   → When task status changes
task:assigned         → When a task is assigned to someone
```

### 📦 Deliverable Events (3)
```
deliverable:created   → When a new deliverable is created
deliverable:updated   → When a deliverable is modified
deliverable:deleted   → When a deliverable is removed
```

### 👤 Reporter Events (3)
```
reporter:created      → When a new reporter is created
reporter:updated      → When a reporter is modified
reporter:deleted      → When a reporter is removed
```

### 👥 User Events (5)
```
user:created          → When a new user registers
user:updated          → When a user profile changes
user:deleted          → When a user is deleted
user:role_changed     → When a user's role changes
user:status_changed   → When a user is activated/deactivated
```

### 📅 Board Events (3)
```
board:created         → When a new board is created
board:updated         → When a board is modified
board:deleted         → When a board is removed
```

### 🔐 Authentication Events (3)
```
auth:user_login       → When a user logs in
auth:user_logout      → When a user logs out
auth:session_expired  → When a session expires
```

### 🤝 Collaboration Events (3)
```
filter:applied        → When filters are applied
bulk:action           → When bulk operations occur
data:refresh          → Request to refresh data
```

---

## 🎨 Event Payload Patterns

### Standard CRUD Event
```javascript
{
  [entity]: { /* full entity object */ },
  userId: "uuid-of-user-who-made-change",
  userName: "Display name of user",
  timestamp: "2026-01-20T10:30:00.000Z"
}
```

### Example: Task Created
```javascript
{
  task: {
    id: "task-123",
    title: "Fix bug in login",
    status: "TODO",
    // ... other task fields
  },
  userId: "user-456",
  userName: "John Doe",
  timestamp: "2026-01-20T10:30:00.000Z"
}
```

### Example: Task Deleted
```javascript
{
  taskId: "task-123",
  userId: "user-456",
  userName: "John Doe",
  timestamp: "2026-01-20T10:30:00.000Z"
}
```

### Example: User Role Changed
```javascript
{
  userId: "user-789",
  oldRole: "USER",
  newRole: "MANAGER",
  changedBy: "user-456",
  changedByName: "Admin User",
  timestamp: "2026-01-20T10:30:00.000Z"
}
```

---

## 🏠 Room System

### Join Rooms (Client → Server)
```javascript
// Join board room
socket.emit('task:subscribe', { boardId: 'board-123' });

// Join month room
socket.emit('task:subscribe', { monthId: 'jan-2026' });

// Join both
socket.emit('task:subscribe', { 
  boardId: 'board-123',
  monthId: 'jan-2026'
});
```

### Leave Rooms (Client → Server)
```javascript
socket.emit('task:unsubscribe', { boardId: 'board-123' });
```

### Automatic Rooms
```
user:{userId}    → Automatically joined on connect
role:{role}      → Automatically joined based on user role
```

### Emit to Specific Rooms (Server)
```javascript
// To specific board
io.to('board:123').emit('task:created', data);

// To all admins
io.to('role:ADMIN').emit('user:created', data);

// To specific user
io.to('user:456').emit('task:assigned', data);

// To everyone
io.emit('data:refresh', data);
```

---

## 🔄 Real-Time Update Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     USER A (Creates Task)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/tasks
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                          │
│  1. Validate request                                         │
│  2. Save to PostgreSQL                                       │
│  3. Emit socket event: task:created                          │
│  4. Return HTTP 201 response                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Socket Event
                              ▼
        ┌────────────────┬────────────────┬────────────────┐
        │                │                │                │
        ▼                ▼                ▼                ▼
   ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐
   │ USER A │      │ USER B │      │ USER C │      │ USER D │
   │        │      │        │      │        │      │        │
   │ Skip   │      │ Add to │      │ Add to │      │ Add to │
   │ (owns) │      │ list   │      │ list   │      │ list   │
   └────────┘      └────────┘      └────────┘      └────────┘
```

---

## 💻 Frontend Code Examples

### Basic Setup
```javascript
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from './constants/socketEvents';

// Connect with authentication
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

### Listen to Events
```javascript
// Task events
socket.on(SOCKET_EVENTS.TASK_CREATED, (data) => {
  console.log('New task:', data.task);
  console.log('Created by:', data.userName);
});

socket.on(SOCKET_EVENTS.TASK_UPDATED, (data) => {
  console.log('Task updated:', data.task);
});

socket.on(SOCKET_EVENTS.TASK_DELETED, (data) => {
  console.log('Task deleted:', data.taskId);
});

// User events
socket.on(SOCKET_EVENTS.USER_LOGIN, (data) => {
  console.log(`${data.userName} logged in`);
});

socket.on(SOCKET_EVENTS.USER_LOGOUT, (data) => {
  console.log(`${data.userName} logged out`);
});
```

### React Component Example
```javascript
import { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../constants/socketEvents';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const currentUserId = useAuth().user.id;

  useEffect(() => {
    // Subscribe to board
    socketService.joinRoom({ boardId: 'current-board-id' });

    // Handler: Task created
    const onTaskCreated = (data) => {
      // Skip if current user (already added optimistically)
      if (data.userId === currentUserId) return;
      
      // Add to list
      setTasks(prev => [data.task, ...prev]);
      
      // Show notification
      toast.success(`New task by ${data.userName}`);
    };

    // Handler: Task updated
    const onTaskUpdated = (data) => {
      setTasks(prev => 
        prev.map(t => t.id === data.task.id ? data.task : t)
      );
      
      if (data.userId !== currentUserId) {
        toast.info(`Task updated by ${data.userName}`);
      }
    };

    // Handler: Task deleted
    const onTaskDeleted = (data) => {
      setTasks(prev => prev.filter(t => t.id !== data.taskId));
      
      if (data.userId !== currentUserId) {
        toast.warning(`Task deleted by ${data.userName}`);
      }
    };

    // Register listeners
    socketService.on(SOCKET_EVENTS.TASK_CREATED, onTaskCreated);
    socketService.on(SOCKET_EVENTS.TASK_UPDATED, onTaskUpdated);
    socketService.on(SOCKET_EVENTS.TASK_DELETED, onTaskDeleted);

    // Cleanup
    return () => {
      socketService.off(SOCKET_EVENTS.TASK_CREATED, onTaskCreated);
      socketService.off(SOCKET_EVENTS.TASK_UPDATED, onTaskUpdated);
      socketService.off(SOCKET_EVENTS.TASK_DELETED, onTaskDeleted);
      socketService.leaveRoom({ boardId: 'current-board-id' });
    };
  }, [currentUserId]);

  return (
    <div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
};
```

### Custom Hook Pattern
```javascript
// useRealtimeEntity.js
import { useEffect } from 'react';
import socketService from '../services/socketService';

export const useRealtimeEntity = (entityType, handlers) => {
  useEffect(() => {
    const events = {
      created: `${entityType}:created`,
      updated: `${entityType}:updated`,
      deleted: `${entityType}:deleted`,
    };

    if (handlers.onCreate) {
      socketService.on(events.created, handlers.onCreate);
    }
    if (handlers.onUpdate) {
      socketService.on(events.updated, handlers.onUpdate);
    }
    if (handlers.onDelete) {
      socketService.on(events.deleted, handlers.onDelete);
    }

    return () => {
      if (handlers.onCreate) {
        socketService.off(events.created, handlers.onCreate);
      }
      if (handlers.onUpdate) {
        socketService.off(events.updated, handlers.onUpdate);
      }
      if (handlers.onDelete) {
        socketService.off(events.deleted, handlers.onDelete);
      }
    };
  }, [entityType, handlers]);
};

// Usage:
useRealtimeEntity('task', {
  onCreate: (data) => setTasks(prev => [...prev, data.task]),
  onUpdate: (data) => setTasks(prev => prev.map(t => t.id === data.task.id ? data.task : t)),
  onDelete: (data) => setTasks(prev => prev.filter(t => t.id !== data.taskId)),
});
```

---

## 🧪 Testing Events

### Manual Testing (Browser Console)
```javascript
// Listen for all events
Object.values(SOCKET_EVENTS).forEach(event => {
  socket.on(event, (data) => {
    console.log(`[${event}]`, data);
  });
});

// Test connection
console.log('Socket connected:', socket.connected);
console.log('Socket ID:', socket.id);

// Join a room
socket.emit('task:subscribe', { boardId: 'test-board' });

// Check rooms
socket.emit('rooms', (rooms) => {
  console.log('My rooms:', rooms);
});
```

### Unit Testing (Jest)
```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import socketService from '../services/socketService';
import { useTaskList } from './useTaskList';

jest.mock('../services/socketService');

test('should add task when TASK_CREATED event received', () => {
  const { result } = renderHook(() => useTaskList());
  
  // Get the registered handler
  const handler = socketService.on.mock.calls
    .find(call => call[0] === 'task:created')[1];
  
  // Simulate event
  act(() => {
    handler({
      task: { id: '123', title: 'Test Task' },
      userId: 'other-user',
      userName: 'Other User',
      timestamp: new Date().toISOString(),
    });
  });
  
  expect(result.current.tasks).toHaveLength(1);
  expect(result.current.tasks[0].id).toBe('123');
});
```

---

## 🔧 Troubleshooting

### Connection Issues
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  
  if (error.message === 'Authentication required') {
    // Redirect to login
    window.location.href = '/login';
  }
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);
  // Refresh data to sync state
  fetchAllData();
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
  // Show offline banner
});
```

### Debug All Events
```javascript
// Log every socket event
const originalEmit = socket.emit;
socket.emit = function(...args) {
  console.log('Emitting:', args[0], args.slice(1));
  return originalEmit.apply(socket, args);
};

// Log every received event
const originalOn = socket.on;
socket.on = function(...args) {
  const event = args[0];
  const handler = args[1];
  
  return originalOn.call(socket, event, (...handlerArgs) => {
    console.log('Received:', event, handlerArgs);
    return handler(...handlerArgs);
  });
};
```

### Check Active Connections (Server Side)
```javascript
// In your server code
setInterval(() => {
  console.log('Active socket connections:', io.sockets.sockets.size);
  
  io.sockets.sockets.forEach((socket) => {
    console.log('- User:', socket.user.email, 'ID:', socket.id);
  });
}, 60000); // Every minute
```

---

## 📊 Event Categories Summary

| Category       | Event Count | Use Case                          |
|----------------|-------------|-----------------------------------|
| Tasks          | 5           | Core task management              |
| Deliverables   | 3           | Deliverable CRUD                  |
| Reporters      | 3           | Reporter management               |
| Users          | 5           | User administration               |
| Boards         | 3           | Board/month management            |
| Authentication | 3           | Login/logout tracking             |
| Collaboration  | 3           | Advanced features                 |
| **TOTAL**      | **25**      | **Complete real-time coverage**   |

---

## 🎯 Common Patterns

### Optimistic Updates
```javascript
const createTask = async (taskData) => {
  // 1. Add to UI immediately (optimistic)
  const tempId = 'temp-' + Date.now();
  const optimisticTask = { ...taskData, id: tempId };
  setTasks(prev => [optimisticTask, ...prev]);
  
  try {
    // 2. Send to server
    const response = await api.post('/tasks', taskData);
    
    // 3. Replace with real data
    setTasks(prev => 
      prev.map(t => t.id === tempId ? response.data.task : t)
    );
  } catch (error) {
    // 4. Rollback on error
    setTasks(prev => prev.filter(t => t.id !== tempId));
    toast.error('Failed to create task');
  }
  
  // 5. Socket event will be ignored (same user)
};
```

### Prevent Duplicate Updates
```javascript
const handleTaskCreated = (data) => {
  // Don't add if we already have it (optimistic update)
  setTasks(prev => {
    const exists = prev.some(t => t.id === data.task.id);
    if (exists) return prev;
    return [data.task, ...prev];
  });
};
```

### Debounced Updates
```javascript
import { debounce } from 'lodash';

const handleTaskUpdated = debounce((data) => {
  setTasks(prev => 
    prev.map(t => t.id === data.task.id ? data.task : t)
  );
}, 300); // Wait 300ms before applying
```

---

## 🚀 Quick Start Checklist

### Backend (Already Done! ✅)
- [x] Socket events defined in constants
- [x] All controllers emit events
- [x] Authentication configured
- [x] Room system ready

### Frontend (Next Steps)
- [ ] Install `socket.io-client`
- [ ] Create socket service
- [ ] Add event constants
- [ ] Connect on login
- [ ] Listen in components
- [ ] Handle disconnections
- [ ] Add notifications

---

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [Backend Guide](./backend/SOCKET_EVENTS_GUIDE.md)
- [Summary](./REALTIME_FEATURES_SUMMARY.md)
