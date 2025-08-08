import { collection, query, where, orderBy, limit, startAfter, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function fetchIncrementalData(entityName, userId, lastSync, pageSize, lastDoc) {
  let colRef = collection(db, entityName);
  const lastSyncTimestamp = Timestamp.fromDate(new Date(lastSync));
  let q;

  if (entityName === 'tasks') {
    if (!userId) throw new Error('userId required for tasks query');
    q = query(
      colRef,
      where('userId', '==', userId),
      where('updatedAt', '>', lastSyncTimestamp),
      orderBy('updatedAt'),
      limit(pageSize)
    );
  } else if (entityName === 'users') {
    q = query(
      colRef,
      where('updatedAt', '>', lastSyncTimestamp),
      orderBy('updatedAt'),
      limit(pageSize)
    );
  } else {
    throw new Error(`Unknown entity: ${entityName}`);
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return {
    data,
    lastDoc: lastVisible,
    hasMore: snapshot.docs.length === pageSize,
  };
}
