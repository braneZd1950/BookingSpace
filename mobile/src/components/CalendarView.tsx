import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { listTenantBookings, type Booking } from '../api/bookings';
import { listMemberships, type Membership } from '../api/memberships';
import { listServices } from '../api/services';
import { useStudio } from '../features/studio/StudioContext';
import {
  dayHours,
  formatDay,
  monthCells,
  monthLabel,
  sameDay,
  studioHours,
  toDateKey,
} from '../lib/studioTime';
import { tokens } from '../theme/tokens';
import {
  LOAD_BG,
  LOAD_COUNT,
  LOAD_FG,
  SWATCH,
  makeCalendarStyles,
} from '../ui/calendarStyles';

const REAL_ID = /^[a-f\d]{24}$/i;
const weekLabels = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
const DEFAULT_CAPACITY = 12;

const loadLegend = [
  { id: 'free' as const, label: 'Slobodno', note: '0%' },
  { id: 'low' as const, label: 'Nisko', note: 'do 25%' },
  { id: 'mid' as const, label: 'Srednje', note: '26–50%' },
  { id: 'high' as const, label: 'Visoko', note: '51–75%' },
  { id: 'max' as const, label: 'Maksimum', note: '76–100%' },
];

const demoNames = [
  'Ivan Horvat', 'Ana Kovač', 'Marko Babić', 'Petra Jurić', 'Luka Marić', 'Ivana Novak',
  'Tomislav Perić', 'Maja Šimić', 'Josip Kralj', 'Sara Božić', 'Nikola Vuković', 'Elena Pavić',
];

type CalBooking = Booking & {
  date: string;
  memberName: string;
  capacity: number;
  demo?: boolean;
};

type LoadLevel = keyof typeof LOAD_BG;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function statusLabel(status: string) {
  if (status === 'CONFIRMED') return 'Potvrđeno';
  if (status === 'CANCELLED') return 'Otkazano';
  if (status === 'COMPLETED') return 'Završeno';
  if (status === 'NO_SHOW') return 'Nije došao';
  return status;
}

function hourSlots(from: string, to: string) {
  const start = Number(String(from).slice(0, 2));
  const end = Number(String(to).slice(0, 2));
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return Array.from({ length: 14 }, (_, index) => `${pad(7 + index)}:00`);
  }
  return Array.from({ length: end - start }, (_, index) => `${pad(start + index)}:00`);
}

function occupancyLevel(ratio: number, open: boolean): LoadLevel {
  if (!open) return 'closed';
  if (ratio <= 0) return 'free';
  if (ratio <= 0.25) return 'low';
  if (ratio <= 0.5) return 'mid';
  if (ratio <= 0.75) return 'high';
  return 'max';
}

function loadLabel(level: LoadLevel) {
  if (level === 'max') return 'Puno';
  if (level === 'high') return 'Visoko';
  if (level === 'mid') return 'Srednje';
  if (level === 'low') return 'Nisko';
  if (level === 'closed') return 'Zatvoreno';
  return 'Slobodno';
}

function dayPeak(list: CalBooking[], capacity: number) {
  if (!list.length) return { count: 0, peak: 0, ratio: 0, capacity };
  const bySlot = new Map<string, number>();
  for (const item of list) {
    const key = `${item.startTime}-${item.endTime}`;
    bySlot.set(key, (bySlot.get(key) || 0) + 1);
  }
  const peak = Math.max(...bySlot.values());
  const cap = Math.max(1, capacity || DEFAULT_CAPACITY);
  return { count: list.length, peak, ratio: Math.min(1, peak / cap), capacity: cap };
}

function enrichBookings(bookings: Booking[], memberships: Membership[]): CalBooking[] {
  const byUser = new Map(
    memberships.map((item) => [String(item.userId), item.user?.name || 'Član']),
  );
  return bookings
    .filter((item) => item.status === 'CONFIRMED' || item.status === 'COMPLETED')
    .map((item) => ({
      ...item,
      date: item.date || '',
      memberName: item.user?.name || byUser.get(String(item.userId)) || 'Član',
      capacity: item.serviceCapacity || DEFAULT_CAPACITY,
      demo: false,
    }))
    .filter((item) => Boolean(item.date));
}

function buildDemoBookings(
  year: number,
  month: number,
  hours: ReturnType<typeof studioHours>,
  members: Membership[],
  capacity: number,
): CalBooking[] {
  const names = members.length > 0
    ? members.map((item) => item.user?.name || 'Član')
    : demoNames;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lightSlots = ['08:00', '09:00', '10:00', '11:00', '17:00', '18:00', '19:00'];
  const weekSlotList = hourSlots(hours.week?.from || '07:00', hours.week?.to || '21:00');
  const cap = Math.max(1, capacity);
  const items: CalBooking[] = [];
  let packedDay = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    if (!dayHours(date, hours).works) continue;
    if (!packedDay && date.getDay() >= 1 && date.getDay() <= 5) packedDay = day;
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    if (!dayHours(date, hours).works) continue;

    if (day === packedDay) {
      weekSlotList.forEach((start, index) => {
        const hour = Number(start.slice(0, 2));
        const endTime = `${pad(hour + 1)}:00`;
        const seats = start === '09:00' ? cap : 1;
        for (let seat = 0; seat < seats; seat += 1) {
          items.push({
            id: `demo-full-${year}-${month}-${day}-${start}-${seat}`,
            userId: 'demo',
            date: toDateKey(date),
            startTime: start,
            endTime,
            status: 'CONFIRMED',
            memberName: names[(index + seat) % names.length],
            capacity: cap,
            demo: true,
          });
        }
      });
      continue;
    }

    const pattern = (day + month) % 5;
    if (pattern === 0) continue;
    const count = pattern === 1 ? 2 : pattern === 2 ? Math.ceil(cap * 0.4) : pattern === 3 ? Math.ceil(cap * 0.7) : 3;
    for (let index = 0; index < count; index += 1) {
      const start = lightSlots[(day + index) % lightSlots.length];
      const hour = Number(start.slice(0, 2));
      items.push({
        id: `demo-${year}-${month}-${day}-${index}`,
        userId: 'demo',
        date: toDateKey(date),
        startTime: start,
        endTime: `${pad(hour + 1)}:00`,
        status: 'CONFIRMED',
        memberName: names[(day + index) % names.length],
        capacity: cap,
        demo: true,
      });
    }
  }

  return items;
}

export function CalendarView() {
  const { studio, ready: studioReady } = useStudio();
  const brand = studio?.theme.primaryColor || tokens.brand;
  const soft = studio?.theme.secondaryColor || tokens.brandSoft;
  const ink = studio?.theme.ink || tokens.fg;
  const styles = useMemo(() => makeCalendarStyles(brand, soft, ink), [brand, soft, ink]);

  const hours = useMemo(() => studioHours(studio?.hours), [studio?.hours]);
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveBookings, setLiveBookings] = useState<CalBooking[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);

  const tenantId = String(studio?.id || '');
  const ready = REAL_ID.test(tenantId);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => monthCells(year, month), [year, month]);

  const load = useCallback(async () => {
    if (!ready) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const dateFrom = `${year}-${pad(month + 1)}-01`;
    const dateTo = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`;
    try {
      const [bookingRows, mems, services] = await Promise.all([
        listTenantBookings(tenantId, { dateFrom, dateTo, limit: 500 }),
        listMemberships(tenantId),
        listServices(tenantId),
      ]);
      const activeServices = services.filter((item) => item.active !== false);
      const cap = activeServices.reduce(
        (max, item) => Math.max(max, Number(item.capacity) || 0),
        0,
      ) || DEFAULT_CAPACITY;
      setCapacity(cap);
      setMemberships(mems);
      setLiveBookings(enrichBookings(bookingRows, mems));
    } catch (err) {
      setError(err instanceof TypeError
        ? 'Poslužitelj nije dostupan. Kalendar se nije učitao.'
        : 'Rezervacije se nisu učitale. Pokušajte ponovno.');
      setLiveBookings([]);
    } finally {
      setLoading(false);
    }
  }, [ready, tenantId, year, month]);

  useEffect(() => {
    if (!studioReady) return;
    void load();
  }, [studioReady, load]);

  const bookings = useMemo(() => {
    if (showDemo) {
      return buildDemoBookings(
        year,
        month,
        hours,
        memberships.filter((item) => item.status === 'ACTIVE'),
        capacity,
      );
    }
    return liveBookings;
  }, [showDemo, liveBookings, year, month, hours, memberships, capacity]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalBooking[]>();
    for (const item of bookings) {
      const list = map.get(item.date) || [];
      list.push(item);
      map.set(item.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime)
        || a.memberName.localeCompare(b.memberName));
    }
    return map;
  }, [bookings]);

  const selectedKey = selected ? toDateKey(selected) : '';
  const dayBookings = selectedKey ? (byDay.get(selectedKey) || []) : [];
  const daySlots = useMemo(() => {
    const groups = new Map<string, {
      startTime: string;
      endTime: string;
      date: string;
      members: CalBooking[];
      capacity: number;
      serviceName: string;
    }>();
    for (const item of dayBookings) {
      const key = `${item.startTime}-${item.endTime}`;
      const current = groups.get(key) || {
        startTime: item.startTime,
        endTime: item.endTime,
        date: item.date,
        members: [],
        capacity: item.capacity || capacity,
        serviceName: item.serviceName || '',
      };
      current.members.push(item);
      current.capacity = Math.max(current.capacity, item.capacity || capacity);
      if (item.serviceName) current.serviceName = item.serviceName;
      groups.set(key, current);
    }
    return [...groups.values()];
  }, [dayBookings, capacity]);

  function shiftMonth(delta: number) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    setSelected(null);
  }

  if (!studioReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
        <ActivityIndicator color={brand} size="large" />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.root} contentContainerStyle={styles.stage} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text style={styles.eyebrow}>Pregled</Text>
          <Text style={styles.title}>Kalendar</Text>
          <View style={styles.accent} />
          <Text style={styles.lede}>
            {showDemo
              ? 'Primjer rasporeda — nije povezan s bazom.'
              : 'Zauzeti termini iz baze, po danima i kapacitetu usluge.'}
          </Text>
          <View style={styles.actions}>
            <Pressable
              style={styles.demoToggle}
              onPress={() => {
                setShowDemo((v) => !v);
                setSelected(null);
              }}
            >
              <View style={[styles.demoBox, showDemo && styles.demoBoxOn]}>
                {showDemo ? <Text style={styles.demoCheck}>✓</Text> : null}
              </View>
              <Text style={styles.demoLabel}>Primjer rasporeda</Text>
            </Pressable>
            <View style={styles.monthNav}>
              <Pressable style={styles.monthBtn} onPress={() => shiftMonth(-1)} accessibilityLabel="Prethodni mjesec">
                <Text style={styles.monthBtnText}>‹</Text>
              </Pressable>
              <Text style={styles.monthLabel}>{monthLabel(cursor)}</Text>
              <Pressable style={styles.monthBtn} onPress={() => shiftMonth(1)} accessibilityLabel="Sljedeći mjesec">
                <Text style={styles.monthBtnText}>›</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {!ready ? (
          <Text style={styles.hint}>Studio još nije u bazi. Dovršite registraciju da vidite stvarne termine.</Text>
        ) : null}
        {ready && !showDemo && loading ? <Text style={styles.hint}>Učitavamo termine iz baze…</Text> : null}
        {ready && !showDemo && error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.index}>01</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>Popunjenost</Text>
              <Text style={styles.panelTitle}>Legenda</Text>
              <Text style={styles.panelSub}>
                Boja dana = najpuniji termin tog dana u odnosu na kapacitet ({capacity} mjesta).
              </Text>
            </View>
          </View>
          <View style={styles.legend}>
            {loadLegend.map((item) => (
              <View key={item.id} style={styles.legendItem}>
                <View style={[styles.swatch, { backgroundColor: SWATCH[item.id] }]} />
                <View>
                  <Text style={styles.legendStrong}>{item.label}</Text>
                  <Text style={styles.legendNote}>{item.note}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.index}>02</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>Mjesec</Text>
              <Text style={styles.panelTitle}>{monthLabel(cursor)}</Text>
              <Text style={styles.panelSub}>Odaberite dan za pregled rezervacija.</Text>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.metaCount}>{bookings.length}</Text>
              <Text style={styles.metaLabel}>{showDemo ? 'primjer' : 'upisa'}</Text>
            </View>
          </View>

          <View style={styles.weekRow}>
            {weekLabels.map((label) => (
              <Text key={label} style={styles.weekday}>{label}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.cellEmpty} />;
              }
              const key = toDateKey(date);
              const open = dayHours(date, hours).works;
              const current = sameDay(date, today);
              const list = byDay.get(key) || [];
              const stats = dayPeak(list, capacity);
              const level = occupancyLevel(stats.ratio, open);
              const selectedOn = selected ? sameDay(date, selected) : false;

              return (
                <Pressable
                  key={key}
                  onPress={() => setSelected(date)}
                  style={[
                    styles.cell,
                    { backgroundColor: LOAD_BG[level], width: '13.2%' },
                    current && { borderWidth: 2, borderColor: `${ink}8C` },
                    selectedOn && { borderWidth: 2, borderColor: ink },
                  ]}
                  accessibilityLabel={`${formatDay(date)}, ${loadLabel(level)}${stats.count ? `, ${stats.count} upisa` : ''}`}
                >
                  <Text style={[styles.dayNum, { color: LOAD_FG[level] }]}>{date.getDate()}</Text>
                  <Text style={[styles.loadLabel, { color: LOAD_FG[level] }]}>{loadLabel(level)}</Text>
                  {stats.count > 0 ? (
                    <Text style={[styles.count, { backgroundColor: LOAD_COUNT[level] }]}>
                      {stats.count}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {ready && !showDemo && !loading && !error && liveBookings.length === 0 ? (
          <Text style={styles.hint}>
            Još nema rezervacija u bazi za ovaj mjesec. Uključite „Primjer rasporeda” za pregled izgleda.
          </Text>
        ) : null}
      </ScrollView>

      <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalPanel} onPress={(e) => e.stopPropagation()}>
            {selected ? (
              <>
                <View style={styles.modalHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Dan</Text>
                    <Text style={styles.panelTitle}>{formatDay(selected)}</Text>
                    <Text style={styles.panelSub}>
                      {dayBookings.length === 0
                        ? 'Nema rezervacija ovog dana.'
                        : `${dayBookings.length} ${dayBookings.length === 1 ? 'upis' : 'upisa'} u ${daySlots.length} ${daySlots.length === 1 ? 'terminu' : 'termina'}`}
                    </Text>
                  </View>
                  <Pressable style={styles.modalClose} onPress={() => setSelected(null)} accessibilityLabel="Zatvori">
                    <Text style={styles.modalCloseText}>×</Text>
                  </Pressable>
                </View>

                {daySlots.length === 0 ? (
                  <Text style={styles.modalEmpty}>
                    {dayHours(selected, hours).works
                      ? 'Dan je otvoren, ali još nema upisa u bazi.'
                      : 'Studio je zatvoren ovog dana.'}
                  </Text>
                ) : (
                  <ScrollView>
                    {daySlots.map((slot) => {
                      const filled = slot.members.length;
                      const cap = Math.max(1, slot.capacity || capacity);
                      const full = filled >= cap;
                      return (
                        <View key={`${slot.date}-${slot.startTime}`} style={styles.slotBlock}>
                          <Text style={styles.slotTime}>
                            {slot.startTime}–{slot.endTime}
                          </Text>
                          <Text style={styles.slotCap}>
                            {filled}/{cap}
                            {full ? ' · popunjeno' : ''}
                            {slot.serviceName ? ` · ${slot.serviceName}` : ''}
                          </Text>
                          {slot.members.map((item) => (
                            <View key={item.id} style={styles.personRow}>
                              <Text style={styles.personName}>{item.memberName}</Text>
                              <Text style={styles.personStatus}>{statusLabel(item.status)}</Text>
                            </View>
                          ))}
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
