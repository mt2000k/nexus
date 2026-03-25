import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nexuschat-token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getMe()
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('nexuschat-token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const register = useCallback(async (username, email, password, avatar) => {
    const data = await api.register(username, email, password, avatar);
    localStorage.setItem('nexuschat-token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('nexuschat-token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const guestLogin = useCallback(async () => {
    const data = await api.guestLogin();
    localStorage.setItem('nexuschat-token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nexuschat-token');
    setToken(null);
    setUser(null);
  }, []);

  const value = { user, token, loading, register, login, guestLogin, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
