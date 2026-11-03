import { useEffect, useState } from 'react';
import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuth } from '../features/auth/AuthContext';
import {
  HOME_UNAVAILABLE,
  resolveHomeHref,
} from '../features/auth/resolveHomeHref';
import { tokens } from '../theme/tokens';

/** Role-aware gate — same destinations as web LoginPage. */
export function AuthRedirect({ mode }: { mode: 'root' | 'authed-only' }) {
  const { ready, token, user, logout } = useAuth();
  const [href, setHref] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ready) return;
      if (!token) {
        if (!cancelled) setHref('/(auth)/login');
        return;
      }
      const next = await resolveHomeHref(user);
      if (!cancelled) setHref(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, user, retryTick]);

  if (!ready || !href) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg }}>
        <ActivityIndicator color={tokens.brand} size="large" />
      </View>
    );
  }

  if (mode === 'authed-only' && !token) {
    return <Redirect href="/(auth)/login" />;
  }

  if (href === HOME_UNAVAILABLE) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg, padding: 24, gap: 12 }}>
        <Text style={{ color: tokens.fg, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
          Veza nije dostupna
        </Text>
        <Text style={{ color: tokens.muted, textAlign: 'center', lineHeight: 22 }}>
          Ne možemo odrediti početni zaslon. Provjerite mrežu pa pokušajte ponovo.
        </Text>
        <Pressable
          onPress={() => setRetryTick((value) => value + 1)}
          style={{ backgroundColor: tokens.brand, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: tokens.onBrand, fontWeight: '700' }}>Pokušaj ponovo</Text>
        </Pressable>
        {token ? (
          <Pressable onPress={() => void logout()}>
            <Text style={{ color: tokens.muted, marginTop: 8 }}>Odjava</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return <Redirect href={href as Href} />;
}
