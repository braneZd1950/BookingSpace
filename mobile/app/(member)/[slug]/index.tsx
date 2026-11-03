import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { listMyMemberships, type Membership } from '../../../src/api/memberships';
import { getPublicTenant } from '../../../src/api/tenants';
import { SiteLive } from '../../../src/components/SiteLive';
import { studioFromTenant, type StudioView } from '../../../src/features/studio/studioMap';
import { tokens } from '../../../src/theme/tokens';
import { font } from '../../../src/theme/fonts';

function sessionsLabel(membership: Membership | null) {
  if (!membership) return null;
  if (membership.sessionsIncluded == null) return 'Neograničeni termini';
  const left = membership.sessionsRemaining
    ?? Math.max(0, (membership.sessionsIncluded || 0) - (membership.sessionsUsed || 0));
  return `${left} od ${membership.sessionsIncluded} preostalo`;
}

/** Member Početna — same destination as web `/s/:slug`. */
export default function MemberHomeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [studio, setStudio] = useState<StudioView | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const [tenant, memberships] = await Promise.all([
          getPublicTenant(String(slug)),
          listMyMemberships(50),
        ]);
        if (cancelled) return;
        setStudio(studioFromTenant(tenant));
        const mine = memberships.find(
          (item) => item.status === 'ACTIVE'
            && (item.tenant?.slug === slug || String(item.tenantId) === String(tenant.id)),
        ) || null;
        setMembership(mine);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Stranica nije učitana.');
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.brand} />
      </View>
    );
  }

  if (error || !studio) {
    return (
      <View style={{ flex: 1, padding: 24 }}>
        <Text style={{ color: tokens.fg }}>{error || 'Nema studija.'}</Text>
      </View>
    );
  }

  const left = sessionsLabel(membership);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: studio.theme.canvas }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {membership ? (
        <View
          style={{
            margin: 16,
            padding: 14,
            borderRadius: 3.2,
            borderWidth: 1,
            borderColor: `${studio.theme.primaryColor}33`,
            backgroundColor: '#fff',
            gap: 4,
          }}
        >
          <Text
            style={{
              fontFamily: font.bodyExtra,
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: studio.theme.primaryColor,
            }}
          >
            Vaša članarina
          </Text>
          <Text style={{ fontFamily: font.display, fontSize: 22, color: studio.theme.ink }}>
            {membership.planName || 'Članarina'}
          </Text>
          {left ? (
            <Text style={{ fontFamily: font.bodyRegular, fontSize: 14, color: `${studio.theme.ink}94` }}>
              {left}
            </Text>
          ) : null}
        </View>
      ) : null}
      <SiteLive
        studio={studio}
        onBook={() => router.push(`/(member)/${slug}/termini` as Href)}
      />
    </ScrollView>
  );
}
