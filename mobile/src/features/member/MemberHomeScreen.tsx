import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { listMyMemberships } from '../../api/memberships.js';
import { getPublicTenant } from '../../api/tenants.js';
import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { useCancelledEffect } from '../../lib/useCancelledEffect.js';
import { useOwnerLogout } from '../../lib/useOwnerLogout.js';
import { colorsForTheme } from '../../lib/uiTheme.js';
import AppBrandBar from '../../ui/AppBrandBar';
import { sessionCopyStyles as copy } from '../../ui/sessionCopyStyles.js';
import AuthLegalStrip from '../auth/AuthLegalStrip';
import { hourRows, hoursFromWorking } from '../studio/studioTime.js';
import MemberBookScreen from './MemberBookScreen';
import MemberDiscoverScreen from './MemberDiscoverScreen';
import MemberGalleryScreen from './MemberGalleryScreen';
import MemberPolicyScreen from './MemberPolicyScreen';
import MemberSettingsScreen from './MemberSettingsScreen';
import { hoursLine } from './memberContent.js';
import {
  formatValidUntil,
  resolveMembershipForSlug,
  sessionsLeft,
} from './memberHomeHelpers.js';
import { MEMBER_HOME_NAV } from './memberHomeNav.js';
import { memberHomeStyles as styles } from './memberHomeStyles.js';

type MemberHomeScreenProps = {
  slug: string;
  fallbackName?: string;
  fallbackEmail?: string;
  initialTenantName?: string;
  initialMembership?: MembershipPass | null;
  uiTheme?: string;
  onThemeChange?: (theme: string) => void;
  onLogout?: () => void;
  onSwitchStudio?: (next: {
    slug: string;
    tenantName?: string;
    membership?: MembershipPass | null;
  }) => void;
};

type MembershipPass = {
  id?: string;
  status?: string;
  planName?: string;
  tenantId?: string;
  validUntil?: string;
  sessionsIncluded?: number | null;
  sessionsUsed?: number | null;
  sessionsRemaining?: number | null;
  tenant?: { id?: string; slug?: string; name?: string };
};

type PublicTenant = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  timezone?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  services?: any[];
  trainers?: any[];
  bookingSettings?: { workingHours?: any[] };
  siteSettings?: {
    legal?: Record<string, string>;
    gallery?: Array<string | { url?: string; publicId?: string; alt?: string }>;
    visibleSections?: { gallery?: boolean };
  };
};

type Panel =
  | 'home'
  | 'book'
  | 'gallery'
  | 'discover'
  | 'privacy'
  | 'settings';

/**
 * Članski shell — parity s web /s/:slug (Početna, Termini, Otkrij, Privatnost, Postavke).
 */
export default function MemberHomeScreen({
  slug,
  fallbackName,
  fallbackEmail,
  initialTenantName,
  initialMembership = null,
  uiTheme = 'dark',
  onThemeChange,
  onLogout,
  onSwitchStudio,
}: MemberHomeScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useRef(new Animated.Value(0)).current;
  const colors = colorsForTheme(uiTheme);

  const [panel, setPanel] = useState<Panel>('home');
  const [loading, setLoading] = useState(true);
  const { loggingOut, handleLogout } = useOwnerLogout(onLogout);
  const [error, setError] = useState('');
  const [tenant, setTenant] = useState<PublicTenant | null>(
    initialTenantName ? { name: initialTenantName, slug } : null,
  );
  const [membership, setMembership] = useState<MembershipPass | null>(initialMembership);

  useCancelledEffect(({ cancelled }) => {
    setPanel('home');
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const [publicData, mine] = await Promise.all([
          getPublicTenant(slug),
          listMyMemberships(50).catch(() => null),
        ]);
        if (cancelled()) return;

        const nextTenant = (publicData?.tenant || publicData) as PublicTenant;
        if (nextTenant?.name || nextTenant?.slug) {
          setTenant({
            ...nextTenant,
            name: nextTenant.name || initialTenantName || slug,
            slug: nextTenant.slug || slug,
          });
        }

        const list = Array.isArray(mine?.memberships) ? mine.memberships : [];
        setMembership(
          resolveMembershipForSlug(list, {
            slug,
            tenantId: nextTenant?.id,
            initial: initialMembership,
          }),
        );
      } catch (err) {
        if (!cancelled()) {
          setError(err instanceof Error ? err.message : 'Studio nije učitan.');
        }
      } finally {
        if (!cancelled()) setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (loading || panel !== 'home') return undefined;
    enter.setValue(0);
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [loading, panel, enter]);

  const left = useMemo(() => sessionsLeft(membership), [membership]);
  const until = useMemo(
    () => formatValidUntil(membership?.validUntil),
    [membership?.validUntil],
  );

  if (loading) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const studioName = tenant?.name || initialTenantName || 'Studio';
  const isMember = membership?.status === 'ACTIVE';
  const placeLine = [tenant?.address, tenant?.city].filter(Boolean).join(', ');
  const hours = hoursFromWorking(tenant?.bookingSettings?.workingHours);

  if (panel === 'book') {
    return (
      <MemberBookScreen
        tenant={tenant}
        membership={membership}
        isMember={isMember}
        onBack={() => setPanel('home')}
      />
    );
  }

  if (panel === 'gallery') {
    return (
      <MemberGalleryScreen
        tenant={tenant}
        onBack={() => setPanel('home')}
      />
    );
  }

  if (panel === 'discover') {
    return (
      <MemberDiscoverScreen
        slug={slug}
        studioName={studioName}
        onBack={() => setPanel('home')}
        onOpenStudio={(next) => {
          setPanel('home');
          onSwitchStudio?.({
            slug: next.slug,
            tenantName: next.tenantName,
            membership: null,
          });
        }}
      />
    );
  }

  if (panel === 'privacy') {
    return (
      <MemberPolicyScreen
        tenant={tenant}
        onBack={() => setPanel('home')}
      />
    );
  }

  if (panel === 'settings') {
    return (
      <MemberSettingsScreen
        tenantName={studioName}
        onBack={() => setPanel('home')}
        onLogout={onLogout}
        uiTheme={uiTheme}
        onThemeChange={onThemeChange}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={colors.status as 'light' | 'dark'} />
      <LinearGradient
        colors={colors.gradient as [string, string, ...string[]]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: compact ? 48 : 64,
            paddingBottom: compact ? 28 : 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: enter,
            transform: [
              {
                translateY: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          }}
        >
          <AppBrandBar
            onLogout={handleLogout}
            loggingOut={loggingOut}
            accentColor={colors.accent}
            brandColor={colors.title}
            marginBottom={18}
          />

          <Text style={[copy.kicker, { color: colors.accent }]}>Vaš studio</Text>
          <Text style={[copy.title, { color: colors.title }, compact && { fontSize: 34, lineHeight: 38 }]}>
            {studioName}
          </Text>

          {(fallbackName || fallbackEmail) ? (
            <Text style={[copy.identity, { color: colors.soft }]}>
              {[fallbackName, fallbackEmail].filter(Boolean).join('\n')}
            </Text>
          ) : null}

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          {tenant?.description ? (
            <Text style={[copy.lead, { color: colors.muted }]}>{tenant.description}</Text>
          ) : (
            <Text style={[copy.lead, { color: colors.muted }]}>
              Pregled članarine, termina i postavki u ovom prostoru.
            </Text>
          )}

          {isMember ? (
            <View style={[styles.pass, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
              <Text style={[styles.passLabel, { color: colors.accent }]}>Vaša članarina</Text>
              <Text style={[styles.passTitle, { color: colors.title }]}>
                {membership?.planName || 'Članarina'}
              </Text>
              <View style={styles.passMeta}>
                <View style={styles.passMetaRow}>
                  <Text style={[styles.passIndex, { color: colors.accent }]}>01</Text>
                  <Text style={[styles.passMetaText, { color: colors.soft }]}>
                    {left != null
                      ? `${left} od ${membership?.sessionsIncluded} preostalo`
                      : 'Neograničeni termini'}
                  </Text>
                </View>
                {until ? (
                  <View style={styles.passMetaRow}>
                    <Text style={[styles.passIndex, { color: colors.accent }]}>02</Text>
                    <Text style={[styles.passMetaText, { color: colors.soft }]}>Vrijedi do {until}</Text>
                  </View>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Rezervirajte termin"
                onPress={() => setPanel('book')}
                style={({ pressed }) => [
                  styles.ctaPrimary,
                  { backgroundColor: colors.ctaBg },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.ctaPrimaryLabel, { color: colors.ctaText }]}>
                  Rezervirajte termin
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.notice, { borderColor: colors.border }]}>
              <Text style={[styles.noticeText, { color: colors.muted }]}>
                Prijavljeni ste, ali nemate aktivnu članarinu u ovom studiju.
                Obratite se studiju da je aktiviraju.
              </Text>
            </View>
          )}

          <Text style={[styles.navKicker, { color: colors.accent }]}>Izbornik</Text>
          <View style={styles.navList}>
            {MEMBER_HOME_NAV.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => setPanel(item.id as Panel)}
                style={({ pressed }) => [
                  styles.navRow,
                  { borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.navIcon, { borderColor: colors.cardBorder }]}>
                  <Ionicons name={item.icon as any} size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.navLabel, { color: colors.title }]}>{item.label}</Text>
                  <Text style={[styles.navNote, { color: colors.muted }]}>{item.note}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>

          <View style={[styles.hoursCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.hoursTitle, { color: colors.title }]}>Radno vrijeme</Text>
            {hourRows.map(([key, label]) => (
              <Text key={key} style={[styles.hoursLine, { color: colors.soft }]}>
                {hoursLine(label, hours[key as keyof typeof hours])}
              </Text>
            ))}
          </View>

          <View style={styles.details}>
            {placeLine ? (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color={colors.accent} />
                <Text style={[styles.detailText, { color: colors.muted }]}>{placeLine}</Text>
              </View>
            ) : null}
            {tenant?.phone ? (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={18} color={colors.accent} />
                <Text style={[styles.detailText, { color: colors.muted }]}>{tenant.phone}</Text>
              </View>
            ) : null}
            {tenant?.email ? (
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={18} color={colors.accent} />
                <Text style={[styles.detailText, { color: colors.muted }]}>{tenant.email}</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <AuthLegalStrip />
        </View>
      </ScrollView>
    </View>
  );
}
