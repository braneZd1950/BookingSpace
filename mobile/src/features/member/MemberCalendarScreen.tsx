import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTenantOccupancy } from '../../api/services.js';
import { BRAND, DARK_SURFACE } from '../../lib/brandColors.js';
import { colorsForTheme } from '../../lib/uiTheme.js';
import { isLocalDesignMode } from '../studio/localDesignFixtures.js';
import StudioTopCurtain from '../studio/StudioTopCurtain';
import {
  formatDay,
  monthCells,
  monthLabel,
  toDateKey,
} from '../studio/studioTime.js';
import { loadLabel } from '../../../../shared/calendarOccupancy.js';
import {
  CALENDAR_WEEKDAY_SHORT,
  MEMBER_CALENDAR_COPY,
  occupancyDaySubtitle,
  occupancySlotBadge,
  occupancySlotStatusLabel,
  resolveOccupancyDayLevel,
} from '../../../../shared/memberCalendarUi.js';
import MemberChrome from './memberChrome';

type MemberCalendarScreenProps = {
  tenant: any;
  uiTheme?: string;
  onBack: () => void;
  onBookDate?: (dateKey: string, serviceId?: string) => void;
};

type OccupancySlot = {
  startTime?: string;
  endTime?: string;
  serviceId?: string;
  serviceName?: string;
  booked?: number;
  capacity?: number;
  remaining?: number;
  level?: string;
  label?: string;
  status?: string;
};

type OccupancyDay = {
  date: string;
  open?: boolean;
  level?: string;
  label?: string;
  ratio?: number;
  bookingCount?: number;
  slots?: OccupancySlot[];
};

const LEGEND = [
  { id: 'free', label: 'Slobodno', color: 'rgba(148, 163, 184, 0.18)' },
  { id: 'low', label: 'Nisko', color: 'rgba(45, 212, 191, 0.28)' },
  { id: 'mid', label: 'Srednje', color: 'rgba(96, 165, 250, 0.4)' },
  { id: 'high', label: 'Visoko', color: 'rgba(251, 191, 36, 0.45)' },
  { id: 'max', label: 'Puno', color: 'rgba(251, 113, 133, 0.5)' },
  { id: 'closed', label: 'Zatvoreno', color: 'rgba(15, 23, 42, 0.55)' },
];

const CELL_COLORS: Record<string, string> = {
  free: 'rgba(148, 163, 184, 0.14)',
  low: 'rgba(45, 212, 191, 0.28)',
  mid: 'rgba(96, 165, 250, 0.4)',
  high: 'rgba(251, 191, 36, 0.45)',
  max: 'rgba(251, 113, 133, 0.5)',
  closed: 'rgba(15, 23, 42, 0.55)',
};

function localOccupancyDays(year: number, month: number): OccupancyDay[] {
  if (!isLocalDesignMode()) return [];
  const total = new Date(year, month + 1, 0).getDate();
  const days: OccupancyDay[] = [];
  for (let day = 1; day <= total; day += 1) {
    const date = new Date(year, month, day);
    const key = toDateKey(date);
    const weekday = date.getDay();
    if (weekday === 0) {
      days.push({ date: key, open: false, level: 'closed', label: 'Zatvoreno', slots: [] });
      continue;
    }
    const pattern = (day + month) % 5;
    const level = pattern === 0 ? 'free'
      : pattern === 1 ? 'low'
        : pattern === 2 ? 'mid'
          : pattern === 3 ? 'high'
            : 'max';
    const capacity = 12;
    const booked = level === 'free' ? 0
      : level === 'low' ? 2
        : level === 'mid' ? 5
          : level === 'high' ? 9
            : 12;
    days.push({
      date: key,
      open: true,
      level,
      label: loadLabel(level),
      bookingCount: booked,
      slots: [
        {
          startTime: '10:00',
          endTime: '11:00',
          serviceName: 'Jutarnji termin',
          booked: Math.min(booked, capacity),
          capacity,
          remaining: Math.max(0, capacity - booked),
          level,
          label: loadLabel(level),
          status: booked >= capacity ? 'FULL' : 'AVAILABLE',
        },
        {
          startTime: '18:00',
          endTime: '19:00',
          serviceName: 'Večernji termin',
          booked: Math.max(0, booked - 3),
          capacity,
          remaining: Math.max(0, capacity - Math.max(0, booked - 3)),
          level: booked - 3 >= capacity ? 'max' : 'mid',
          label: loadLabel(booked - 3 >= capacity ? 'max' : 'mid'),
          status: booked - 3 >= capacity ? 'FULL' : 'AVAILABLE',
        },
      ],
    });
  }
  return days;
}

/**
 * Klijentski kalendar zauzetosti — bez imena klijenata.
 * Radi za fitness, wellness, igraonice i ostale kapacitetne usluge.
 */
export default function MemberCalendarScreen({
  tenant,
  uiTheme = 'dark',
  onBack,
  onBookDate,
}: MemberCalendarScreenProps) {
  const colors = colorsForTheme(uiTheme);
  const tenantId = String(tenant?.id || '');
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => toDateKey(new Date()));
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [days, setDays] = useState<OccupancyDay[]>([]);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingLocal, setUsingLocal] = useState(false);
  const services = useMemo(() => {
    const fromTenant = (tenant?.services || [])
      .filter((item: any) => item.active !== false)
      .map((item: any) => ({ id: String(item.id), name: item.name }));
    if (fromTenant.length) return fromTenant;
    if (isLocalDesignMode()) {
      return [
        { id: 'local-svc-1', name: 'Grupni termin' },
        { id: 'local-svc-2', name: 'Individualni termin' },
      ];
    }
    return [];
  }, [tenant?.services]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const byDate = useMemo(() => {
    const map = new Map<string, OccupancyDay>();
    for (const day of days) map.set(day.date, day);
    return map;
  }, [days]);
  const selectedDay = byDate.get(selected) || null;
  const selectedSlots = selectedDay?.slots || [];

  const load = useCallback(async () => {
    const dateFrom = toDateKey(new Date(year, month, 1));
    const dateTo = toDateKey(new Date(year, month + 1, 0));
    setLoading(true);
    setError('');

    if (!tenantId && isLocalDesignMode()) {
      setUsingLocal(true);
      setDays(localOccupancyDays(year, month));
      setLoading(false);
      return;
    }

    if (!tenantId) {
      setDays([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getTenantOccupancy(tenantId, {
        dateFrom,
        dateTo,
        ...(serviceFilter !== 'all' ? { serviceId: serviceFilter } : {}),
      });
      const nextDays = Array.isArray(data?.days) ? data.days : [];
      if (!nextDays.length && isLocalDesignMode()) {
        setUsingLocal(true);
        setDays(localOccupancyDays(year, month));
      } else {
        setUsingLocal(false);
        setDays(nextDays);
      }
    } catch {
      if (isLocalDesignMode()) {
        setUsingLocal(true);
        setDays(localOccupancyDays(year, month));
        setError('');
      } else {
        setDays([]);
        setError('Kalendar se nije učitao. Pokušajte ponovo.');
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, year, month, serviceFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function openDay(key: string) {
    setSelected(key);
    setCurtainOpen(true);
  }

  return (
    <>
      <MemberChrome
        onBack={onBack}
        kicker={tenant?.name || 'Studio'}
        title="Kalendar"
        lead="Pogledajte zauzetost dana unaprijed — bez poziva. Oznake vrijede za sve vrste termina."
        uiTheme={uiTheme}
      >
        {usingLocal ? (
          <Text style={[styles.banner, { color: colors.accent }]}>
            Lokalni demo podaci — samo za testiranje.
          </Text>
        ) : null}
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        <View style={styles.toolbar}>
          <Pressable
            onPress={() => {
              const now = new Date();
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
              openDay(toDateKey(now));
            }}
            style={[styles.todayBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.todayLabel, { color: colors.accent }]}>Danas</Text>
          </Pressable>
          <View style={styles.monthNav}>
            <Pressable
              onPress={() => setCursor(new Date(year, month - 1, 1))}
              accessibilityLabel="Prethodni mjesec"
              style={styles.navBtn}
            >
              <Ionicons name="chevron-back" size={18} color={colors.accent} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: colors.title }]}>
              {monthLabel(new Date(year, month, 1))}
            </Text>
            <Pressable
              onPress={() => setCursor(new Date(year, month + 1, 1))}
              accessibilityLabel="Sljedeći mjesec"
              style={styles.navBtn}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.accent} />
            </Pressable>
          </View>
        </View>

        {services.length > 1 ? (
          <View style={styles.filterRow}>
            <Pressable
              onPress={() => setServiceFilter('all')}
              style={[
                styles.filterChip,
                { borderColor: colors.border },
                serviceFilter === 'all' && styles.filterChipOn,
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  { color: colors.muted },
                  serviceFilter === 'all' && styles.filterLabelOn,
                ]}
              >
                Sve usluge
              </Text>
            </Pressable>
            {services.map((item) => {
              const id = String(item.id);
              const on = serviceFilter === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setServiceFilter(id)}
                  style={[
                    styles.filterChip,
                    { borderColor: colors.border },
                    on && styles.filterChipOn,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterLabel,
                      { color: colors.muted },
                      on && styles.filterLabelOn,
                    ]}
                  >
                    {item.name || 'Usluga'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.weekRow}>
          {CALENDAR_WEEKDAY_SHORT.map((label) => (
            <Text key={label} style={[styles.weekLabel, { color: colors.muted }]}>
              {label}
            </Text>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.grid}>
            {cells.map((cell, index) => {
              if (!cell) {
                return <View key={`empty-${index}`} style={styles.cellEmpty} />;
              }
              const key = toDateKey(cell);
              const day = byDate.get(key);
              const level = resolveOccupancyDayLevel(day);
              const selectedOn = key === selected && curtainOpen;
              return (
                <Pressable
                  key={key}
                  onPress={() => openDay(key)}
                  style={[
                    styles.cell,
                    { backgroundColor: CELL_COLORS[level] || CELL_COLORS.free },
                    selectedOn && styles.cellSelected,
                  ]}
                >
                  <Text style={[styles.cellDay, { color: colors.title }]}>
                    {cell.getDate()}
                  </Text>
                  {day?.bookingCount ? (
                    <Text style={[styles.cellMeta, { color: colors.soft }]}>
                      {day.bookingCount}
                    </Text>
                  ) : (
                    <View style={styles.cellDot} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.legend}>
          {LEGEND.map((item) => (
            <View key={item.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: colors.muted }]}>{item.label}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Dodirnite dan za termine. Broj je ukupan broj rezervacija tog dana.
        </Text>
      </MemberChrome>

      <StudioTopCurtain
        open={curtainOpen}
        onClose={() => setCurtainOpen(false)}
        kicker="Odabrani dan"
        title={formatDay(new Date(`${selected}T12:00:00`))}
        subtitle={occupancyDaySubtitle(selectedDay)}
        footer={
          onBookDate ? (
            <Pressable
              onPress={() => {
                setCurtainOpen(false);
                onBookDate(
                  selected,
                  selectedSlots.find((slot) => slot.status === 'AVAILABLE')?.serviceId,
                );
              }}
              style={styles.bookCta}
            >
              <Text style={styles.bookCtaLabel}>Rezerviraj ovaj dan</Text>
            </Pressable>
          ) : null
        }
      >
        {selectedDay?.open === false ? (
          <Text style={styles.curtainEmpty}>{MEMBER_CALENDAR_COPY.closedDay}</Text>
        ) : selectedSlots.length === 0 ? (
          <Text style={styles.curtainEmpty}>
            {MEMBER_CALENDAR_COPY.emptyDay}
            {' '}
            Možete rezervirati termin.
          </Text>
        ) : (
          selectedSlots.map((slot) => (
            <View key={`${slot.serviceId}-${slot.startTime}`} style={styles.slotRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.slotTime}>
                  {slot.startTime}
                  {slot.endTime ? ` – ${slot.endTime}` : ''}
                </Text>
                <Text style={styles.slotName}>{slot.serviceName || 'Termin'}</Text>
                <Text style={styles.slotMeta}>
                  {slot.booked ?? 0}
                  /
                  {slot.capacity ?? '—'}
                  {' · '}
                  {occupancySlotStatusLabel(slot)}
                </Text>
              </View>
              <View
                style={[
                  styles.slotBadge,
                  { backgroundColor: CELL_COLORS[slot.level || 'free'] || CELL_COLORS.free },
                ]}
              >
                <Text style={styles.slotBadgeLabel}>
                  {occupancySlotBadge(slot)}
                </Text>
              </View>
            </View>
          ))
        )}
      </StudioTopCurtain>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    marginBottom: 10,
  },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    marginBottom: 10,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  todayBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  todayLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  monthNav: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    minWidth: 120,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterChipOn: {
    borderColor: 'rgba(37, 99, 235, 0.55)',
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
  },
  filterLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
  },
  filterLabelOn: {
    color: BRAND.blueBright,
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
    marginBottom: 4,
  },
  cellSelected: {
    borderWidth: 1.5,
    borderColor: BRAND.blueBright,
  },
  cellDay: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
  },
  cellMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    marginTop: 1,
  },
  cellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
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
  },
  hint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  curtainEmpty: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(148, 163, 184, 0.95)',
    paddingVertical: 8,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  slotTime: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: BRAND.onDark,
  },
  slotName: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(226, 232, 240, 0.9)',
    marginTop: 2,
  },
  slotMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(148, 163, 184, 0.95)',
    marginTop: 2,
  },
  slotBadge: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  slotBadgeLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    color: BRAND.onDark,
  },
  bookCta: {
    minHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DARK_SURFACE.cta,
  },
  bookCtaLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
