import { logger } from "@/utils/logger";

/**
 * Shared request deduplication utility
 * Prevents duplicate API calls for the same request
 */
class RequestDeduplicationManager {
  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Deduplicate a request by key
   * @param {string} key - Unique key for the request
   * @param {Function} requestFn - Function that returns a promise
   * @param {string} apiName - Name of the API for logging (optional)
   * @returns {Promise} - The deduplicated request result
   */
  async deduplicateRequest(key, requestFn, apiName = 'API') {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    const promise = requestFn();
    this.pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Clear all pending requests
   */
  clearAll() {
    this.pendingRequests.clear();
  }

  /**
   * Get count of pending requests
   */
  getPendingCount() {
    return this.pendingRequests.size;
  }

  /**
   * Get all pending request keys
   */
  getPendingKeys() {
    return Array.from(this.pendingRequests.keys());
  }
}

// Create singleton instance
const requestDeduplicationManager = new RequestDeduplicationManager();

// Export the deduplication function for easy use
export const deduplicateRequest = (key, requestFn, apiName) => 
  requestDeduplicationManager.deduplicateRequest(key, requestFn, apiName);

// Export the manager for advanced usage
export default requestDeduplicationManager;
