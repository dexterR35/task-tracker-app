/**
 * Firestore Usage Tracker
 * Tracks and displays real-time Firestore usage statistics
 */

class FirestoreUsageTracker {
  constructor() {
    this.usage = this.loadPersistedUsage();
    this.listeners = [];
    this.isTracking = false;
  }

  loadPersistedUsage() {
    try {
      const stored = localStorage.getItem('firestore_usage_tracker');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if it's from today
        const today = new Date().toDateString();
        if (parsed.date === today) {
          return parsed.usage;
        }
      }
    } catch (error) {
      console.error('Error loading persisted usage:', error);
    }

    // Return default if no valid data
    return {
      reads: 0,
      writes: 0,
      deletes: 0,
      total: 0
    };
  }

  savePersistedUsage() {
    try {
      const data = {
        date: new Date().toDateString(),
        usage: this.usage
      };
      localStorage.setItem('firestore_usage_tracker', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving persisted usage:', error);
    }
  }

  startTracking() {
    try {
      if (this.isTracking) return;
      this.isTracking = true;

      // Track Firestore operations
      this.trackFirestoreOperations();

      // Reset usage daily
      this.resetDailyUsage();

      console.log('🔍 Firestore Usage Tracker started');
    } catch (error) {
      console.error('Error starting Firestore usage tracker:', error);
    }
  }

  stopTracking() {
    this.isTracking = false;
    console.log('🔍 Firestore Usage Tracker stopped');
  }

  trackFirestoreOperations() {
    // Track actual Firestore operations by intercepting Firebase calls
    this.trackGetDocs();
    this.trackGetDoc();
    this.trackOnSnapshot();
    this.trackQuery();

    // Also track through module interception
    this.interceptFirebaseModules();
  }

  interceptFirebaseModules() {
    // Track Firebase operations at the module level
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      if (this.isTracking) {
        const message = args.join(' ');
        if (message.includes('📋 Tasks fetched:') ||
            message.includes('🔍 getMonthTasks API called:') ||
            message.includes('📅 Month board check:')) {
          // These are our app's Firestore operations
          this.incrementReads(1);
        }
      }
      originalConsoleLog.apply(console, args);
    };
  }

  trackGetDocs() {
    // Track getDocs calls
    const originalGetDocs = window.firebase?.firestore?.getDocs;
    if (originalGetDocs) {
      window.firebase.firestore.getDocs = async (...args) => {
        const result = await originalGetDocs.apply(this, args);
        this.incrementReads(result.docs.length);
        console.log(`📊 Firestore getDocs: ${result.docs.length} documents read`);
        return result;
      };
    }
  }

  trackGetDoc() {
    // Track getDoc calls
    const originalGetDoc = window.firebase?.firestore?.getDoc;
    if (originalGetDoc) {
      window.firebase.firestore.getDoc = async (...args) => {
        const result = await originalGetDoc.apply(this, args);
        this.incrementReads(1);
        console.log(`📊 Firestore getDoc: 1 document read`);
        return result;
      };
    }
  }

  trackOnSnapshot() {
    // Track onSnapshot listeners
    const originalOnSnapshot = window.firebase?.firestore?.onSnapshot;
    if (originalOnSnapshot) {
      window.firebase.firestore.onSnapshot = (...args) => {
        const unsubscribe = originalOnSnapshot.apply(this, args);
        // Track initial read
        this.incrementReads(1);
        console.log(`📊 Firestore onSnapshot: 1 initial read`);
        return unsubscribe;
      };
    }
  }

  trackQuery() {
    // Track query operations
    const originalQuery = window.firebase?.firestore?.query;
    if (originalQuery) {
      window.firebase.firestore.query = (...args) => {
        const result = originalQuery.apply(this, args);
        // Query itself doesn't count as read, but execution does
        return result;
      };
    }
  }

  incrementReads(count = 1) {
    this.usage.reads += count;
    this.usage.total += count;
    this.savePersistedUsage();
    this.notifyListeners();
  }

  incrementWrites(count = 1) {
    this.usage.writes += count;
    this.usage.total += count;
    this.savePersistedUsage();
    this.notifyListeners();
  }

  incrementDeletes(count = 1) {
    this.usage.deletes += count;
    this.usage.total += count;
    this.savePersistedUsage();
    this.notifyListeners();
  }

  getUsage() {
    return { ...this.usage };
  }

  resetUsage() {
    this.usage = {
      reads: 0,
      writes: 0,
      deletes: 0,
      total: 0
    };
    this.savePersistedUsage();
    this.notifyListeners();
  }

  resetDailyUsage() {
    // Reset usage at midnight
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
      this.resetUsage();
      this.resetDailyUsage(); // Schedule next reset
    }, timeUntilMidnight);
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getUsage());
      } catch (error) {
        console.error('Error in Firestore usage listener:', error);
      }
    });

    // Dispatch custom event for React components
    window.dispatchEvent(new CustomEvent('firestore-usage', {
      detail: {
        type: 'FIRESTORE_USAGE',
        data: this.getUsage()
      }
    }));
  }

  // Manual tracking methods for specific operations
  trackQuery(collectionName, limit = null) {
    const reads = limit ? Math.min(limit, 1) : 1;
    this.incrementReads(reads);
    console.log(`📊 Firestore Query: ${collectionName} (${reads} reads)`);
  }

  trackDocumentRead(documentPath) {
    this.incrementReads(1);
    console.log(`📊 Firestore Document Read: ${documentPath}`);
  }

  trackListener(collectionName) {
    this.incrementReads(1);
    console.log(`📊 Firestore Listener: ${collectionName}`);
  }

  trackWrite(collectionName, operation = 'write') {
    this.incrementWrites(1);
    console.log(`📊 Firestore ${operation}: ${collectionName}`);
  }

  trackDelete(collectionName) {
    this.incrementDeletes(1);
    console.log(`📊 Firestore Delete: ${collectionName}`);
  }

  // Method to manually set usage from Firebase dashboard
  setUsageFromDashboard(dashboardData) {
    try {
      this.usage = {
        reads: dashboardData.reads || 0,
        writes: dashboardData.writes || 0,
        deletes: dashboardData.deletes || 0,
        total: (dashboardData.reads || 0) + (dashboardData.writes || 0) + (dashboardData.deletes || 0)
      };
      this.savePersistedUsage();
      this.notifyListeners();
      console.log('📊 Usage synced from Firebase dashboard:', this.usage);
    } catch (error) {
      console.error('Error setting usage from dashboard:', error);
    }
  }

  // Method to get current usage with timestamp
  getUsageWithTimestamp() {
    return {
      ...this.usage,
      lastUpdated: new Date().toISOString(),
      date: new Date().toDateString()
    };
  }
}

// Create singleton instance
const firestoreUsageTracker = new FirestoreUsageTracker();

// Make it available globally for manual sync
if (typeof window !== 'undefined') {
  window.firestoreUsageTracker = firestoreUsageTracker;

  // Add global function to sync from Firebase dashboard
  window.syncFirestoreUsage = (reads, writes = 0, deletes = 0) => {
    firestoreUsageTracker.setUsageFromDashboard({ reads, writes, deletes });
    console.log(`✅ Synced Firestore usage: ${reads} reads, ${writes} writes, ${deletes} deletes`);
  };
}

export default firestoreUsageTracker;
