import { useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import { logout } from '../../api/auth.js';
import { getMyTenants, updateTenant } from '../../api/tenants.js';
import AuthLegalStrip from '../auth/AuthLegalStrip';
import { findSignupNiche } from '../auth/signupDefaults.js';
import StudioAnalyticsScreen from './StudioAnalyticsScreen';
import StudioBookingsScreen from './StudioBookingsScreen';
import StudioCalendarScreen from './StudioCalendarScreen';
import StudioMembersScreen from './StudioMembersScreen';
import StudioServicesScreen from './StudioServicesScreen';
import StudioSettingsScreen from './StudioSettingsScreen';

type StudioHomeScreenProps = {
  fallbackName?: string;
  fallbackEmail?: string;
  fromRegister?: boolean;
  onLogout?: () => void;
};

type StudioInfo = {
  id?: string;
  name: string;
  slug?: string;
  niche?: string;
  nicheCustom?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
};

const NAV_ITEMS = [
  {
    id: 'bookings',
    label: 'Termini',
    note: 'Raspored i rezervacije',
    icon: 'calendar-outline' as const,
  },
  {
    id: 'calendar',
    label: 'Kalendar',
    note: 'Zauzetost po mjesecu',
    icon: 'grid-outline' as const,
  },
  {
    id: 'members',
    label: 'Članovi',
    note: 'Članarine i klijenti',
    icon: 'people-outline' as const,
  },
  {
    id: 'services',
    label: 'Usluge',
    note: 'Ponuda i trajanja',
    icon: 'list-outline' as const,
  },
  {
    id: 'analytics',
    label: 'Analitika',
    note: 'Uvidi i članarine',
    icon: 'stats-chart-outline' as const,
  },
  {
    id: 'settings',
    label: 'Postavke',
    note: 'Račun i obavijesti',
    icon: 'settings-outline' as const,
  },
];

/**
 * Početni ekran prostora — osnovni podaci + brzi izbornik.
 */
export default function StudioHomeScreen({
  fallbackName,
  fallbackEmail,
  onLogout,
}: StudioHomeScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useRef(new Animated.Value(0)).current;

  const [studio, setStudio] = useState<StudioInfo | null>(
    fallbackName ? { name: fallbackName, email: fallbackEmail } : null,
  );
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [panel, setPanel] = useState<
    | 'home'
    | 'bookings'
    | 'calendar'
    | 'members'
    | 'services'
    | 'analytics'
    | 'settings'
  >('home');
  const [hint, setHint] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const phoneReveal = useRef(new Animated.Value(0)).current;
  const phoneActions = useRef(new Animated.Value(0)).current;
  const phoneInputRef = useRef<TextInput>(null);
  const phoneAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyTenants();
        const owned = data?.tenants?.find(
          (item: { role?: string }) => item.role === 'BUSINESS_OWNER',
        );
        const tenant = owned?.tenant;
        if (!cancelled && tenant) {
          setStudio({
            id: tenant.id || tenant._id,
            name: tenant.name || fallbackName || 'Studio',
            slug: tenant.slug,
            niche: tenant.niche,
            nicheCustom: tenant.nicheCustom,
            email: tenant.email || fallbackEmail,
            phone: tenant.phone,
            address: tenant.address,
            city: tenant.city,
          });
        }
      } catch {
        /* fallback */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fallbackName, fallbackEmail]);

  useEffect(() => {
    if (loading) return undefined;
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 560,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [loading, enter]);

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color="#5EEAD4" />
      </View>
    );
  }

  const studioName = studio?.name || fallbackName || 'Studio';
  const host = studio?.slug ? `${studio.slug}.booking.hr` : null;
  const nicheLabel =
    studio?.niche === 'generic' && studio?.nicheCustom
      ? studio.nicheCustom
      : studio?.niche
        ? findSignupNiche(studio.niche).name
        : null;
  const email = studio?.email || fallbackEmail || null;
  const phone = studio?.phone?.trim() || null;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      /* lokalni logout */
    } finally {
      setLoggingOut(false);
      onLogout?.();
    }
  }

  function stopPhoneAnim() {
    phoneAnimRef.current?.stop();
    phoneAnimRef.current = null;
  }

  function openPhoneEdit() {
    stopPhoneAnim();
    setPhoneDraft('');
    setPhoneError('');
    setEditingPhone(true);
    phoneReveal.setValue(0);
    phoneActions.setValue(0);
    requestAnimationFrame(() => {
      const anim = Animated.parallel([
        Animated.timing(phoneReveal, {
          toValue: 1,
          duration: 780,
          easing: Easing.bezier(0.33, 0.1, 0.25, 1),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.sequence([
          Animated.delay(280),
          Animated.timing(phoneActions, {
            toValue: 1,
            duration: 520,
            easing: Easing.bezier(0.33, 0.1, 0.25, 1),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      ]);
      phoneAnimRef.current = anim;
      anim.start(({ finished }) => {
        if (finished) {
          // Tipkovnica tek nakon otvaranja — ne prekida animaciju.
          setTimeout(() => phoneInputRef.current?.focus(), 60);
        }
      });
    });
  }

  function closePhoneEdit(after?: () => void) {
    stopPhoneAnim();
    phoneInputRef.current?.blur();
    const anim = Animated.parallel([
      Animated.timing(phoneActions, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(phoneReveal, {
        toValue: 0,
        duration: 420,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    phoneAnimRef.current = anim;
    anim.start(({ finished }) => {
      if (!finished) return;
      setEditingPhone(false);
      setPhoneDraft('');
      setPhoneError('');
      after?.();
    });
  }

  async function savePhone() {
    const next = phoneDraft.trim();
    if (!next) {
      setPhoneError('Upišite broj telefona.');
      return;
    }
    if (!studio?.id) {
      setPhoneError('Studio još nije učitan. Pokušajte ponovno.');
      return;
    }
    setSavingPhone(true);
    setPhoneError('');
    try {
      await updateTenant(studio.id, { phone: next });
      setStudio((current) => (current ? { ...current, phone: next } : current));
      closePhoneEdit();
    } catch {
      setPhoneError('Spremanje nije uspjelo. Pokušajte ponovno.');
    } finally {
      setSavingPhone(false);
    }
  }

  function onNavPress(id: string, label: string) {
    if (id === 'bookings') {
      setHint('');
      setPanel('bookings');
      return;
    }
    if (id === 'members') {
      setHint('');
      setPanel('members');
      return;
    }
    if (id === 'services') {
      setHint('');
      setPanel('services');
      return;
    }
    if (id === 'analytics') {
      setHint('');
      setPanel('analytics');
      return;
    }
    if (id === 'calendar') {
      setHint('');
      setPanel('calendar');
      return;
    }
    if (id === 'settings') {
      setHint('');
      setPanel('settings');
      return;
    }
    setHint(`${label} stiže u sljedećem koraku.`);
  }

  if (panel === 'bookings') {
    return (
      <StudioBookingsScreen
        tenantId={studio?.id}
        studioName={studioName}
        siteHost={host}
        onBack={() => setPanel('home')}
      />
    );
  }

  if (panel === 'members') {
    return (
      <StudioMembersScreen
        tenantId={studio?.id}
        studioName={studioName}
        onBack={() => setPanel('home')}
      />
    );
  }

  if (panel === 'services') {
    return (
      <StudioServicesScreen
        tenantId={studio?.id}
        studioName={studioName}
        onBack={() => setPanel('home')}
      />
    );
  }

  if (panel === 'analytics') {
    return (
      <StudioAnalyticsScreen
        tenantId={studio?.id}
        studioName={studioName}
        onBack={() => setPanel('home')}
      />
    );
  }

  if (panel === 'calendar') {
    return (
      <StudioCalendarScreen
        tenantId={studio?.id}
        studioName={studioName}
        onBack={() => setPanel('home')}
      />
    );
  }

  if (panel === 'settings') {
    return (
      <StudioSettingsScreen
        tenantId={studio?.id}
        studioName={studioName}
        onBack={() => setPanel('home')}
        onLogout={handleLogout}
        onStudioUpdated={(patch) => {
          setStudio((current) =>
            current
              ? {
                  ...current,
                  ...patch,
                  name: patch.name || current.name,
                }
              : current,
          );
        }}
      />
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
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.topBar}>
            <Text style={styles.brand}>anyminutes</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Odjava"
              onPress={handleLogout}
              disabled={loggingOut}
              hitSlop={10}
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
            >
              {loggingOut ? (
                <ActivityIndicator color="#5EEAD4" size="small" />
              ) : (
                <Ionicons name="power-outline" size={22} color="#5EEAD4" />
              )}
            </Pressable>
          </View>

          <Text
            style={[styles.title, compact && { fontSize: 34, lineHeight: 38 }]}
            numberOfLines={2}
          >
            {studioName}
          </Text>
          <Text style={styles.lead}>
            Sve za vaš studio na jednom mjestu — termini, kalendar, članovi,
            usluge i analitika.
          </Text>

          <View style={styles.facts} accessibilityLabel="Podaci poslovanja">
            <Text style={styles.factsTitle}>Podaci poslovanja</Text>

            {host ? (
              <FactRow icon="globe-outline" label="Adresa stranice" value={host} />
            ) : null}
            {nicheLabel ? (
              <FactRow
                icon="apps-outline"
                label="Vrsta poslovanja"
                value={nicheLabel}
              />
            ) : null}
            {email ? (
              <FactRow icon="mail-outline" label="E-pošta" value={email} />
            ) : null}

            <View
              style={[
                styles.factRow,
                editingPhone && styles.factRowPhoneEdit,
              ]}
            >
              <View style={styles.factIcon}>
                <Ionicons name="call-outline" size={18} color="#5EEAD4" />
              </View>
              {editingPhone ? (
                <View style={styles.phoneEditWrap}>
                  <View style={styles.phoneEditRow}>
                    <Animated.View
                      style={[
                        styles.phoneInputShell,
                        {
                          opacity: phoneReveal,
                          transform: [
                            {
                              translateX: phoneReveal.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-22, 0],
                              }),
                            },
                            {
                              scaleX: phoneReveal.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.92, 1],
                              }),
                            },
                            {
                              scaleY: phoneReveal.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.98, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <TextInput
                        ref={phoneInputRef}
                        style={styles.phoneInput}
                        value={phoneDraft}
                        onChangeText={(value) => {
                          setPhoneDraft(value);
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder="+385 …"
                        placeholderTextColor="rgba(232, 242, 239, 0.28)"
                        keyboardType="phone-pad"
                        editable={!savingPhone}
                        accessibilityLabel="Telefon"
                        returnKeyType="done"
                        onSubmitEditing={savePhone}
                      />
                    </Animated.View>
                    <Animated.View
                      style={[
                        styles.phoneActionGroup,
                        {
                          opacity: phoneActions,
                          transform: [
                            {
                              translateX: phoneActions.interpolate({
                                inputRange: [0, 1],
                                outputRange: [8, 0],
                              }),
                            },
                            {
                              scale: phoneActions.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.94, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Spremi telefon"
                        onPress={savePhone}
                        disabled={savingPhone}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.phoneIconBtn,
                          styles.phoneIconBtnPrimary,
                          pressed && styles.pressed,
                        ]}
                      >
                        {savingPhone ? (
                          <ActivityIndicator color="#061210" size="small" />
                        ) : (
                          <Ionicons name="checkmark" size={20} color="#061210" />
                        )}
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Odustani"
                        onPress={() => closePhoneEdit()}
                        disabled={savingPhone}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.phoneIconBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name="close"
                          size={18}
                          color="rgba(232, 242, 239, 0.55)"
                        />
                      </Pressable>
                    </Animated.View>
                  </View>
                  {phoneError ? (
                    <Text style={styles.phoneError}>{phoneError}</Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.factCopy}>
                  <Text style={styles.factLabel}>Telefon</Text>
                  {phone ? (
                    <Text style={styles.factValue}>{phone}</Text>
                  ) : (
                    <View style={styles.phoneIdle}>
                      <Text style={[styles.factValue, styles.factMuted]}>
                        Nije upisan
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Dodaj telefon"
                        onPress={openPhoneEdit}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.phoneAddBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name="add-outline"
                          size={18}
                          color="#5EEAD4"
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: enter, marginTop: 8 }}>
          <Text style={styles.menuTitle}>Brzi izbornik</Text>
          <View style={styles.menuGrid}>
            {NAV_ITEMS.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => onNavPress(item.id, item.label)}
                style={({ pressed }) => [styles.menuCard, pressed && styles.pressed]}
              >
                <Ionicons name={item.icon} size={20} color="#5EEAD4" />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuNote}>{item.note}</Text>
              </Pressable>
            ))}
          </View>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </Animated.View>

        <View style={styles.footer}>
          <AuthLegalStrip />
        </View>
      </ScrollView>
    </View>
  );
}

function FactRow({
  icon,
  label,
  value,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.factRow}>
      <View style={styles.factIcon}>
        <Ionicons name={icon} size={18} color="#5EEAD4" />
      </View>
      <View style={styles.factCopy}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
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
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  brand: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: '#F7FCFA',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.6,
    color: '#E8F2EF',
    marginBottom: 10,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.66)',
    maxWidth: 360,
    marginBottom: 20,
  },
  facts: {
    paddingTop: 2,
  },
  factsTitle: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
    marginBottom: 8,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(232, 242, 239, 0.12)',
  },
  factIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    marginTop: 1,
  },
  factCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  factLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
  },
  factValue: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    lineHeight: 21,
    color: '#E8F2EF',
  },
  factMuted: {
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(232, 242, 239, 0.42)',
  },
  factRowPhoneEdit: {
    alignItems: 'center',
  },
  phoneIdle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  phoneEditWrap: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    overflow: 'hidden',
  },
  phoneEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneInputShell: {
    flex: 1,
    minWidth: 0,
    transformOrigin: 'left center',
  },
  phoneInput: {
    width: '100%',
    height: 36,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#F7FCFA',
    backgroundColor: 'rgba(10, 20, 18, 0.45)',
  },
  phoneActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232, 242, 239, 0.08)',
  },
  phoneIconBtnPrimary: {
    backgroundColor: '#5EEAD4',
  },
  phoneError: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(251, 113, 133, 0.95)',
  },
  menuTitle: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
    marginBottom: 12,
    marginTop: 18,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  menuCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.16)',
    borderRadius: 8,
    backgroundColor: 'rgba(10, 20, 18, 0.4)',
  },
  menuLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#F7FCFA',
  },
  menuNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(232, 242, 239, 0.5)',
  },
  hint: {
    marginTop: 12,
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(94, 234, 212, 0.75)',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 28,
  },
  pressed: { opacity: 0.82 },
});
