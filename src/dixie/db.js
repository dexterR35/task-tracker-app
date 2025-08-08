import Dexie from 'dexie';

export const db_dexie = new Dexie('MyAppdb_dexie');

db_dexie.version(1).stores({
  users: 'uid, role, email, name, userID',
  tasks: '++id, taskId, userId, createdAt, updatedAt, status, [userId+createdAt]',
  offlineQueue: '++id, operation, entity, entityId, data, timestamp',
});

export const normalizeUser = (user) => ({
  uid: user.uid,
  email: user.email || '',
  name: user.name || '',
  role: user.role?.toLowerCase() || 'guest',
});

export const normalizeTask = (task) => ({
  taskId: task.taskId || task.id || null,
  userId: task.userId,
  title: task.title || '',
  status: task.status || 'pending',
  createdAt: new Date(task.createdAt || Date.now()).toISOString(),
  updatedAt: new Date(task.updatedAt || Date.now()).toISOString(),
});

export async function upsertUsers(users) {
  const normalized = users.map(user => ({
    uid: user.uid || user.id,
    role: user.role?.toLowerCase() || 'guest',
    email: user.email || '',
    name: user.name || '',
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  }));
  await db_dexie.users.bulkPut(normalized);
}

export async function upsertTasks(tasks) {
  const normalized = tasks.map(task => ({
    taskId: task.taskId || task.id,
    userId: task.userId,
    title: task.title || '',
    status: task.status || 'pending',
    createdAt: task.createdAt || null,
    updatedAt: task.updatedAt || null,
  }));
  await db_dexie.tasks.bulkPut(normalized);
}
export async function getUserTasksPaged(userId, limit = 20, lastCreatedAt = null) {
  let collection = db_dexie.tasks
    .where('userId')
    .equals(userId)
    .orderBy('createdAt')
    .reverse();

  if (lastCreatedAt) {
    collection = collection.filter(task => task.createdAt < lastCreatedAt);
  }
  return collection.limit(limit).toArray();
}



export async function enqueueOfflineOp(operation, entity, entityId, data) {
  await db_dexie.offlineQueue.add({
    operation, // 'add', 'update', 'delete'
    entity,    // 'tasks' or 'users'
    entityId,  // Firestore document id or taskId
    data,      // data object for add/update
    timestamp: new Date().toISOString(),
  });
}

export async function getOfflineQueue() {
  return await db_dexie.offlineQueue.orderBy('timestamp').toArray();
}

export async function clearOfflineQueue() {
  await db_dexie.offlineQueue.clear();
}