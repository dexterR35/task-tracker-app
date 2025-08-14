import { initializeApp } from "firebase/app";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize secondary app for user creation
const secondaryApp = initializeApp(firebaseConfig, "secondary");

// Initialize Firebase services
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
export const db = getFirestore(app);

// Analytics (optional)
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn('Analytics not available');
}

// Enable logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase initialized for Free Tier (Client-side only)');
  console.log('🔄 Secondary auth instance created for user creation');
  console.log('Firebase config:', { ...firebaseConfig, apiKey: '[HIDDEN]' });
}

export default app;
