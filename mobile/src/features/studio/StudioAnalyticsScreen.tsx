import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { getStudioAnalytics } from '../../api/analytics.js';
import { listTenantBookings } from '../../api/bookings.js';
import { listMemberships } from '../../api/memberships.js';
import AuthLegalStrip from '../auth/AuthLegalStrip';
import {
  isLocalDesignMode,
  localDesignAnalytics,
  localDesignMembers,
} from './localDesignFixtures.js';

type StudioAnalyticsScreenProps = {
  tenantId?: string;
  studioName?: string;
  onBack: () => void;
};

type MembershipRow = {
  id: string;
  userId?: string;
  status?: string;
  planName?: string;
  validUntil?: string;
  sessionsIncluded?: number | null;
  sessionsUsed?: number;
  user?: { name?: string; email?: string } | null;
};

type BookingRow = {
  userId?: string;
  status?: string;
};

const LABELS: { key: string; label: string }[] = [
  { key: 'page_view', label: 'Posjeti' },
  { key: 'login_success', label: 'Prijave' },
  { key: 'member_created', label: 'Dodani članovi' },
  { key: 'booking_created', label: 'Rezervacije' },
  { key: 'booking_cancelled', label: 'Otkazi' },
  { key: 'booking_completed', label: 'Završeni' },
  { key: 'booking_no_show', label: 'Nedolasci' },
];

const dateFmt = new Intl.DateTimeFormat('hr-HR', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

function monthRange(from = new Date()) {
  const year = from.getFullYear();
  const month = from.getMonth();
  const pad = (value: number) => String(value).padStart(2, '0');
  const last = new Date(year, month + 1, 0).getDate();
  return {
    dateFrom: `${year}-${pad(month + 1)}-01`,
    dateTo: `${year}-${pad(month + 1)}-${pad(last)}`,
  };
}

function daysLeft(until?: string) {
  if (!until) return null;
  const end = new Date(`${until}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function formatMonthHr(yearMonth: string) {
  const [year, month] = String(yearMonth).split('-').map(Number);
  if (!year || !month) return yearMonth;
  const label = new Intl.DateTimeFormat('hr-HR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function formatShortDate(value?: string) {
  if (!value) return '—';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  return dateFmt.format(new Date(y, m - 1, d));
}

function memberName(item: MembershipRow) {
  return item.user?.name || item.user?.email || 'Član';
}

function seriesByMonth(series: Array<Record<string, unknown>>) {
  const map = new Map<
    string,
    {
      month: string;
      page_view: number;
      booking_created: number;
      booking_cancelled: number;
      member_created: number;
    }
  >();
  for (const row of series) {
    const key = String(row.date || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) continue;
    const current = map.get(key) || {
      month: key,
      page_view: 0,
      booking_created: 0,
      booking_cancelled: 0,
      member_created: 0,
    };
    current.page_view += Number(row.page_view) || 0;
    current.booking_created += Number(row.booking_created) || 0;
    current.booking_cancelled += Number(row.booking_cancelled) || 0;
    current.member_created += Number(row.member_created) || 0;
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function buildMemberInsights(memberships: MembershipRow[], bookings: BookingRow[]) {
  const active = memberships.filter((item) => item.status === 'ACTIVE');
  const visitsByUser = new Map<string, number>();
  for (const booking of bookings) {
    if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') continue;
    const id = String(booking.userId || '');
    if (!id) continue;
    visitsByUser.set(id, (visitsByUser.get(id) || 0) + 1);
  }

  const endingSoon: Array<{ item: MembershipRow; left: number }> = [];
  const packageHot: Array<{
    item: MembershipRow;
    used: number;
    total: number;
  }> = [];
  const noVisit: MembershipRow[] = [];
  let withVisit = 0;

  for (const item of active) {
    const userId = String(item.userId || '');
    const left = daysLeft(item.validUntil);
    const visits = visitsByUser.get(userId) || 0;
    if (visits > 0) withVisit += 1;
    else noVisit.push(item);

    if (left != null && left >= 0 && left <= 7) {
      endingSoon.push({ item, left });
    }

    const included = item.sessionsIncluded;
    if (included != null) {
      const used = Number(item.sessionsUsed) || 0;
      const total = Number(included) || 0;
      if (total > 0 && used / total >= 0.85) {
        packageHot.push({ item, used, total });
      }
    }
  }

  endingSoon.sort((a, b) => a.left - b.left);
  packageHot.sort((a, b) => b.used / b.total - a.used / a.total);
  noVisit.sort((a, b) => memberName(a).localeCompare(memberName(b), 'hr'));

  return {
    activeCount: active.length,
    endingSoonCount: endingSoon.length,
    packageHotCount: packageHot.length,
    noVisitCount: noVisit.length,
    regularity: active.length > 0 ? Math.round((withVisit / active.length) * 100) : 0,
    endingSoon: endingSoon.slice(0, 6),
    packageHot: packageHot.slice(0, 6),
    noVisit: noVisit.slice(0, 6),
  };
}

/**
 * Analitika studija — brojke (30 dana) + uvidi članarina.
 */
export default function StudioAnalyticsScreen({
  tenantId,
  studioName,
  onBack,
}: StudioAnalyticsScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingLocalFixtures, setUsingLocalFixtures] = useState(false);
  const [days, setDays] = useState(30);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [series, setSeries] = useState<Array<Record<string, unknown>>>([]);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  const months = useMemo(() => seriesByMonth(series), [series]);
  const insights = useMemo(
    () => buildMemberInsights(memberships, bookings),
    [memberships, bookings],
  );

  const load = useCallback(async () => {
    if (isLocalDesignMode()) {
      const demo = localDesignAnalytics();
      setUsingLocalFixtures(true);
      setDays(demo.days);
      setCounts(demo.counts);
      setSeries(demo.series);
      setMemberships(localDesignMembers() as MembershipRow[]);
      setBookings([
        { userId: 'local-design-user-1', status: 'CONFIRMED' },
        { userId: 'local-design-user-1', status: 'COMPLETED' },
      ]);
      setLoading(false);
      setError('');
      return;
    }

    setUsingLocalFixtures(false);
    if (!tenantId) {
      setLoading(false);
      setError('Studio još nije učitan.');
      return;
    }

    setLoading(true);
    setError('');
    const range = monthRange();
    try {
      const [analytics, membersData, bookingData] = await Promise.all([
        getStudioAnalytics(tenantId, 30),
        listMemberships(tenantId),
        listTenantBookings(tenantId, {
          dateFrom: range.dateFrom,
          dateTo: range.dateTo,
          limit: 500,
        }),
      ]);
      setDays(Number(analytics?.days) || 30);
      setCounts(analytics?.counts || {});
      setSeries(Array.isArray(analytics?.series) ? analytics.series : []);
      setMemberships(
        Array.isArray(membersData?.memberships) ? membersData.memberships : [],
      );
      setBookings(Array.isArray(bookingData?.bookings) ? bookingData.bookings : []);
    } catch {
      setError('Analitika nije dostupna. Pokušajte ponovno.');
      setCounts({});
      setSeries([]);
      setMemberships([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading) return undefined;
    enter.setValue(0);
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [loading, enter]);

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color="#5EEAD4" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0C1815', '#070B0A', '#050706']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.stage,
          {
            paddingTop: compact ? 48 : 64,
            paddingBottom: compact ? 28 : 40,
            minHeight: height,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          style={{
            opacity: enter,
            transform: [
              {
                translateY: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Natrag na ${studioName || 'studio'}`}
              onPress={onBack}
              hitSlop={10}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={22} color="#5EEAD4" />
              <Text style={styles.backLabel} numberOfLines={1}>
                {studioName || 'Moj studio'}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.title, compact && { fontSize: 34, lineHeight: 38 }]}>
            Analitika
          </Text>
          <Text style={styles.lead}>
            Samo vaš studio — zadnjih {days} dana. Drugi studiji i platforma ne
            vide ove brojke.
          </Text>

          {usingLocalFixtures ? (
            <Text style={styles.fixtureBanner}>
              Lokalni demo podaci — samo za dizajn (__DEV__).
            </Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.sectionLabel}>Pregled</Text>
          <View style={styles.statsGrid}>
            {LABELS.map((item) => (
              <View key={item.key} style={styles.stat}>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>{counts[item.key] || 0}</Text>
              </View>
            ))}
          </View>

          <View style={styles.blockHead}>
            <Text style={styles.sectionLabel}>Vrijeme</Text>
            <Text style={styles.blockTitle}>Po mjesecima</Text>
            <Text style={styles.blockLead}>
              Posjeti, rezervacije, otkazi i novi članovi.
            </Text>
          </View>
          {months.length === 0 ? (
            <Text style={styles.empty}>Još nema podataka za ovo razdoblje.</Text>
          ) : (
            <View style={styles.monthList}>
              {months.map((row) => (
                <View key={row.month} style={styles.monthRow}>
                  <Text style={styles.monthName}>{formatMonthHr(row.month)}</Text>
                  <Text style={styles.monthMeta}>
                    {row.page_view} posjeta · {row.booking_created} rez. ·{' '}
                    {row.booking_cancelled} otk. · {row.member_created} član.
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.blockHead}>
            <Text style={styles.sectionLabel}>Članovi</Text>
            <Text style={styles.blockTitle}>Stanje članarina</Text>
            <Text style={styles.blockLead}>
              Redovitost, pred istekom i paketi skoro potrošeni.
            </Text>
          </View>

          <View style={styles.memberStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Aktivni</Text>
              <Text style={styles.statValue}>{insights.activeCount}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Redovitost</Text>
              <Text style={styles.statValue}>{insights.regularity}%</Text>
            </View>
            <View style={[styles.stat, insights.endingSoonCount > 0 && styles.statWarn]}>
              <Text style={styles.statLabel}>Pred istekom</Text>
              <Text style={styles.statValue}>{insights.endingSoonCount}</Text>
            </View>
            <View style={[styles.stat, insights.packageHotCount > 0 && styles.statWarn]}>
              <Text style={styles.statLabel}>Paket skoro</Text>
              <Text style={styles.statValue}>{insights.packageHotCount}</Text>
            </View>
            <View style={styles.statWide}>
              <Text style={styles.statLabel}>Bez dolaska (mjesec)</Text>
              <Text style={styles.statValue}>{insights.noVisitCount}</Text>
            </View>
          </View>

          {insights.activeCount === 0 ? (
            <Text style={styles.empty}>
              Još nema aktivnih članova. Dodajte ih u sekciji Članovi.
            </Text>
          ) : (
            <>
              <Text style={styles.listTitle}>Pred istekom (7 dana)</Text>
              {insights.endingSoon.length === 0 ? (
                <Text style={styles.empty}>Nitko ne ističe uskoro.</Text>
              ) : (
                insights.endingSoon.map(({ item, left }) => (
                  <View key={item.id} style={styles.insightRow}>
                    <View style={styles.insightCopy}>
                      <Text style={styles.insightName}>{memberName(item)}</Text>
                      <Text style={styles.insightMeta}>
                        do {formatShortDate(item.validUntil)}
                      </Text>
                    </View>
                    <Text style={styles.insightWarn}>
                      {left === 0 ? 'Danas' : `Još ${left} d`}
                    </Text>
                  </View>
                ))
              )}

              <Text style={styles.listTitle}>Paket skoro potrošen</Text>
              {insights.packageHot.length === 0 ? (
                <Text style={styles.empty}>Nema paketa blizu limitu.</Text>
              ) : (
                insights.packageHot.map(({ item, used, total }) => (
                  <View key={item.id} style={styles.insightRow}>
                    <View style={styles.insightCopy}>
                      <Text style={styles.insightName}>{memberName(item)}</Text>
                      <Text style={styles.insightMeta}>
                        {item.planName || 'Plan'}
                      </Text>
                    </View>
                    <Text style={styles.insightValue}>
                      {used}/{total}
                    </Text>
                  </View>
                ))
              )}

              <Text style={styles.listTitle}>Bez dolaska ovaj mjesec</Text>
              {insights.noVisit.length === 0 ? (
                <Text style={styles.empty}>
                  Svi aktivni imaju barem jedan dolazak.
                </Text>
              ) : (
                insights.noVisit.map((item) => (
                  <View key={item.id} style={styles.insightRow}>
                    <View style={styles.insightCopy}>
                      <Text style={styles.insightName}>{memberName(item)}</Text>
                      <Text style={styles.insightMeta}>
                        {item.user?.email || 'Bez e-pošte'}
                      </Text>
                    </View>
                    <Text style={styles.insightValue}>0</Text>
                  </View>
                ))
              )}
            </>
          )}

          <Text style={styles.fine}>
            Redovitost = udio aktivnih članova s barem jednom rezervacijom u
            tekućem mjesecu.
          </Text>
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
  flex: { flex: 1, minHeight: 0 },
  stage: {
    flexGrow: 1,
    paddingHorizontal: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: -6,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: '#5EEAD4',
    maxWidth: 260,
  },
  title: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.6,
    color: '#E8F2EF',
    marginBottom: 8,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.66)',
    marginBottom: 16,
  },
  fixtureBanner: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(251, 191, 36, 0.95)',
    marginBottom: 10,
  },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(251, 113, 133, 0.95)',
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  stat: {
    width: '31%',
    flexGrow: 1,
    minWidth: '30%',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.12)',
    backgroundColor: 'rgba(10, 20, 18, 0.28)',
    gap: 4,
  },
  statWide: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.12)',
    backgroundColor: 'rgba(10, 20, 18, 0.28)',
    gap: 4,
  },
  statWarn: {
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  statLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
  },
  statValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#E8F2EF',
  },
  blockHead: {
    marginBottom: 10,
  },
  blockTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#E8F2EF',
    marginTop: -4,
    marginBottom: 4,
  },
  blockLead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  monthList: {
    marginBottom: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(232, 242, 239, 0.12)',
  },
  monthRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(232, 242, 239, 0.12)',
    gap: 4,
  },
  monthName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#F7FCFA',
  },
  monthMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  memberStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  listTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#E8F2EF',
    marginTop: 8,
    marginBottom: 6,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(232, 242, 239, 0.1)',
  },
  insightCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  insightName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#F7FCFA',
  },
  insightMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.48)',
  },
  insightWarn: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: 'rgba(251, 191, 36, 0.95)',
  },
  insightValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: '#5EEAD4',
  },
  empty: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(232, 242, 239, 0.5)',
    marginBottom: 10,
  },
  fine: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(232, 242, 239, 0.4)',
    marginTop: 16,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
  },
  pressed: { opacity: 0.72 },
});
