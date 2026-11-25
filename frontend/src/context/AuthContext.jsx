import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi.js';
import { ensureCsrf } from '../api/axiosClient.js';

const AuthContext = createContext(null);

/**
 * Holds the current user profile only. The JWT itself lives in an HttpOnly cookie
 * the browser manages, so nothing sensitive is stored in JS memory or web storage.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await ensureCsrf();
        const { data } = await authApi.me();
        if (active) setUser(data);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    await ensureCsrf();
    const { data } = await authApi.login({ email, password });
    setUser(data);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    await ensureCsrf();
    const { data } = await authApi.register(payload);
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: !!user, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
