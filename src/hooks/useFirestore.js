import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter as fsStartAfter,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { addNotification } from "../redux/slices/notificationSlice";

export const useFirestore = (collectionName) => {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async ({
      where: whereFilters,
      orderBy: orderByFilters,
      limit: limitValue,
      startAfter: startAfterDoc,
      append = false,
    } = {}) => {
      try {
        setLoading(true);
        setError(null);

        let colRef = collection(db, collectionName);
        let q = colRef;
console.log(`Fetching data from collection: ${collectionName}`);
console.log(`Where filters: ${JSON.stringify(whereFilters)}`);
console.log(`Order by filters: ${JSON.stringify(orderByFilters)}`);
console.log(`Limit: ${limitValue}`);
console.log(`q: ${q}`);
        if (whereFilters) {
          whereFilters.forEach(([field, op, value]) => {
            q = query(q, where(field, op, value));
          });
        }

        if (orderByFilters) {
          orderByFilters.forEach(([field, dir = "asc"]) => {
            q = query(q, orderBy(field, dir));
          });
        }

        if (limitValue) q = query(q, limit(limitValue));
        if (startAfterDoc) q = query(q, fsStartAfter(startAfterDoc));

        const snapshot = await getDocs(q);
     
        const results = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          
          createdAt:
            d.data().createdAt?.toDate?.() || new Date(d.data().createdAt),
          updatedAt:
            d.data().updatedAt?.toDate?.() || new Date(d.data().updatedAt),
        }));

        setData(append ? [...data, ...results] : results);
        return results;
      } catch (err) {
        const msg = err.message || "Failed to fetch data";
        setError(msg);
        dispatch(addNotification({ type: "error", message: msg }));
        throw err;
      } finally {
        console.log(`Data fetched from collection: ${results}`);
        setLoading(false);
      }
    },
    [collectionName, dispatch, data]
  );

  const addDocument = useCallback(
    async (docData) => {
      try {
        setLoading(true);
        const dataWithTimestamps = {
          ...docData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(
          collection(db, collectionName),
          dataWithTimestamps
        );
        dispatch(
          addNotification({
            type: "success",
            message: `${collectionName.slice(0, -1)} created successfully`,
          })
        );
        return { id: docRef.id, ...dataWithTimestamps };
      } catch (err) {
        const msg = err.message || "Failed to create document";
        setError(msg);
        dispatch(addNotification({ type: "error", message: msg }));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName, dispatch]
  );

  const updateDocument = useCallback(
    async (id, updates) => {
      try {
        setLoading(true);
        const updateData = { ...updates, updatedAt: serverTimestamp() };
        await updateDoc(doc(db, collectionName, id), updateData);
        dispatch(
          addNotification({
            type: "success",
            message: `${collectionName.slice(0, -1)} updated successfully`,
          })
        );
        return { id, ...updateData };
      } catch (err) {
        const msg = err.message || "Failed to update document";
        setError(msg);
        dispatch(addNotification({ type: "error", message: msg }));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName, dispatch]
  );

  const deleteDocument = useCallback(
    async (id) => {
      try {
        setLoading(true);
        await deleteDoc(doc(db, collectionName, id));
        dispatch(
          addNotification({
            type: "success",
            message: `${collectionName.slice(0, -1)} deleted successfully`,
          })
        );
        return id;
      } catch (err) {
        const msg = err.message || "Failed to delete document";
        setError(msg);
        dispatch(addNotification({ type: "error", message: msg }));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName, dispatch]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    data,
    loading,
    error,
    fetchData,
    addDocument,
    updateDocument,
    deleteDocument,
    clearError,
  };
};

// Convenience hooks
export const useTasks = () => useFirestore("tasks");
export const useUsers = () => useFirestore("users");

