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
import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useOwnerLogout } from '../../lib/useOwnerLogout.js';
import { listMyMemberships } from '../../api/memberships.js';
import { getPublicTenant } from '../../api/tenants.js';
import { colorsForTheme } from '../../lib/uiTheme.js';
import AuthLegalStrip from '../auth/AuthLegalStrip';
import { hourRows, hoursFromWorking } from '../studio/studioTime.js';
import MemberBookScreen from './MemberBookScreen';
import MemberDiscoverScreen from './MemberDiscoverScreen';
import MemberGalleryScreen from './MemberGalleryScreen';
import MemberPolicyScreen from './MemberPolicyScreen';
import MemberSettingsScreen from './MemberSettingsScreen';
import { hoursLine } from './memberContent.js';

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

const NAV_ITEMS = [
  {
    id: 'book' as const,
    label: 'Termini',
    note: 'Rezervacija i otkaz',
    icon: 'calendar-outline' as const,
  },
  {
    id: 'gallery' as const,
    label: 'Galerija',
    note: 'Fotografije studija',
    icon: 'images-outline' as const,
  },
  {
    id: 'discover' as const,
    label: 'Otkrij',
    note: 'Drugi studiji',
    icon: 'compass-outline' as const,
  },
  {
    id: 'privacy' as const,
    label: 'Privatnost',
    note: 'Dokumenti studija',
    icon: 'shield-checkmark-outline' as const,
  },
  {
    id: 'settings' as const,
    label: 'Postavke',
    note: 'Račun i obavijesti',
    icon: 'settings-outline' as const,
  },
];

const untilDay = new Intl.DateTimeFormat('hr-HR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function sessionsLeft(membership: MembershipPass | null | undefined) {
  if (!membership || membership.sessionsIncluded == null) return null;
  return (
    membership.sessionsRemaining
    ?? Math.max(0, (membership.sessionsIncluded || 0) - (membership.sessionsUsed || 0))
  );
}

function formatValidUntil(value?: string) {
  if (!value) return '';
  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}/.test(raw)
    ? new Date(`${raw.slice(0, 10)}T12:00:00`)
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return untilDay.format(date);
}

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

  useEffect(() => {
    let cancelled = false;
    setPanel('home');
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [publicData, mine] = await Promise.all([
          getPublicTenant(slug),
          listMyMemberships(50).catch(() => null),
        ]);
        if (cancelled) return;

        const nextTenant = (publicData?.tenant || publicData) as PublicTenant;
        if (nextTenant?.name || nextTenant?.slug) {
          setTenant({
            ...nextTenant,
            name: nextTenant.name || initialTenantName || slug,
            slug: nextTenant.slug || slug,
          });
        }

        const list = Array.isArray(mine?.memberships) ? mine.memberships : [];
        const match =
          list.find(
            (item: MembershipPass) =>
              item?.status === 'ACTIVE'
              && (item?.tenant?.slug === slug || item?.tenantId === nextTenant?.id),
          )
          || list.find((item: MembershipPass) => item?.tenant?.slug === slug)
          || initialMembership
          || null;
        setMembership(match);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Studio nije učitan.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <View style={styles.topRow}>
            <Text style={[styles.brand, { color: colors.title }]}>anyminutes</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Odjava"
              disabled={loggingOut}
              onPress={handleLogout}
              hitSlop={10}
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
            >
              {loggingOut ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Ionicons name="power-outline" size={22} color={colors.accent} />
              )}
            </Pressable>
          </View>

          <Text style={[styles.kicker, { color: colors.accent }]}>Vaš studio</Text>
          <Text style={[styles.title, { color: colors.title }, compact && { fontSize: 34, lineHeight: 38 }]}>
            {studioName}
          </Text>

          {(fallbackName || fallbackEmail) ? (
            <Text style={[styles.identity, { color: colors.soft }]}>
              {[fallbackName, fallbackEmail].filter(Boolean).join('\n')}
            </Text>
          ) : null}

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          {tenant?.description ? (
            <Text style={[styles.lead, { color: colors.muted }]}>{tenant.description}</Text>
          ) : (
            <Text style={[styles.lead, { color: colors.muted }]}>
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
            {NAV_ITEMS.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => setPanel(item.id)}
                style={({ pressed }) => [
                  styles.navRow,
                  { borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.navIcon, { borderColor: colors.cardBorder }]}>
                  <Ionicons name={item.icon} size={18} color={colors.accent} />
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

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#060908',
  },
  root: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#060908',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brand: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: '#F7FCFA',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#5EEAD4',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.6,
    color: '#E8F2EF',
    marginBottom: 12,
  },
  identity: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.78)',
    marginBottom: 12,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(232, 242, 239, 0.64)',
    marginBottom: 22,
  },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#FCA5A5',
    marginBottom: 12,
  },
  pass: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(94, 234, 212, 0.35)',
    backgroundColor: 'rgba(12, 28, 24, 0.72)',
    padding: 18,
    marginBottom: 22,
  },
  passLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(94, 234, 212, 0.9)',
    marginBottom: 8,
  },
  passTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 28,
    lineHeight: 32,
    color: '#F7FCFA',
    marginBottom: 14,
  },
  passMeta: { gap: 10, marginBottom: 18 },
  passMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  passIndex: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: 'rgba(94, 234, 212, 0.7)',
    width: 22,
  },
  passMetaText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.82)',
  },
  ctaPrimary: {
    minHeight: 52,
    borderRadius: 6,
    backgroundColor: '#5EEAD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    letterSpacing: 0.15,
    color: '#061210',
  },
  notice: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    padding: 16,
    marginBottom: 22,
  },
  noticeText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.72)',
  },
  navKicker: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  navList: { gap: 8, marginBottom: 22 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  navIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  navLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
  },
  navNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  hoursCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 22,
    gap: 8,
  },
  hoursTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    marginBottom: 4,
  },
  hoursLine: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  details: { gap: 12, marginTop: 4 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 36,
  },
  pressed: { opacity: 0.82 },
});
