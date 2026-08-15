import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

// ── DEV_MODE : mettre à true pour bypasser le backend (tests UI sans serveur) ─
const DEV_MODE = false;

const MOCK_USER = {
  id: 1,
  nom: 'Jean Dupont',
  email: 'demo@learnai.dev',
  role: 'apprenant',
  date_creation: '2026-08-15',
};
const MOCK_TOKEN = 'mock_jwt_token_dev_only';
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('learnai_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('learnai_token'));

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }

      if (DEV_MODE) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await authService.me();
        setUser(data);
        localStorage.setItem('learnai_user', JSON.stringify(data));
      } catch {
        // Token expired or invalid — clear session
        localStorage.removeItem('learnai_token');
        localStorage.removeItem('learnai_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (credentials) => {
    if (DEV_MODE) {
      const u = { ...MOCK_USER, email: credentials.email || MOCK_USER.email };
      localStorage.setItem('learnai_token', MOCK_TOKEN);
      localStorage.setItem('learnai_user', JSON.stringify(u));
      setToken(MOCK_TOKEN);
      setUser(u);
      return u;
    }
    // Real backend call
    const { data } = await authService.login(credentials);
    localStorage.setItem('learnai_token', data.access_token);
    localStorage.setItem('learnai_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    if (DEV_MODE) {
      const u = { ...MOCK_USER, nom: payload.nom || MOCK_USER.nom, email: payload.email || MOCK_USER.email };
      localStorage.setItem('learnai_token', MOCK_TOKEN);
      localStorage.setItem('learnai_user', JSON.stringify(u));
      setToken(MOCK_TOKEN);
      setUser(u);
      return u;
    }
    const { data } = await authService.register(payload);
    localStorage.setItem('learnai_token', data.access_token);
    localStorage.setItem('learnai_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('learnai_token');
    localStorage.removeItem('learnai_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('learnai_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
