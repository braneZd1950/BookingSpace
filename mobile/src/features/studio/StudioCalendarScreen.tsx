import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listTenantBookings } from '../../api/bookings.js';
import { listServices } from '../../api/services.js';
import { isLocalDesignMode } from './localDesignFixtures.js';
import StudioScreenShell from './StudioScreenShell';
import { studioChromeStyles as chrome } from './studioChrome.js';
import { studioUiStyles as ui } from './studioUiStyles.js';
import {
  formatDay,
  monthCells,
  monthLabel,
  sameDay,
  toDateKey,
} from './studioTime.js';
import {
  DEFAULT_CAPACITY,
  dayPeak,
  occupancyLevel,
} from '../../../../shared/calendarOccupancy.js';
type StudioCalendarScreenProps = {
  tenantId?: string;
  studioName?: string;
  onBack: () => void;
};

type BookingRow = {
  id: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  user?: { name?: string } | null;
  serviceCapacity?: number;
};

const WEEK = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

const LEGEND = [
  { id: 'free', label: 'Slobodno', color: 'rgba(232, 242, 239, 0.12)' },
  { id: 'low', label: 'Nisko', color: 'rgba(94, 234, 212, 0.22)' },
  { id: 'mid', label: 'Srednje', color: 'rgba(94, 234, 212, 0.4)' },
  { id: 'high', label: 'Visoko', color: 'rgba(251, 191, 36, 0.45)' },
  { id: 'max', label: 'Puno', color: 'rgba(251, 113, 133, 0.45)' },
];

function localMonthBookings(year: number, month: number): BookingRow[] {
  if (!isLocalDesignMode()) return [];
  const items: BookingRow[] = [];
  const days = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= days; day += 1) {
    const date = new Date(year, month, day);
    if (date.getDay() === 0) continue;
    const pattern = (day + month) % 5;
    if (pattern === 0) continue;
    const count = pattern === 1 ? 1 : pattern === 2 ? 3 : pattern === 3 ? 6 : 2;
    for (let i = 0; i < count; i += 1) {
      const hour = 8 + (i % 6);
      items.push({
        id: `local-cal-${year}-${month}-${day}-${i}`,
        date: toDateKey(date),
        startTime: `${String(hour).padStart(2, '0')}:00`,
        endTime: `${String(hour + 1).padStart(2, '0')}:00`,
        status: 'CONFIRMED',
        user: { name: i % 2 ? 'Ana Kovač' : 'Marko Horvat' },
        serviceCapacity: DEFAULT_CAPACITY,
      });
    }
  }
  return items;
}

/**
 * Kalendar — mjesečni pregled zauzetosti.
 */
export default function StudioCalendarScreen({
  tenantId,
  studioName,
  onBack,
}: StudioCalendarScreenProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => toDateKey(new Date()));
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingLocalFixtures, setUsingLocalFixtures] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const byDate = useMemo(() => {
    const map = new Map<string, BookingRow[]>();
    for (const item of bookings) {
      if (item.status !== 'CONFIRMED' && item.status !== 'COMPLETED') continue;
      const key = String(item.date || '');
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [bookings]);

  const selectedList = useMemo(() => {
    const list = byDate.get(selected) || [];
    return [...list].sort((a, b) =>
      String(a.startTime || '').localeCompare(String(b.startTime || '')),
    );
  }, [byDate, selected]);

  const load = useCallback(async () => {
    const dateFrom = toDateKey(new Date(year, month, 1));
    const dateTo = toDateKey(new Date(year, month + 1, 0));

    if (isLocalDesignMode()) {
      setUsingLocalFixtures(true);
      setBookings(localMonthBookings(year, month));
      setCapacity(DEFAULT_CAPACITY);
      setLoading(false);
      setError('');
      return;
    }

    setUsingLocalFixtures(false);
    if (!tenantId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [bookingData, serviceData] = await Promise.all([
        listTenantBookings(tenantId, { dateFrom, dateTo, limit: 500 }),
        listServices(tenantId),
      ]);
      const services = Array.isArray(serviceData?.services) ? serviceData.services : [];
      const primary = services.find((item: { active?: boolean }) => item.active !== false)
        || services[0];
      setCapacity(Number(primary?.capacity) || DEFAULT_CAPACITY);
      setBookings(Array.isArray(bookingData?.bookings) ? bookingData.bookings : []);
    } catch {
      setBookings([]);
      setError('Kalendar se nije učitao.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, year, month]);

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
      title="Kalendar"
      lead="Mjesečni pregled zauzetosti. Detalji i rezervacije po danu."
    >
      {usingLocalFixtures ? (
        <Text style={ui.fixtureBanner}>
          Lokalni demo podaci — samo za dizajn (__DEV__).
        </Text>
      ) : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}

          <View style={styles.monthNav}>
            <Pressable
              onPress={() => setCursor(new Date(year, month - 1, 1))}
              style={({ pressed }) => [styles.navBtn, pressed && ui.pressed]}
            >
              <Ionicons name="chevron-back" size={18} color="#5EEAD4" />
            </Pressable>
            <Text style={styles.monthTitle}>{monthLabel(cursor)}</Text>
            <Pressable
              onPress={() => setCursor(new Date(year, month + 1, 1))}
              style={({ pressed }) => [styles.navBtn, pressed && ui.pressed]}
            >
              <Ionicons name="chevron-forward" size={18} color="#5EEAD4" />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEK.map((label) => (
              <Text key={label} style={styles.weekLabel}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((cell, index) => {
              if (!cell) {
                return <View key={`pad-${index}`} style={styles.cellEmpty} />;
              }
              const key = toDateKey(cell);
              const list = byDate.get(key) || [];
              const peak = dayPeak(list, capacity);
              const level = occupancyLevel(peak.ratio);
              const legend = LEGEND.find((item) => item.id === level);
              const active = key === selected;
              const today = sameDay(cell, new Date());
              return (
                <Pressable
                  key={key}
                  onPress={() => setSelected(key)}
                  style={({ pressed }) => [
                    styles.cell,
                    { backgroundColor: legend?.color },
                    active && styles.cellActive,
                    pressed && ui.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.cellDay,
                      today && styles.cellToday,
                      active && styles.cellDayActive,
                    ]}
                  >
                    {cell.getDate()}
                  </Text>
                  {peak.count > 0 ? (
                    <Text style={styles.cellCount}>{peak.count}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legend}>
            {LEGEND.map((item) => (
              <View key={item.id} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

      <Text style={ui.sectionLabel}>Odabrani dan</Text>
      <Text style={styles.dayTitle}>{formatDay(new Date(`${selected}T12:00:00`))}</Text>
      {selectedList.length === 0 ? (
        <Text style={styles.emptyLine}>Nema rezervacija za ovaj dan.</Text>
      ) : (
        selectedList.map((item) => (
          <View key={item.id} style={styles.dayRow}>
            <Text style={styles.rowTime}>
              {item.startTime}–{item.endTime}
            </Text>
            <Text style={ui.rowMeta}>{item.user?.name || 'Član'}</Text>
          </View>
        ))
      )}
    </StudioScreenShell>
  );
}

const styles = StyleSheet.create({
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
  },
  monthTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#E8F2EF',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    color: 'rgba(232, 242, 239, 0.42)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellEmpty: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 1,
  },
  cellActive: {
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.7)',
  },
  cellDay: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: '#E8F2EF',
  },
  cellToday: {
    color: '#5EEAD4',
  },
  cellDayActive: {
    color: '#F7FCFA',
  },
  cellCount: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  dayTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#E8F2EF',
    marginBottom: 8,
  },
  emptyLine: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.5)',
  },
  dayRow: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(232, 242, 239, 0.12)',
    gap: 2,
  },
  rowTime: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#F7FCFA',
  },
});
