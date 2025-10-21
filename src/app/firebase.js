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
 * Validates and retrieves Firebase configuration from environment variables
 * @returns {FirebaseConfig} Validated Firebase configuration
 * @throws {Error} If required configuration is missing
 */
const getFirebaseConfig = () => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    const errorMessage = `Missing required Firebase environment variables: ${missingFields.join(', ')}`;
    logger.error(errorMessage);
    
    // Provide helpful instructions for setting up environment variables
    console.error(`
🚨 FIREBASE CONFIGURATION ERROR 🚨

Missing environment variables: ${missingFields.join(', ')}

Please check your .env file and ensure all Firebase variables are set correctly.

Current .env file should contain:
VITE_FIREBASE_API_KEY=AIzaSyABUgnH7wwm9RVFaf7wuSHEzfhUDtiXCtI
VITE_FIREBASE_AUTH_DOMAIN=task-tracker-app-eb03e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=task-tracker-app-eb03e
VITE_FIREBASE_STORAGE_BUCKET=task-tracker-app-eb03e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=976694748809
VITE_FIREBASE_APP_ID=1:976694748809:web:4a1d4c0a72ad588e2fc858

If the .env file exists, restart your development server:
npm run dev
    `);
    
    throw new Error(errorMessage);
  }

  return config;
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
    await setupAuthPersistence();
  } catch (error) {
    // Log error but don't crash the app
    logger.error("Auth persistence initialization failed", error);
    
    if (import.meta.env.MODE === "development") {
      console.warn("Firebase auth persistence is not available. Some features may not work correctly.");
    }
  }
};

// Initialize auth persistence asynchronously
initializeAuthPersistence();

export default appInstance;
