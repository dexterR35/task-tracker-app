import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  onIdTokenChanged,
} from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { logger } from "../shared/utils/logger";

const firebaseConfig = {
  apiKey: "AIzaSyABUgnH7wwm9RVFaf7wuSHEzfhUDtiXCtI",
  authDomain: "task-tracker-app-eb03e.firebaseapp.com",
  projectId: "task-tracker-app-eb03e",
  storageBucket: "task-tracker-app-eb03e.firebasestorage.app",
  messagingSenderId: "976694748809",
  appId: "1:976694748809:web:4a1d4c0a72ad588e2fc858",
};

let appInstance;
if (!getApps().length) {
  appInstance = initializeApp(firebaseConfig);
} else {
  appInstance = getApp();
}

export const auth = getAuth(appInstance);
export const db = getFirestore(appInstance);

// Enable logging in development
if (import.meta.env.MODE === "development") {
  logger.log("🔥 Firebase initialized");
  logger.log("App name:", appInstance.name);
}

// Set up Firebase auth persistence for incognito mode compatibility
(async () => {
  try {
    // Use session persistence - requires authentication every time in incognito
    await setPersistence(auth, browserSessionPersistence);
    logger.log("Firebase auth persistence set to session (incognito compatible)");
  } catch (e) {
    if (import.meta.env.MODE === "development") {
      logger.warn("Failed to set session persistence:", e?.message || e);
    } else {
      console.error("🔥 Persistence error:", e);
    }
  }
})();

// Simple auth state listener - no session management
onIdTokenChanged(auth, (user) => {
  if (user) {
    logger.log("User authenticated");
    
    // Update lastLogin timestamp in Firestore
    const userRef = doc(db, "users", user.uid);
    updateDoc(userRef, {
      lastLogin: serverTimestamp(),
      lastActive: serverTimestamp(),
    }).catch(err => {
      logger.error("Failed to update lastLogin timestamp:", err);
    });
  } else {
    logger.log("User signed out");
  }
});

export default appInstance;
