import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getStudioAnalytics, type StudioAnalytics } from '../api/analytics';
import { listTenantBookings, type Booking } from '../api/bookings';
import { listMemberships, type Membership } from '../api/memberships';
import { useStudio } from '../features/studio/StudioContext';
import { tokens } from '../theme/tokens';
import { makeAnalyticsStyles } from '../ui/analyticsStyles';

const REAL_ID = /^[a-f\d]{24}$/i;

const LABELS: Record<string, string> = {
  page_view: 'Posjeti',
  login_success: 'Prijave (vezane uz studio)',
  member_created: 'Dodani članovi',
  booking_created: 'Rezervacije',
  booking_cancelled: 'Otkazi',
  booking_completed: 'Završeni termini',
  booking_no_show: 'Nedolasci',
};

function formatMonthHr(yearMonth: string) {
  const [year, month] = String(yearMonth).split('-').map(Number);
  if (!year || !month) return yearMonth;
  const label = new Intl.DateTimeFormat('hr-HR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('hr-HR', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function daysLeft(until?: string) {
  if (!until) return null;
  const end = new Date(`${until}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

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

function seriesByMonth(series: Array<Record<string, number | string>>) {
  const map = new Map<string, {
    month: string;
    page_view: number;
    booking_created: number;
    booking_cancelled: number;
    member_created: number;
  }>();
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

function memberName(item: Membership) {
  return item.user?.name || item.user?.email || 'Član';
}

function buildMemberInsights(memberships: Membership[], bookings: Booking[]) {
  const active = memberships.filter((item) => item.status === 'ACTIVE');
  const visitsByUser = new Map<string, number>();
  for (const booking of bookings) {
    if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') continue;
    const id = String(booking.userId || '');
    if (!id) continue;
    visitsByUser.set(id, (visitsByUser.get(id) || 0) + 1);
  }

  const endingSoon: Array<{ item: Membership; left: number; visits: number }> = [];
  const packageHot: Array<{ item: Membership; used: number; total: number; ratio: number }> = [];
  const noVisit: Membership[] = [];
  let withVisit = 0;

  for (const item of active) {
    const userId = String(item.userId || '');
    const left = daysLeft(item.validUntil);
    const visits = visitsByUser.get(userId) || 0;
    if (visits > 0) withVisit += 1;
    else noVisit.push(item);

    if (left != null && left >= 0 && left <= 7) {
      endingSoon.push({ item, left, visits });
    }

    const included = item.sessionsIncluded;
    if (included != null) {
      const used = Number(item.sessionsUsed) || 0;
      const total = Number(included) || 0;
      if (total > 0 && used / total >= 0.85) {
        packageHot.push({ item, used, total, ratio: used / total });
      }
    }
  }

  endingSoon.sort((a, b) => a.left - b.left);
  packageHot.sort((a, b) => b.ratio - a.ratio);
  noVisit.sort((a, b) => memberName(a).localeCompare(memberName(b)));

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

export function AnalyticsView() {
  const router = useRouter();
  const { studio, ready: studioReady } = useStudio();
  const brand = studio?.theme.primaryColor || tokens.brand;
  const soft = studio?.theme.secondaryColor || tokens.brandSoft;
  const ink = studio?.theme.ink || tokens.fg;
  const styles = useMemo(() => makeAnalyticsStyles(brand, soft, ink), [brand, soft, ink]);

  const tenantId = String(studio?.id || '');
  const ready = REAL_ID.test(tenantId);
  const range = useMemo(() => monthRange(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<StudioAnalytics | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const load = useCallback(async () => {
    if (!ready) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const [analytics, mems, bookingRows] = await Promise.all([
        getStudioAnalytics(tenantId, 30),
        listMemberships(tenantId),
        listTenantBookings(tenantId, {
          dateFrom: range.dateFrom,
          dateTo: range.dateTo,
          limit: 500,
        }),
      ]);
      setData(analytics);
      setMemberships(mems);
      setBookings(bookingRows);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [ready, tenantId, range.dateFrom, range.dateTo]);

  useEffect(() => {
    if (!studioReady) return;
    void load();
  }, [studioReady, load]);

  const insights = useMemo(
    () => buildMemberInsights(memberships, bookings),
    [memberships, bookings],
  );

  if (!studioReady || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
        <ActivityIndicator color={brand} size="large" />
      </View>
    );
  }

  if (!ready) {
    return (
      <ScrollView contentContainerStyle={styles.stage}>
        <View style={styles.head}>
          <Text style={styles.eyebrow}>Uvidi</Text>
          <Text style={styles.title}>Analitika</Text>
          <View style={styles.accent} />
          <Text style={styles.lede}>Studio još nije u bazi.</Text>
        </View>
      </ScrollView>
    );
  }

  if (error || !data) {
    return (
      <ScrollView contentContainerStyle={styles.stage}>
        <View style={styles.head}>
          <Text style={styles.eyebrow}>Uvidi</Text>
          <Text style={styles.title}>Analitika</Text>
          <View style={styles.accent} />
          <Text style={styles.lede}>Podaci nisu dostupni.</Text>
        </View>
      </ScrollView>
    );
  }

  const counts = data.counts || {};
  const months = seriesByMonth(data.series || []);
  const totalBookings = counts.booking_created || 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.stage} showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <Text style={styles.eyebrow}>Uvidi</Text>
        <Text style={styles.title}>Analitika</Text>
        <View style={styles.accent} />
        <Text style={styles.lede}>
          Samo tvoj studio — zadnjih {data.days} dana. Drugi studiji i platforma ne vide ove brojke.
        </Text>
        <View style={styles.period}>
          <Text style={styles.periodLabel}>Razdoblje</Text>
          <Text style={styles.periodValue}>{data.days} dana</Text>
        </View>
      </View>

      <View style={styles.stats} accessibilityLabel="Akcije studija">
        {Object.entries(LABELS).map(([key, label]) => (
          <View key={key} style={styles.stat}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{counts[key] || 0}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.index}>01</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Vrijeme</Text>
            <Text style={styles.panelTitle}>Po mjesecima</Text>
            <Text style={styles.panelSub}>
              Zbroj posjeta, rezervacija, otkaza i novih članova po mjesecu.
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaCount}>{totalBookings}</Text>
            <Text style={styles.metaLabel}>rezervacija</Text>
          </View>
        </View>

        {months.length === 0 ? (
          <Text style={styles.empty}>Još nema podataka za ovo razdoblje.</Text>
        ) : (
          months.map((row) => (
            <View key={row.month} style={styles.monthRow}>
              <Text style={styles.monthName}>{formatMonthHr(row.month)}</Text>
              <Text style={styles.monthMetric}>
                Posjeti: <Text style={styles.monthMetricStrong}>{row.page_view}</Text>
              </Text>
              <Text style={styles.monthMetric}>
                Rezervacije: <Text style={styles.monthMetricStrong}>{row.booking_created}</Text>
              </Text>
              <Text style={styles.monthMetric}>
                Otkazi: <Text style={styles.monthMetricStrong}>{row.booking_cancelled}</Text>
              </Text>
              <Text style={styles.monthMetric}>
                Članovi: <Text style={styles.monthMetricStrong}>{row.member_created}</Text>
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.index}>02</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Članovi</Text>
            <Text style={styles.panelTitle}>Stanje članarina</Text>
            <Text style={styles.panelSub}>
              Aktivni, redovitost dolazaka ovaj mjesec, pred istekom i paketi skoro potrošeni.
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaCount}>{insights.activeCount}</Text>
            <Text style={styles.metaLabel}>aktivnih</Text>
          </View>
        </View>

        <View style={styles.memberStats}>
          <View style={styles.memberStat}>
            <Text style={styles.statLabel}>Aktivni</Text>
            <Text style={styles.statValue}>{insights.activeCount}</Text>
          </View>
          <View style={styles.memberStat}>
            <Text style={styles.statLabel}>Redovitost</Text>
            <Text style={styles.statValue}>{insights.regularity}%</Text>
          </View>
          <View style={[styles.memberStat, insights.endingSoonCount > 0 && styles.memberStatWarn]}>
            <Text style={styles.statLabel}>Pred istekom</Text>
            <Text style={styles.statValue}>{insights.endingSoonCount}</Text>
          </View>
          <View style={[styles.memberStat, insights.packageHotCount > 0 && styles.memberStatWarn]}>
            <Text style={styles.statLabel}>Paket skoro potrošen</Text>
            <Text style={styles.statValue}>{insights.packageHotCount}</Text>
          </View>
          <View style={[styles.memberStat, { width: '100%', borderRightWidth: 0 }]}>
            <Text style={styles.statLabel}>Bez dolaska (mjesec)</Text>
            <Text style={styles.statValue}>{insights.noVisitCount}</Text>
          </View>
        </View>

        {insights.activeCount === 0 ? (
          <Text style={styles.empty}>
            Još nema aktivnih članova.{' '}
            <Text style={styles.link} onPress={() => router.push('/(app)/clanovi')}>
              Dodajte člana
            </Text>
            .
          </Text>
        ) : (
          <>
            <View style={styles.listBlock}>
              <Text style={styles.listTitle}>Pred istekom (7 dana)</Text>
              {insights.endingSoon.length === 0 ? (
                <Text style={styles.empty}>Nitko ne ističe uskoro.</Text>
              ) : (
                insights.endingSoon.map(({ item, left }) => (
                  <View key={item.id} style={styles.listItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listName}>{memberName(item)}</Text>
                      <Text style={styles.listMeta}>do {formatDate(item.validUntil)}</Text>
                    </View>
                    <Text style={[styles.listEm, styles.listEmWarn]}>
                      {left === 0 ? 'Danas' : `Još ${left} d`}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.listBlock}>
              <Text style={styles.listTitle}>Paket skoro potrošen</Text>
              {insights.packageHot.length === 0 ? (
                <Text style={styles.empty}>Nema paketa blizu limitu.</Text>
              ) : (
                insights.packageHot.map(({ item, used, total }) => (
                  <View key={item.id} style={styles.listItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listName}>{memberName(item)}</Text>
                      <Text style={styles.listMeta}>{item.planName || 'Plan'}</Text>
                    </View>
                    <Text style={styles.listEm}>{used}/{total}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.listBlock}>
              <Text style={styles.listTitle}>Bez dolaska ovaj mjesec</Text>
              {insights.noVisit.length === 0 ? (
                <Text style={styles.empty}>Svi aktivni imaju barem jedan dolazak.</Text>
              ) : (
                insights.noVisit.map((item) => (
                  <View key={item.id} style={styles.listItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listName}>{memberName(item)}</Text>
                      <Text style={styles.listMeta}>{item.user?.email || 'Bez e-pošte'}</Text>
                    </View>
                    <Text style={styles.listEm}>0</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        <Text style={styles.fine}>
          Redovitost = udio aktivnih članova s barem jednom rezervacijom u tekućem mjesecu.{' '}
          <Text style={styles.link} onPress={() => router.push('/(app)/clanovi')}>
            Otvori članove
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}
