// src/redux/features/users/usersSlice.js
import { createEntitySlice } from '../../redux/utils/createEntitySlice';
import { fetchIncrementalData } from '../../utils/firestoreSync';

const { slice, fetchEntity: fetchUsers } = createEntitySlice({
  entityName: 'users',
  fetchFn: fetchIncrementalData,
});

export const usersSlice = slice;
export const fetchUsersThunk = fetchUsers;
export default usersSlice.reducer;
