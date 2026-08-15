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
  is_email_verified: true,
  auth_provider: 'email',
  avatar_url: null,
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

  // ── Vérification du token au montage ────────────────────────────────────
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      if (DEV_MODE) { setLoading(false); return; }
      try {
        const { data } = await authService.me();
        setUser(data);
        localStorage.setItem('learnai_user', JSON.stringify(data));
      } catch {
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

  // ── Helpers internes ──────────────────────────────────────────────────────
  const _storeSession = useCallback((accessToken, userData) => {
    localStorage.setItem('learnai_token', accessToken);
    localStorage.setItem('learnai_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, []);

  // ── login (email + password) ──────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    if (DEV_MODE) {
      const u = { ...MOCK_USER, email: credentials.email || MOCK_USER.email };
      _storeSession(MOCK_TOKEN, u);
      return u;
    }
    const { data } = await authService.login(credentials);
    _storeSession(data.access_token, data.user);
    return data.user;
  }, [_storeSession]);

  // ── register (email + password) → ne stocke PAS de session, attend OTP ───
  const register = useCallback(async (payload) => {
    if (DEV_MODE) {
      const u = { ...MOCK_USER, nom: payload.nom || MOCK_USER.nom, email: payload.email || MOCK_USER.email };
      _storeSession(MOCK_TOKEN, u);
      return u;
    }
    // Le backend retourne RegisterPendingResponse (message + email), PAS un token
    const { data } = await authService.register(payload);
    // Retourner la réponse pour que la page puisse rediriger vers /verify-email
    return data;
  }, [_storeSession]);

  // ── verifyEmail (OTP confirmation) → stocke la session ───────────────────
  const verifyEmail = useCallback(async (payload) => {
    if (DEV_MODE) {
      _storeSession(MOCK_TOKEN, MOCK_USER);
      return MOCK_USER;
    }
    const { data } = await authService.verifyEmail(payload);
    _storeSession(data.access_token, data.user);
    return data.user;
  }, [_storeSession]);

  // ── resendVerification ────────────────────────────────────────────────────
  const resendVerification = useCallback(async (email) => {
    if (DEV_MODE) return { message: 'Code renvoyé (dev mode)' };
    const { data } = await authService.resendVerification(email);
    return data;
  }, []);

  // ── loginWithToken (callback Google OAuth) ────────────────────────────────
  const loginWithToken = useCallback(async (accessToken) => {
    if (DEV_MODE) {
      _storeSession(MOCK_TOKEN, MOCK_USER);
      return MOCK_USER;
    }
    // Stocker le token puis appeler /me pour récupérer le profil
    localStorage.setItem('learnai_token', accessToken);
    setToken(accessToken);
    const { data } = await authService.me();
    localStorage.setItem('learnai_user', JSON.stringify(data));
    setUser(data);
    return data;
  }, [_storeSession]);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('learnai_token');
    localStorage.removeItem('learnai_user');
    setToken(null);
    setUser(null);
  }, []);

  // ── updateUser ────────────────────────────────────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('learnai_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyEmail,
        resendVerification,
        loginWithToken,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
