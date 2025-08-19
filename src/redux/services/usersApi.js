import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { collection, getDocs, orderBy, query as fsQuery } from 'firebase/firestore';
import { db } from '../../firebase';

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
  })
});

export const { useGetUsersQuery } = usersApi;


