import { 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser as deleteAuthUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  where,
  writeBatch,
  limit,
  startAfter
} from 'firebase/firestore';
import { auth, db } from '../firebase';

// Create a new user using Firestore Batched Writes for atomicity
export const createNewUser = async (userData) => {
  let createdAuthUser = null;
  
  try {
    const { email, password, name, role = 'user' } = userData;
    
    // Validate input
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    // Get current authenticated user (the admin creating this user)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to create users');
    }

    console.log('🚀 Starting batched user creation for:', email);
    console.log('👤 Creating user as admin:', currentUser.uid);

    // STEP 1: Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    createdAuthUser = user; // Store for potential rollback

    console.log('✅ User created in Firebase Auth:', user.uid);

    // STEP 2: Update user profile
    await updateProfile(user, {
      displayName: name
    });

    console.log('✅ User profile updated');

    // STEP 3: Create Firestore batch for atomic writes
    const batch = writeBatch(db);

    // Create user document with auto-generated ID
    const userDocRef = doc(collection(db, 'users'));
    const userDoc = {
      userUID: user.uid,
      email: user.email,
      name: name,
      role: role,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.uid, // Dynamic admin UID
      isActive: true
    };

    // Add user document to batch
    batch.set(userDocRef, userDoc);
    console.log('📝 Added user document to batch:', userDocRef.id);

    // Create initial task collection document for the user
    const taskDocRef = doc(collection(db, 'tasks'));
    const initialTaskDoc = {
      userId: user.uid, // Reference to the user
      title: 'Welcome Task',
      description: 'Welcome to the task tracker! This is your first task.',
      status: 'pending',
      priority: 'low',
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
      assignedTo: user.uid,
      isActive: true
    };

    // Add task document to batch
    batch.set(taskDocRef, initialTaskDoc);
    console.log('📝 Added welcome task to batch:', taskDocRef.id);

    // STEP 4: Commit the batch (atomic operation)
    console.log('🔄 Committing batch write...');
    await batch.commit();

    console.log('✅ Batch write completed successfully!');
    console.log('✅ User document created in Firestore');
    console.log('✅ Welcome task created for user');

    return { 
      success: true, 
      user: { ...userDoc, id: userDocRef.id },
      welcomeTask: { ...initialTaskDoc, id: taskDocRef.id }
    };

  } catch (error) {
    console.error('❌ Error during batched user creation:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    // ROLLBACK: If we created Auth user but batch failed, delete the Auth user
    if (createdAuthUser) {
      try {
        console.log('🔄 Rolling back: Deleting Auth user due to batch failure...');
        await deleteAuthUser(createdAuthUser);
        console.log('✅ Auth user successfully deleted (rollback complete)');
      } catch (rollbackError) {
        console.error('❌ CRITICAL: Failed to rollback Auth user:', rollbackError);
        throw new Error(`User created in Auth but batch failed. Please contact admin. Auth UID: ${createdAuthUser.uid}`);
      }
    }

    // Provide user-friendly error messages
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

// Get all users with pagination for better performance
export const getAllUsers = async (limit = 10, startAfter = null) => {
  try {
    let usersQuery = query(
      collection(db, 'users'), 
      orderBy('createdAt', 'desc'),
      limit(limit) // Limit results to save reads
    );

    // Add pagination if startAfter is provided
    if (startAfter) {
      usersQuery = query(usersQuery, startAfter(startAfter));
    }

    const querySnapshot = await getDocs(usersQuery);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`📊 Retrieved ${users.length} users (saved reads with pagination)`);
    return { users, hasMore: querySnapshot.docs.length === limit };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

// Update user role
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
      updatedBy: currentUser.uid // Dynamic admin UID
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }
};

// Delete user
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
