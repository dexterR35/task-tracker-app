// src/utils/errorSlicesRegistry.js
const errorSlicesRegistry = new Map();

export function registerErrorSlice(sliceName, getError, clearError) {
  if (errorSlicesRegistry.has(sliceName)) {
    console.warn(`[errorSlicesRegistry] Slice '${sliceName}' already registered.`);
  }
  errorSlicesRegistry.set(sliceName, { getError, clearError });
}

export function getRegisteredErrorSlices() {
  return Array.from(errorSlicesRegistry.entries()).map(([sliceName, handlers]) => ({
    sliceName,
    ...handlers,
  }));
}
