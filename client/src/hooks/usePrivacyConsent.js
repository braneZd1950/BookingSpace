import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecordConsentMutation } from '../api/consentApi.js';
import { useGetMeQuery, useUpdateMeMutation } from '../api/authApi.js';
import {
  CONSENT_EVENT,
  CONSENT_VERSION,
  acceptLocally,
  consentFromUser,
  getAnonymousKey,
  hasValidConsent,
  hasValidLocalConsent,
  readLocalConsent,
  withdrawLocally,
} from '../lib/consent.js';

const TOKEN_KEY = 'bookingspace.token';

export function usePrivacyConsent() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const { data: meData, refetch } = useGetMeQuery(undefined, { skip: !token });
  const user = meData?.user || null;
  const [recordConsent] = useRecordConsentMutation();
  const [updateMe] = useUpdateMeMutation();
  const [tick, setTick] = useState(0);
  const syncingRef = useRef(false);

  useEffect(() => {
    function bump() {
      setTick((value) => value + 1);
    }
    window.addEventListener(CONSENT_EVENT, bump);
    return () => window.removeEventListener(CONSENT_EVENT, bump);
  }, []);

  useEffect(() => {
    if (!user || !token) return undefined;
    const remote = consentFromUser(user);
    const uid = String(user.id || user._id || '');
    const local = readLocalConsent();

    if (remote?.isCurrent) {
      if (!hasValidLocalConsent() || local?.userId !== uid) {
        acceptLocally(remote.source || 'settings', { allowAccountSync: false, userId: uid });
      }
      return undefined;
    }

    // Push device accept → account when never recorded: guest→login sync flag,
    // or same userId rebound after restart when DB row was missing.
    const neverRecorded = !remote || (!remote.accepted && !remote.withdrawnAt);
    const boundToUser = Boolean(uid && local?.userId && String(local.userId) === uid);
    const maySyncToAccount = local?.allowAccountSync === true || boundToUser;
    if (hasValidLocalConsent() && neverRecorded && maySyncToAccount && !syncingRef.current) {
      syncingRef.current = true;
      void recordConsent({
        action: 'accept',
        version: CONSENT_VERSION,
        source: 'banner',
        path: window.location.pathname,
        anonymousKey: getAnonymousKey(),
      })
        .unwrap()
        .then(() => {
          acceptLocally('banner', { allowAccountSync: false, userId: uid });
          return refetch();
        })
        .catch(() => {})
        .finally(() => {
          syncingRef.current = false;
        });
    }

    return undefined;
  }, [user, token, recordConsent, refetch]);

  const accepted = hasValidConsent(user);
  void tick;

  const accept = useCallback(async (source = 'banner') => {
    const uid = user?.id || user?._id || null;
    acceptLocally(source, { userId: uid });
    try {
      await recordConsent({
        action: 'accept',
        version: CONSENT_VERSION,
        source,
        path: window.location.pathname,
        anonymousKey: getAnonymousKey(),
      }).unwrap();
      if (token) await refetch();
    } catch {
      /* local already set; banner hides — booking still needs server sync */
    }
  }, [recordConsent, refetch, token, user]);

  const withdraw = useCallback(async (source = 'settings') => {
    withdrawLocally(source);
    try {
      if (token) {
        await updateMe({
          privacyConsent: {
            action: 'withdraw',
            version: CONSENT_VERSION,
            source,
            path: window.location.pathname,
          },
        }).unwrap();
      } else {
        await recordConsent({
          action: 'withdraw',
          version: CONSENT_VERSION,
          source,
          path: window.location.pathname,
          anonymousKey: getAnonymousKey(),
        }).unwrap();
      }
      if (token) await refetch();
    } catch {
      /* local already cleared */
    }
  }, [recordConsent, refetch, token, updateMe]);

  return {
    accepted,
    user,
    version: CONSENT_VERSION,
    consent: user ? consentFromUser(user) : null,
    accept,
    withdraw,
  };
}
