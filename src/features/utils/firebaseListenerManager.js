import { logger } from "@/utils/logger";

/**
 * Centralized Firebase Listener Manager
 * Prevents duplicate listeners and manages cleanup
 */
class FirebaseListenerManager {
  constructor() {
    this.listeners = new Map();
    this.isInitialized = false;
  }

  /**
   * Add a listener with automatic deduplication
   * @param {string} key - Unique key for the listener
   * @param {Function} setupFn - Function that returns unsubscribe function
   * @returns {Function} - Unsubscribe function
   */
  addListener(key, setupFn) {
    // Clean up existing listener if it exists
    if (this.listeners.has(key)) {
      logger.log(`[ListenerManager] Cleaning up existing listener: ${key}`);
      const existingUnsubscribe = this.listeners.get(key);
      existingUnsubscribe();
      this.listeners.delete(key);
    }

    // Set up new listener
    logger.log(`[ListenerManager] Setting up new listener: ${key}`);
    const unsubscribe = setupFn();
    
    // Store the unsubscribe function
    this.listeners.set(key, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Remove a specific listener
   * @param {string} key - Key of the listener to remove
   */
  removeListener(key) {
    if (this.listeners.has(key)) {
      logger.log(`[ListenerManager] Removing listener: ${key}`);
      const unsubscribe = this.listeners.get(key);
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    logger.log(`[ListenerManager] Removing all ${this.listeners.size} listeners`);
    for (const [key, unsubscribe] of this.listeners) {
      logger.log(`[ListenerManager] Removing listener: ${key}`);
      unsubscribe();
    }
    this.listeners.clear();
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

// Clean up listeners on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    listenerManager.removeAllListeners();
  });
}

export default listenerManager;
