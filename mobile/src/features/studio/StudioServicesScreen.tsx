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
import { createService, listServices, updateService } from '../../api/services.js';
import AuthLegalStrip from '../auth/AuthLegalStrip';
import {
  isLocalDesignMode,
  localDesignServices,
} from './localDesignFixtures.js';
import { formatCancellationWindow } from './studioTime.js';
import {
  STUDIO_GRADIENT,
  STUDIO_GRADIENT_LOCATIONS,
  studioChromeStyles as chrome,
  studioEnterStyle,
  useStudioEnterAnimation,
} from './studioChrome.js';

type StudioServicesScreenProps = {
  tenantId?: string;
  studioName?: string;
  onBack: () => void;
};

type ServiceRow = {
  id: string;
  name?: string;
  description?: string;
  durationMinutes?: number;
  slotIntervalMinutes?: number;
  capacity?: number;
  cancellationWindowMinutes?: number;
  price?: number;
  membershipRequired?: boolean;
  active?: boolean;
};

type FilterId = 'active' | 'all';

const DURATION_PRESETS = [30, 45, 60, 90] as const;
const CAPACITY_PRESETS = [1, 6, 8, 12] as const;
const CANCEL_PRESETS = [0, 30, 60, 120] as const;

function serviceCountLabel(count: number) {
  const n = Number(count) || 0;
  if (n === 0) return 'Nema usluga';
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod10 === 1 && mod100 !== 11) return `${n} usluga`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} usluge`;
  return `${n} usluga`;
}

function isFixtureId(id?: string) {
  return Boolean(id && String(id).startsWith('local-design-'));
}

/**
 * Usluge — ponuda, trajanje, kapacitet i rok otkaza.
 */
export default function StudioServicesScreen({
  tenantId,
  studioName,
  onBack,
}: StudioServicesScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useStudioEnterAnimation();
  const formReveal = useRef(new Animated.Value(0)).current;
  const formAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const [filter, setFilter] = useState<FilterId>('active');
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [usingLocalFixtures, setUsingLocalFixtures] = useState(false);
  const [loading, setLoading] = useState(Boolean(tenantId) || isLocalDesignMode());
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [name, setName] = useState('Termin');
  const [duration, setDuration] = useState('60');
  const [capacity, setCapacity] = useState('12');
  const [cancelWindow, setCancelWindow] = useState('60');
  const [membershipRequired, setMembershipRequired] = useState(true);

  const activeServices = useMemo(
    () => services.filter((item) => item.active !== false),
    [services],
  );
  const visible = useMemo(
    () => (filter === 'active' ? activeServices : services),
    [filter, activeServices, services],
  );

  const load = useCallback(async () => {
    if (isLocalDesignMode()) {
      setUsingLocalFixtures(true);
      setServices(localDesignServices() as ServiceRow[]);
      setLoading(false);
      setError('');
      return;
    }

    setUsingLocalFixtures(false);
    if (!tenantId) {
      setServices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await listServices(tenantId);
      setServices(Array.isArray(data?.services) ? data.services : []);
    } catch {
      setServices([]);
      setError('Usluge se nisu učitale. Pokušajte ponovno.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm(defaults?: Partial<ServiceRow>) {
    setName(defaults?.name || 'Termin');
    setDuration(String(defaults?.durationMinutes ?? 60));
    setCapacity(String(defaults?.capacity ?? 12));
    setCancelWindow(String(defaults?.cancellationWindowMinutes ?? 60));
    setMembershipRequired(defaults?.membershipRequired !== false);
    setFormError('');
    setEditingId(defaults?.id || null);
  }

  function stopFormAnim() {
    formAnimRef.current?.stop();
    formAnimRef.current = null;
  }

  function openForm(service?: ServiceRow) {
    stopFormAnim();
    setNotice('');
    resetForm(service);
    setFormOpen(true);
    setFormVisible(true);
    formReveal.setValue(0);
    requestAnimationFrame(() => {
      const anim = Animated.timing(formReveal, {
        toValue: 1,
        duration: 820,
        easing: Easing.bezier(0.33, 0.1, 0.25, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      });
      formAnimRef.current = anim;
      anim.start();
    });
  }

  function closeForm(after?: () => void) {
    stopFormAnim();
    const anim = Animated.timing(formReveal, {
      toValue: 0,
      duration: 460,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    formAnimRef.current = anim;
    anim.start(({ finished }) => {
      if (!finished) return;
      setFormVisible(false);
      setFormOpen(false);
      resetForm();
      after?.();
    });
  }

  function toggleForm() {
    if (formOpen || formVisible) {
      closeForm();
      return;
    }
    openForm();
  }

  async function onSave() {
    if (!name.trim()) {
      setFormError('Upišite naziv usluge.');
      return;
    }
    const durationMinutes = Number(duration);
    const capacityValue = Number(capacity);
    const cancellationWindowMinutes = Number(cancelWindow);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
      setFormError('Upišite trajanje u minutama.');
      return;
    }
    if (!Number.isFinite(capacityValue) || capacityValue < 1) {
      setFormError('Upišite kapacitet (najmanje 1).');
      return;
    }
    if (!Number.isFinite(cancellationWindowMinutes) || cancellationWindowMinutes < 0) {
      setFormError('Upišite rok otkaza u minutama.');
      return;
    }

    if (isFixtureId(editingId || undefined) || usingLocalFixtures) {
      setNotice('Lokalni demo podatak — spremanje u bazu je isključeno.');
      closeForm();
      return;
    }
    if (!tenantId) {
      setFormError('Studio još nije učitan.');
      return;
    }

    const body = {
      name: name.trim(),
      durationMinutes,
      slotIntervalMinutes: durationMinutes,
      capacity: capacityValue,
      cancellationWindowMinutes,
      price: 0,
      membershipRequired,
    };

    setSaving(true);
    setFormError('');
    try {
      if (editingId) {
        await updateService(editingId, body);
        closeForm(() => setNotice('Usluga je spremljena.'));
      } else {
        await createService(tenantId, body);
        closeForm(() => setNotice('Usluga je dodana.'));
      }
      await load();
    } catch {
      setFormError('Usluga nije spremljena. Provjerite podatke i pokušajte ponovno.');
    } finally {
      setSaving(false);
    }
  }

  async function onToggleActive(item: ServiceRow) {
    if (isFixtureId(item.id) || usingLocalFixtures) {
      setNotice('Lokalni demo podatak — promjena statusa je isključena.');
      return;
    }
    setBusyId(item.id);
    setNotice('');
    try {
      await updateService(item.id, { active: item.active === false });
      setNotice(
        item.active === false
          ? `${item.name || 'Usluga'} je ponovno aktivna.`
          : `${item.name || 'Usluga'} je deaktivirana.`,
      );
      await load();
    } catch {
      setError('Status usluge nije promijenjen.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <View style={chrome.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={STUDIO_GRADIENT}
        locations={STUDIO_GRADIENT_LOCATIONS}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={chrome.flex}
        contentContainerStyle={[
          chrome.stage,
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
        <Animated.View style={studioEnterStyle(enter)}>
          <View style={chrome.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Natrag na ${studioName || 'studio'}`}
              onPress={onBack}
              hitSlop={10}
              style={({ pressed }) => [chrome.backBtn, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={22} color="#5EEAD4" />
              <Text style={chrome.backLabel} numberOfLines={1}>
                {studioName || 'Moj studio'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text
                style={[styles.title, compact && { fontSize: 34, lineHeight: 38 }]}
              >
                Usluge
              </Text>
              <Text style={styles.lead}>Ponuda i trajanja</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={formOpen ? 'Zatvori formu' : 'Dodaj uslugu'}
              onPress={toggleForm}
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Ionicons
                name={formOpen ? 'close' : 'add-outline'}
                size={20}
                color="#061210"
              />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Aktivne</Text>
              <Text style={styles.statValue}>{activeServices.length}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Sve</Text>
              <Text style={styles.statValue}>{services.length}</Text>
            </View>
          </View>

          {usingLocalFixtures ? (
            <Text style={styles.fixtureBanner}>
              Lokalni demo podaci — samo za dizajn (__DEV__).
            </Text>
          ) : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

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
                          outputRange: [-36, 0],
                        }),
                      },
                      {
                        scaleY: formReveal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.94, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.sectionLabel}>
                  {editingId ? 'Uredi uslugu' : 'Nova usluga'}
                </Text>
                <Text style={styles.formHint}>
                  Trajanje, kapacitet i rok otkaza vrijede za rezervacije ove usluge.
                </Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Naziv usluge"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  editable={!saving}
                />

                <Text style={styles.fieldLabel}>Trajanje (min)</Text>
                <View style={styles.presetRow}>
                  {DURATION_PRESETS.map((value) => {
                    const on = duration === String(value);
                    return (
                      <Pressable
                        key={value}
                        onPress={() => setDuration(String(value))}
                        style={({ pressed }) => [
                          styles.preset,
                          on && styles.presetOn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.presetLabel, on && styles.presetLabelOn]}>
                          {value}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                  placeholder="Trajanje"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  editable={!saving}
                />

                <Text style={styles.fieldLabel}>Kapacitet</Text>
                <View style={styles.presetRow}>
                  {CAPACITY_PRESETS.map((value) => {
                    const on = capacity === String(value);
                    return (
                      <Pressable
                        key={value}
                        onPress={() => setCapacity(String(value))}
                        style={({ pressed }) => [
                          styles.preset,
                          on && styles.presetOn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.presetLabel, on && styles.presetLabelOn]}>
                          {value}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  style={styles.input}
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="number-pad"
                  placeholder="Kapacitet"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  editable={!saving}
                />

                <Text style={styles.fieldLabel}>Rok otkaza (min)</Text>
                <View style={styles.presetRow}>
                  {CANCEL_PRESETS.map((value) => {
                    const on = cancelWindow === String(value);
                    return (
                      <Pressable
                        key={value}
                        onPress={() => setCancelWindow(String(value))}
                        style={({ pressed }) => [
                          styles.preset,
                          on && styles.presetOn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.presetLabel, on && styles.presetLabelOn]}>
                          {value === 0 ? '0' : value}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.cancelHint}>
                  {formatCancellationWindow(Number(cancelWindow))}
                </Text>

                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: membershipRequired }}
                  onPress={() => setMembershipRequired((value) => !value)}
                  style={({ pressed }) => [
                    styles.checkRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      membershipRequired && styles.checkboxOn,
                    ]}
                  >
                    {membershipRequired ? (
                      <Ionicons name="checkmark" size={14} color="#061210" />
                    ) : null}
                  </View>
                  <Text style={styles.checkLabel}>
                    Zahtijeva aktivnu članarinu
                  </Text>
                </Pressable>

                {formError ? <Text style={styles.error}>{formError}</Text> : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={onSave}
                  disabled={saving}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.pressed,
                    saving && styles.disabled,
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color="#061210" size="small" />
                  ) : (
                    <Text style={styles.primaryLabel}>
                      {editingId ? 'Spremi izmjene' : 'Dodaj uslugu'}
                    </Text>
                  )}
                </Pressable>
              </Animated.View>
            </View>
          ) : null}

          <View style={styles.filterRow}>
            {(
              [
                { id: 'active' as const, label: `Aktivne (${activeServices.length})` },
                { id: 'all' as const, label: `Sve (${services.length})` },
              ]
            ).map((item) => {
              const on = filter === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    on && styles.filterChipOn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.filterLabel, on && styles.filterLabelOn]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.listHead}>
            <View style={styles.listHeadCopy}>
              <Text style={styles.sectionLabel}>Ponuda</Text>
              <Text style={styles.listDay}>Usluge za rezervacije</Text>
            </View>
            <Text style={[styles.count, visible.length > 0 && styles.countStrong]}>
              {serviceCountLabel(visible.length)}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#5EEAD4" size="small" />
              <Text style={styles.hint}>Učitavamo usluge…</Text>
            </View>
          ) : null}

          {!loading && visible.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="list-outline" size={22} color="#5EEAD4" />
              </View>
              <Text style={styles.emptyTitle}>Još nema usluga</Text>
              <Text style={styles.emptyBody}>
                Dodajte prvu uslugu da članovi mogu rezervirati termine.
              </Text>
              {!formVisible ? (
                <Pressable
                  onPress={() => openForm()}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.primaryLabel}>Dodajte uslugu</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {!loading && visible.length > 0 ? (
            <View style={styles.list}>
              {visible.map((item) => {
                const active = item.active !== false;
                const busy = busyId === item.id;
                return (
                  <View
                    key={item.id}
                    style={[styles.row, !active && styles.rowMuted]}
                  >
                    <View style={styles.avatar}>
                      <Ionicons name="time-outline" size={18} color="#5EEAD4" />
                    </View>
                    <View style={styles.rowCopy}>
                      <View style={styles.rowTitle}>
                        <Text style={styles.rowName} numberOfLines={1}>
                          {item.name || 'Usluga'}
                        </Text>
                        <Text
                          style={[
                            styles.badge,
                            active ? styles.badgeOk : styles.badgeMuted,
                          ]}
                        >
                          {active ? 'Aktivno' : 'Neaktivno'}
                        </Text>
                      </View>
                      <Text style={styles.rowMeta}>
                        {item.durationMinutes || '—'} min
                        {' · '}
                        max {item.capacity || '—'}
                        {item.membershipRequired ? ' · članarina' : ''}
                      </Text>
                      <Text style={styles.rowDates}>
                        Otkaz: {formatCancellationWindow(item.cancellationWindowMinutes)}
                      </Text>
                      <View style={styles.actions}>
                        <Pressable
                          onPress={() => openForm(item)}
                          style={({ pressed }) => [
                            styles.actionBtn,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={styles.actionLabel}>Uredi</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => onToggleActive(item)}
                          disabled={Boolean(busyId)}
                          style={({ pressed }) => [
                            styles.actionBtn,
                            !active ? null : styles.actionDanger,
                            pressed && styles.pressed,
                          ]}
                        >
                          {busy ? (
                            <ActivityIndicator
                              color={active ? '#FCA5A5' : '#5EEAD4'}
                              size="small"
                            />
                          ) : (
                            <Text
                              style={
                                active
                                  ? styles.actionDangerLabel
                                  : styles.actionLabel
                              }
                            >
                              {active ? 'Deaktiviraj' : 'Aktiviraj'}
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  titleCopy: { flex: 1, minWidth: 0 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5EEAD4',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.12)',
    backgroundColor: 'rgba(10, 20, 18, 0.28)',
    gap: 4,
  },
  statLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
  },
  statValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#E8F2EF',
  },
  fixtureBanner: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(251, 191, 36, 0.95)',
    marginBottom: 10,
  },
  notice: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#5EEAD4',
    marginBottom: 12,
  },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(251, 113, 133, 0.95)',
    marginBottom: 10,
  },
  formShell: {
    overflow: 'hidden',
    marginBottom: 18,
  },
  form: {
    gap: 10,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(232, 242, 239, 0.12)',
    transformOrigin: 'top center',
  },
  formHint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(232, 242, 239, 0.55)',
    marginTop: -4,
    marginBottom: 4,
  },
  fieldLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
    marginTop: 4,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#F7FCFA',
    backgroundColor: 'rgba(10, 20, 18, 0.45)',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preset: {
    minWidth: 52,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.14)',
    backgroundColor: 'rgba(10, 20, 18, 0.35)',
  },
  presetOn: {
    borderColor: 'rgba(94, 234, 212, 0.55)',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  presetLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.6)',
  },
  presetLabelOn: {
    color: '#5EEAD4',
  },
  cancelHint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.48)',
    marginTop: -2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 20, 18, 0.35)',
  },
  checkboxOn: {
    backgroundColor: '#5EEAD4',
    borderColor: '#5EEAD4',
  },
  checkLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.78)',
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.14)',
    backgroundColor: 'rgba(10, 20, 18, 0.35)',
  },
  filterChipOn: {
    borderColor: 'rgba(94, 234, 212, 0.55)',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  filterLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  filterLabelOn: {
    color: '#5EEAD4',
  },
  sectionLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
    marginBottom: 10,
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  listHeadCopy: { flex: 1, minWidth: 0 },
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
  list: { gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(232, 242, 239, 0.12)',
  },
  rowMuted: { opacity: 0.62 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    marginTop: 2,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowName: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#F7FCFA',
  },
  badge: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  badgeOk: { color: '#5EEAD4' },
  badgeMuted: { color: 'rgba(232, 242, 239, 0.45)' },
  rowMeta: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.72)',
  },
  rowDates: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.42)',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.35)',
    backgroundColor: 'rgba(94, 234, 212, 0.08)',
  },
  actionLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#5EEAD4',
  },
  actionDanger: {
    borderColor: 'rgba(251, 113, 133, 0.35)',
    backgroundColor: 'rgba(251, 113, 133, 0.08)',
  },
  actionDangerLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#FCA5A5',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
  },
  pressed: { opacity: 0.72 },
});
