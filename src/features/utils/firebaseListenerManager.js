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
    this.lastActivity = Date.now();
    this.isPageVisible = true; // Track page visibility
    this.pausedListeners = new Map(); // Store paused listener state

    // Usage tracking
    this.usageStats = {
      totalListeners: 0,
      listenersPerPage: new Map(),
      listenersPerCategory: new Map(),
      navigationHistory: [],
      peakListeners: 0,
      cleanupCount: 0
    };
  }

  /**
   * Stop automatic cleanup interval (kept for backward compatibility)
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
   * Only cleans up if too many listeners (no time-based cleanup)
   */
  performCleanup() {
    const listenerCount = this.listeners.size;

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
  }

  /**
   * Perform selective cleanup - only remove non-critical listeners
   * This prevents memory leaks while preserving essential functionality
   */
  performSelectiveCleanup() {
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


  addListener(key, setupFn, preserve = false, category = 'general', page = 'unknown') {
    // Check for excessive listeners - use selective cleanup instead of removing all
    if (this.listeners.size >= this.maxListeners) {
      logger.warn(`[ListenerManager] Maximum listeners reached (${this.maxListeners}), performing selective cleanup`);
      this.performSelectiveCleanup();
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
    for (const [key, { setupFn }] of this.preservedListeners) {
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
   * Pause all non-critical listeners when page becomes hidden
   * ALL listeners except auth should be paused when tab is hidden
   */
  pauseNonCriticalListeners() {
    if (!this.isPageVisible) return; // Already paused

    logger.log('[ListenerManager] Page hidden, pausing non-critical listeners');
    this.isPageVisible = false;

    const listenersToPause = [];

    for (const [key, unsubscribe] of this.listeners) {
      // Keep ONLY auth listeners active (critical for session management)
      // Everything else (tasks, users, etc.) should be paused to save resources
      if (key.includes('auth') || key.includes('auth-state')) {
        continue;
      }

      listenersToPause.push({ key, unsubscribe });
    }

    // Pause all non-critical listeners (including preserved ones)
    for (const { key, unsubscribe } of listenersToPause) {
      // Store paused listener info for restoration
      // Even preserved listeners need to be paused when tab is hidden
      if (this.preservedListeners.has(key)) {
        const preserved = this.preservedListeners.get(key);
        this.pausedListeners.set(key, {
          setupFn: preserved.setupFn,
          wasActive: true,
          wasPreserved: true
        });
      } else {
        // For non-preserved listeners, just unsub them when hidden
        this.pausedListeners.set(key, { wasActive: true, wasPreserved: false });
      }

      // Unsubscribe to stop Firestore requests
      try {
        unsubscribe();
      } catch (error) {
        logger.error(`[ListenerManager] Error pausing listener ${key}:`, error);
      }

      // Remove from active listeners map
      this.listeners.delete(key);
    }

    logger.log(`[ListenerManager] Paused ${listenersToPause.length} non-critical listeners`);
  }

  /**
   * Resume paused listeners when page becomes visible
   */
  resumePausedListeners() {
    if (this.isPageVisible) return; // Already active

    logger.log('[ListenerManager] Page visible, resuming paused listeners');
    this.isPageVisible = true;

    let resumedCount = 0;
    const listenersToResume = Array.from(this.pausedListeners.entries());

    for (const [key, pausedInfo] of listenersToResume) {
      try {
        if (pausedInfo.setupFn) {
          // Only restore if listener doesn't already exist (might have been recreated)
          if (!this.listeners.has(key)) {
            // Restore preserved listener
            const newUnsubscribe = pausedInfo.setupFn();
            this.listeners.set(key, newUnsubscribe);

            // Update preserved listeners map
            if (this.preservedListeners.has(key)) {
              this.preservedListeners.set(key, {
                setupFn: pausedInfo.setupFn,
                unsubscribe: newUnsubscribe
              });
            }

            resumedCount++;
          }
        } else if (pausedInfo.wasPreserved) {
          // If it was preserved but setupFn is missing, it means it was stored in preservedListeners
          // Try to restore from preservedListeners
          const preserved = this.preservedListeners.get(key);
          if (preserved && preserved.setupFn && !this.listeners.has(key)) {
            try {
              const newUnsubscribe = preserved.setupFn();
              this.listeners.set(key, newUnsubscribe);
              this.preservedListeners.set(key, {
                setupFn: preserved.setupFn,
                unsubscribe: newUnsubscribe
              });
              resumedCount++;
            } catch (error) {
              logger.error(`[ListenerManager] Error restoring preserved listener ${key}:`, error);
            }
          }
        }
        // Non-preserved listeners will be recreated automatically by components when needed
      } catch (error) {
        logger.error(`[ListenerManager] Error resuming listener ${key}:`, error);
      }
    }

    this.pausedListeners.clear();

    if (resumedCount > 0) {
      logger.log(`[ListenerManager] Resumed ${resumedCount} listeners`);
    }
  }

  /**
   * Cleanup on component unmount or app shutdown
   */
  destroy() {
    this.stopCleanupInterval();
    // Remove all listeners including preserved ones on destroy
    for (const [key, unsubscribe] of this.listeners) {
      try {
        unsubscribe();
      } catch (error) {
        logger.error(`[ListenerManager] Error removing listener ${key}:`, error);
      }
    }
    this.listeners.clear();
    this.preservedListeners.clear();
    this.pausedListeners.clear();
  }

  
  getListenerCount() {
    return this.listeners.size;
  }


  getListenerKeys() {
    return Array.from(this.listeners.keys());
  }


  hasListener(key) {
    return this.listeners.has(key);
  }

 
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

 
  trackCleanup() {
    this.usageStats.cleanupCount++;
  }


  getUsageStats() {
    return {
      ...this.usageStats,
      currentListeners: this.listeners.size,
      listenersPerPage: Object.fromEntries(this.usageStats.listenersPerPage),
      listenersPerCategory: Object.fromEntries(this.usageStats.listenersPerCategory),
      recentNavigation: this.usageStats.navigationHistory.slice(-10)
    };
  }

 
  getListenersPerPage() {
    return Object.fromEntries(this.usageStats.listenersPerPage);
  }

 
  getListenersPerCategory() {
    return Object.fromEntries(this.usageStats.listenersPerCategory);
  }

  getNavigationHistory() {
    return this.usageStats.navigationHistory;
  }


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


  getListenerCategory(key) {
    if (key.includes('auth')) return 'auth';
    if (key.includes('tasks')) return 'tasks';
    if (key.includes('table')) return 'table';
    if (key.includes('form')) return 'form';
    if (key.includes('months')) return 'months';
    if (key.includes('users')) return 'users';
    if (key.includes('reporters')) return 'reporters';
    if (key.includes('deliverables')) return 'deliverables';
    if (key.includes('reports')) return 'reports';
    return 'general';
  }

 
  getCategoryConfig(category) {
    const configs = {
      'auth': { priority: 1, preserve: true },
      'auth-state': { priority: 1, preserve: true },
      'tasks': { priority: 2, preserve: true },
      'realtime': { priority: 2, preserve: true },
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

// Handle page visibility changes to pause/resume listeners
if (typeof window !== 'undefined') {
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    listenerManager.destroy();
  });

  // Pause listeners when page becomes hidden (tab switched, minimized, etc.)
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Use a small delay to batch multiple visibility changes
      setTimeout(() => {
        if (document.hidden) {
          listenerManager.pauseNonCriticalListeners();
        }
      }, 100);
    } else {
      listenerManager.resumePausedListeners();
    }
  };

  // Listen for visibility changes (primary method)
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

export default listenerManager;
