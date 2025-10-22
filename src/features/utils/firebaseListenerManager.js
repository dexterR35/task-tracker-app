import { logger } from "@/utils/logger";

/**
 * Centralized Firebase Listener Manager
 * Prevents duplicate listeners and manages cleanup
 * Enhanced with memory leak prevention and automatic cleanup
 */
class FirebaseListenerManager {
  constructor() {
    this.listeners = new Map();
    this.preservedListeners = new Map(); // Store critical listeners that should be preserved
    this.isInitialized = false;
    this.cleanupInterval = null;
    this.maxListeners = 50; // Prevent excessive listeners
    this.cleanupIntervalMs = 600000; // Clean up every 10 minutes (for infrequent data usage)
    this.idleTimeoutMs = 1800000; // 30 minutes of inactivity before cleanup
    this.lastActivity = Date.now();
    
    // Usage tracking
    this.usageStats = {
      totalListeners: 0,
      listenersPerPage: new Map(),
      listenersPerCategory: new Map(),
      navigationHistory: [],
      peakListeners: 0,
      cleanupCount: 0
    };
    
    this.startCleanupInterval();
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.cleanupIntervalMs);
  }

  /**
   * Stop automatic cleanup interval
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Update last activity timestamp
   */
  updateActivity() {
    this.lastActivity = Date.now();
  }

  /**
   * Perform automatic cleanup based on usage patterns
   * MEGA MASTER: Enhanced with granular cleanup
   */
  performCleanup() {
    const listenerCount = this.listeners.size;
    const timeSinceLastActivity = Date.now() - this.lastActivity;

    // Force cleanup if too many listeners - use granular cleanup first
    if (listenerCount > this.maxListeners) {
      logger.warn(`[ListenerManager] Too many listeners (${listenerCount}), performing granular cleanup`);
      this.performGranularCleanup();
      
      // If still too many after granular cleanup, remove all
      if (this.listeners.size > this.maxListeners) {
        this.removeAllListeners();
      }
      return;
    }

    // Use granular cleanup for high listener counts (increased threshold)
    if (listenerCount > 50) {
      logger.log(`[ListenerManager] High listener count (${listenerCount}), performing granular cleanup`);
      this.performGranularCleanup();
      return;
    }

    // Cleanup if idle for too long (for infrequent data usage)
    if (listenerCount > 0 && timeSinceLastActivity > this.idleTimeoutMs) {
      this.removeAllListeners();
      return;
    }

    // Log current listener status (less frequently)
    if (listenerCount > 0 && timeSinceLastActivity < 300000) { // Only log if active in last 5 minutes
    }
  }

  /**
   * Perform selective cleanup - only remove non-critical listeners
   * This prevents memory leaks while preserving essential functionality
   */
  performSelectiveCleanup() {
    const now = Date.now();
    const listenersToRemove = [];

    for (const [key, unsubscribe] of this.listeners) {
      // Only remove non-critical listeners (not auth, not real-time data)
      if (!this.preservedListeners.has(key) &&
          !key.includes('auth') &&
          !key.includes('auth-state') &&
          !key.includes('tasks') &&
          !key.includes('realtime')) {
        try {
          unsubscribe();
          listenersToRemove.push(key);
        } catch (error) {
          logger.error(`[ListenerManager] Error in selective cleanup of listener ${key}:`, error);
        }
      }
    }

    // Remove cleaned up listeners
    listenersToRemove.forEach(key => this.listeners.delete(key));

    if (listenersToRemove.length > 0) {
      logger.log(`[ListenerManager] Selective cleanup removed ${listenersToRemove.length} non-critical listeners`);
    }
  }

  /**
   * Perform granular cleanup based on listener categories and priorities
   * MEGA MASTER: Advanced cleanup with listener categorization
   */
  performGranularCleanup() {
    const listenerCategories = {
      'auth': { priority: 1, preserve: true },
      'auth-state': { priority: 1, preserve: true },
      'tasks': { priority: 2, preserve: true }, // HIGH PRIORITY - real-time updates needed
      'realtime': { priority: 2, preserve: true },
      'analytics': { priority: 2, preserve: true }, // HIGH PRIORITY - changes frequently
      'table': { priority: 2, preserve: true }, // HIGH PRIORITY - changes frequently
      'form': { priority: 2, preserve: true }, // HIGH PRIORITY - changes frequently
      'months': { priority: 3, preserve: true }, // MEDIUM PRIORITY - cached for 30 days
      'users': { priority: 5, preserve: false }, // LOWEST PRIORITY - infinite cache, cleanup first
      'reporters': { priority: 5, preserve: false }, // LOWEST PRIORITY - infinite cache, cleanup first
      'deliverables': { priority: 5, preserve: false }, // LOWEST PRIORITY - infinite cache, cleanup first
      'reports': { priority: 5, preserve: false }, // LOWEST PRIORITY - heavy reports
      'general': { priority: 5, preserve: false } // LOWEST PRIORITY - general listeners
    };

    const listenersToRemove = [];
    const now = Date.now();

    for (const [key, unsubscribe] of this.listeners) {
      // Skip preserved listeners
      if (this.preservedListeners.has(key)) {
        continue;
      }

      // Determine listener category
      let category = 'general';
      let priority = 5;
      let shouldPreserve = false;

      for (const [catName, catConfig] of Object.entries(listenerCategories)) {
        if (key.includes(catName)) {
          category = catName;
          priority = catConfig.priority;
          shouldPreserve = catConfig.preserve;
          break;
        }
      }

          // Remove listeners based on priority and category
          // SMART CLEANUP: Remove infinite cache data first (users, reporters, deliverables)
          const shouldRemove = !shouldPreserve && (
            priority >= 5 || // Remove users, reporters, deliverables (infinite cache)
            (category === 'reports' && this.listeners.size > 30) || // Remove heavy reports
            (category === 'general' && this.listeners.size > 25) // Remove general listeners
          );

      if (shouldRemove) {
        try {
          unsubscribe();
          listenersToRemove.push(key);
          logger.log(`[ListenerManager] Granular cleanup removed ${category} listener: ${key}`);
        } catch (error) {
          logger.error(`[ListenerManager] Error in granular cleanup of listener ${key}:`, error);
        }
      }
    }

    // Remove cleaned up listeners
    listenersToRemove.forEach(key => this.listeners.delete(key));

    if (listenersToRemove.length > 0) {
      logger.log(`[ListenerManager] Granular cleanup removed ${listenersToRemove.length} listeners`);
    }
  }

  /**
   * Add a listener with automatic deduplication and memory leak prevention
   * @param {string} key - Unique key for the listener
   * @param {Function} setupFn - Function that returns unsubscribe function
   * @param {boolean} preserve - Whether to preserve this listener during cleanup
   * @param {string} category - Listener category for tracking
   * @param {string} page - Current page for tracking
   * @returns {Function} - Unsubscribe function
   */
  addListener(key, setupFn, preserve = false, category = 'general', page = 'unknown') {
    // Check for excessive listeners
    if (this.listeners.size >= this.maxListeners) {
      logger.warn(`[ListenerManager] Maximum listeners reached (${this.maxListeners}), cleaning up`);
      this.removeAllListeners();
    }

    // Clean up existing listener if it exists
    if (this.listeners.has(key)) {
      const existingUnsubscribe = this.listeners.get(key);
      try {
        existingUnsubscribe();
      } catch (error) {
        logger.error(`[ListenerManager] Error cleaning up listener ${key}:`, error);
      }
      this.listeners.delete(key);
    }

    // Set up new listener with error handling
    let unsubscribe;
    try {
      unsubscribe = setupFn();

      // Validate unsubscribe function
      if (typeof unsubscribe !== 'function') {
        throw new Error('Setup function must return an unsubscribe function');
      }

      // Store the unsubscribe function
      this.listeners.set(key, unsubscribe);

      // If this listener should be preserved, store it separately
      if (preserve) {
        this.preservedListeners.set(key, { setupFn, unsubscribe });
      }

      // Track usage statistics
      this.trackListenerUsage(key, category, page);

      // Update activity timestamp
      this.updateActivity();

    } catch (error) {
      logger.error(`[ListenerManager] Error setting up listener ${key}:`, error);
      throw error;
    }

    return unsubscribe;
  }

  /**
   * Remove a specific listener with error handling
   * @param {string} key - Key of the listener to remove
   */
  removeListener(key) {
    if (this.listeners.has(key)) {
      const unsubscribe = this.listeners.get(key);
      try {
        unsubscribe();
      } catch (error) {
        logger.error(`[ListenerManager] Error removing listener ${key}:`, error);
      }
      this.listeners.delete(key);
    }
  }

  /**
   * Remove all listeners with error handling (preserves critical listeners)
   */
  removeAllListeners() {
    const listenerCount = this.listeners.size;

    for (const [key, unsubscribe] of this.listeners) {
      // Skip preserved listeners
      if (this.preservedListeners.has(key)) {
        continue;
      }

      try {
        unsubscribe();
      } catch (error) {
        logger.error(`[ListenerManager] Error removing listener ${key}:`, error);
      }
    }

    // Clear only non-preserved listeners
    for (const [key] of this.listeners) {
      if (!this.preservedListeners.has(key)) {
        this.listeners.delete(key);
      }
    }
  }

  /**
   * Restore preserved listeners when app becomes visible again
   */
  restorePreservedListeners() {
    for (const [key, { setupFn, unsubscribe }] of this.preservedListeners) {
      // Clean up old listener if it exists
      if (this.listeners.has(key)) {
        try {
          this.listeners.get(key)();
        } catch (error) {
          logger.error(`[ListenerManager] Error cleaning up old listener ${key}:`, error);
        }
      }

      // Set up new listener
      try {
        const newUnsubscribe = setupFn();
        this.listeners.set(key, newUnsubscribe);
        this.preservedListeners.set(key, { setupFn, unsubscribe: newUnsubscribe });
        this.updateActivity();
      } catch (error) {
        logger.error(`[ListenerManager] Error restoring listener ${key}:`, error);
      }
    }
  }

  /**
   * Cleanup on component unmount or app shutdown
   */
  destroy() {
    this.stopCleanupInterval();
    this.removeAllListeners();
    // Also clear preserved listeners on destroy
    this.preservedListeners.clear();
  }

  /**
   * Get listener count
   * @returns {number} - Number of active listeners
   */
  getListenerCount() {
    return this.listeners.size;
  }

  /**
   * Get all listener keys
   * @returns {Array<string>} - Array of listener keys
   */
  getListenerKeys() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Check if a listener exists
   * @param {string} key - Key to check
   * @returns {boolean} - Whether listener exists
   */
  hasListener(key) {
    return this.listeners.has(key);
  }

  /**
   * Track listener usage for monitoring
   * @param {string} key - Listener key
   * @param {string} category - Listener category
   * @param {string} page - Current page
   */
  trackListenerUsage(key, category, page) {
    // Update total listeners
    this.usageStats.totalListeners = this.listeners.size;
    
    // Track peak listeners
    if (this.usageStats.totalListeners > this.usageStats.peakListeners) {
      this.usageStats.peakListeners = this.usageStats.totalListeners;
    }
    
    // Track listeners per page
    const pageCount = this.usageStats.listenersPerPage.get(page) || 0;
    this.usageStats.listenersPerPage.set(page, pageCount + 1);
    
    // Track listeners per category
    const categoryCount = this.usageStats.listenersPerCategory.get(category) || 0;
    this.usageStats.listenersPerCategory.set(category, categoryCount + 1);
    
    // Track navigation history
    this.usageStats.navigationHistory.push({
      timestamp: new Date().toISOString(),
      page,
      category,
      totalListeners: this.usageStats.totalListeners
    });
    
    // Keep only last 100 navigation events
    if (this.usageStats.navigationHistory.length > 100) {
      this.usageStats.navigationHistory = this.usageStats.navigationHistory.slice(-100);
    }
  }

  /**
   * Track cleanup events
   */
  trackCleanup() {
    this.usageStats.cleanupCount++;
  }

  /**
   * Get usage statistics
   * @returns {Object} - Usage statistics
   */
  getUsageStats() {
    return {
      ...this.usageStats,
      currentListeners: this.listeners.size,
      listenersPerPage: Object.fromEntries(this.usageStats.listenersPerPage),
      listenersPerCategory: Object.fromEntries(this.usageStats.listenersPerCategory),
      recentNavigation: this.usageStats.navigationHistory.slice(-10)
    };
  }

  /**
   * Get listeners per page breakdown
   * @returns {Object} - Listeners per page
   */
  getListenersPerPage() {
    return Object.fromEntries(this.usageStats.listenersPerPage);
  }

  /**
   * Get listeners per category breakdown
   * @returns {Object} - Listeners per category
   */
  getListenersPerCategory() {
    return Object.fromEntries(this.usageStats.listenersPerCategory);
  }

  /**
   * Get navigation history
   * @returns {Array} - Navigation history
   */
  getNavigationHistory() {
    return this.usageStats.navigationHistory;
  }

  /**
   * Check if a listener should be preserved based on recent usage
   * @param {string} key - Listener key
   * @param {number} recentMinutes - Minutes to consider as recent (default: 10)
   * @returns {boolean} - Whether listener should be preserved
   */
  shouldPreserveListener(key, recentMinutes = 10) {
    const recentTime = Date.now() - (recentMinutes * 60 * 1000);
    
    // Check if listener was used recently
    const recentUsage = this.usageStats.navigationHistory.filter(
      nav => nav.timestamp && new Date(nav.timestamp).getTime() > recentTime
    );
    
    // Check if this listener was used recently
    const wasUsedRecently = recentUsage.some(nav => 
      nav.page && key.includes(nav.page.toLowerCase())
    );
    
    // Check listener category for preservation rules
    const category = this.getListenerCategory(key);
    const categoryConfig = this.getCategoryConfig(category);
    
    return wasUsedRecently || categoryConfig.preserve;
  }

  /**
   * Get listener category from key
   * @param {string} key - Listener key
   * @returns {string} - Category name
   */
  getListenerCategory(key) {
    if (key.includes('auth')) return 'auth';
    if (key.includes('tasks')) return 'tasks';
    if (key.includes('analytics')) return 'analytics';
    if (key.includes('table')) return 'table';
    if (key.includes('form')) return 'form';
    if (key.includes('months')) return 'months';
    if (key.includes('users')) return 'users';
    if (key.includes('reporters')) return 'reporters';
    if (key.includes('deliverables')) return 'deliverables';
    if (key.includes('reports')) return 'reports';
    return 'general';
  }

  /**
   * Get category configuration
   * @param {string} category - Category name
   * @returns {Object} - Category configuration
   */
  getCategoryConfig(category) {
    const configs = {
      'auth': { priority: 1, preserve: true },
      'auth-state': { priority: 1, preserve: true },
      'tasks': { priority: 2, preserve: true },
      'realtime': { priority: 2, preserve: true },
      'analytics': { priority: 2, preserve: true },
      'table': { priority: 2, preserve: true },
      'form': { priority: 2, preserve: true },
      'months': { priority: 3, preserve: true },
      'users': { priority: 4, preserve: false },
      'reporters': { priority: 4, preserve: false },
      'deliverables': { priority: 4, preserve: false },
      'reports': { priority: 5, preserve: false },
      'general': { priority: 5, preserve: false }
    };
    
    return configs[category] || configs.general;
  }
}

// Create singleton instance
const listenerManager = new FirebaseListenerManager();

// Clean up listeners on page unload and visibility change
if (typeof window !== 'undefined') {
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    listenerManager.destroy();
  });

  // Handle visibility changes - preserve critical listeners
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Only clean up non-critical listeners to prevent memory leaks
      // while preserving essential real-time functionality
      listenerManager.performSelectiveCleanup();
    } else {
      // App became visible again - restore necessary listeners
      listenerManager.restorePreservedListeners();
    }
  });

  // Clean up on page focus loss (additional safety) - but preserve critical listeners
  window.addEventListener('blur', () => {
    listenerManager.performCleanup();
  });
}

export default listenerManager;
