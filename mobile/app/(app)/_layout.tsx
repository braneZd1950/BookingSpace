import { useEffect, useState } from 'react';
import { Redirect, Slot, usePathname, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlatformLegalStrip } from '../../src/components/PlatformLegalStrip';
import { StudioNav } from '../../src/components/StudioNav';
import { useAuth } from '../../src/features/auth/AuthContext';
import {
  HOME_UNAVAILABLE,
  isOwnerRole,
  resolveHomeHref,
} from '../../src/features/auth/resolveHomeHref';
import { StudioProvider, useStudio } from '../../src/features/studio/StudioContext';
import { tokens } from '../../src/theme/tokens';
import { navStyles } from '../../src/ui/navStyles';

/**
 * Owner studio shell — only BUSINESS_OWNER (and platform roles).
 * Members are redirected to `/(member)/[slug]` like web `/s/:slug`.
 */
function OwnerShell() {
  const pathname = usePathname();
  const { studio } = useStudio();
  const brand = studio?.theme.primaryColor || tokens.brand;
  const soft = studio?.theme.secondaryColor || tokens.brandSoft;
  const ink = studio?.theme.ink || tokens.fg;
  const isHome = pathname === '/' || pathname === '/(app)' || pathname === '/(app)/';

  return (
    <SafeAreaView style={navStyles.shell} edges={['top', 'left', 'right']}>
      <StudioNav />
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      {!isHome ? (
        <PlatformLegalStrip
          brand={brand}
          soft={soft}
          ink={ink}
          studioSlug={studio?.slug}
        />
      ) : null}
    </SafeAreaView>
  );
}

export default function AppLayout() {
  const { ready, token, user, logout } = useAuth();
  const [memberHref, setMemberHref] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ready || !token || isOwnerRole(user)) {
        if (!cancelled) setMemberHref(null);
        return;
      }
      const href = await resolveHomeHref(user);
      if (!cancelled) setMemberHref(href);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token, user, retryTick]);

  if (ready && !token) {
    return <Redirect href="/(auth)/login" />;
  }

  if (ready && token && user && !isOwnerRole(user)) {
    if (!memberHref) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg }}>
          <ActivityIndicator color={tokens.brand} />
        </View>
      );
    }
    if (memberHref === HOME_UNAVAILABLE) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg, padding: 24, gap: 12 }}>
          <Text style={{ color: tokens.fg, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
            Veza nije dostupna
          </Text>
          <Text style={{ color: tokens.muted, textAlign: 'center', lineHeight: 22 }}>
            Ne možemo učitati vaše članstvo. Provjerite mrežu pa pokušajte ponovo.
          </Text>
          <Pressable
            onPress={() => setRetryTick((value) => value + 1)}
            style={{ backgroundColor: tokens.brand, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: tokens.onBrand, fontWeight: '700' }}>Pokušaj ponovo</Text>
          </Pressable>
          <Pressable onPress={() => void logout()}>
            <Text style={{ color: tokens.muted, marginTop: 8 }}>Odjava</Text>
          </Pressable>
        </View>
      );
    }
    if (memberHref.startsWith('/(auth)')) {
      return <Redirect href="/(auth)/login" />;
    }
    return <Redirect href={memberHref as Href} />;
  }

  return (
    <StudioProvider>
      <OwnerShell />
    </StudioProvider>
  );
}
