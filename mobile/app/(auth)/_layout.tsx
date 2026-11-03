import { useEffect, useState } from 'react';
import { Redirect, Stack, type Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../src/features/auth/AuthContext';
import {
  HOME_UNAVAILABLE,
  resolveHomeHref,
} from '../../src/features/auth/resolveHomeHref';
import { tokens } from '../../src/theme/tokens';

function isAuthDestination(href: string) {
  return href.startsWith('/(auth)');
}

export default function AuthLayout() {
  const { token, ready, user } = useAuth();
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ready || !token) {
        if (!cancelled) setHref(null);
        return;
      }
      const next = await resolveHomeHref(user);
      if (!cancelled) setHref(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, user]);

  if (ready && token) {
    if (!href || href === HOME_UNAVAILABLE) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg }}>
          <ActivityIndicator color={tokens.brand} />
        </View>
      );
    }
    // Stay on auth screens when home is still login (no membership) — avoids redirect loop.
    if (!isAuthDestination(href)) {
      return <Redirect href={href as Href} />;
    }
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
