// IndexedDB Storage Utility - Integrates with Firebase's existing IndexedDB
const DB_NAME = 'nb-tracker-store';
const DB_VERSION = 1;
const STORES = {
  ANALYTICS: 'analytics-store',
  USERS: 'users-store',
  TASKS: 'tasks-store'
};

import { logger } from './logger';

class IndexedDBStorage {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  // Initialize IndexedDB
  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.ANALYTICS)) {
          const analyticsStore = db.createObjectStore(STORES.ANALYTICS, { keyPath: 'monthId' });
          analyticsStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.USERS)) {
          const usersStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
          usersStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const tasksStore = db.createObjectStore(STORES.TASKS, { keyPath: 'monthId' });
          tasksStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        logger.log('IndexedDB stores created');
      };
    });

    return this.initPromise;
  }

  // Generic methods for any store
  async get(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async set(storeName, key, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ ...value, id: key });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
const indexedDBStorage = new IndexedDBStorage();

// Analytics Storage
export const analyticsStorage = {
  storeAnalytics: async (monthId, analyticsData) => {
    try {
      const data = {
        monthId,
        data: analyticsData,
        cachedAt: new Date().toISOString()
      };
      await indexedDBStorage.set(STORES.ANALYTICS, monthId, data);
      logger.log('Analytics cached in IndexedDB for month:', monthId);
      return true;
    } catch (error) {
              logger.error('Failed to store analytics in IndexedDB:', error);
      return false;
    }
  },

  getAnalytics: async (monthId) => {
    try {
      const result = await indexedDBStorage.get(STORES.ANALYTICS, monthId);
      return result?.data || null;
    } catch (error) {
              logger.error('Failed to get analytics from IndexedDB:', error);
      return null;
    }
  },

  getAllAnalytics: async () => {
    try {
      const results = await indexedDBStorage.getAll(STORES.ANALYTICS);
      const analytics = {};
      results.forEach(result => {
        analytics[result.monthId] = result.data;
      });
      return analytics;
    } catch (error) {
              logger.error('Failed to get all analytics from IndexedDB:', error);
      return {};
    }
  },

  hasAnalytics: async (monthId) => {
    const analytics = await analyticsStorage.getAnalytics(monthId);
    return analytics !== null;
  },

  clearAnalytics: async (monthId) => {
    try {
      await indexedDBStorage.delete(STORES.ANALYTICS, monthId);
      logger.log('Analytics cleared from IndexedDB for month:', monthId);
      return true;
    } catch (error) {
              logger.error('Failed to clear analytics from IndexedDB:', error);
      return false;
    }
  },

  clearAllAnalytics: async () => {
    try {
      await indexedDBStorage.clear(STORES.ANALYTICS);
      logger.log('All analytics cleared from IndexedDB');
      return true;
    } catch (error) {
              logger.error('Failed to clear all analytics from IndexedDB:', error);
      return false;
    }
  },

  getAnalyticsAge: async (monthId) => {
    try {
      const result = await indexedDBStorage.get(STORES.ANALYTICS, monthId);
      if (!result?.cachedAt) return Infinity;
      
      const cachedTime = new Date(result.cachedAt).getTime();
      const now = new Date().getTime();
      return (now - cachedTime) / (1000 * 60 * 60); // hours
    } catch (error) {
      return Infinity;
    }
  },

  isAnalyticsFresh: async (monthId) => {
    const age = await analyticsStorage.getAnalyticsAge(monthId);
    return age < 24; // 24 hours
  },

  updateAnalytics: async (monthId, analyticsData) => {
    return analyticsStorage.storeAnalytics(monthId, analyticsData);
  }
};

// Users Storage
export const userStorage = {
  storeUsers: async (users, silent = false) => {
    try {
      const data = {
        users,
        cachedAt: new Date().toISOString(),
        count: users.length
      };
      await indexedDBStorage.set(STORES.USERS, 'all-users', data);
              // Only log once per session to reduce spam (unless silent)
        if (!silent && import.meta.env.MODE === 'development' && !window._usersCachedLogged) {
          logger.log('Users cached in IndexedDB:', users.length, 'users');
          window._usersCachedLogged = true;
        }
      return true;
    } catch (error) {
              logger.error('Failed to store users in IndexedDB:', error);
      return false;
    }
  },

  getUsers: async () => {
    try {
      const result = await indexedDBStorage.get(STORES.USERS, 'all-users');
      return result?.users || null;
    } catch (error) {
              logger.error('Failed to get users from IndexedDB:', error);
      return null;
    }
  },

  hasUsers: async () => {
    const users = await userStorage.getUsers();
    return users !== null;
  },

    clearUsers: async () => {
    try {
      await indexedDBStorage.clear(STORES.USERS);
      // Reset log flags when cache is cleared
      if (window._usersCachedLogged) delete window._usersCachedLogged;
      if (window._cachedUsersLogged) delete window._cachedUsersLogged;
      if (window._fetchingUsersLogged) delete window._fetchingUsersLogged;
      
              // Only log in development mode
        if (import.meta.env.MODE === 'development') {
          logger.log('Users cache cleared from IndexedDB');
        }
      return true;
    } catch (error) {
              logger.error('Failed to clear users cache from IndexedDB:', error);
      return false;
    }
  },

  getUsersAge: async () => {
    try {
      const result = await indexedDBStorage.get(STORES.USERS, 'all-users');
      if (!result?.cachedAt) return Infinity;
      
      const cachedTime = new Date(result.cachedAt).getTime();
      const now = new Date().getTime();
      return (now - cachedTime) / (1000 * 60 * 60); // hours
    } catch (error) {
      return Infinity;
    }
  },

  isUsersFresh: async () => {
    const age = await userStorage.getUsersAge();
    return age < 1; // 1 hour
  },

  updateUser: async (updatedUser) => {
    try {
      const users = await userStorage.getUsers();
      if (!users) return false;
      
      const updatedUsers = users.map(user => 
        (user.userUID === updatedUser.userUID || user.id === updatedUser.id) ? updatedUser : user
      );
      
      await userStorage.storeUsers(updatedUsers);
      return true;
    } catch (error) {
              logger.error('Failed to update user in IndexedDB cache:', error);
      return false;
    }
  },

  addUser: async (newUser) => {
    try {
      const users = await userStorage.getUsers();
      if (!users) return false;
      
      // Check if user already exists
      const exists = users.some(user => 
        user.userUID === newUser.userUID || user.id === newUser.id
      );
      
      if (!exists) {
        const updatedUsers = [newUser, ...users];
        await userStorage.storeUsers(updatedUsers);
                  // Only log in development mode
          if (import.meta.env.MODE === 'development') {
            logger.log('New user added to IndexedDB cache:', newUser.name);
          }
      }
      
      return true;
    } catch (error) {
              logger.error('Failed to add user to IndexedDB cache:', error);
      return false;
    }
  }
};

// Tasks Storage (enhanced for complete caching strategy)
export const taskStorage = {
  storeTasks: async (monthId, tasks) => {
    try {
      const data = {
        monthId,
        tasks,
        cachedAt: new Date().toISOString(),
        count: tasks.length
      };
      await indexedDBStorage.set(STORES.TASKS, monthId, data);
      logger.log('Tasks cached in IndexedDB for month:', monthId, 'count:', tasks.length);
      return true;
    } catch (error) {
              logger.error('Failed to store tasks in IndexedDB:', error);
      return false;
    }
  },

  getTasks: async (monthId) => {
    try {
      const result = await indexedDBStorage.get(STORES.TASKS, monthId);
      return result?.tasks || null;
    } catch (error) {
              logger.error('Failed to get tasks from IndexedDB:', error);
      return null;
    }
  },

  hasTasks: async (monthId) => {
    const tasks = await taskStorage.getTasks(monthId);
    return tasks !== null && tasks.length > 0;
  },

  getTasksAge: async (monthId) => {
    try {
      const result = await indexedDBStorage.get(STORES.TASKS, monthId);
      if (!result?.cachedAt) return Infinity;
      
      const cachedTime = new Date(result.cachedAt).getTime();
      const now = new Date().getTime();
      return (now - cachedTime) / (1000 * 60 * 60); // hours
    } catch (error) {
      return Infinity;
    }
  },

  isTasksFresh: async (monthId) => {
    const age = await taskStorage.getTasksAge(monthId);
    return age < 2; // 2 hours - tasks can be cached longer than analytics
  },

  addTask: async (monthId, newTask) => {
    try {
      const tasks = await taskStorage.getTasks(monthId);
      
      // Ensure deliverablesOther is always an array
      const normalizedTask = {
        ...newTask,
        deliverablesOther: Array.isArray(newTask.deliverablesOther) 
          ? newTask.deliverablesOther 
          : false,
        aiModels: Array.isArray(newTask.aiModels) 
          ? newTask.aiModels 
          : false,
        deliverablesCount: Number(newTask.deliverablesCount) || 0,
      };
      
      if (!tasks) {
        // If no tasks exist, create new array
        await taskStorage.storeTasks(monthId, [normalizedTask]);
        return true;
      }
      
      // Check if task already exists
      const exists = tasks.some(task => task.id === newTask.id);
      if (!exists) {
        const updatedTasks = [normalizedTask, ...tasks]; // Add to beginning (newest first)
        await taskStorage.storeTasks(monthId, updatedTasks);
        logger.log('New task added to IndexedDB cache:', newTask.id, 'for month:', monthId);
      }
      
      return true;
    } catch (error) {
              logger.error('Failed to add task to IndexedDB cache:', error);
      return false;
    }
  },

  updateTask: async (monthId, taskId, updates) => {
    try {
      const tasks = await taskStorage.getTasks(monthId);
      if (!tasks) return false;
      
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          // Ensure deliverablesOther is false when not selected, array when selected
          const deliverablesOther = Array.isArray(updates.deliverablesOther) 
            ? updates.deliverablesOther 
            : false;
          
          // Ensure aiModels is false when not selected, array when selected
          const aiModels = Array.isArray(updates.aiModels) 
            ? updates.aiModels 
            : false;
          
          // Ensure deliverablesCount is always a number
          const deliverablesCount = Number(updates.deliverablesCount) || 0;
          
          return { 
            ...task, 
            ...updates, 
            deliverablesOther, // Ensure it's false when not selected, array when selected
            aiModels, // Ensure it's false when not selected, array when selected
            deliverablesCount, // Ensure it's always a number
            updatedAt: Date.now() 
          };
        }
        return task;
      });
      
      await taskStorage.storeTasks(monthId, updatedTasks);
      logger.log('Task updated in IndexedDB cache:', taskId, 'for month:', monthId);
      return true;
    } catch (error) {
              logger.error('Failed to update task in IndexedDB cache:', error);
      return false;
    }
  },

  removeTask: async (monthId, taskId) => {
    try {
      const tasks = await taskStorage.getTasks(monthId);
      if (!tasks) return false;
      
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      await taskStorage.storeTasks(monthId, updatedTasks);
      logger.log('Task removed from IndexedDB cache:', taskId, 'for month:', monthId);
      return true;
    } catch (error) {
  
      return false;
    }
  },

  clearTasks: async (monthId) => {
    try {
      await indexedDBStorage.delete(STORES.TASKS, monthId);
     
      return true;
    } catch (error) {
 
      return false;
    }
  },

  clearAllTasks: async () => {
    try {
      await indexedDBStorage.clear(STORES.TASKS);
   
      return true;
    } catch (error) {
 
      return false;
    }
  },

  getAllTasks: async () => {
    try {
      const results = await indexedDBStorage.getAll(STORES.TASKS);
      const allTasks = {};
      results.forEach(result => {
        allTasks[result.monthId] = result.tasks;
      });
      return allTasks;
    } catch (error) {
    
      return {};
    }
  },

  // Utility method to get tasks across multiple months
  getTasksForMonths: async (monthIds) => {
    try {
      const allTasks = {};
      for (const monthId of monthIds) {
        const tasks = await taskStorage.getTasks(monthId);
        if (tasks) {
          allTasks[monthId] = tasks;
        }
      }
      return allTasks;
    } catch (error) {
   
      return {};
    }
  }
};

export default indexedDBStorage;
