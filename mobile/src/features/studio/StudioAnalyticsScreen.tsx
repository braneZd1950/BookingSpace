import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getStudioAnalytics } from '../../api/analytics.js';
import { listTenantBookings } from '../../api/bookings.js';
import { listMemberships } from '../../api/memberships.js';
import {
  isLocalDesignMode,
  localDesignAnalytics,
  localDesignMembers,
} from './localDesignFixtures.js';
import StudioScreenShell from './StudioScreenShell';
import { formatShortDate } from './studioFormat.js';
import { studioChromeStyles as chrome } from './studioChrome.js';
import { studioUiStyles as ui } from './studioUiStyles.js';
import { monthRange } from '../../../../shared/dateRange.js';
import {
  buildMemberInsights,
  formatMonthHr,
  memberName,
  seriesByMonth,
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

const LABELS: { key: string; label: string }[] = [
  { key: 'page_view', label: 'Posjeti' },
  { key: 'login_success', label: 'Prijave' },
  { key: 'member_created', label: 'Dodani članovi' },
  { key: 'booking_created', label: 'Rezervacije' },
  { key: 'booking_cancelled', label: 'Otkazi' },
  { key: 'booking_completed', label: 'Završeni' },
  { key: 'booking_no_show', label: 'Nedolasci' },
];

/**
 * Analitika studija — brojke (30 dana) + uvidi članarina.
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

  if (loading) {
    return (
      <View style={chrome.boot}>
        <ActivityIndicator color="#5EEAD4" />
      </View>
    );
  }

  return (
    <StudioScreenShell
      studioName={studioName}
      onBack={onBack}
      title="Analitika"
      lead={`Samo vaš studio — zadnjih ${days} dana. Drugi studiji i platforma ne vide ove brojke.`}
    >
      {usingLocalFixtures ? (
        <Text style={ui.fixtureBanner}>
          Lokalni demo podaci — samo za dizajn (__DEV__).
        </Text>
      ) : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}

      <Text style={ui.sectionLabel}>Pregled</Text>
      <View style={styles.statsGrid}>
        {LABELS.map((item) => (
          <View key={item.key} style={[ui.stat, styles.statTile]}>
            <Text style={ui.statLabel}>{item.label}</Text>
            <Text style={ui.statValue}>{counts[item.key] || 0}</Text>
          </View>
        ))}
      </View>

          <View style={styles.blockHead}>
      <Text style={ui.sectionLabel}>Vrijeme</Text>
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
      <Text style={ui.sectionLabel}>Članovi</Text>
            <Text style={styles.blockTitle}>Stanje članarina</Text>
            <Text style={styles.blockLead}>
              Redovitost, pred istekom i paketi skoro potrošeni.
            </Text>
          </View>

          <View style={styles.memberStats}>
        <View style={[ui.stat, styles.statTile]}>
          <Text style={ui.statLabel}>Aktivni</Text>
          <Text style={ui.statValue}>{insights.activeCount}</Text>
        </View>
        <View style={[ui.stat, styles.statTile]}>
          <Text style={ui.statLabel}>Redovitost</Text>
          <Text style={ui.statValue}>{insights.regularity}%</Text>
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
        <View
          style={[
            ui.stat,
            styles.statTile,
            insights.packageHotCount > 0 && ui.statWarn,
          ]}
        >
          <Text style={ui.statLabel}>Paket skoro</Text>
          <Text style={ui.statValue}>{insights.packageHotCount}</Text>
        </View>
        <View style={[ui.statWide, styles.statTileWide]}>
          <Text style={ui.statLabel}>Bez dolaska (mjesec)</Text>
          <Text style={ui.statValue}>{insights.noVisitCount}</Text>
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
    </StudioScreenShell>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  statTile: {
    width: '31%',
    flexGrow: 1,
    minWidth: '30%',
    flex: undefined,
  },
  statTileWide: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    flex: undefined,
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
});
