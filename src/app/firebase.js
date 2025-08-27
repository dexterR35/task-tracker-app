import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onIdTokenChanged,
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
  appInstance = initializeApp(firebaseConfig);
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

// Token refresh management
let tokenRefreshTimer = null;
let tokenRefreshInterval = null;

// Setup automatic token refresh
const setupTokenRefresh = () => {
  const user = auth.currentUser;
  if (!user) return;

  // Clear existing timers
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
  }
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }

  // Get current token and check expiration
  user.getIdTokenResult().then((tokenResult) => {
    const expiresAt = tokenResult.expirationTime ? new Date(tokenResult.expirationTime).getTime() : 0;
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    // If token expires in less than 5 minutes, refresh it immediately
    if (timeUntilExpiry < 5 * 60 * 1000) {
      logger.log("Token expires soon, refreshing immediately");
      user.getIdToken(true).catch(err => {
        logger.error("Failed to refresh token:", err);
      });
    } else {
      // Set timer to refresh token 5 minutes before expiry (production timing)
      const refreshTime = timeUntilExpiry - (5 * 60 * 1000);
      tokenRefreshTimer = setTimeout(() => {
        logger.log("Refreshing token before expiry");
        user.getIdToken(true).catch(err => {
          logger.error("Failed to refresh token:", err);
        });
      }, refreshTime);
    }
  }).catch(err => {
    logger.error("Failed to get token result:", err);
  });

  // Set up periodic refresh every 50 minutes (tokens expire after 1 hour normally)
  tokenRefreshInterval = setInterval(() => {
    if (auth.currentUser) {
      logger.log("Periodic token refresh");
      auth.currentUser.getIdToken(true).catch(err => {
        logger.error("Failed to refresh token:", err);
      });
    }
  }, 50 * 60 * 1000); // 50 minutes (production timing)
};

// Cleanup token refresh timers
export const cleanupTokenRefresh = () => {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
    tokenRefreshTimer = null;
  }
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
};

// Listen for auth state changes to setup token refresh
onIdTokenChanged(auth, (user) => {
  if (user) {
    setupTokenRefresh();
  } else {
    cleanupTokenRefresh();
  }
});

(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    if (import.meta.env.MODE === "development") {
      logger.warn("Failed to set local persistence:", e?.message || e);
    } else {
      console.error("🔥 Persistence error:", e);
    }
  }
})();

export default appInstance;
