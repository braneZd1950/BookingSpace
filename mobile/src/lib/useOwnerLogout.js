import { useCallback, useState } from 'react';
import { logout } from '../api/auth.js';

/** Shared logout flow for studio + member home. */
export function useOwnerLogout(onLogout) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(() => {
    void (async () => {
      setLoggingOut(true);
      try {
        await logout();
      } catch {
        /* lokalni logout */
      } finally {
        setLoggingOut(false);
        onLogout?.();
      }
    })();
  }, [onLogout]);

  return { loggingOut, handleLogout };
}
