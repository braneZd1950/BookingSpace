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
import { listTenantBookings } from '../../api/bookings.js';
import { listServices } from '../../api/services.js';
import AuthLegalStrip from '../auth/AuthLegalStrip';
import { isLocalDesignMode } from './localDesignFixtures.js';
import {
  formatDay,
  monthCells,
  monthLabel,
  sameDay,
  toDateKey,
} from './studioTime.js';

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
const DEFAULT_CAPACITY = 12;

const LEGEND = [
  { id: 'free', label: 'Slobodno', color: 'rgba(232, 242, 239, 0.12)' },
  { id: 'low', label: 'Nisko', color: 'rgba(94, 234, 212, 0.22)' },
  { id: 'mid', label: 'Srednje', color: 'rgba(94, 234, 212, 0.4)' },
  { id: 'high', label: 'Visoko', color: 'rgba(251, 191, 36, 0.45)' },
  { id: 'max', label: 'Puno', color: 'rgba(251, 113, 133, 0.45)' },
];

function occupancyLevel(ratio: number) {
  if (ratio <= 0) return 'free';
  if (ratio <= 0.25) return 'low';
  if (ratio <= 0.5) return 'mid';
  if (ratio <= 0.75) return 'high';
  return 'max';
}

function dayPeak(list: BookingRow[], capacity: number) {
  if (!list.length) return { count: 0, peak: 0, ratio: 0 };
  const bySlot = new Map<string, number>();
  for (const item of list) {
    const key = `${item.startTime}-${item.endTime}`;
    bySlot.set(key, (bySlot.get(key) || 0) + 1);
  }
  const peak = Math.max(...bySlot.values());
  const cap = Math.max(1, capacity || DEFAULT_CAPACITY);
  return {
    count: list.length,
    peak,
    ratio: Math.min(1, peak / cap),
  };
}

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
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useRef(new Animated.Value(0)).current;
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
  }, [loading, enter, year, month]);

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
            Kalendar
          </Text>
          <Text style={styles.lead}>
            Mjesečni pregled zauzetosti. Detalji i rezervacije po danu.
          </Text>

          {usingLocalFixtures ? (
            <Text style={styles.fixtureBanner}>
              Lokalni demo podaci — samo za dizajn (__DEV__).
            </Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.monthNav}>
            <Pressable
              onPress={() => setCursor(new Date(year, month - 1, 1))}
              style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={18} color="#5EEAD4" />
            </Pressable>
            <Text style={styles.monthTitle}>{monthLabel(cursor)}</Text>
            <Pressable
              onPress={() => setCursor(new Date(year, month + 1, 1))}
              style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
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
                    pressed && styles.pressed,
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

          <Text style={styles.sectionLabel}>Odabrani dan</Text>
          <Text style={styles.dayTitle}>{formatDay(new Date(`${selected}T12:00:00`))}</Text>
          {selectedList.length === 0 ? (
            <Text style={styles.empty}>Nema rezervacija za ovaj dan.</Text>
          ) : (
            selectedList.map((item) => (
              <View key={item.id} style={styles.row}>
                <Text style={styles.rowTime}>
                  {item.startTime}–{item.endTime}
                </Text>
                <Text style={styles.rowMeta}>{item.user?.name || 'Član'}</Text>
              </View>
            ))
          )}
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
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
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
    color: 'rgba(251, 191, 36, 0.95)',
    marginBottom: 10,
  },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(251, 113, 133, 0.95)',
    marginBottom: 10,
  },
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
  sectionLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
    marginBottom: 6,
  },
  dayTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#E8F2EF',
    marginBottom: 8,
  },
  empty: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.5)',
  },
  row: {
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
  rowMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.62)',
  },
  footer: { marginTop: 'auto', paddingTop: 32 },
  pressed: { opacity: 0.72 },
});
