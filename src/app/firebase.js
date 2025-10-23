import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { logger } from "@/utils/logger";

/**
 * Firebase configuration object
 * @typedef {Object} FirebaseConfig
 * @property {string} apiKey - Firebase API key
 * @property {string} authDomain - Firebase auth domain
 * @property {string} projectId - Firebase project ID
 * @property {string} storageBucket - Firebase storage bucket
 * @property {string} messagingSenderId - Firebase messaging sender ID
 * @property {string} appId - Firebase app ID
 */

/**
 * Firebase configuration with automatic environment detection
 * @returns {FirebaseConfig} Firebase configuration object
 */
const getFirebaseConfig = () => {
  const isDevelopment = import.meta.env.MODE === "development";

  // Use development Firebase project in development mode
  if (isDevelopment) {
    logger.log("🔧 Using Development Firebase Project");
    return {
      apiKey: "AIzaSyBKCRN8f7dOaNrzjhOGIUpB__jQs-PX6MU",
      authDomain: "track-app-stage.firebaseapp.com",
      projectId: "track-app-stage",
      storageBucket: "track-app-stage.firebasestorage.app",
      messagingSenderId: "236939384499",
      appId: "1:236939384499:web:5767e2dcbcebd67ed882c6",
    };
  }

  // Use production Firebase project in production (Vercel)
  logger.log("🚀 Using Production Firebase Project");
  return {
    apiKey: "AIzaSyABUgnH7wwm9RVFaf7wuSHEzfhUDtiXCtI",
    authDomain: "task-tracker-app-eb03e.firebaseapp.com",
    projectId: "task-tracker-app-eb03e",
    storageBucket: "task-tracker-app-eb03e.firebasestorage.app",
    messagingSenderId: "976694748809",
    appId: "1:976694748809:web:4a1d4c0a72ad588e2fc858",
  };
};

const firebaseConfig = getFirebaseConfig();

/**
 * Initializes Firebase app instance with proper error handling
 * @returns {FirebaseApp} Initialized Firebase app instance
 * @throws {Error} If Firebase initialization fails
 */
const initializeFirebaseApp = () => {
  try {
    if (!getApps().length) {
      logger.log("Initializing new Firebase app instance");
      return initializeApp(firebaseConfig);
    } else {
      logger.log("Using existing Firebase app instance");
      return getApp();
    }
  } catch (error) {
    const errorMessage = "Failed to initialize Firebase app";
    logger.error(errorMessage, error);
    throw new Error(`${errorMessage}: ${error.message}`);
  }
};

// Initialize Firebase app
const appInstance = initializeFirebaseApp();

// Initialize Firebase services
export const auth = getAuth(appInstance);
export const db = getFirestore(appInstance);

// Enable Firebase debug logging in development
if (import.meta.env.MODE === "development") {
  logger.log("Firebase debug logging enabled for development");
}

/**
 * Sets up Firebase auth persistence with exponential backoff retry logic
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<void>} Promise that resolves when persistence is set
 * @throws {Error} If persistence setup fails after all retries
 */
const setupAuthPersistence = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await setPersistence(auth, browserLocalPersistence);
      logger.log("Firebase auth persistence configured successfully");
      return;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        const errorMessage = `Failed to set auth persistence after ${maxRetries} attempts`;
        logger.error(errorMessage, error);
        throw new Error(`${errorMessage}: ${error.message}`);
      }

      const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
      logger.warn(`Persistence setup attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Initializes Firebase auth persistence
 * Handles errors gracefully to prevent app crashes
 */
const initializeAuthPersistence = async () => {
  try {
    // Only set up persistence in browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      await setupAuthPersistence();
    } else {
      logger.log("Skipping auth persistence setup - not in browser environment");
    }
  } catch (error) {
    // Log error but don't crash the app
    logger.error("Auth persistence initialization failed", error);

    if (import.meta.env.MODE === "development") {
      console.warn("Firebase auth persistence is not available. Some features may not work correctly.");
    }
  }
};

// Initialize auth persistence asynchronously only in browser
if (typeof window !== 'undefined') {
  initializeAuthPersistence();
}

export default appInstance;
