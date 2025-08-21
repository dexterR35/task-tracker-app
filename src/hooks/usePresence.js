import { doc, setDoc, serverTimestamp, useEffect } from "./useImports";
import { db } from "../firebase";

// 10 minutes heartbeat
const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000;

// Accepts either a user object ({ uid } or { userUID }) or a string userId
export function usePresence(userOrId) {
  useEffect(() => {
    const uid =
      typeof userOrId === "string"
        ? userOrId
        : userOrId?.uid || userOrId?.userUID;
    if (!uid) return;

    let intervalId;
    const userDocRef = doc(db, "users", uid);

    const beat = async () => {
      try {
        await setDoc(
          userDocRef,
          {
            userUID: uid,
            heartbeatAt: serverTimestamp(),
            lastActive: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (_) {}
    };

    // Initial heartbeat
    beat();

    // Interval heartbeat (10 minutes)
    intervalId = setInterval(beat, HEARTBEAT_INTERVAL_MS);

    // Activity-triggered heartbeats
    const onVisibility = () => {
      if (document.visibilityState === "visible") beat();
    };
    const onFocus = () => beat();
    const onOnline = () => beat();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [
    userOrId &&
      (typeof userOrId === "string"
        ? userOrId
        : userOrId.uid || userOrId.userUID),
  ]);
}

export default usePresence;
