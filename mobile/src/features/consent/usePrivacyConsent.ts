import { useCallback, useEffect, useState } from 'react';
import { recordConsent } from '../../api/consent';
import { getMe, updateMe, type AuthUser } from '../../api/auth';
import { useAuth } from '../auth/AuthContext';
import {
  CONSENT_VERSION,
  consentFromUser,
  getAnonymousKey,
  hasValidConsent,
  hasValidLocalConsent,
  writeLocalConsent,
} from '../../lib/consent';
import { openWebPath } from '../../lib/openWeb';
import { deleteItem, getItem, setItem } from '../../lib/storage';

export function usePrivacyConsent() {
  const { user, token, setUser } = useAuth();
  const [localOk, setLocalOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await hasValidLocalConsent(getItem);
      if (!cancelled) setLocalOk(ok);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !token) return;
    const remote = consentFromUser(user);
    if (remote?.isCurrent && !localOk) {
      void writeLocalConsent(setItem, deleteItem, {
        accepted: true,
        version: CONSENT_VERSION,
        acceptedAt: remote.acceptedAt || new Date().toISOString(),
        withdrawnAt: null,
        source: remote.source || 'settings',
      }).then(() => setLocalOk(true));
      return;
    }

    if (localOk && !remote?.isCurrent) {
      void (async () => {
        try {
          const anonymousKey = await getAnonymousKey(getItem, setItem);
          await recordConsent({
            action: 'accept',
            version: CONSENT_VERSION,
            source: 'banner',
            anonymousKey,
          });
          const me = await getMe();
          setUser(me.user);
        } catch {
          /* local already set */
        }
      })();
    }
  }, [user, token, localOk, setUser]);

  const accepted = hasValidConsent(user) || localOk;

  const accept = useCallback(async (source = 'banner') => {
    setBusy(true);
    try {
      await writeLocalConsent(setItem, deleteItem, {
        accepted: true,
        version: CONSENT_VERSION,
        acceptedAt: new Date().toISOString(),
        withdrawnAt: null,
        source,
      });
      setLocalOk(true);
      const anonymousKey = await getAnonymousKey(getItem, setItem);
      await recordConsent({
        action: 'accept',
        version: CONSENT_VERSION,
        source,
        anonymousKey,
      });
      if (token) {
        const me = await getMe();
        setUser(me.user);
      }
    } catch {
      /* local already set — booking may still need server sync */
    } finally {
      setBusy(false);
    }
  }, [setUser, token]);

  const withdraw = useCallback(async (source = 'settings') => {
    setBusy(true);
    try {
      await writeLocalConsent(setItem, deleteItem, {
        accepted: false,
        version: CONSENT_VERSION,
        acceptedAt: null,
        withdrawnAt: new Date().toISOString(),
        source,
      });
      setLocalOk(false);
      if (token) {
        await updateMe({
          privacyConsent: {
            action: 'withdraw',
            version: CONSENT_VERSION,
            source,
            path: '/mobile',
          },
        });
        const me = await getMe();
        setUser(me.user);
      } else {
        const anonymousKey = await getAnonymousKey(getItem, setItem);
        await recordConsent({
          action: 'withdraw',
          version: CONSENT_VERSION,
          source,
          anonymousKey,
        });
      }
    } catch {
      /* local already cleared */
    } finally {
      setBusy(false);
    }
  }, [setUser, token]);

  const openPrivacy = useCallback(async () => {
    await openWebPath('/privatnost');
  }, []);

  const openTerms = useCallback(async () => {
    await openWebPath('/uvjeti');
  }, []);

  return {
    accepted,
    busy,
    user: user as AuthUser | null,
    version: CONSENT_VERSION,
    accept,
    withdraw,
    openPrivacy,
    openTerms,
  };
}
