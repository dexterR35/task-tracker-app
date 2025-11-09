/**
 * URL Parameter Utilities
 * Shared utilities for managing URL search parameters
 */

/**
 * Update URL search parameters while preserving existing ones
 * @param {Function} setSearchParams - React Router's setSearchParams function
 * @param {Object} updates - Object with key-value pairs to update
 * @param {boolean} replace - Whether to replace the history entry (default: true)
 * @returns {void}
 */
export const updateURLParams = (setSearchParams, updates, replace = true) => {
  const currentParams = new URLSearchParams(window.location.search);
  const paramsObj = Object.fromEntries(currentParams.entries());
  
  // Apply updates
  Object.entries(updates).forEach(([key, value]) => {
    if (!value || value === "") {
      delete paramsObj[key];
    } else {
      paramsObj[key] = value;
    }
  });
  
  setSearchParams(paramsObj, { replace });
};

/**
 * Update a single URL parameter
 * @param {Function} setSearchParams - React Router's setSearchParams function
 * @param {string} key - Parameter key
 * @param {string|null|undefined} value - Parameter value (null/undefined/empty string removes it)
 * @param {boolean} replace - Whether to replace the history entry (default: true)
 * @returns {void}
 */
export const updateURLParam = (setSearchParams, key, value, replace = true) => {
  updateURLParams(setSearchParams, { [key]: value }, replace);
};

/**
 * Get URL parameter value with default
 * @param {URLSearchParams} searchParams - React Router's searchParams
 * @param {string} key - Parameter key
 * @param {string} defaultValue - Default value if not found
 * @returns {string}
 */
export const getURLParam = (searchParams, key, defaultValue = "") => {
  return searchParams.get(key) || defaultValue;
};

