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
  withdrawLocally,
} from '../consent.js';

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

    if (remote?.isCurrent && !hasValidLocalConsent()) {
      acceptLocally(remote.source || 'settings');
      return undefined;
    }

    // Local accept before login must be pushed to the account — do not wipe it.
    if (hasValidLocalConsent() && !remote?.isCurrent && !syncingRef.current) {
      syncingRef.current = true;
      recordConsent({
        action: 'accept',
        version: CONSENT_VERSION,
        source: 'banner',
        path: window.location.pathname,
        anonymousKey: getAnonymousKey(),
      })
        .unwrap()
        .then(() => refetch())
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
    acceptLocally(source);
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
  }, [recordConsent, refetch, token]);

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
