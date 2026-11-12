import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getMe } from '../../api/auth.js';
import {
  cancelBooking,
  createBooking,
  listMyBookings,
} from '../../api/bookings.js';
import { recordConsent } from '../../api/consent.js';
import { getAvailability } from '../../api/services.js';
import {
  messageForCancelBookingError,
  messageForCreateBookingError,
} from '../../lib/bookingErrors.js';
import { memberChromeStyles as chrome } from './memberChrome';
import { CONSENT_VERSION, hasValidConsent } from '../../lib/consent.js';
import {
  firstOpenKey,
  formatBookingDay,
  sessionsLabel,
  slotNote,
} from '../../../../shared/memberBookLabels.js';
import {
  dateFromKey,
  dayOpen,
  formatCancellationWindow,
  formatDay,
  formatDayChip,
  toDateKey,
  upcomingDays,
  withinCancellationWindow,
  zonedClock,
} from '../studio/studioTime.js';

type MemberBookScreenProps = {
  tenant: any;
  membership: any;
  isMember: boolean;
  onBack: () => void;
};

export default function MemberBookScreen({
  tenant,
  membership,
  isMember,
  onBack,
}: MemberBookScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const tenantId = String(tenant?.id || '');
  const services = tenant?.services || [];
  const trainers = tenant?.trainers || [];
  const service = services.find((item: any) => item.active !== false) || services[0] || null;
  const serviceId = service ? String(service.id) : '';
  const cancelWindow = Number(service?.cancellationWindowMinutes ?? 60) || 60;
  const cancelWindowLabel = formatCancellationWindow(cancelWindow);
  const timeZone = tenant?.timezone || 'Europe/Zagreb';
  const workingHours = tenant?.bookingSettings?.workingHours || [];
  const days = useMemo(() => upcomingDays(14), []);

  const [date, setDate] = useState(() => firstOpenKey(days, workingHours));
  const [staffId, setStaffId] = useState(() => (
    trainers[0] ? String(trainers[0].id) : ''
  ));
  const [slotTime, setSlotTime] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [consentOk, setConsentOk] = useState(false);
  const [acceptingConsent, setAcceptingConsent] = useState(false);
  const [booking, setBooking] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const selectedDate = useMemo(() => dateFromKey(date), [date]);
  const open = dayOpen(workingHours, selectedDate);
  const bookableSlots = slots.filter((item) => item.status === 'AVAILABLE');
  const selectedSlot = bookableSlots.find((item) => item.startTime === slotTime) || null;

  const myBookings = useMemo(() => (
    bookings
      .filter((item) => String(item.tenantId) === tenantId && item.status === 'CONFIRMED')
      .sort((a, b) => {
        const byDate = String(a.date).localeCompare(String(b.date));
        return byDate !== 0 ? byDate : String(a.startTime).localeCompare(String(b.startTime));
      })
  ), [bookings, tenantId]);

  const refreshBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const data = await listMyBookings(50);
      setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } catch {
      /* ignore */
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getMe();
        const user = data?.user || data;
        if (!cancelled) setConsentOk(hasValidConsent(user));
      } catch {
        if (!cancelled) setConsentOk(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void refreshBookings();
  }, [refreshBookings]);

  useEffect(() => {
    setSlotTime('');
    setOk('');
  }, [date]);

  useEffect(() => {
    if (!isMember || !consentOk || !serviceId || !tenantId || !open) {
      setSlots([]);
      return undefined;
    }
    let cancelled = false;
    void (async () => {
      setLoadingSlots(true);
      try {
        const data = await getAvailability(tenantId, serviceId, date);
        if (!cancelled) setSlots(Array.isArray(data?.slots) ? data.slots : []);
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setError(err instanceof Error ? err.message : 'Sati nisu učitani.');
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isMember, consentOk, serviceId, tenantId, date, open]);

  async function acceptConsent() {
    setAcceptingConsent(true);
    setError('');
    try {
      await recordConsent({
        action: 'accept',
        version: CONSENT_VERSION,
        source: 'member-book',
      });
      setConsentOk(true);
      setOk('Privola je spremljena.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Privola nije spremljena.');
    } finally {
      setAcceptingConsent(false);
    }
  }

  async function onBook() {
    setError('');
    setOk('');
    if (trainers.length > 0 && !staffId) {
      setError('Odaberite trenera.');
      return;
    }
    if (!slotTime) {
      setError('Odaberite sat.');
      return;
    }
    setBooking(true);
    try {
      await createBooking({
        serviceId,
        date,
        startTime: slotTime,
        ...(staffId ? { staffId } : {}),
      });
      setOk('Termin je rezerviran.');
      setSlotTime('');
      await refreshBookings();
      const data = await getAvailability(tenantId, serviceId, date);
      setSlots(Array.isArray(data?.slots) ? data.slots : []);
    } catch (failure) {
      setError(messageForCreateBookingError(failure));
    } finally {
      setBooking(false);
    }
  }

  async function onCancel(bookingId: string) {
    setError('');
    setOk('');
    setBusyId(bookingId);
    try {
      await cancelBooking(bookingId);
      setOk('Rezervacija je otkazana. Termin vam se ne broji kao iskorišten.');
      await refreshBookings();
    } catch (failure) {
      setError(messageForCancelBookingError(failure, { cancelWindowLabel }));
    } finally {
      setBusyId('');
    }
  }

  function canCancel(item: any) {
    const now = zonedClock(timeZone);
    return withinCancellationWindow(now, item.date, item.startTime, cancelWindow);
  }

  return (
    <View style={[chrome.root, { backgroundColor: '#060908' }]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0C1815', '#070B0A', '#050706']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          chrome.content,
          { paddingTop: compact ? 44 : 56, paddingBottom: 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [chrome.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={18} color="#5EEAD4" />
          <Text style={[chrome.backLabel, { color: '#5EEAD4' }]}>Početna</Text>
        </Pressable>

        <Text style={styles.studio}>{tenant?.name || 'Studio'}</Text>
        <Text style={[chrome.title, { color: '#E8F2EF' }]}>Termini</Text>
        <Text style={styles.lead}>
          {service
            ? `${service.name} · ${service.durationMinutes} min`
            : 'Studio još nema objavljenu uslugu za rezervaciju.'}
        </Text>
        {isMember ? (
          <Text style={styles.plan}>
            {membership?.planName || 'Članarina'}
            {' · '}
            {sessionsLabel(membership)}
          </Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {ok ? <Text style={styles.ok}>{ok}</Text> : null}

        {!isMember ? (
          <View style={styles.gate}>
            <Text style={styles.kicker}>Članstvo</Text>
            <Text style={styles.gateTitle}>Članarina je potrebna</Text>
            <Text style={styles.gateLead}>
              Pregled termina je dostupan članovima s aktivnom članarinom.
            </Text>
          </View>
        ) : null}

        {isMember && !consentOk ? (
          <View style={styles.gate}>
            <Text style={styles.kicker}>Privola</Text>
            <Text style={styles.gateTitle}>Privola je potrebna za rezervacije</Text>
            <Text style={styles.gateLead}>
              Za rezervacije i otkaze potrebna je privola za obradu podataka.
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={acceptingConsent}
              onPress={acceptConsent}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            >
              <Text style={styles.ctaLabel}>
                {acceptingConsent ? 'Spremamo…' : 'Prihvatite privolu'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {isMember && consentOk && !service ? (
          <View style={styles.gate}>
            <Text style={styles.kicker}>Usluga</Text>
            <Text style={styles.gateTitle}>Nema usluge</Text>
            <Text style={styles.gateLead}>
              Studio još nije postavio uslugu za termine.
            </Text>
          </View>
        ) : null}

        {isMember && consentOk && service ? (
          <>
            <View style={styles.policy}>
              <Text style={styles.kicker}>Pravila</Text>
              <Text style={styles.sectionTitle}>Uvjeti otkazivanja</Text>
              <Text style={styles.policyText}>
                Termin možete otkazati najkasnije {cancelWindowLabel}. U tom roku
                rezervacija se briše i termin se ne broji kao iskorišten.
              </Text>
            </View>

            <Text style={styles.kicker}>Korak 01</Text>
            <Text style={styles.sectionTitle}>Dan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.days}>
              {days.map((item) => {
                const key = toDateKey(item);
                const works = dayOpen(workingHours, item);
                const selected = key === date;
                const chip = formatDayChip(item);
                return (
                  <Pressable
                    key={key}
                    disabled={!works}
                    onPress={() => setDate(key)}
                    style={({ pressed }) => [
                      styles.dayChip,
                      selected && styles.dayChipOn,
                      !works && styles.dayChipClosed,
                      pressed && works && styles.pressed,
                    ]}
                  >
                    <Text style={styles.dayName}>{chip.weekday}</Text>
                    <Text style={styles.dayNum}>{chip.day}.</Text>
                    <Text style={styles.dayMeta}>{works ? 'Otvoreno' : 'Zatvoreno'}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.kicker}>Korak 02</Text>
            <Text style={styles.sectionTitle}>{formatDay(selectedDate)}</Text>
            <Text style={styles.hint}>
              {!open
                ? 'Studio je zatvoren ovog dana.'
                : loadingSlots
                  ? 'Učitavamo slobodne sate…'
                  : bookableSlots.length > 0
                    ? 'Odaberite slobodan sat.'
                    : 'Nema slobodnih sati za ovaj dan.'}
            </Text>

            {open && trainers.length > 0 ? (
              <View style={styles.trainers}>
                <Text style={styles.trainersLabel}>Kod koga rezervirate</Text>
                <View style={styles.trainerRow}>
                  {trainers.map((trainer: any) => {
                    const id = String(trainer.id);
                    const on = staffId === id;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => setStaffId(id)}
                        style={({ pressed }) => [
                          styles.trainerChip,
                          on && styles.trainerChipOn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.trainerName}>{trainer.name}</Text>
                        <Text style={styles.trainerTitle}>{trainer.title || 'Trener'}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {open ? (
              <View style={styles.slots}>
                {slots.map((slot) => {
                  const free = slot.status === 'AVAILABLE';
                  const on = slotTime === slot.startTime;
                  return (
                    <Pressable
                      key={slot.startTime}
                      disabled={!free}
                      onPress={() => setSlotTime(slot.startTime)}
                      style={({ pressed }) => [
                        styles.slotChip,
                        on && styles.slotChipOn,
                        !free && styles.slotChipDisabled,
                        pressed && free && styles.pressed,
                      ]}
                    >
                      <Text style={styles.slotTime}>{slot.startTime}</Text>
                      <Text style={styles.slotMeta}>{slotNote(slot)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {open ? (
              <Pressable
                accessibilityRole="button"
                disabled={booking || !selectedSlot}
                onPress={onBook}
                style={({ pressed }) => [
                  styles.cta,
                  (!selectedSlot || booking) && styles.ctaDisabled,
                  pressed && selectedSlot && styles.pressed,
                ]}
              >
                <Text style={styles.ctaLabel}>
                  {booking ? 'Rezerviramo…' : 'Rezerviraj termin'}
                </Text>
              </Pressable>
            ) : null}

            <Text style={[styles.kicker, { marginTop: 28 }]}>Pregled</Text>
            <Text style={styles.sectionTitle}>Vaše rezervacije</Text>
            {loadingBookings ? <Text style={styles.hint}>Učitavamo…</Text> : null}
            {!loadingBookings && myBookings.length === 0 ? (
              <Text style={styles.hint}>Još nemate rezervacija u ovom studiju.</Text>
            ) : null}
            {myBookings.map((item) => {
              const allowed = canCancel(item);
              return (
                <View key={item.id} style={styles.bookingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingTitle}>
                      {formatBookingDay(item.date)} · {item.startTime}–{item.endTime}
                    </Text>
                    <Text style={styles.bookingMeta}>
                      {item.serviceName || 'Termin'}
                      {item.staff?.name ? ` · ${item.staff.name}` : ''}
                      {' · '}
                      {allowed
                        ? 'Možete otkazati bez gubitka termina'
                        : 'Rok za otkaz je istekao'}
                    </Text>
                  </View>
                  {allowed ? (
                    <Pressable
                      disabled={busyId === item.id}
                      onPress={() => {
                        void onCancel(item.id);
                      }}
                      style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.cancelLabel}>
                        {busyId === item.id ? '…' : 'Otkaži'}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.locked}>Zaključano</Text>
                  )}
                </View>
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  studio: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    letterSpacing: 0.4,
    color: 'rgba(94, 234, 212, 0.85)',
    marginBottom: 6,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.68)',
    marginBottom: 6,
  },
  plan: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#5EEAD4',
    marginBottom: 16,
  },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#FCA5A5',
    marginBottom: 10,
  },
  ok: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#5EEAD4',
    marginBottom: 10,
  },
  gate: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  kicker: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#5EEAD4',
    marginTop: 10,
    marginBottom: 6,
  },
  gateTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 24,
    color: '#F7FCFA',
  },
  gateLead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(232, 242, 239, 0.7)',
  },
  policy: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(94, 234, 212, 0.28)',
    padding: 14,
    marginBottom: 8,
  },
  policyText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(232, 242, 239, 0.72)',
  },
  sectionTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 26,
    color: '#F7FCFA',
    marginBottom: 8,
  },
  hint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.62)',
    marginBottom: 12,
  },
  days: { marginBottom: 8 },
  dayChip: {
    width: 78,
    marginRight: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    alignItems: 'center',
  },
  dayChipOn: {
    borderColor: '#5EEAD4',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  dayChipClosed: { opacity: 0.4 },
  dayName: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    color: 'rgba(232, 242, 239, 0.7)',
  },
  dayNum: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 22,
    color: '#F7FCFA',
    marginVertical: 2,
  },
  dayMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  trainers: { marginBottom: 14 },
  trainersLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.75)',
    marginBottom: 8,
  },
  trainerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trainerChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 120,
  },
  trainerChipOn: {
    borderColor: '#5EEAD4',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  trainerName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#F7FCFA',
  },
  trainerTitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.6)',
  },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  slotChip: {
    width: '30%',
    minWidth: 96,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  slotChipOn: {
    borderColor: '#5EEAD4',
    backgroundColor: 'rgba(94, 234, 212, 0.14)',
  },
  slotChipDisabled: { opacity: 0.38 },
  slotTime: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#F7FCFA',
  },
  slotMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: 'rgba(232, 242, 239, 0.58)',
    marginTop: 2,
  },
  cta: {
    minHeight: 52,
    borderRadius: 6,
    backgroundColor: '#5EEAD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#061210',
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(232, 242, 239, 0.14)',
  },
  bookingTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#F7FCFA',
  },
  bookingMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(232, 242, 239, 0.62)',
    marginTop: 2,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(94, 234, 212, 0.45)',
  },
  cancelLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: '#5EEAD4',
  },
  locked: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.45)',
  },
  pressed: { opacity: 0.82 },
});
