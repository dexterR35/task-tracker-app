import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
} from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator 
} from "firebase/firestore";
import { logger } from "../shared/utils/logger";

// Use environment variables for sensitive config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyABUgnH7wwm9RVFaf7wuSHEzfhUDtiXCtI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "task-tracker-app-eb03e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "task-tracker-app-eb03e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "task-tracker-app-eb03e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "976694748809",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:976694748809:web:4a1d4c0a72ad588e2fc858",
};

// Validate required config
const requiredFields = ['apiKey', 'authDomain', 'projectId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
if (missingFields.length > 0) {
  throw new Error(`Missing required Firebase config: ${missingFields.join(', ')}`);
}

// Initialize Firebase with error handling
let appInstance;
try {
  if (!getApps().length) {
    appInstance = initializeApp(firebaseConfig);
  } else {
    appInstance = getApp();
  }
} catch (error) {
  logger.error("Failed to initialize Firebase:", error);
  throw error;
}

export const auth = getAuth(appInstance);
export const db = getFirestore(appInstance);

// Connect to emulators in development
if (import.meta.env.MODE === "development" && import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    logger.log("🔥 Connected to Firebase emulators");
  } catch (error) {
    logger.warn("Failed to connect to emulators:", error.message);
  }
}

// Enable logging in development
if (import.meta.env.MODE === "development") {
  logger.log("🔥 Firebase initialized");
  logger.log("App name:", appInstance.name);
  // logger.log("Project ID:", firebaseConfig.projectId);
}

// Set up Firebase auth persistence with retry logic
const setupPersistence = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await setPersistence(auth, browserSessionPersistence);
      logger.log("Firebase auth persistence set to session (incognito compatible)");
      return;
    } catch (error) {
      if (i === retries - 1) {
        logger.error("Failed to set persistence after retries:", error);
        throw error;
      }
      logger.warn(`Persistence setup attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Initialize persistence
setupPersistence().catch(error => {
  if (import.meta.env.MODE === "development") {
    logger.warn("Persistence setup failed:", error.message);
  }
});

// Auth state listener removed - lastLogin updates will be implemented later

export default appInstance;
