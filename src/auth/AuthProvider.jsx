import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  currentUser: null,
  userRole: null,
  loading: false,
  error: null,
  signup: () => Promise.reject("AuthProvider not initialized"),
  login: () => Promise.reject("AuthProvider not initialized"),
  logout: () => Promise.reject("AuthProvider not initialized"),
  createUser: () => Promise.reject("AuthProvider not initialized"),
  isAdmin: false
});

const testUsers = [
  { uid: 'bogdan', email: 'bogdan@netbet.ro', password: 'password123', role: 'Bogdan' },
  { uid: 'razvan', email: 'razvan@netbet.ro', password: 'password123', role: 'Razvan' },
  { uid: 'danela', email: 'danela@netbet.ro', password: 'password123', role: 'Danela' },
  { uid: 'marean', email: 'marean@netbet.ro', password: 'password123', role: 'Marean' },
  { uid: 'admin', email: 'admin@netbet.ro', password: 'admin123', role: 'Admin' }
];

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [userRole, setUserRole] = useState(() => {
    const savedRole = localStorage.getItem('userRole');
    return savedRole || null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize auth state
    setLoading(false);
  }, []);

  async function createUser({ name, email, password, role }) {
    setError(null);
    const existingUser = mockUsers.find(user => user.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const newUser = {
      uid: 'user' + (mockUsers.length + 1),
      name,
      email,
      password,
      role
    };

    // In a real app, we would make an API call here
    mockUsers.push(newUser);
    return newUser;
  }

  async function signup(email, password) {
    setError(null);
    return await createUser({
      name: email.split('@')[0],
      email,
      password,
      role: 'User'
    });
  }

    async function login(email, password) {
    setError(null);
    setLoading(true);
    try {
      const user = testUsers.find(u => u.email === email && u.password === password);
      if (!user) {
        throw new Error('Invalid credentials');
      }
      // Add uid if it doesn't exist
      const userWithId = {
        ...user,
        uid: user.uid || email.split('@')[0] // Use existing uid or create from email
      };
      setCurrentUser(userWithId);
      setUserRole(user.role);
      localStorage.setItem('currentUser', JSON.stringify(userWithId));
      localStorage.setItem('userRole', user.role);
    } catch (e) {
      setError('Failed to log in: ' + e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    return Promise.resolve();
  }

  const isAdmin = currentUser?.role === 'Admin';

  const value = {
    currentUser,
    userRole,
    loading,
    error,
    signup,
    login,
    logout,
    createUser,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}