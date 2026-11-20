import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listTenantBookings } from '../../api/bookings.js';
import { listServices } from '../../api/services.js';
import { isLocalDesignMode } from './localDesignFixtures.js';
import StudioBoot from './StudioBoot';
import StudioScreenShell from './StudioScreenShell';
import { studioUiStyles as ui } from './studioUiStyles.js';
import {
  formatDay,
  monthCells,
  monthLabel,
  reservationCountLabel,
  sameDay,
  toDateKey,
} from './studioTime.js';
import {
  DEFAULT_CAPACITY,
  dayPeak,
  groupDaySlots,
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
  serviceId?: string;
  serviceName?: string;
  user?: { name?: string; email?: string } | null;
  serviceCapacity?: number;
};

type ServiceOption = {
  id: string;
  name?: string;
  capacity?: number;
  active?: boolean;
};

const WEEK = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
const MONTH_NAMES = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac',
];

const LEGEND = [
  { id: 'low', label: 'Nisko', color: 'rgba(94, 234, 212, 0.22)' },
  { id: 'mid', label: 'Srednje', color: 'rgba(94, 234, 212, 0.4)' },
  { id: 'high', label: 'Visoko', color: 'rgba(251, 191, 36, 0.45)' },
  { id: 'max', label: 'Puno', color: 'rgba(251, 113, 133, 0.45)' },
];

const CELL_COLORS: Record<string, string> = {
  free: 'rgba(232, 242, 239, 0.08)',
  low: 'rgba(94, 234, 212, 0.22)',
  mid: 'rgba(94, 234, 212, 0.4)',
  high: 'rgba(251, 191, 36, 0.45)',
  max: 'rgba(251, 113, 133, 0.45)',
};

const SCREEN_H = Dimensions.get('window').height;
const DAY_SHEET_H = Math.min(SCREEN_H * 0.78, 640);
const DAY_SHEET_OFFSET = DAY_SHEET_H + 48;

function statusLabel(status?: string) {
  if (status === 'CONFIRMED') return 'Potvrđeno';
  if (status === 'COMPLETED') return 'Završeno';
  if (status === 'CANCELLED') return 'Otkazano';
  if (status === 'NO_SHOW') return 'Nedolazak';
  return status || '';
}

function localMonthBookings(year: number, month: number): BookingRow[] {
  if (!isLocalDesignMode()) return [];
  const items: BookingRow[] = [];
  const days = new Date(year, month + 1, 0).getDate();
  const services = [
    { id: 'svc-group', name: 'Grupni trening', capacity: 12 },
    { id: 'svc-pt', name: 'Personalni trening', capacity: 1 },
  ];
  for (let day = 1; day <= days; day += 1) {
    const date = new Date(year, month, day);
    if (date.getDay() === 0) continue;
    const pattern = (day + month) % 5;
    if (pattern === 0) continue;
    const count = pattern === 1 ? 1 : pattern === 2 ? 3 : pattern === 3 ? 6 : 2;
    for (let i = 0; i < count; i += 1) {
      const service = services[i % 2];
      const hour = 8 + (i % 6);
      items.push({
        id: `local-cal-${year}-${month}-${day}-${i}`,
        date: toDateKey(date),
        startTime: `${String(hour).padStart(2, '0')}:00`,
        endTime: `${String(hour + 1).padStart(2, '0')}:00`,
        status: 'CONFIRMED',
        serviceId: service.id,
        serviceName: service.name,
        user: { name: i % 2 ? 'Ana Kovač' : 'Marko Horvat' },
        serviceCapacity: service.capacity,
      });
    }
  }
  return items;
}

/**
 * Kalendar — mjesečni pregled zauzetosti prema kapacitetu termina.
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
  const [dayOpen, setDayOpen] = useState(false);
  const [dayMounted, setDayMounted] = useState(false);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [fallbackCapacity, setFallbackCapacity] = useState(DEFAULT_CAPACITY);
  const [expandedId, setExpandedId] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingLocalFixtures, setUsingLocalFixtures] = useState(false);
  const dayAnim = useRef(new Animated.Value(0)).current;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, index) => current - 2 + index);
  }, []);

  const filteredBookings = useMemo(() => {
    if (serviceFilter === 'all') return bookings;
    return bookings.filter((item) => String(item.serviceId || '') === serviceFilter);
  }, [bookings, serviceFilter]);

  const byDate = useMemo(() => {
    const map = new Map<string, BookingRow[]>();
    for (const item of filteredBookings) {
      if (item.status !== 'CONFIRMED' && item.status !== 'COMPLETED') continue;
      const key = String(item.date || '');
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [filteredBookings]);

  const selectedList = useMemo(() => {
    const list = byDate.get(selected) || [];
    return [...list].sort((a, b) =>
      String(a.startTime || '').localeCompare(String(b.startTime || '')),
    );
  }, [byDate, selected]);

  const selectedSlots = useMemo(
    () => groupDaySlots(selectedList, fallbackCapacity),
    [selectedList, fallbackCapacity],
  );

  const openDay = useCallback((key: string) => {
    setSelected(key);
    setExpandedId('');
    setDayMounted(true);
    setDayOpen(true);
  }, []);

  const closeDay = useCallback(() => {
    setDayOpen(false);
    setExpandedId('');
  }, []);

  const goToday = useCallback(() => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    openDay(toDateKey(now));
  }, [openDay]);

  useEffect(() => {
    if (!dayMounted) return undefined;
    const anim = Animated.timing(dayAnim, {
      toValue: dayOpen ? 1 : 0,
      duration: dayOpen ? 300 : 220,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished && !dayOpen) setDayMounted(false);
    });
    return () => anim.stop();
  }, [dayOpen, dayMounted, dayAnim]);

  const load = useCallback(async () => {
    const dateFrom = toDateKey(new Date(year, month, 1));
    const dateTo = toDateKey(new Date(year, month + 1, 0));

    if (isLocalDesignMode()) {
      setUsingLocalFixtures(true);
      setBookings(localMonthBookings(year, month));
      setServices([
        { id: 'svc-group', name: 'Grupni trening', capacity: 12, active: true },
        { id: 'svc-pt', name: 'Personalni trening', capacity: 1, active: true },
      ]);
      setFallbackCapacity(DEFAULT_CAPACITY);
      setLoading(false);
      setError('');
      return;
    }

    setUsingLocalFixtures(false);
    if (!tenantId) {
      setBookings([]);
      setServices([]);
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
      const nextServices = (
        Array.isArray(serviceData?.services) ? serviceData.services : []
      ) as ServiceOption[];
      const active = nextServices.filter((item) => item.active !== false);
      const primary = active[0] || nextServices[0];
      setServices(active.length ? active : nextServices);
      setFallbackCapacity(Number(primary?.capacity) || DEFAULT_CAPACITY);
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
    setExpandedId('');
  }, [selected, serviceFilter]);

  if (loading) return <StudioBoot />;

  const selectedDate = new Date(`${selected}T12:00:00`);
  const showingToday = selected === toDateKey(new Date()) && dayOpen;
  const dayTranslateY = dayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DAY_SHEET_OFFSET, 0],
  });
  const dayBackdrop = dayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <StudioScreenShell
      studioName={studioName}
      onBack={onBack}
      title="Kalendar"
      lead="Zauzetost prema kapacitetu termina. Odaberite dan za detalje."
    >
      {usingLocalFixtures ? (
        <Text style={ui.fixtureBanner}>
          Lokalni demo podaci — samo za dizajn (__DEV__).
        </Text>
      ) : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}

      <View style={styles.toolbar}>
        <Pressable
          onPress={goToday}
          style={({ pressed }) => [
            styles.todayBtn,
            showingToday && styles.todayBtnActive,
            pressed && ui.pressed,
          ]}
        >
          <Text style={styles.todayLabel}>Danas</Text>
        </Pressable>
        <View style={styles.monthNav}>
          <Pressable
            onPress={() => setCursor(new Date(year, month - 1, 1))}
            style={({ pressed }) => [styles.navBtn, pressed && ui.pressed]}
            accessibilityLabel="Prethodni mjesec"
          >
            <Ionicons name="chevron-back" size={18} color="#14B8A6" />
          </Pressable>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [styles.monthTitleBtn, pressed && ui.pressed]}
            accessibilityLabel="Odabir mjeseca i godine"
          >
            <Text style={styles.monthTitle}>{monthLabel(cursor)}</Text>
            <Ionicons name="chevron-down" size={14} color="rgba(232, 242, 239, 0.55)" />
          </Pressable>
          <Pressable
            onPress={() => setCursor(new Date(year, month + 1, 1))}
            style={({ pressed }) => [styles.navBtn, pressed && ui.pressed]}
            accessibilityLabel="Sljedeći mjesec"
          >
            <Ionicons name="chevron-forward" size={18} color="#14B8A6" />
          </Pressable>
        </View>
      </View>

      {services.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          <Pressable
            onPress={() => setServiceFilter('all')}
            style={({ pressed }) => [
              styles.filterChip,
              serviceFilter === 'all' && styles.filterChipActive,
              pressed && ui.pressed,
            ]}
          >
            <Text
              style={[
                styles.filterChipLabel,
                serviceFilter === 'all' && styles.filterChipLabelActive,
              ]}
            >
              Sve usluge
            </Text>
          </Pressable>
          {services.map((service) => {
            const active = serviceFilter === service.id;
            return (
              <Pressable
                key={service.id}
                onPress={() => setServiceFilter(service.id)}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && ui.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipLabel,
                    active && styles.filterChipLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {service.name || 'Usluga'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

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
          const peak = dayPeak(list, fallbackCapacity);
          const level = occupancyLevel(peak.ratio);
          const active = key === selected;
          const today = sameDay(cell, new Date());
          return (
            <Pressable
              key={key}
              onPress={() => openDay(key)}
              style={({ pressed }) => [
                styles.cell,
                { backgroundColor: CELL_COLORS[level] || CELL_COLORS.free },
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
              ) : (
                <View style={styles.cellDotEmpty} />
              )}
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
      <Text style={styles.hintLine}>Dodirnite dan za detalje rezervacija.</Text>

      <Modal
        visible={dayMounted}
        transparent
        animationType="none"
        onRequestClose={closeDay}
      >
        <View style={styles.dayOverlay} pointerEvents="box-none">
          <Animated.View style={[styles.dayBackdrop, { opacity: dayBackdrop }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDay} />
          </Animated.View>
          <Animated.View
            style={[
              styles.dayCurtain,
              {
                height: DAY_SHEET_H,
                transform: [{ translateY: dayTranslateY }],
              },
            ]}
          >
            <View style={styles.dayHandleRow}>
              <View style={styles.dayHandle} />
            </View>
            <View style={styles.dayHead}>
              <View style={styles.dayHeadCopy}>
                <Text style={ui.sectionLabel}>Odabrani dan</Text>
                <Text style={styles.dayTitle}>{formatDay(selectedDate)}</Text>
                <Text style={styles.dayMeta}>
                  {reservationCountLabel(selectedList.length)}
                </Text>
              </View>
              <Pressable
                onPress={closeDay}
                style={({ pressed }) => [styles.dayClose, pressed && ui.pressed]}
                accessibilityLabel="Zatvori detalje dana"
              >
                <Ionicons name="close" size={20} color="#E8F2EF" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.dayScroll}
              contentContainerStyle={styles.dayScrollContent}
              showsVerticalScrollIndicator={false}
              bounces
            >
              {selectedSlots.length === 0 ? (
                <Text style={styles.emptyLine}>Nema rezervacija za ovaj dan.</Text>
              ) : (
                selectedSlots.map((slot) => {
                  const filled = slot.members.length;
                  const cap = Math.max(1, slot.capacity || fallbackCapacity);
                  const free = Math.max(0, cap - filled);
                  return (
                    <View key={slot.key} style={styles.slotCard}>
                      <View style={styles.slotHead}>
                        <View style={styles.slotCopy}>
                          <Text style={styles.slotName} numberOfLines={1}>
                            {slot.serviceName || 'Termin'}
                          </Text>
                          <Text style={styles.slotTime}>
                            {slot.startTime}
                            {' – '}
                            {slot.endTime}
                          </Text>
                        </View>
                        <Text style={styles.slotCap}>
                          {filled}
                          {' / '}
                          {cap}
                          {' '}
                          {cap === 1 ? 'mjesto' : 'mjesta'}
                        </Text>
                      </View>
                      <Text style={styles.slotFree}>
                        {free === 0 ? 'Popunjeno' : `${free} slobodno`}
                      </Text>
                      {slot.members.map((item) => {
                        const open = expandedId === item.id;
                        return (
                          <Pressable
                            key={item.id}
                            onPress={() => setExpandedId(open ? '' : item.id)}
                            style={({ pressed }) => [
                              styles.memberRow,
                              pressed && ui.pressed,
                            ]}
                          >
                            <View style={styles.memberCopy}>
                              <Text style={styles.memberName}>
                                {item.user?.name || 'Član'}
                              </Text>
                              <Text style={styles.memberStatus}>
                                {statusLabel(item.status)}
                              </Text>
                              {open && item.user?.email ? (
                                <Text style={styles.memberDetail}>
                                  {item.user.email}
                                </Text>
                              ) : null}
                              {open ? (
                                <Text style={styles.memberDetail}>
                                  {item.startTime}
                                  –
                                  {item.endTime}
                                  {item.serviceName ? ` · ${item.serviceName}` : ''}
                                </Text>
                              ) : null}
                            </View>
                            <Ionicons
                              name={open ? 'chevron-up' : 'chevron-forward'}
                              size={16}
                              color="rgba(232, 242, 239, 0.45)"
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.pickerTitle}>Mjesec i godina</Text>
            <Text style={styles.pickerLabel}>Mjesec</Text>
            <View style={styles.pickerGrid}>
              {MONTH_NAMES.map((label, index) => (
                <Pressable
                  key={label}
                  onPress={() => setCursor(new Date(year, index, 1))}
                  style={[
                    styles.pickerChip,
                    month === index && styles.pickerChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerChipLabel,
                      month === index && styles.pickerChipLabelActive,
                    ]}
                  >
                    {label.slice(0, 3)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.pickerLabel}>Godina</Text>
            <View style={styles.pickerYears}>
              {yearOptions.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setCursor(new Date(option, month, 1))}
                  style={[
                    styles.pickerChip,
                    year === option && styles.pickerChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerChipLabel,
                      year === option && styles.pickerChipLabelActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setPickerOpen(false)}
              style={({ pressed }) => [styles.pickerDone, pressed && ui.pressed]}
            >
              <Text style={styles.pickerDoneLabel}>Gotovo</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </StudioScreenShell>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    gap: 10,
    marginBottom: 12,
  },
  todayBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.18)',
    backgroundColor: 'rgba(15, 28, 26, 0.45)',
  },
  todayBtnActive: {
    borderColor: 'rgba(20, 184, 166, 0.55)',
    backgroundColor: 'rgba(20, 184, 166, 0.16)',
  },
  todayLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: '#5EEAD4',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
  },
  monthTitleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  monthTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#E8F2EF',
  },
  filterScroll: {
    marginBottom: 10,
    marginHorizontal: -4,
  },
  filterRow: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.16)',
    backgroundColor: 'rgba(15, 28, 26, 0.4)',
  },
  filterChipActive: {
    borderColor: 'rgba(20, 184, 166, 0.5)',
    backgroundColor: 'rgba(20, 184, 166, 0.16)',
  },
  filterChipLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.65)',
    maxWidth: 140,
  },
  filterChipLabelActive: {
    color: '#5EEAD4',
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
    color: '#14B8A6',
  },
  cellDayActive: {
    color: '#F7FCFA',
  },
  cellCount: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 10,
    color: 'rgba(232, 242, 239, 0.7)',
  },
  cellDotEmpty: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
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
  hintLine: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.42)',
    marginBottom: 12,
  },
  dayOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  dayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dayCurtain: {
    width: '100%',
    maxHeight: '86%',
    paddingTop: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: '#0F1C1A',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(94, 234, 212, 0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  dayHandleRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  dayHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(232, 242, 239, 0.28)',
  },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  dayHeadCopy: {
    flex: 1,
    minWidth: 0,
  },
  dayClose: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232, 242, 239, 0.08)',
  },
  dayTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#E8F2EF',
    marginTop: -2,
    marginBottom: 2,
  },
  dayMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  dayScroll: {
    flex: 1,
  },
  dayScrollContent: {
    paddingBottom: 28,
    gap: 2,
  },
  emptyLine: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.5)',
    paddingTop: 8,
  },
  slotCard: {
    marginBottom: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(232, 242, 239, 0.12)',
    gap: 6,
  },
  slotHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  slotCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  slotName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#F7FCFA',
  },
  slotTime: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  slotCap: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#14B8A6',
  },
  slotFree: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.42)',
    marginBottom: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(232, 242, 239, 0.08)',
  },
  memberCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  memberName: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: '#E8F2EF',
  },
  memberStatus: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: 'rgba(232, 242, 239, 0.45)',
  },
  memberDetail: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: 'rgba(232, 242, 239, 0.4)',
    marginTop: 2,
  },
  pickerBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  pickerSheet: {
    padding: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#0F1C1A',
    gap: 10,
  },
  pickerTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
    color: '#F7FCFA',
    marginBottom: 4,
  },
  pickerLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerYears: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.16)',
    backgroundColor: 'rgba(232, 242, 239, 0.06)',
  },
  pickerChipActive: {
    borderColor: 'rgba(20, 184, 166, 0.55)',
    backgroundColor: 'rgba(20, 184, 166, 0.18)',
  },
  pickerChipLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.7)',
  },
  pickerChipLabelActive: {
    color: '#5EEAD4',
  },
  pickerDone: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
  },
  pickerDoneLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#5EEAD4',
  },
});
