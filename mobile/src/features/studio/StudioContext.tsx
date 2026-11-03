import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { listMyTenants } from '../../api/tenants';
import { useAuth } from '../auth/AuthContext';
import { studioFromTenant, type StudioView } from './studioMap';

type StudioState = {
  ready: boolean;
  studio: StudioView | null;
  error: string;
  refresh: () => Promise<void>;
};

const StudioContext = createContext<StudioState | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [ready, setReady] = useState(false);
  const [studio, setStudio] = useState<StudioView | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!token) {
      setStudio(null);
      setReady(true);
      setError('');
      return;
    }
    try {
      setError('');
      const rows = await listMyTenants();
      /* Owner shell only — never fall back to CUSTOMER tenant (web does the same). */
      const owned = rows.find((row) => row.role === 'BUSINESS_OWNER');
      if (owned?.tenant) {
        setStudio(studioFromTenant(owned.tenant));
      } else {
        setStudio(null);
        setError('Nema studija za ovaj račun.');
      }
    } catch (err) {
      setStudio(null);
      setError(err instanceof Error ? err.message : 'Studio nije učitan.');
    } finally {
      setReady(true);
    }
  }, [token]);

  useEffect(() => {
    setReady(false);
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ ready, studio, error, refresh }),
    [ready, studio, error, refresh],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
}
