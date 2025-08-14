import { 
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser as deleteAuthUser,
  signOut,
  signInWithEmailAndPassword,
  setPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { 
  doc, 
  collection,
  setDoc,
  getDocs, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { auth, secondaryAuth, db } from '../firebase';

// Create user using secondary auth instance (preserves admin session)
export const createNewUser = async (userData, options = {}) => {
  console.log('👤 Creating user (secondary auth session retained unless cleared)');
  return createUserWithSecondaryAuth(userData, options);
};

// Create user with secondary auth instance - retain session unless options.clearSecondarySession === true
const createUserWithSecondaryAuth = async (userData, { clearSecondarySession = false } = {}) => {
  let createdAuthUser = null;
  try {
    const { email, password, name, role = 'user' } = userData;
    if (!email || !password || !name) throw new Error('Email, password, and name are required');
    const adminUser = auth.currentUser;
    if (!adminUser) throw new Error('You must be logged in to create users');
    const adminUID = adminUser.uid;

    await setPersistence(secondaryAuth, inMemoryPersistence);

    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUser = userCredential.user;
    createdAuthUser = newUser;
    await updateProfile(newUser, { displayName: name });

    const result = await runTransaction(db, async (transaction) => {
      const userDocRef = doc(collection(db, 'users'));
      const userDoc = {
        userUID: newUser.uid,
        email: newUser.email,
        name,
        role,
        createdAt: new Date().toISOString(),
        createdBy: adminUID,
        isActive: true
      };
      transaction.set(userDocRef, userDoc);
      return { userDoc: { ...userDoc, id: userDocRef.id }, authUID: newUser.uid };
    });

    if (clearSecondarySession) {
      try { await signOut(secondaryAuth); console.log('🔄 Secondary auth session cleared (option enabled)'); } catch { /* ignore */ }
    } else {
      console.log('➡️ Secondary auth session kept (new user remains on secondaryAuth).');
    }

    return {
      success: true,
      user: result.userDoc,
      message: `User ${email} created successfully. Secondary session: ${clearSecondarySession ? 'cleared' : 'kept'}.`,
      adminEmail: adminUser.email,
      newUserUID: result.authUID
    };
  } catch (error) {
    if (createdAuthUser) { try { await deleteAuthUser(createdAuthUser); } catch { /* ignore */ } }
    if (error.code === 'auth/email-already-in-use') throw new Error('Email address is already in use');
    if (error.code === 'auth/weak-password') throw new Error('Password is too weak');
    if (error.code === 'permission-denied') throw new Error('Database permission denied. Please check Firestore rules.');
    throw new Error(error.message);
  }
};

// Get all users using client-side Firestore query
export const getAllUsers = async (limitCount = 10, startAfterDoc = null) => {
  try {
    console.log('📊 Fetching users with client-side Firestore query');
    
    // Get current authenticated user to verify admin permission
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to view users');
    }

    // Build query for users collection
    let usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    // Add pagination if startAfterDoc is provided
    if (startAfterDoc) {
      usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        startAfter(startAfterDoc),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(usersQuery);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData,
        // Normalize createdAt if it's a Firestore timestamp
        createdAt: userData.createdAt?.toDate?.() 
          ? userData.createdAt.toDate().toISOString() 
          : userData.createdAt
      });
    });
    
    console.log(`✅ Retrieved ${users.length} users via client-side query`);
    return { users, hasMore: users.length === limitCount };
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your admin privileges.');
    } else {
      throw new Error('Failed to fetch users');
    }
  }
};

// Update user role (client-side)
// export const updateUserRole = async (uid, newRole) => {
//   try {
//     if (!['admin', 'user'].includes(newRole)) {
//       throw new Error('Invalid role');
//     }

//     // Get current authenticated user
//     const currentUser = auth.currentUser;
//     if (!currentUser) {
//       throw new Error('You must be logged in to update users');
//     }

//     // Find the user document by userUID field
//     const usersQuery = query(collection(db, 'users'), where('userUID', '==', uid));
//     const querySnapshot = await getDocs(usersQuery);
    
//     if (querySnapshot.empty) {
//       throw new Error('User not found');
//     }
    
//     const userDoc = querySnapshot.docs[0];
//     const userRef = doc(db, 'users', userDoc.id);
    
//     await updateDoc(userRef, { 
//       role: newRole,
//       updatedAt: new Date().toISOString(),
//       updatedBy: currentUser.uid
//     });

//     return { success: true };
//   } catch (error) {
//     console.error('Error updating user role:', error);
//     throw new Error('Failed to update user role');
//   }
// };

// Delete user (client-side)
export const deleteUser = async (uid) => {
  try {
    // Find the user document by userUID field
    const usersQuery = query(collection(db, 'users'), where('userUID', '==', uid));
    const querySnapshot = await getDocs(usersQuery);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }
    
    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);
    
    await deleteDoc(userRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};
