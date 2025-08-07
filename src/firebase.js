// Mock Firebase functionality for testing
const mockDb = {
  collection: (path) => ({
    doc: (id) => ({
      get: () => Promise.resolve({
        exists: () => true,
        data: () => ({ role: 'admin' })
      }),
      set: (data) => Promise.resolve(data)
    }),
    add: (data) => Promise.resolve({ id: 'mock-doc-' + Date.now() }),
    where: () => ({
      get: () => Promise.resolve({
        docs: []
      })
    })
  })
};

export const auth = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com'
  }
};

export const db = mockDb;

export default { auth, db };