import { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc, Timestamp, limit, startAfter as fsStartAfter, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { setGlobalLoading } from '../redux/slices/uiSlice';
import { addNotification } from '../redux/slices/notificationSlice';

// Global in-memory cache for firestore queries
const __firestoreCache = new Map(); // key -> { data, lastDoc, timestamp }

export const getFirestoreCacheEntry = (key) => __firestoreCache.get(key);

// Utility to invalidate cache entries by predicate
export const invalidateFirestoreCache = (predicate) => {
  for (const key of __firestoreCache.keys()) {
    if (typeof predicate === 'function' ? predicate(key) : key === predicate) {
      __firestoreCache.delete(key);
    }
  }
};

export const useFirestore = (collectionName) => {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (queryOptions = {}) => {
    const {
      where: whereFilters,
      orderBy: orderByFilters,
      limit: limitValue,
      startAfter: startAfterDoc,
      append,
      cacheKey,
      force = false,
      useCache = true
    } = queryOptions;

    const effectiveCacheKey = cacheKey || collectionName;

    if (!force && useCache && __firestoreCache.has(effectiveCacheKey) && !append) {
      const cached = __firestoreCache.get(effectiveCacheKey);
      setData(cached.data);
      return { results: cached.data, lastDoc: cached.lastDoc, fromCache: true };
    }

    try {
      setLoading(true);
      setError(null);
      dispatch(setGlobalLoading(true));

      let firestoreQuery = collection(db, collectionName);

      if (whereFilters) {
        whereFilters.forEach(([field, operator, value]) => {
          firestoreQuery = query(firestoreQuery, where(field, operator, value));
        });
      }

      if (orderByFilters) {
        orderByFilters.forEach(([field, direction = 'asc']) => {
          firestoreQuery = query(firestoreQuery, orderBy(field, direction));
        });
      }

      if (limitValue) {
        firestoreQuery = query(firestoreQuery, limit(limitValue));
      }

      if (startAfterDoc) {
        firestoreQuery = query(firestoreQuery, fsStartAfter(startAfterDoc));
      }

      const querySnapshot = await getDocs(firestoreQuery);
      const results = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.() || new Date(docSnap.data().createdAt),
        updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(docSnap.data().updatedAt)
      }));

      const finalData = append ? [...data, ...results] : results;
      setData(finalData);

      const lastDocRef = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      __firestoreCache.set(effectiveCacheKey, { data: finalData, lastDoc: lastDocRef, timestamp: Date.now() });

      return { results: finalData, lastDoc: lastDocRef, fromCache: false };
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch data';
      setError(errorMessage);
      dispatch(addNotification({
        type: 'error',
        message: errorMessage
      }));
      throw err;
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  }, [collectionName, dispatch, data]);

  const addDocument = useCallback(async (data) => {
    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      const docData = {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, collectionName), docData);
      
      dispatch(addNotification({
        type: 'success',
        message: `${collectionName.slice(0, -1)} created successfully`
      }));

      return { id: docRef.id, ...docData };
    } catch (err) {
      const errorMessage = err.message || 'Failed to create document';
      setError(errorMessage);
      dispatch(addNotification({
        type: 'error',
        message: errorMessage
      }));
      throw err;
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  }, [collectionName, dispatch]);

  const updateDocument = useCallback(async (id, data) => {
    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      const updateData = {
        ...data,
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, collectionName, id), updateData);
      
      dispatch(addNotification({
        type: 'success',
        message: `${collectionName.slice(0, -1)} updated successfully`
      }));

      return { id, ...updateData };
    } catch (err) {
      const errorMessage = err.message || 'Failed to update document';
      setError(errorMessage);
      dispatch(addNotification({
        type: 'error',
        message: errorMessage
      }));
      throw err;
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  }, [collectionName, dispatch]);

  const deleteDocument = useCallback(async (id) => {
    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      await deleteDoc(doc(db, collectionName, id));
      
      dispatch(addNotification({
        type: 'success',
        message: `${collectionName.slice(0, -1)} deleted successfully`
      }));

      return id;
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete document';
      setError(errorMessage);
      dispatch(addNotification({
        type: 'error',
        message: errorMessage
      }));
      throw err;
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  }, [collectionName, dispatch]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    fetchData,
    addDocument,
    updateDocument,
    deleteDocument,
    clearError
  };
};

export const useTasks = () => {
  return useFirestore('tasks');
};

export const useUsers = () => {
  return useFirestore('users');
};

export const useMonthlyTasks = (monthId) => {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pageStateRef = useState({ lastDoc: null })[0];

  // Helper: build base cache key prefix for this month
  const monthCachePrefix = useMemo(() => `monthly:${monthId}:`, [monthId]);
  const makeCacheKey = (cacheKey = 'default') => `${monthCachePrefix}${cacheKey}`;

  const invalidateMonthCache = useCallback(() => {
    // Remove every cache entry for this month
    for (const key of __firestoreCache.keys()) {
      if (key.startsWith(monthCachePrefix)) {
        __firestoreCache.delete(key);
      }
    }
  }, [monthCachePrefix]);

  const ensureMonthDoc = useCallback(async () => {
    try { await setDoc(doc(db, 'tasks', monthId), { monthId }, { merge: true }); } catch { /* ignore */ }
  }, [monthId]);

  const fetchData = useCallback(async ({
    where: whereFilters = [],
    limit: limitValue = 10,
    startAfter: startAfterDoc = null,
    append = false,
    orderBy: orderByFilters = [['createdAt','desc']],
    cacheKey,
    force = false,
    useCache = true
  } = {}) => {
    const effectiveCacheKey = makeCacheKey(cacheKey || JSON.stringify({ where: whereFilters, orderBy: orderByFilters }));

    if (!force && useCache && __firestoreCache.has(effectiveCacheKey) && !append) {
      const cached = __firestoreCache.get(effectiveCacheKey);
      setData(cached.data);
      pageStateRef.lastDoc = cached.lastDoc;
      return { results: cached.data, lastDoc: cached.lastDoc, fromCache: true };
    }

    try {
      setLoading(true);
      setError(null);
      dispatch(setGlobalLoading(true));

      const colRef = collection(db, 'tasks', monthId, 'monthTasks');
      let qRef = colRef;

      whereFilters.forEach(([f, op, v]) => { qRef = query(qRef, where(f, op, v)); });
      orderByFilters.forEach(([f, dir]) => { qRef = query(qRef, orderBy(f, dir)); });
      if (startAfterDoc) qRef = query(qRef, fsStartAfter(startAfterDoc));
      if (limitValue) qRef = query(qRef, limit(limitValue));

      const snap = await getDocs(qRef);
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const finalData = append ? [...data, ...results] : results;
      setData(finalData);
      const lastDocRef = snap.docs[snap.docs.length - 1] || null;
      pageStateRef.lastDoc = lastDocRef;

      __firestoreCache.set(effectiveCacheKey, { data: finalData, lastDoc: lastDocRef, timestamp: Date.now() });

      return { results: finalData, lastDoc: lastDocRef, fromCache: false };
    } catch (err) {
      const msg = err.message || 'Failed to fetch monthly tasks';
      setError(msg);
      dispatch(addNotification({ type: 'error', message: msg }));
      throw err;
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  }, [monthId, data, dispatch, pageStateRef, makeCacheKey]);

  const addDocument = useCallback(async (taskData) => {
    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));
      await ensureMonthDoc();
      const colRef = collection(db, 'tasks', monthId, 'monthTasks');
      const sanitizedTimeSpentOnAI = (
        typeof taskData.timeSpentOnAI === 'number' && !isNaN(taskData.timeSpentOnAI)
      ) ? taskData.timeSpentOnAI : 0;
      const sanitizedAiModel = taskData.aiUsed ? (taskData.aiModel || 'Unknown') : 'Unknown';
      const docData = { ...taskData, timeSpentOnAI: sanitizedTimeSpentOnAI, aiModel: sanitizedAiModel, monthId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
      const docRef = await addDoc(colRef, docData);
      invalidateMonthCache(); // Invalidate cache so next fetch reflects new task
      dispatch(addNotification({ type: 'success', message: 'task created successfully' }));
      return { id: docRef.id, ...docData };
    } catch (err) {
      const msg = err.message || 'Failed to create task';
      setError(msg);
      dispatch(addNotification({ type: 'error', message: msg }));
      throw err;
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  }, [monthId, ensureMonthDoc, dispatch, invalidateMonthCache]);

  const updateDocument = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));
      const ref = doc(db, 'tasks', monthId, 'monthTasks', id);
      const sanitizedTimeSpentOnAI = (
        typeof updates.timeSpentOnAI === 'number' && !isNaN(updates.timeSpentOnAI)
      ) ? updates.timeSpentOnAI : 0;
      const sanitizedAiModel = updates.aiUsed ? (updates.aiModel || 'Unknown') : 'Unknown';
      const updateData = { ...updates, timeSpentOnAI: sanitizedTimeSpentOnAI, aiModel: sanitizedAiModel, updatedAt: serverTimestamp() };
      await updateDoc(ref, updateData);
      invalidateMonthCache(); // ensure stale cache removed
      dispatch(addNotification({ type: 'success', message: 'task updated successfully' }));
      return { id, ...updateData };
    } catch (err) {
      const msg = err.message || 'Failed to update task';
      setError(msg);
      dispatch(addNotification({ type: 'error', message: msg }));
      throw err;
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  }, [monthId, dispatch, invalidateMonthCache]);

  const deleteDocument = useCallback(async (id) => {
    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));
      await deleteDoc(doc(db, 'tasks', monthId, 'monthTasks', id));
      invalidateMonthCache();
      dispatch(addNotification({ type: 'success', message: 'task deleted successfully' }));
      return id;
    } catch (err) {
      const msg = err.message || 'Failed to delete task';
      setError(msg);
      dispatch(addNotification({ type: 'error', message: msg }));
      throw err;
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  }, [monthId, dispatch, invalidateMonthCache]);

  const clearError = useCallback(() => setError(null), []);

  return { data, loading, error, fetchData, addDocument, updateDocument, deleteDocument, clearError, lastDoc: pageStateRef.lastDoc };
};
