import { Slot, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPublicTenant, type Tenant } from '../../../src/api/tenants';
import { MemberBottomNav, MemberTopBar } from '../../../src/components/MemberNav';
import { studioFromTenant } from '../../../src/features/studio/studioMap';
import { tokens } from '../../../src/theme/tokens';
import { memberNavStyles } from '../../../src/ui/memberNavStyles';

/**
 * Member studio shell (parity with web `/s/:slug`).
 * Public tenant load is intentional; booking/consent stay server-enforced.
 */
export default function MemberStudioLayout() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) return;
      setLoading(true);
      setError('');
      try {
        const row = await getPublicTenant(String(slug));
        if (!cancelled) setTenant(row);
      } catch (err) {
        if (!cancelled) {
          setTenant(null);
          setError(err instanceof Error ? err.message : 'Studio nije dostupan.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg }}>
        <ActivityIndicator color={tokens.brand} />
      </View>
    );
  }

  if (error || !tenant) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: tokens.bg }}>
        <Text style={{ fontSize: 18, color: tokens.fg }}>{error || 'Studio nije pronađen.'}</Text>
      </View>
    );
  }

  const studio = studioFromTenant(tenant);
  const brand = studio.theme.primaryColor || tokens.brand;
  const soft = studio.theme.secondaryColor || tokens.brandSoft;

  return (
    <SafeAreaView style={memberNavStyles.shell} edges={['top', 'left', 'right']}>
      <MemberTopBar
        slug={String(slug)}
        studioName={studio.name}
        brand={brand}
      />
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <MemberBottomNav
        slug={String(slug)}
        brand={brand}
        soft={soft}
      />
    </SafeAreaView>
  );
}
