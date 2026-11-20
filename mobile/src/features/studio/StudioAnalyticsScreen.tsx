import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStudioAnalytics } from '../../api/analytics.js';
import { listTenantBookings } from '../../api/bookings.js';
import { listMemberships } from '../../api/memberships.js';
import { legalEntity } from '../auth/platformLegal.js';
import {
  isLocalDesignMode,
  localDesignAnalytics,
  localDesignMembers,
} from './localDesignFixtures.js';
import StudioBoot from './StudioBoot';
import StudioScreenShell from './StudioScreenShell';
import { studioUiStyles as ui } from './studioUiStyles.js';
import { rollingDaysRange } from '../../../../shared/dateRange.js';
import {
  buildMemberInsights,
  memberName,
} from '../../../../shared/memberInsights.js';

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

type BookingSeriesRow = {
  date: string;
  total: number;
};

type AnalyticsPayload = {
  days?: number;
  counts?: Record<string, number>;
  bookingsByStatus?: Record<string, number>;
  bookingsTotal?: number;
  bookingsSeries?: BookingSeriesRow[];
  comparison?: Record<string, { current?: number; previous?: number; deltaPct?: number | null }>;
  period?: {
    dateFrom?: string;
    dateTo?: string;
    previousFrom?: string;
    previousTo?: string;
  };
};

const PERIOD_OPTIONS = [
  { days: 7, label: '7 d' },
  { days: 30, label: '30 d' },
  { days: 90, label: '90 d' },
];

function resolveWebAnalyticsUrl() {
  const fromEnv = String(
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_WEB_URL) || '',
  ).trim();
  const base = (fromEnv || legalEntity.website || '').replace(/\/$/, '');
  if (!base || /localhost|127\.0\.0\.1/i.test(base)) return '';
  return `${base}/stranica/analitika`;
}

function formatPeriodShort(dateFrom?: string, dateTo?: string) {
  if (!dateFrom || !dateTo) return '';
  try {
    const [y1, m1, d1] = dateFrom.split('-').map(Number);
    const [y2, m2, d2] = dateTo.split('-').map(Number);
    const start = new Date(y1, m1 - 1, d1);
    const end = new Date(y2, m2 - 1, d2);
    return new Intl.DateTimeFormat('hr-HR', {
      day: 'numeric',
      month: 'short',
    }).formatRange(start, end);
  } catch {
    return `${dateFrom} – ${dateTo}`;
  }
}

function DeltaText({ metric }: { metric?: { deltaPct?: number | null } | null }) {
  if (!metric || metric.deltaPct == null) {
    return <Text style={styles.deltaFlat}>—</Text>;
  }
  const value = metric.deltaPct;
  const sign = value > 0 ? '+' : '';
  return (
    <Text style={value > 0 ? styles.deltaUp : value < 0 ? styles.deltaDown : styles.deltaFlat}>
      {sign}
      {value}
      %
    </Text>
  );
}

/**
 * Mobilna analitika — sažetak, mini grafikon, članarine i upozorenja.
 */
export default function StudioAnalyticsScreen({
  tenantId,
  studioName,
  onBack,
}: StudioAnalyticsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingLocalFixtures, setUsingLocalFixtures] = useState(false);
  const [days, setDays] = useState(30);
  const [payload, setPayload] = useState<AnalyticsPayload>({});
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const webAnalyticsUrl = useMemo(() => resolveWebAnalyticsUrl(), []);

  const insights = useMemo(
    () => buildMemberInsights(memberships, bookings),
    [memberships, bookings],
  );

  const bookingsSeries = payload.bookingsSeries || [];
  const bookingsTotal = Number(payload.bookingsTotal) || 0;
  const status = payload.bookingsByStatus || {};
  const comparison = payload.comparison || {};
  const maxBookings = Math.max(1, ...bookingsSeries.map((row) => Number(row.total) || 0));
  const chartSample = useMemo(() => {
    if (bookingsSeries.length <= 14) return bookingsSeries;
    const step = Math.ceil(bookingsSeries.length / 14);
    return bookingsSeries.filter((_, index) => (
      index === 0
      || index === bookingsSeries.length - 1
      || index % step === 0
    ));
  }, [bookingsSeries]);

  const load = useCallback(async () => {
    if (isLocalDesignMode()) {
      const demo = localDesignAnalytics() as AnalyticsPayload;
      setUsingLocalFixtures(true);
      setPayload(demo);
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
    const range = rollingDaysRange(days);
    try {
      const [analytics, membersData, bookingData] = await Promise.all([
        getStudioAnalytics(tenantId, days),
        listMemberships(tenantId),
        listTenantBookings(tenantId, {
          dateFrom: range.dateFrom,
          dateTo: range.dateTo,
          limit: 500,
        }),
      ]);
      setPayload((analytics || {}) as AnalyticsPayload);
      setMemberships(
        Array.isArray(membersData?.memberships) ? membersData.memberships : [],
      );
      setBookings(Array.isArray(bookingData?.bookings) ? bookingData.bookings : []);
    } catch {
      setError('Analitika nije dostupna. Pokušajte ponovno.');
      setPayload({});
      setMemberships([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const openWebApp = useCallback(async () => {
    if (!webAnalyticsUrl) return;
    try {
      await Linking.openURL(webAnalyticsUrl);
    } catch {
      setError('Web aplikacija nije dostupna na ovom uređaju.');
    }
  }, [webAnalyticsUrl]);

  if (loading) return <StudioBoot />;

  const periodLabel = formatPeriodShort(
    payload.period?.dateFrom,
    payload.period?.dateTo,
  ) || `Zadnjih ${days} dana`;

  const alertItems = [
    ...insights.packageHot.map(({ item, used, total }) => ({
      id: `pkg-${item.id}`,
      name: memberName(item),
      detail: `Paket ${used}/${total} treninga iskorišteno`,
      tone: 'warn' as const,
    })),
    ...insights.endingSoon.map(({ item, left }) => ({
      id: `end-${item.id}`,
      name: memberName(item),
      detail: left === 0
        ? 'Članarina istječe danas'
        : `Članarina istječe za ${left} d`,
      tone: 'warn' as const,
    })),
  ];

  return (
    <StudioScreenShell
      studioName={studioName}
      onBack={onBack}
      title="Analitika"
      lead="Ova analitika prikazuje podatke vašeg poslovanja i dostupna je samo ovlaštenim korisnicima."
    >
      {usingLocalFixtures ? (
        <Text style={ui.fixtureBanner}>
          Lokalni demo podaci — samo za dizajn (__DEV__).
        </Text>
      ) : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}

      <View style={styles.periodRow}>
        {PERIOD_OPTIONS.map((option) => (
          <Pressable
            key={option.days}
            onPress={() => setDays(option.days)}
            style={({ pressed }) => [
              styles.periodChip,
              days === option.days && styles.periodChipActive,
              pressed && ui.pressed,
            ]}
          >
            <Text
              style={[
                styles.periodChipLabel,
                days === option.days && styles.periodChipLabelActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.periodMeta}>{periodLabel}</Text>

      <Text style={ui.sectionLabel}>Sažetak</Text>
      <View style={styles.statsGrid}>
        <View style={[ui.stat, styles.statTile]}>
          <Text style={ui.statLabel}>Rezervacije</Text>
          <Text style={ui.statValue}>{bookingsTotal}</Text>
          <DeltaText metric={comparison.bookingsTotal} />
        </View>
        <View style={[ui.stat, styles.statTile]}>
          <Text style={ui.statLabel}>Završeni</Text>
          <Text style={ui.statValue}>{status.COMPLETED || 0}</Text>
          <DeltaText metric={comparison.COMPLETED} />
        </View>
        <View style={[ui.stat, styles.statTile]}>
          <Text style={ui.statLabel}>Otkazi</Text>
          <Text style={ui.statValue}>{status.CANCELLED || 0}</Text>
          <DeltaText metric={comparison.CANCELLED} />
        </View>
        <View style={[ui.stat, styles.statTile]}>
          <Text style={ui.statLabel}>Nedolasci</Text>
          <Text style={ui.statValue}>{status.NO_SHOW || 0}</Text>
          <DeltaText metric={comparison.NO_SHOW} />
        </View>
      </View>

      <View style={styles.blockHead}>
        <Text style={ui.sectionLabel}>Trend</Text>
        <Text style={styles.blockTitle}>Rezervacije kroz vrijeme</Text>
      </View>
      {bookingsTotal === 0 ? (
        <Text style={styles.empty}>Još nema dovoljno podataka za grafikon.</Text>
      ) : (
        <View style={styles.miniChart}>
          {chartSample.map((row) => {
            const value = Number(row.total) || 0;
            const height = Math.max(value ? 6 : 2, (value / maxBookings) * 72);
            return (
              <View key={row.date} style={styles.miniCol}>
                <View style={[styles.miniBar, { height }]} />
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.blockHead}>
        <Text style={ui.sectionLabel}>Članarine</Text>
        <Text style={styles.blockTitle}>Stanje članova</Text>
      </View>
      <View style={styles.memberStats}>
        <View style={[ui.stat, styles.statTile]}>
          <Text style={ui.statLabel}>Aktivni</Text>
          <Text style={ui.statValue}>{insights.activeCount}</Text>
        </View>
        <View style={[ui.stat, styles.statTile]}>
          <Text style={ui.statLabel}>Redovitost</Text>
          <Text style={ui.statValue}>{insights.regularity}%</Text>
          <Text style={styles.statHint}>
            {insights.withVisitCount}
            {' '}
            od
            {' '}
            {insights.activeCount}
          </Text>
        </View>
        <View
          style={[
            ui.stat,
            styles.statTile,
            insights.packageHotCount > 0 && ui.statWarn,
          ]}
        >
          <Text style={ui.statLabel}>Paketi pri kraju</Text>
          <Text style={ui.statValue}>{insights.packageHotCount}</Text>
        </View>
        <View
          style={[
            ui.stat,
            styles.statTile,
            insights.endingSoonCount > 0 && ui.statWarn,
          ]}
        >
          <Text style={ui.statLabel}>Pred istekom</Text>
          <Text style={ui.statValue}>{insights.endingSoonCount}</Text>
        </View>
      </View>

      <View style={styles.blockHead}>
        <Text style={ui.sectionLabel}>Pažnja</Text>
        <Text style={styles.blockTitle}>Potrebna pažnja</Text>
      </View>
      {alertItems.length === 0 && insights.noVisitCount === 0 ? (
        <Text style={styles.empty}>Nema upozorenja za ovo razdoblje.</Text>
      ) : (
        <>
          {alertItems.map((item) => (
            <View key={item.id} style={styles.insightRow}>
              <View style={styles.insightCopy}>
                <Text style={styles.insightName}>{item.name}</Text>
                <Text style={styles.insightMeta}>{item.detail}</Text>
              </View>
              <Text style={styles.insightWarn}>!</Text>
            </View>
          ))}
          {insights.noVisitCount > 0 ? (
            <View style={styles.insightRow}>
              <View style={styles.insightCopy}>
                <Text style={styles.insightName}>
                  {insights.noVisitCount}
                  {' '}
                  {insights.noVisitCount === 1 ? 'član bez dolaska' : 'članova bez dolaska'}
                </Text>
                <Text style={styles.insightMeta}>
                  Tijekom odabranog razdoblja
                </Text>
              </View>
              <Text style={styles.insightValue}>{insights.noVisitCount}</Text>
            </View>
          ) : null}
        </>
      )}

      <View style={ui.footerNote}>
        <Text style={ui.hint}>
          Detaljne grafikone, usporedbu razdoblja i popise članova otvorite u web aplikaciji.
        </Text>
        {webAnalyticsUrl ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Otvori detaljnu analitiku na webu"
            onPress={() => {
              void openWebApp();
            }}
            style={({ pressed }) => [ui.textLinkBtn, pressed && ui.pressed]}
          >
            <Text style={ui.textLinkLabel}>Detaljna analitika na webu</Text>
            <Ionicons name="open-outline" size={16} color="#14B8A6" />
          </Pressable>
        ) : null}
      </View>
    </StudioScreenShell>
  );
}

const styles = StyleSheet.create({
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  periodChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.18)',
    backgroundColor: 'rgba(15, 28, 26, 0.45)',
  },
  periodChipActive: {
    borderColor: 'rgba(20, 184, 166, 0.55)',
    backgroundColor: 'rgba(20, 184, 166, 0.16)',
  },
  periodChipLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.7)',
  },
  periodChipLabelActive: {
    color: '#5EEAD4',
  },
  periodMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.45)',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  statTile: {
    width: '47%',
    flexGrow: 1,
    minWidth: '46%',
    flex: undefined,
  },
  statHint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: 'rgba(232, 242, 239, 0.45)',
    marginTop: 2,
  },
  deltaUp: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    color: '#5EEAD4',
    marginTop: 2,
  },
  deltaDown: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    color: 'rgba(251, 191, 36, 0.95)',
    marginTop: 2,
  },
  deltaFlat: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: 'rgba(232, 242, 239, 0.35)',
    marginTop: 2,
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
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 84,
    marginBottom: 22,
    paddingHorizontal: 2,
  },
  miniCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  miniBar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: '#14B8A6',
  },
  memberStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
    color: '#14B8A6',
  },
  empty: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(232, 242, 239, 0.5)',
    marginBottom: 10,
  },
});
