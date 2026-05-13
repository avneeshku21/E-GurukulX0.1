// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Auth Context
// Provides authentication state and actions across the entire app.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import * as api from '../lib/api.js';

// ── Storage keys ──────────────────────────────────────────────────────────────
const AUTH_TOKEN_KEY = 'edutrack_token';
const AUTH_USER_KEY  = 'edutrack_user';

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [token, setToken]         = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // ── Internal session helpers ───────────────────────────────────────────────

  const setSession = useCallback((userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem(AUTH_TOKEN_KEY, tokenStr);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  // ── Restore session on app mount ───────────────────────────────────────────

  const refreshAuth = useCallback(async () => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      // /api/auth/me returns { success, data: user }
      setUser(response.data.data);
      setToken(savedToken);
    } catch {
      // Token invalid / expired → wipe session
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // ── Auth actions ───────────────────────────────────────────────────────────

  /**
   * Standard email/password login.
   * Server sets httpOnly cookie; we also persist the token from response body.
   */
  const login = useCallback(async (email, password, rememberMe = false) => {
    const response = await api.post('/auth/login', { email, password, rememberMe });
    const { user: userData, token: tokenStr } = response.data.data;
    setSession(userData, tokenStr);
    return userData;
  }, [setSession]);

  /**
   * Google OAuth login (stub — backend returns token when OAuth is wired up).
   */
  const loginWithGoogle = useCallback(async (googleToken) => {
    const response = await api.post('/auth/google', { token: googleToken });
    const { user: userData, token: tokenStr } = response.data.data;
    setSession(userData, tokenStr);
    return userData;
  }, [setSession]);

  /**
   * GitHub OAuth login (stub).
   */
  const loginWithGithub = useCallback(async (githubToken) => {
    const response = await api.post('/auth/github', { token: githubToken });
    const { user: userData, token: tokenStr } = response.data.data;
    setSession(userData, tokenStr);
    return userData;
  }, [setSession]);

  /**
   * Log out — clears cookie server-side and local state.
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Always clear local state even if network request fails
    } finally {
      clearSession();
    }
  }, [clearSession]);

  /**
   * Registration — creates account and logs in immediately.
   */
  const register = useCallback(async (data) => {
    const response = await api.post('/auth/register', data);
    const { user: userData, token: tokenStr } = response.data.data;
    setSession(userData, tokenStr);
    return userData;
  }, [setSession]);

  /**
   * Update profile fields and sync local state.
   * Accepts a partial user object; returns updated user.
   */
  const updateUser = useCallback(async (data) => {
    const response = await api.patch('/user', data);
    const updatedUser = response.data.data;
    setUser(updatedUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        loginWithGoogle,
        loginWithGithub,
        logout,
        register,
        updateUser,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
