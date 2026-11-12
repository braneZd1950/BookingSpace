import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  cancelBooking,
  createBooking,
  listTenantBookings,
} from '../../api/bookings.js';
import { listMemberships } from '../../api/memberships.js';
import { getAvailability, listServices } from '../../api/services.js';
import { listStaff } from '../../api/staff.js';
import { isLocalDesignMode } from './localDesignFixtures.js';
import StudioEmptyState from './StudioEmptyState';
import StudioListHead from './StudioListHead';
import StudioScreenShell from './StudioScreenShell';
import { studioUiStyles as ui } from './studioUiStyles.js';
import { useStudioFormReveal } from './useStudioFormReveal.js';
import {
  dateFromKey,
  formatDay,
  formatDayChip,
  reservationCountLabel,
  toDateKey,
  upcomingDays,
} from './studioTime.js';

type StudioBookingsScreenProps = {
  tenantId?: string;
  studioName?: string;
  siteHost?: string | null;
  onBack: () => void;
};

type BookingRow = {
  id: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  userId?: string;
  user?: { name?: string; email?: string } | null;
  staff?: { name?: string } | null;
  serviceName?: string;
};

type MemberOption = {
  userId: string;
  label: string;
};

type StaffOption = {
  id: string;
  name: string;
};

type SlotOption = {
  startTime: string;
  available?: number;
  capacity?: number;
  status?: string;
};

async function copySiteAddress(host: string) {
  const value = host.includes('://') ? host : `https://${host}`;
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  throw new Error('clipboard-unavailable');
}

function memberName(item: BookingRow) {
  return item.user?.name || item.user?.email || 'Član';
}

/**
 * Termini — odabir dana, potvrđene rezervacije, otkaz.
 */
export default function StudioBookingsScreen({
  tenantId,
  studioName,
  siteHost,
  onBack,
}: StudioBookingsScreenProps) {
  const {
    formOpen,
    formVisible,
    openForm: revealOpen,
    closeForm: revealClose,
    formRevealStyle,
  } = useStudioFormReveal();
  const days = useMemo(() => upcomingDays(14), []);
  const [date, setDate] = useState(() => toDateKey(days[0]));
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle');

  const [members, setMembers] = useState<MemberOption[]>([]);
  const [trainers, setTrainers] = useState<StaffOption[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [slotTime, setSlotTime] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [formError, setFormError] = useState('');

  const selectedDate = useMemo(() => dateFromKey(date), [date]);
  const dayBookings = useMemo(
    () =>
      bookings
        .filter((item) => item.status === 'CONFIRMED')
        .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || ''))),
    [bookings],
  );

  const loadBookings = useCallback(async () => {
    if (!tenantId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await listTenantBookings(tenantId, { date, limit: 100 });
      const items = Array.isArray(data?.bookings) ? data.bookings : [];
      setBookings(items);
    } catch {
      setBookings([]);
      setError('Rezervacije se nisu učitale. Pokušajte ponovno.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, date]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    let cancelled = false;
    if (!tenantId || isLocalDesignMode()) return undefined;
    (async () => {
      try {
        const [membersData, staffData, servicesData] = await Promise.all([
          listMemberships(tenantId),
          listStaff(tenantId),
          listServices(tenantId),
        ]);
        if (cancelled) return;
        const memberships = Array.isArray(membersData?.memberships)
          ? membersData.memberships
          : [];
        setMembers(
          memberships
            .filter((item: { status?: string }) => item.status === 'ACTIVE')
            .map((item: { userId?: string; user?: { name?: string; email?: string } }) => ({
              userId: String(item.userId),
              label: item.user?.name || item.user?.email || 'Član',
            })),
        );
        const staff = Array.isArray(staffData?.staff) ? staffData.staff : [];
        const activeTrainers = staff
          .filter(
            (item: { status?: string; role?: string }) =>
              item.status === 'ACTIVE' && item.role === 'STAFF',
          )
          .map((item: { id: string; name?: string }) => ({
            id: String(item.id),
            name: item.name || 'Trener',
          }));
        setTrainers(activeTrainers);
        if (activeTrainers[0]?.id) setStaffId(activeTrainers[0].id);
        const services = Array.isArray(servicesData?.services)
          ? servicesData.services
          : [];
        const primary = services.find((item: { active?: boolean }) => item.active !== false)
          || services[0];
        if (primary?.id) setServiceId(String(primary.id));
      } catch {
        /* keep booking form empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  useEffect(() => {
    let cancelled = false;
    if (!tenantId || !serviceId || !date || isLocalDesignMode()) {
      setSlots([]);
      return undefined;
    }
    setLoadingSlots(true);
    setSlotTime('');
    (async () => {
      try {
        const data = await getAvailability(tenantId, serviceId, date);
        if (cancelled) return;
        const list = Array.isArray(data?.slots) ? data.slots : [];
        setSlots(list.filter((item: SlotOption) => item.status === 'AVAILABLE'));
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId, serviceId, date]);

  function openForm() {
    revealOpen(() => {
      setFormError('');
      setOk('');
    });
  }

  function closeForm() {
    revealClose(() => {
      setFormError('');
    });
  }

  async function handleBook() {
    if (isLocalDesignMode()) {
      setFormError('Lokalni demo — rezervacija u bazu je isključena.');
      return;
    }
    if (!memberId) {
      setFormError('Odaberite člana.');
      return;
    }
    if (trainers.length > 0 && !staffId) {
      setFormError('Odaberite trenera.');
      return;
    }
    if (!slotTime) {
      setFormError('Odaberite sat.');
      return;
    }
    if (!serviceId) {
      setFormError('Usluga još nije spremna.');
      return;
    }
    setBooking(true);
    setFormError('');
    setOk('');
    try {
      await createBooking({
        serviceId,
        date,
        startTime: slotTime,
        userId: memberId,
        ...(staffId ? { staffId } : {}),
      });
      setOk('Rezervacija je spremljena.');
      setSlotTime('');
      closeForm();
      await loadBookings();
    } catch {
      setFormError('Rezervacija nije spremljena. Provjerite slobodne sate.');
    } finally {
      setBooking(false);
    }
  }

  async function handleCopy() {
    if (!siteHost) return;
    try {
      await copySiteAddress(siteHost);
      setCopyState('done');
      setTimeout(() => setCopyState('idle'), 2200);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2200);
    }
  }

  async function handleCancel(id: string) {
    setBusyId(id);
    setError('');
    try {
      await cancelBooking(id);
      setBookings((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: 'CANCELLED' } : item,
        ),
      );
    } catch {
      setError('Otkazivanje nije uspjelo. Pokušajte ponovno.');
    } finally {
      setBusyId('');
    }
  }

  const titleAccessory = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={formOpen ? 'Zatvori formu' : 'Nova rezervacija'}
      onPress={() => (formOpen || formVisible ? closeForm() : openForm())}
      style={({ pressed }) => [ui.addBtnSolid, pressed && ui.pressed]}
    >
      <Ionicons
        name={formOpen ? 'close' : 'add-outline'}
        size={20}
        color="#061210"
      />
    </Pressable>
  );

  return (
    <StudioScreenShell
      studioName={studioName}
      onBack={onBack}
      title="Termini"
      lead="Raspored i rezervacije"
      titleAccessory={titleAccessory}
      keyboardShouldPersistTaps="handled"
    >
      {ok ? <Text style={ui.notice}>{ok}</Text> : null}

      {formVisible ? (
        <View style={ui.formShell}>
          <Animated.View style={[ui.form, formRevealStyle]}>
            <Text style={ui.sectionLabel}>Nova rezervacija</Text>
            <Text style={ui.formHint}>
                  Odaberite člana i slobodni sat za {formatDay(selectedDate)}.
                </Text>

            <Text style={ui.fieldLabel}>Član</Text>
            <View style={styles.optionWrap}>
              {members.length === 0 ? (
                <Text style={ui.hint}>Nema aktivnih članova.</Text>
              ) : (
                members.map((item) => {
                  const on = memberId === item.userId;
                  return (
                    <Pressable
                      key={item.userId}
                      onPress={() => setMemberId(item.userId)}
                      style={({ pressed }) => [
                        ui.filterChip,
                        on && ui.filterChipOn,
                        pressed && ui.pressed,
                      ]}
                    >
                      <Text style={[ui.filterLabel, on && ui.filterLabelOn]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>

            {trainers.length > 0 ? (
              <>
                <Text style={ui.fieldLabel}>Trener</Text>
                <View style={styles.optionWrap}>
                  {trainers.map((item) => {
                    const on = staffId === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setStaffId(item.id)}
                        style={({ pressed }) => [
                          ui.filterChip,
                          on && ui.filterChipOn,
                          pressed && ui.pressed,
                        ]}
                      >
                        <Text style={[ui.filterLabel, on && ui.filterLabelOn]}>
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            <Text style={ui.fieldLabel}>Slobodni sati</Text>
            {loadingSlots ? (
              <Text style={ui.hint}>Učitavamo sate…</Text>
            ) : null}
            {!loadingSlots && slots.length === 0 ? (
              <Text style={ui.hint}>Nema slobodnih sati za ovaj dan.</Text>
            ) : null}
            <View style={styles.optionWrap}>
              {slots.map((slot) => {
                const on = slotTime === slot.startTime;
                return (
                  <Pressable
                    key={slot.startTime}
                    onPress={() => setSlotTime(slot.startTime)}
                    style={({ pressed }) => [
                      ui.filterChip,
                      on && ui.filterChipOn,
                      pressed && ui.pressed,
                    ]}
                  >
                    <Text style={[ui.filterLabel, on && ui.filterLabelOn]}>
                      {slot.startTime}
                      {slot.available != null && slot.capacity != null
                        ? ` · ${slot.available}/${slot.capacity}`
                        : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {formError ? <Text style={ui.error}>{formError}</Text> : null}
            <Pressable
              onPress={handleBook}
              disabled={booking}
              style={({ pressed }) => [
                ui.primaryBtn,
                pressed && ui.pressed,
                booking && ui.disabled,
              ]}
            >
              {booking ? (
                <ActivityIndicator color="#061210" />
              ) : (
                <Text style={ui.primaryLabel}>Spremi rezervaciju</Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      ) : null}

      <Text style={ui.sectionLabel}>Dan</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayRail}
            style={styles.dayRailScroll}
          >
            {days.map((day) => {
              const key = toDateKey(day);
              const chip = formatDayChip(day);
              const active = key === date;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${chip.weekday} ${chip.day}`}
                  onPress={() => setDate(key)}
                  style={({ pressed }) => [
                    styles.dayChip,
                    active && styles.dayChipActive,
                    pressed && ui.pressed,
                  ]}
                >
                  <Text style={[styles.dayWeek, active && styles.dayWeekActive]}>
                    {chip.weekday}
                  </Text>
                  <Text style={[styles.dayNum, active && styles.dayNumActive]}>
                    {chip.day}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

      <StudioListHead
        sectionLabel="Rezervacije"
        dayLabel={formatDay(selectedDate)}
        countLabel={reservationCountLabel(dayBookings.length)}
        countStrong={dayBookings.length > 0}
      />

      {error ? <Text style={ui.error}>{error}</Text> : null}

      {loading ? (
        <View style={ui.loadingRow}>
          <ActivityIndicator color="#5EEAD4" size="small" />
          <Text style={ui.hint}>Učitavamo rezervacije…</Text>
        </View>
      ) : null}

      {!loading && dayBookings.length === 0 ? (
        <StudioEmptyState
          icon="calendar-outline"
          title="Još nema rezervacija"
          body="Podijelite svoju adresu stranice s klijentima i prve će uskoro stići."
          extra={
            siteHost ? (
              <>
                <Text style={styles.hostHint}>{siteHost}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Kopiraj adresu stranice"
                  onPress={handleCopy}
                  style={({ pressed }) => [
                    styles.copyBtn,
                    pressed && ui.pressed,
                  ]}
                >
                  <Ionicons name="copy-outline" size={18} color="#061210" />
                  <Text style={ui.primaryLabel}>Kopiraj adresu stranice</Text>
                </Pressable>
                {copyState === 'done' ? (
                  <Text style={styles.copyOk} accessibilityLiveRegion="polite">
                    Adresa je kopirana.
                  </Text>
                ) : null}
                {copyState === 'error' ? (
                  <Text style={ui.error}>Adresa nije kopirana. Pokušajte ponovno.</Text>
                ) : null}
              </>
            ) : null
          }
        />
      ) : null}

      {!loading && dayBookings.length > 0 ? (
        <View style={ui.list}>
          {dayBookings.map((item) => (
            <View key={item.id} style={styles.bookingRow}>
              <View style={ui.rowCopy}>
                <Text style={styles.rowTime}>
                      {item.startTime || '—'}
                      –
                      {item.endTime || '—'}
                    </Text>
                <Text style={ui.rowMeta} numberOfLines={2}>
                      {memberName(item)}
                      {item.staff?.name ? ` · ${item.staff.name}` : ''}
                    </Text>
                    {item.serviceName ? (
                      <Text style={styles.rowService} numberOfLines={1}>
                        {item.serviceName}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Otkaži rezervaciju"
                    onPress={() => handleCancel(item.id)}
                    disabled={Boolean(busyId)}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  pressed && ui.pressed,
                ]}
                  >
                    {busyId === item.id ? (
                      <ActivityIndicator color="#FCA5A5" size="small" />
                    ) : (
                      <Text style={styles.cancelLabel}>Otkaži</Text>
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
    </StudioScreenShell>
  );
}

const styles = StyleSheet.create({
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayRailScroll: {
    marginHorizontal: -24,
    marginBottom: 22,
  },
  dayRail: {
    paddingHorizontal: 24,
    gap: 8,
  },
  dayChip: {
    minWidth: 56,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.14)',
    backgroundColor: 'rgba(10, 20, 18, 0.35)',
    alignItems: 'center',
    gap: 2,
  },
  dayChipActive: {
    borderColor: 'rgba(94, 234, 212, 0.55)',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  dayWeek: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 0.4,
    color: 'rgba(232, 242, 239, 0.48)',
    textTransform: 'capitalize',
  },
  dayWeekActive: {
    color: 'rgba(94, 234, 212, 0.9)',
  },
  dayNum: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#E8F2EF',
  },
  dayNumActive: {
    color: '#F7FCFA',
  },
  hostHint: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: 'rgba(94, 234, 212, 0.9)',
    marginTop: 4,
  },
  copyBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#5EEAD4',
    marginTop: 8,
  },
  copyOk: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: '#5EEAD4',
    marginTop: 2,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(232, 242, 239, 0.12)',
  },
  rowTime: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#F7FCFA',
  },
  rowService: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.42)',
  },
  cancelBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.35)',
    backgroundColor: 'rgba(251, 113, 133, 0.08)',
  },
  cancelLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: '#FCA5A5',
  },
});
