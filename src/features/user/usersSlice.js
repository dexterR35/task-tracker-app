// src/redux/features/users/usersSlice.js
import { createEntitySlice } from '../../redux/utils/createEntitySlice';
import { upsertUsers, getUserTasksPaged } from '../../dixie/db';
import { fetchIncrementalData } from '../../utils/firestoreSync';

const { slice, fetchEntity: fetchUsers } = createEntitySlice({
  entityName: 'users',
  fetchFn: fetchIncrementalData,
  dexieUpsertFn: upsertUsers,
  dexieGetFn: async () => {
    // Return all cached users
    return await import('../../dixie/db').then(({ db }) => db.users.toArray());
  },
});

export const usersSlice = slice;
export const fetchUsersThunk = fetchUsers;
export default usersSlice.reducer;
