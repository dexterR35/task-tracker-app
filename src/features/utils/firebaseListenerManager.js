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
   */
  performCleanup() {
    const listenerCount = this.listeners.size;
    const timeSinceLastActivity = Date.now() - this.lastActivity;
    
    // Force cleanup if too many listeners
    if (listenerCount > this.maxListeners) {
      logger.warn(`[ListenerManager] Too many listeners (${listenerCount}), performing cleanup`);
      this.removeAllListeners();
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
   * Add a listener with automatic deduplication and memory leak prevention
   * @param {string} key - Unique key for the listener
   * @param {Function} setupFn - Function that returns unsubscribe function
   * @param {boolean} preserve - Whether to preserve this listener during cleanup
   * @returns {Function} - Unsubscribe function
   */
  addListener(key, setupFn, preserve = false) {
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
