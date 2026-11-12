import React, { useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { useOwnerLogout } from '../../lib/useOwnerLogout.js';
import { Ionicons } from '@expo/vector-icons';
import { getMyTenants, updateTenant } from '../../api/tenants.js';
import { findSignupNiche } from '../auth/signupDefaults.js';
import AppBrandBar from './AppBrandBar';
import StudioAnalyticsScreen from './StudioAnalyticsScreen';
import StudioBookingsScreen from './StudioBookingsScreen';
import StudioBoot from './StudioBoot';
import StudioCalendarScreen from './StudioCalendarScreen';
import StudioMembersScreen from './StudioMembersScreen';
import StudioScreenShell from './StudioScreenShell';
import StudioServicesScreen from './StudioServicesScreen';
import StudioSettingsScreen from './StudioSettingsScreen';
import { studioUiStyles as ui } from './studioUiStyles.js';

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

type PanelId =
  | 'home'
  | 'bookings'
  | 'calendar'
  | 'members'
  | 'services'
  | 'analytics'
  | 'settings';

const NAV_ITEMS = [
  {
    id: 'bookings' as const,
    label: 'Termini',
    note: 'Raspored i rezervacije',
    icon: 'calendar-outline' as const,
  },
  {
    id: 'calendar' as const,
    label: 'Kalendar',
    note: 'Zauzetost po mjesecu',
    icon: 'grid-outline' as const,
  },
  {
    id: 'members' as const,
    label: 'Članovi',
    note: 'Članarine i klijenti',
    icon: 'people-outline' as const,
  },
  {
    id: 'services' as const,
    label: 'Usluge',
    note: 'Ponuda i trajanja',
    icon: 'list-outline' as const,
  },
  {
    id: 'analytics' as const,
    label: 'Analitika',
    note: 'Uvidi i članarine',
    icon: 'stats-chart-outline' as const,
  },
  {
    id: 'settings' as const,
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
  const { loggingOut, handleLogout } = useOwnerLogout(onLogout);
  const [studio, setStudio] = useState<StudioInfo | null>(
    fallbackName ? { name: fallbackName, email: fallbackEmail } : null,
  );
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<PanelId>('home');
  const [hint, setHint] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const phoneReveal = useRef(new Animated.Value(0)).current;
  const phoneActions = useRef(new Animated.Value(0)).current;
  const phoneInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
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

  if (loading) return <StudioBoot />;

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
  const goHome = () => setPanel('home');

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

  function onNavPress(id: PanelId | string, label: string) {
    const known = NAV_ITEMS.some((item) => item.id === id);
    if (known) {
      setHint('');
      setPanel(id as PanelId);
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
        onBack={goHome}
      />
    );
  }

  if (panel !== 'home') {
    const shared = {
      tenantId: studio?.id,
      studioName,
      onBack: goHome,
    };
    if (panel === 'members') return <StudioMembersScreen {...shared} />;
    if (panel === 'services') return <StudioServicesScreen {...shared} />;
    if (panel === 'analytics') return <StudioAnalyticsScreen {...shared} />;
    if (panel === 'calendar') return <StudioCalendarScreen {...shared} />;
    if (panel === 'settings') {
      return (
        <StudioSettingsScreen
          {...shared}
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
  }

  return (
    <StudioScreenShell
      title={studioName}
      lead="Sve za vaš studio na jednom mjestu — termini, kalendar, članovi, usluge i analitika."
      topBar={<AppBrandBar onLogout={handleLogout} loggingOut={loggingOut} />}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.facts} accessibilityLabel="Podaci poslovanja">
        <Text style={ui.sectionLabel}>Podaci poslovanja</Text>

        {host ? (
          <FactRow icon="globe-outline" label="Adresa stranice" value={host} />
        ) : null}
        {nicheLabel ? (
          <FactRow icon="apps-outline" label="Vrsta poslovanja" value={nicheLabel} />
        ) : null}
        {email ? <FactRow icon="mail-outline" label="E-pošta" value={email} /> : null}

        <View style={[ui.factRow, editingPhone && styles.factRowPhoneEdit]}>
          <View style={ui.factIcon}>
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
                    style={ui.inputCompact}
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
                      pressed && ui.pressed,
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
                    style={({ pressed }) => [styles.phoneIconBtn, pressed && ui.pressed]}
                  >
                    <Ionicons name="close" size={18} color="rgba(232, 242, 239, 0.55)" />
                  </Pressable>
                </Animated.View>
              </View>
              {phoneError ? <Text style={ui.error}>{phoneError}</Text> : null}
            </View>
          ) : (
            <View style={ui.factCopy}>
              <Text style={ui.factLabel}>Telefon</Text>
              {phone ? (
                <Text style={ui.factValue}>{phone}</Text>
              ) : (
                <View style={styles.phoneIdle}>
                  <Text style={[ui.factValue, ui.factMuted]}>Nije upisan</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Dodaj telefon"
                    onPress={openPhoneEdit}
                    hitSlop={8}
                    style={({ pressed }) => [styles.phoneAddBtn, pressed && ui.pressed]}
                  >
                    <Ionicons name="add-outline" size={18} color="#5EEAD4" />
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      <Text style={[ui.sectionLabel, styles.menuTitle]}>Brzi izbornik</Text>
      <View style={styles.menuGrid}>
        {NAV_ITEMS.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => onNavPress(item.id, item.label)}
            style={({ pressed }) => [styles.menuCard, pressed && ui.pressed]}
          >
            <Ionicons name={item.icon} size={20} color="#5EEAD4" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuNote}>{item.note}</Text>
          </Pressable>
        ))}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </StudioScreenShell>
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
    <View style={ui.factRow}>
      <View style={ui.factIcon}>
        <Ionicons name={icon} size={18} color="#5EEAD4" />
      </View>
      <View style={ui.factCopy}>
        <Text style={ui.factLabel}>{label}</Text>
        <Text style={ui.factValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  facts: { paddingTop: 2 },
  factRowPhoneEdit: { alignItems: 'center' },
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
  menuTitle: {
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
});
