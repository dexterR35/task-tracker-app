import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABUgnH7wwm9RVFaf7wuSHEzfhUDtiXCtI",
  authDomain: "task-tracker-app-eb03e.firebaseapp.com",
  projectId: "task-tracker-app-eb03e",
  storageBucket: "task-tracker-app-eb03e.firebasestorage.app",
  messagingSenderId: "976694748809",
  appId: "1:976694748809:web:4a1d4c0a72ad588e2fc858",
  measurementId: "G-CVVRHVRMNB"
};

// Initialize (or reuse) primary app
let appInstance;
if (!getApps().length) {
  appInstance = initializeApp(firebaseConfig);
} else {
  appInstance = getApp();
}

// Initialize (or reuse) secondary app for user creation
let secondaryAppInstance;
try {
  secondaryAppInstance = getApp('secondary');
} catch {
  secondaryAppInstance = initializeApp(firebaseConfig, 'secondary');
}

// Initialize Firebase services
export const auth = getAuth(appInstance);
export const secondaryAuth = getAuth(secondaryAppInstance);
export const db = getFirestore(appInstance);

// Analytics (optional, only in browser and only if available)
let analytics = null;
if (typeof window !== 'undefined') {
  try { analytics = getAnalytics(appInstance); } catch { /* ignore */ }
}

// Helper (optional) to verify both auth instances
export const verifyAuthInstances = () => ({ primaryReady: !!auth, secondaryReady: !!secondaryAuth });

// Enable logging in development (hide sensitive keys)
if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase initialized');
  console.log('Primary app name:', appInstance.name);
  console.log('Secondary app name:', secondaryAppInstance.name);
}

export default appInstance;
