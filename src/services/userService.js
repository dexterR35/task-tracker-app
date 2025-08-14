import { 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser as deleteAuthUser,
  signOut,
  signInWithEmailAndPassword
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
export const createNewUser = async (userData) => {
  console.log('� Creating user with secondary auth (admin session preserved)');
  return createUserWithSecondaryAuth(userData);
};

// Create user with secondary auth instance - admin session preserved
const createUserWithSecondaryAuth = async (userData) => {
  let createdAuthUser = null;
  
  try {
    const { email, password, name, role = 'user' } = userData;
    
    // Validate input
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    // Get the current admin user (on primary auth)
    const adminUser = auth.currentUser;
    if (!adminUser) {
      throw new Error('You must be logged in to create users');
    }

    const adminUID = adminUser.uid;
    console.log('🚀 Starting user creation with secondary auth for:', email);
    console.log('👤 Admin session preserved:', adminUser.email);

    // STEP 1: Create user in Firebase Auth using secondary auth instance
    // This won't affect the admin's session on the primary auth instance
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUser = userCredential.user;
    createdAuthUser = newUser;

    console.log('✅ User created in Firebase Auth (secondary):', newUser.uid);

    // STEP 2: Update user profile on secondary auth
    await updateProfile(newUser, {
      displayName: name
    });

    console.log('✅ User profile updated');

    // STEP 3: Use transaction to create user document atomically
    const result = await runTransaction(db, async (transaction) => {
      const userDocRef = doc(collection(db, 'users'));
      const userDoc = {
        userUID: newUser.uid,
        email: newUser.email,
        name: name,
        role: role,
        createdAt: new Date().toISOString(),
        createdBy: adminUID,
        isActive: true
      };

      // Create user document
      transaction.set(userDocRef, userDoc);
      
      console.log('✅ User document prepared in transaction');
      
      return { 
        userDoc: { ...userDoc, id: userDocRef.id },
        authUID: newUser.uid
      };
    });

    console.log('✅ Transaction completed successfully');

    // STEP 4: Sign out the user from secondary auth (cleanup)
    await signOut(secondaryAuth);
    console.log('🔄 Signed out user from secondary auth');

    // Admin session remains intact on primary auth!
    console.log('✅ Admin session preserved on primary auth');

    return { 
      success: true, 
      user: result.userDoc,
      message: `User ${email} created successfully! Admin session preserved.`,
      requiresAdminReauth: false,
      adminEmail: adminUser.email,
      newUserUID: result.authUID
    };

  } catch (error) {
    console.error('❌ Error during secondary auth user creation:', error);

    // ROLLBACK: Delete Auth user if Firestore transaction failed
    if (createdAuthUser) {
      try {
        console.log('🔄 Rolling back: Deleting Auth user...');
        await deleteAuthUser(createdAuthUser);
        console.log('✅ Auth user successfully deleted (rollback complete)');
      } catch (rollbackError) {
        console.error('❌ CRITICAL: Failed to rollback Auth user:', rollbackError);
        throw new Error(`User created in Auth but failed to save to database. Contact admin. Auth UID: ${createdAuthUser.uid}`);
      }
    }

    // User-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email address is already in use');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak');
    } else if (error.code === 'permission-denied') {
      throw new Error('Database permission denied. Please check Firestore rules.');
    } else {
      throw new Error(error.message);
    }
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
export const updateUserRole = async (uid, newRole) => {
  try {
    if (!['admin', 'user'].includes(newRole)) {
      throw new Error('Invalid role');
    }

    // Get current authenticated user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to update users');
    }

    // Find the user document by userUID field
    const usersQuery = query(collection(db, 'users'), where('userUID', '==', uid));
    const querySnapshot = await getDocs(usersQuery);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }
    
    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);
    
    await updateDoc(userRef, { 
      role: newRole,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.uid
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }
};

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

// Send password reset email
export const sendUserPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset:', error);
    throw new Error('Failed to send password reset email');
  }
};
