import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser, userRole } = useAuth();

  useEffect(() => {
    if (currentUser) {
      if (userRole === 'Admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(`/dashboard/${currentUser.uid}`, { replace: true });
      }
    }
  }, [currentUser, userRole, navigate]);

  const testUsers = [
    { email: 'bogdan@netbet.ro', password: 'password123', role: 'Bogdan' },
    { email: 'razvan@netbet.ro', password: 'password123', role: 'Razvan' },
    { email: 'danela@netbet.ro', password: 'password123', role: 'Danela' },
    { email: 'marean@netbet.ro', password: 'password123', role: 'Marean' },
    { email: 'admin@netbet.ro', password: 'admin123', role: 'Admin Doria' },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      // Navigation will be handled by the useEffect
    } catch (error) {
      setError('Failed to sign in: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>

      <div className="test-users">
        <h3>Test Users</h3>
        <div className="test-users-grid">
          {testUsers.map((user, index) => (
            <div key={index} className="test-user-card">
              <strong>{user.role}</strong>
              <p>Email: {user.email}</p>
              <p>Password: {user.password}</p>
              <button
                onClick={() => {
                  setEmail(user.email);
                  setPassword(user.password);
                }}
                className="fill-credentials"
              >
                Fill Credentials
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}