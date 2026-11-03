import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getMe,
  login as loginRequest,
  loginWithGoogle as loginWithGoogleRequest,
  logoutRequest,
  type AuthUser,
} from '../../api/auth';
import { ApiError, setUnauthorizedHandler } from '../../api/client';
import { deleteItem, getItem, setItem } from '../../lib/storage';

const TOKEN_KEY = 'anyminutes.token';

type AuthState = {
  ready: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  loginWithGoogle: (idToken: string, intent?: 'login' | 'register') => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  /** Persist a rotated JWT (e.g. after password change) into SecureStore + state. */
  persistToken: (next: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await getItem(TOKEN_KEY);
        if (!saved) return;
        const me = await getMe(saved);
        if (cancelled) return;
        setToken(saved);
        setUser(me.user);
      } catch (err) {
        // Wipe only on auth rejection — keep token through network/5xx so cold start recovers.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          await deleteItem(TOKEN_KEY);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    await setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const loginWithGoogle = useCallback(async (
    idToken: string,
    intent: 'login' | 'register' = 'login',
  ) => {
    const result = await loginWithGoogleRequest(idToken, intent);
    await setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    await deleteItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const persistToken = useCallback(async (next: string) => {
    await setItem(TOKEN_KEY, next);
    setToken(next);
  }, []);

  const value = useMemo(
    () => ({ ready, token, user, login, loginWithGoogle, logout, setUser, persistToken }),
    [ready, token, user, login, loginWithGoogle, logout, persistToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
