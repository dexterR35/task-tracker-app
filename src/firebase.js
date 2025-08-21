import {
  initializeApp,
  getApps,
  getApp,
  getAuth,
  setPersistence,
  browserLocalPersistence,
  getFirestore,
} from "./hooks/useImports";

const firebaseConfig = {
  apiKey: "AIzaSyABUgnH7wwm9RVFaf7wuSHEzfhUDtiXCtI",
  authDomain: "task-tracker-app-eb03e.firebaseapp.com",
  projectId: "task-tracker-app-eb03e",
  storageBucket: "task-tracker-app-eb03e.firebasestorage.app",
  messagingSenderId: "976694748809",
  appId: "1:976694748809:web:4a1d4c0a72ad588e2fc858",
};

// Initialize (or reuse) primary app
let appInstance;
if (!getApps().length) {
  appInstance = initializeApp(firebaseConfig);
} else {
  appInstance = getApp();
}

// Initialize Firebase services (single app only)
export const auth = getAuth(appInstance);
export const db = getFirestore(appInstance);

// Enable logging in development
if (process.env.NODE_ENV === "development") {
  console.log("🔥 Firebase initialized (single app)");
  console.log("App name:", appInstance.name);
}

// --- Persistence: use local persistence (survives browser restarts) ---
(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to set local persistence:", e?.message || e);
    }
  }
})();

export default appInstance;
