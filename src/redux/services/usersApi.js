import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { collection, getDocs, orderBy, query as fsQuery, doc, setDoc, getDocFromServer, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      async queryFn() {
        try {
          const snap = await getDocs(fsQuery(collection(db, 'users'), orderBy('createdAt', 'desc')));
          const users = snap.docs.map(d => {
            const raw = d.data();
            const createdAt = raw.createdAt?.toDate ? raw.createdAt.toDate().getTime() : (typeof raw.createdAt === 'number' ? raw.createdAt : (raw.createdAt ? new Date(raw.createdAt).getTime() : null));
            const updatedAt = raw.updatedAt?.toDate ? raw.updatedAt.toDate().getTime() : (typeof raw.updatedAt === 'number' ? raw.updatedAt : (raw.updatedAt ? new Date(raw.updatedAt).getTime() : null));
            return { id: d.id, ...raw, createdAt, updatedAt };
          });
          return { data: users };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to load users' } };
        }
      },
      providesTags: ['Users'],
    }),
    createUser: builder.mutation({
      async queryFn({ email, password, name, role = 'user' }) {
        try {
          // Use a secondary app to avoid switching the current admin session
          const primary = getApp();
          const cfg = primary.options;
          let secondaryApp;
          try {
            secondaryApp = getApps().find(a => a.name === 'secondary') || initializeApp(cfg, 'secondary');
          } catch (_) {
            secondaryApp = initializeApp(cfg, 'secondary');
          }
          const secondaryAuth = getAuth(secondaryApp);
          const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
          const uid = cred.user.uid;
          const userDocRef = doc(collection(db, 'users'), uid);
          const createdBy = auth.currentUser?.uid || null;
          const safeRole = role === 'admin' ? 'admin' : 'user';
          await setDoc(
            userDocRef,
            { userUID: uid, email, name: name || '', role: safeRole, isActive: true, createdBy, createdAt: serverTimestamp() },
            { merge: true }
          );
          // Read back the doc to normalize server timestamps
          const fresh = await getDocFromServer(userDocRef);
          const raw = fresh.data() || {};
          const createdAt = raw.createdAt?.toDate ? raw.createdAt.toDate().getTime() : null;
          // Sign out the secondary auth to clean up, preserving the admin session on primary auth
          try { await signOut(secondaryAuth); } catch (_) {}
          return { data: { id: uid, ...raw, createdAt } };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to create user' } };
        }
      },
      invalidatesTags: ['Users'],
    }),
  })
});

export const { useGetUsersQuery, useCreateUserMutation } = usersApi;


