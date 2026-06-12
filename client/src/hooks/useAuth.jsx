import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);

    // Listen for auth expiry
    const handleExpiry = () => {
      setUser(null);
    };
    window.addEventListener('auth:expired', handleExpiry);
    return () => window.removeEventListener('auth:expired', handleExpiry);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const token = data.session?.access_token;
    if (token) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  }, []);

  const signup = useCallback(async (email, password, displayName) => {
    const { data } = await authAPI.signup({ email, password, displayName });
    const token = data.session?.access_token;
    if (token) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
