# Firebase to PERN Stack Migration Guide

This guide helps you migrate from Firebase/Firestore to the new PERN stack backend.

## 🗺️ Architecture Overview

### Before (Firebase)
```
Frontend (React) 
    ↓
Firebase SDK (Direct connection)
    ↓
Firebase Auth + Firestore
```

### After (PERN Stack)
```
Frontend (React)
    ↓
REST API + Socket.IO
    ↓
Express Server + JWT Auth
    ↓
PostgreSQL (via Prisma ORM)
```

## 📊 Data Structure Mapping

### Firestore → PostgreSQL

| Firestore | PostgreSQL Table |
|-----------|-----------------|
| `users` collection | `users` table |
| `reporters` collection | `reporters` table |
| `settings/app/data/deliverables` | `deliverables` table |
| `departments/design/{year}/{monthId}` | `boards` table |
| `departments/design/{year}/{monthId}/taskdata` | `tasks` table |

### Field Mappings

#### User Fields
| Firestore | PostgreSQL | Notes |
|-----------|-----------|-------|
| `userUID` | `id` (UUID) | Now single UUID primary key |
| `email` | `email` | Same |
| `displayName` | `displayName` | Same |
| `role` | `role` | Now ENUM type |
| `permissions` | `permissions` | Array type |

#### Task Fields
| Firestore | PostgreSQL | Notes |
|-----------|-----------|-------|
| `data_task.name` | `name` | Flattened structure |
| `data_task.gimodear` | `gimodear` | Same |
| `data_task.reporterUID` | `reporterId` | Now references Reporter.id |
| `data_task.hasAiUsed` | `hasAiUsed` | Same |
| `createdAt` | `createdAt` | Timestamp |
| `updatedAt` | `updatedAt` | Timestamp |

## 🔄 API Endpoint Conversion

### Authentication

**Before (Firebase):**
```javascript
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/app/firebase";

// Login
await signInWithEmailAndPassword(auth, email, password);

// Logout
await signOut(auth);
```

**After (REST API):**
```javascript
// Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { data } = await response.json();
const { tokens } = data;

// Store token
localStorage.setItem('accessToken', tokens.accessToken);

// Logout
await fetch('http://localhost:5000/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

### Fetching Tasks

**Before (Firestore):**
```javascript
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/app/firebase";

const tasksRef = collection(db, 'departments', 'design', '2024', '2024-09', 'taskdata');
const q = query(tasksRef, where("userUID", "==", userUID));

const unsubscribe = onSnapshot(q, (snapshot) => {
  const tasks = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setTasks(tasks);
});
```

**After (REST API + Socket.IO):**
```javascript
// Fetch tasks (REST API)
const response = await fetch('http://localhost:5000/api/tasks?monthId=2024-09', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
const { data } = await response.json();
setTasks(data.tasks);

// Real-time updates via Socket.IO
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('accessToken') }
});

socket.on('task:created', ({ task }) => {
  setTasks(prev => [...prev, task]);
});

socket.on('task:updated', ({ task }) => {
  setTasks(prev => prev.map(t => t.id === task.id ? task : t));
});

socket.on('task:deleted', ({ taskId }) => {
  setTasks(prev => prev.filter(t => t.id !== taskId));
});
```

### Creating Tasks

**Before (Firestore):**
```javascript
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const colRef = collection(db, 'departments', 'design', '2024', monthId, 'taskdata');
await addDoc(colRef, {
  data_task: taskData,
  userUID: user.userUID,
  monthId: monthId,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

**After (REST API):**
```javascript
const response = await fetch('http://localhost:5000/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: JSON.stringify({
    ...taskData,
    monthId: '2024-09',
    boardId: board.boardId
  })
});
const { data } = await response.json();
const { task } = data;
```

## 🔌 Frontend Integration

### 1. Create API Client

Create `src/api/client.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  constructor() {
    this.baseURL = `${API_URL}/api`;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async register(email, password, name) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
  }

  // Tasks
  async getTasks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tasks?${queryString}`);
  }

  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  async updateTask(id, taskData) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  // Similar methods for reporters, deliverables, boards, users...
}

export default new ApiClient();
```

### 2. Create Socket.IO Hook

Create `src/hooks/useSocket.js`:

```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socketInstance = io(SOCKET_URL, {
      auth: { token }
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connected', (data) => {
      console.log('Socket authenticated:', data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
};
```

### 3. Update Auth Context

Update `src/context/AuthContext.jsx`:

```javascript
import apiClient from '@/api/client';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const { data } = await apiClient.getCurrentUser();
          setUser(data.user);
        } catch (error) {
          localStorage.removeItem('accessToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await apiClient.login(email, password);
    localStorage.setItem('accessToken', data.tokens.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    await apiClient.logout();
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 4. Update Tasks Hook

Create `src/hooks/useTasks.js`:

```javascript
import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { useSocket } from './useSocket';

export const useTasks = (filters = {}) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const { data } = await apiClient.getTasks(filters);
        setTasks(data.tasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [JSON.stringify(filters)]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    // Subscribe to board updates
    if (filters.boardId) {
      socket.emit('task:subscribe', { boardId: filters.boardId });
    }

    socket.on('task:created', ({ task }) => {
      setTasks(prev => [...prev, task]);
    });

    socket.on('task:updated', ({ task }) => {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    });

    socket.on('task:deleted', ({ taskId }) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    });

    return () => {
      if (filters.boardId) {
        socket.emit('task:unsubscribe', { boardId: filters.boardId });
      }
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, [socket, filters.boardId]);

  return { tasks, isLoading };
};
```

## 🔧 Environment Variables

Update your frontend `.env`:

```env
# Before
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...

# After
VITE_API_URL=http://localhost:5000
# Or in production:
VITE_API_URL=https://your-heroku-app.herokuapp.com
```

## 📦 Install New Dependencies

```bash
# Frontend
npm install socket.io-client
```

## 🚀 Migration Steps

1. ✅ Backend is ready (completed)
2. 🔄 Update frontend API client
3. 🔄 Replace Firebase imports with API calls
4. 🔄 Add Socket.IO for real-time features
5. 🔄 Update authentication flow
6. 🔄 Test all CRUD operations
7. 🔄 Deploy and verify

## ⚡ Benefits of Migration

- ✅ **Better Performance** - Direct PostgreSQL queries vs Firestore reads
- ✅ **Cost Reduction** - No Firebase pricing, just Heroku/server costs
- ✅ **Full Control** - Complete control over data and business logic
- ✅ **Advanced Queries** - SQL joins, aggregations, complex filters
- ✅ **Type Safety** - Prisma provides full TypeScript support
- ✅ **Easier Testing** - Standard REST API testing tools
- ✅ **Scalability** - Better for large datasets and complex operations

## 🔍 Comparison

| Feature | Firebase | PERN Stack |
|---------|----------|------------|
| Setup Time | Fast | Medium |
| Control | Limited | Full |
| Cost | Variable (can be high) | Predictable |
| Queries | Limited | Advanced (SQL) |
| Real-time | Built-in | Socket.IO |
| Offline Support | Yes | Can be added |
| Learning Curve | Easy | Medium |
| Scalability | Good | Excellent |

## 📞 Need Help?

- Check the main README.md
- Review SETUP_GUIDE.md
- Test endpoints with Postman
- Open an issue if you encounter problems

---

**Good luck with the migration! 🚀**
