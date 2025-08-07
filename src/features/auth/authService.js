import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

export const loginWithEmailPassword = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    throw new Error('User not found in database');
  }

  const userData = userDoc.data();
  if (!userData.role) {
    throw new Error('User role not defined');
  }

  return {
    user: {
      uid: user.uid,
      email: user.email,
      name: userData.name || '',
      ...userData,
    },
    role: userData.role
  };
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) {
        resolve(null);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          resolve(null);
          return;
        }

        const userData = userDoc.data();
        resolve({
          user: {
            uid: user.uid,
            email: user.email,
            name: userData.name || '',
            ...userData,
          },
          role: userData.role || 'user',
        });
      } catch (error) {
        reject(error);
      }
    }, reject);
  });
};
