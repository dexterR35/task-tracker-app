import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { getOfflineQueue, clearOfflineQueue } from './db_dexie';

export async function flushOfflineQueue() {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  const batch = writeBatch(db);
  try {
    queue.forEach(({ operation, entity, entityId, data }) => {
      const ref = doc(db, entity, entityId);
      if (operation === 'add' || operation === 'update') {
        batch.set(ref, data, { merge: true });
      } else if (operation === 'delete') {
        batch.delete(ref);
      }
    });
    await batch.commit();
    await clearOfflineQueue();
    console.log('Offline queue flushed successfully');
  } catch (error) {
    console.error('Failed to flush offline queue:', error);
  }
}
