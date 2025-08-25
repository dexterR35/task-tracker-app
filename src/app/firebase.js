import {
  initializeApp,
  getApps,
  getApp,
} from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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
  appInstance = initializeApp(firebaseConfig,"Task Tracker pwd by NetBet");
} else {
  appInstance = getApp();
}


export const auth = getAuth(appInstance);
export const db = getFirestore(appInstance);

// Enable logging in development
if (import.meta.env.MODE === "development") {
  logger.log("🔥 Firebase initialized ");
  logger.log("App name:", appInstance.name);
  logger.log("App instance:", appInstance);
}


(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    if (import.meta.env.MODE === "development") {
      logger.warn("Failed to set local persistence:", e?.message || e);
    }
  }
})();

export default appInstance;
