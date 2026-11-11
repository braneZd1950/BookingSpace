import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  cancelBooking,
  createBooking,
  listTenantBookings,
} from '../../api/bookings.js';
import { listMemberships } from '../../api/memberships.js';
import { getAvailability, listServices } from '../../api/services.js';
import { listStaff } from '../../api/staff.js';
import AuthLegalStrip from '../auth/AuthLegalStrip';
import { isLocalDesignMode } from './localDesignFixtures.js';
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
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useRef(new Animated.Value(0)).current;
  const days = useMemo(() => upcomingDays(14), []);
  const [date, setDate] = useState(() => toDateKey(days[0]));
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle');

  const [formOpen, setFormOpen] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const formReveal = useRef(new Animated.Value(0)).current;
  const formAnimRef = useRef<Animated.CompositeAnimation | null>(null);
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
    
    enter.setValue(0);
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [enter]);

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
    formAnimRef.current?.stop();
    setFormError('');
    setOk('');
    setFormOpen(true);
    setFormVisible(true);
    formReveal.setValue(0);
    requestAnimationFrame(() => {
      const anim = Animated.timing(formReveal, {
        toValue: 1,
        duration: 720,
        easing: Easing.bezier(0.33, 0.1, 0.25, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      });
      formAnimRef.current = anim;
      anim.start();
    });
  }

  function closeForm() {
    formAnimRef.current?.stop();
    const anim = Animated.timing(formReveal, {
      toValue: 0,
      duration: 420,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    formAnimRef.current = anim;
    anim.start(({ finished }) => {
      if (!finished) return;
      setFormVisible(false);
      setFormOpen(false);
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
        keyboardShouldPersistTaps="handled"
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

          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text
                style={[styles.title, compact && { fontSize: 34, lineHeight: 38 }]}
              >
                Termini
              </Text>
              <Text style={styles.lead}>Raspored i rezervacije</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={formOpen ? 'Zatvori formu' : 'Nova rezervacija'}
              onPress={() => (formOpen || formVisible ? closeForm() : openForm())}
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Ionicons
                name={formOpen ? 'close' : 'add-outline'}
                size={20}
                color="#061210"
              />
            </Pressable>
          </View>

          {ok ? <Text style={styles.ok}>{ok}</Text> : null}

          {formVisible ? (
            <View style={styles.formShell}>
              <Animated.View
                style={[
                  styles.form,
                  {
                    opacity: formReveal,
                    transform: [
                      {
                        translateY: formReveal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-28, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.sectionLabel}>Nova rezervacija</Text>
                <Text style={styles.formHint}>
                  Odaberite člana i slobodni sat za {formatDay(selectedDate)}.
                </Text>

                <Text style={styles.fieldLabel}>Član</Text>
                <View style={styles.optionWrap}>
                  {members.length === 0 ? (
                    <Text style={styles.hint}>Nema aktivnih članova.</Text>
                  ) : (
                    members.map((item) => {
                      const on = memberId === item.userId;
                      return (
                        <Pressable
                          key={item.userId}
                          onPress={() => setMemberId(item.userId)}
                          style={({ pressed }) => [
                            styles.optionChip,
                            on && styles.optionChipOn,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionLabel,
                              on && styles.optionLabelOn,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>

                {trainers.length > 0 ? (
                  <>
                    <Text style={styles.fieldLabel}>Trener</Text>
                    <View style={styles.optionWrap}>
                      {trainers.map((item) => {
                        const on = staffId === item.id;
                        return (
                          <Pressable
                            key={item.id}
                            onPress={() => setStaffId(item.id)}
                            style={({ pressed }) => [
                              styles.optionChip,
                              on && styles.optionChipOn,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.optionLabel,
                                on && styles.optionLabelOn,
                              ]}
                            >
                              {item.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                <Text style={styles.fieldLabel}>Slobodni sati</Text>
                {loadingSlots ? (
                  <Text style={styles.hint}>Učitavamo sate…</Text>
                ) : null}
                {!loadingSlots && slots.length === 0 ? (
                  <Text style={styles.hint}>Nema slobodnih sati za ovaj dan.</Text>
                ) : null}
                <View style={styles.optionWrap}>
                  {slots.map((slot) => {
                    const on = slotTime === slot.startTime;
                    return (
                      <Pressable
                        key={slot.startTime}
                        onPress={() => setSlotTime(slot.startTime)}
                        style={({ pressed }) => [
                          styles.optionChip,
                          on && styles.optionChipOn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[styles.optionLabel, on && styles.optionLabelOn]}
                        >
                          {slot.startTime}
                          {slot.available != null && slot.capacity != null
                            ? ` · ${slot.available}/${slot.capacity}`
                            : ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {formError ? <Text style={styles.error}>{formError}</Text> : null}
                <Pressable
                  onPress={handleBook}
                  disabled={booking}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.pressed,
                    booking && styles.disabled,
                  ]}
                >
                  {booking ? (
                    <ActivityIndicator color="#061210" />
                  ) : (
                    <Text style={styles.primaryLabel}>Spremi rezervaciju</Text>
                  )}
                </Pressable>
              </Animated.View>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Dan</Text>
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
                    pressed && styles.pressed,
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

          <View style={styles.listHead}>
            <View style={styles.listHeadCopy}>
              <Text style={styles.sectionLabel}>Rezervacije</Text>
              <Text style={styles.listDay}>{formatDay(selectedDate)}</Text>
            </View>
            <Text
              style={[
                styles.count,
                dayBookings.length > 0 && styles.countStrong,
              ]}
            >
              {reservationCountLabel(dayBookings.length)}
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#5EEAD4" size="small" />
              <Text style={styles.hint}>Učitavamo rezervacije…</Text>
            </View>
          ) : null}

          {!loading && dayBookings.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={22} color="#5EEAD4" />
              </View>
              <Text style={styles.emptyTitle}>Još nema rezervacija</Text>
              <Text style={styles.emptyBody}>
                Podijelite svoju adresu stranice s klijentima i prve će uskoro
                stići.
              </Text>
              {siteHost ? (
                <>
                  <Text style={styles.hostHint}>{siteHost}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Kopiraj adresu stranice"
                    onPress={handleCopy}
                    style={({ pressed }) => [
                      styles.copyBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons name="copy-outline" size={18} color="#061210" />
                    <Text style={styles.copyLabel}>Kopiraj adresu stranice</Text>
                  </Pressable>
                  {copyState === 'done' ? (
                    <Text style={styles.copyOk} accessibilityLiveRegion="polite">
                      Adresa je kopirana.
                    </Text>
                  ) : null}
                  {copyState === 'error' ? (
                    <Text style={styles.copyFail}>
                      Adresa nije kopirana. Pokušajte ponovno.
                    </Text>
                  ) : null}
                </>
              ) : null}
            </View>
          ) : null}

          {!loading && dayBookings.length > 0 ? (
            <View style={styles.list}>
              {dayBookings.map((item) => (
                <View key={item.id} style={styles.row}>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTime}>
                      {item.startTime || '—'}
                      –
                      {item.endTime || '—'}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={2}>
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
                      pressed && styles.pressed,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  titleCopy: { flex: 1, minWidth: 0 },
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
    marginBottom: 8,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5EEAD4',
    marginTop: 4,
  },
  ok: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#5EEAD4',
    marginBottom: 10,
  },
  formShell: {
    overflow: 'hidden',
    marginBottom: 18,
  },
  form: {
    gap: 10,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(232, 242, 239, 0.12)',
  },
  formHint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(232, 242, 239, 0.55)',
    marginTop: -4,
  },
  fieldLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
    marginTop: 4,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.14)',
    backgroundColor: 'rgba(10, 20, 18, 0.35)',
  },
  optionChipOn: {
    borderColor: 'rgba(94, 234, 212, 0.55)',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  optionLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.6)',
  },
  optionLabelOn: {
    color: '#5EEAD4',
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#5EEAD4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#061210',
  },
  disabled: { opacity: 0.7 },
  sectionLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
    marginBottom: 10,
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
  listHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  listHeadCopy: {
    flex: 1,
    minWidth: 0,
  },
  listDay: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: '#E8F2EF',
    marginTop: -4,
  },
  count: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.48)',
    paddingBottom: 2,
  },
  countStrong: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#5EEAD4',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  hint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(251, 113, 133, 0.95)',
    marginBottom: 10,
  },
  empty: {
    paddingTop: 8,
    gap: 10,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#E8F2EF',
  },
  emptyBody: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(232, 242, 239, 0.64)',
    maxWidth: 340,
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
  copyLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#061210',
  },
  copyOk: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: '#5EEAD4',
    marginTop: 2,
  },
  copyFail: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(251, 113, 133, 0.95)',
    marginTop: 2,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(232, 242, 239, 0.12)',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTime: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#F7FCFA',
  },
  rowMeta: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.72)',
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
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
  },
  pressed: { opacity: 0.72 },
});
