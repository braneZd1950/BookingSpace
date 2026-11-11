import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
import { changePassword, getMe, updateMe } from '../../api/auth.js';
import { listServices, updateService, createService } from '../../api/services.js';
import { getMyTenants, updateTenant } from '../../api/tenants.js';
import AuthLegalStrip from '../auth/AuthLegalStrip';
import {
  fallbackHours,
  formatCancellationWindow,
  hourRows,
  hoursFromWorking,
  hoursPayload,
  isValidClock,
} from './studioTime.js';

type StudioSettingsScreenProps = {
  tenantId?: string;
  studioName?: string;
  onBack: () => void;
  onLogout?: () => void;
  onStudioUpdated?: (patch: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
  }) => void;
};

type TabId =
  | 'business'
  | 'account'
  | 'security'
  | 'privacy'
  | 'billing'
  | 'notifications';

type HourKey = 'week' | 'saturday' | 'sunday' | 'holidays';
type HourRow = { works: boolean; from: string; to: string };
type HoursState = Record<HourKey, HourRow>;

const TABS: { id: TabId; label: string }[] = [
  { id: 'business', label: 'Poslovanje' },
  { id: 'account', label: 'Račun' },
  { id: 'security', label: 'Sigurnost' },
  { id: 'privacy', label: 'Privatnost' },
  { id: 'billing', label: 'Pretplata' },
  { id: 'notifications', label: 'Obavijesti' },
];

const CANCEL_PRESETS = [0, 30, 60, 120, 1440] as const;

const DEFAULT_PREFS = {
  bookingEmail: true,
  cancelEmail: true,
  memberEmail: true,
  weeklyDigest: false,
  marketing: false,
  bookingPush: true,
  cancelPush: true,
  memberPush: true,
  reminderPush: false,
};

type PrefKey = keyof typeof DEFAULT_PREFS;

const EMAIL_PREFS: { key: PrefKey; label: string; note: string }[] = [
  { key: 'bookingEmail', label: 'Nova rezervacija', note: 'E-pošta kad netko rezervira' },
  { key: 'cancelEmail', label: 'Otkaz termina', note: 'E-pošta kad netko otkaže' },
  { key: 'memberEmail', label: 'Novi član', note: 'Obavijest o novom ili obnovljenom članu' },
  { key: 'weeklyDigest', label: 'Tjedni sažetak', note: 'Pregled popunjenosti jednom tjedno' },
  { key: 'marketing', label: 'Novosti proizvoda', note: 'Rijetke obavijesti o anyminutesu' },
];

const PUSH_PREFS: { key: PrefKey; label: string; note: string }[] = [
  { key: 'bookingPush', label: 'Nova rezervacija', note: 'Push na uređaj' },
  { key: 'cancelPush', label: 'Otkaz', note: 'Push kad se termin otkaže' },
  { key: 'memberPush', label: 'Novi član', note: 'Push o članarinama' },
  { key: 'reminderPush', label: 'Podsjetnici', note: 'Prije nadolazećih termina' },
];

const TAB_LEAD: Record<TabId, string> = {
  business: 'Naziv, kontakt, radno vrijeme i rok otkaza.',
  account: 'Podaci za prijavu i OIB za buduću naplatu.',
  security: 'Lozinka i sesija na ovom uređaju.',
  privacy: 'Kako se koriste podaci vašeg studija.',
  billing: 'Trenutačno potpuno besplatno.',
  notifications: 'E-pošta i push o rezervacijama i članovima.',
};

/**
 * Postavke — poslovni podaci, račun, sigurnost, privatnost, pretplata, obavijesti.
 */
export default function StudioSettingsScreen({
  tenantId,
  studioName,
  onBack,
  onLogout,
  onStudioUpdated,
}: StudioSettingsScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useRef(new Animated.Value(0)).current;

  const [tab, setTab] = useState<TabId>('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [serviceId, setServiceId] = useState<string | null>(null);

  const [name, setName] = useState(studioName || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [oib, setOib] = useState('');
  const [cancelWindow, setCancelWindow] = useState('60');
  const [hours, setHours] = useState<HoursState>({ ...fallbackHours } as HoursState);

  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPhone, setAccountPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [again, setAgain] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [prefs, setPrefs] = useState({ ...DEFAULT_PREFS });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [meData, tenantsData, servicesData] = await Promise.all([
        getMe(),
        getMyTenants(),
        tenantId ? listServices(tenantId) : Promise.resolve(null),
      ]);
      const user = meData?.user || meData || {};
      setAccountName(user.name || '');
      setAccountEmail(user.email || '');
      setAccountPhone(user.phone || '');
      setPrefs({ ...DEFAULT_PREFS, ...(user.notificationPrefs || {}) });

      const owned = tenantsData?.tenants?.find(
        (item: { role?: string }) => item.role === 'BUSINESS_OWNER',
      );
      const tenant = owned?.tenant;
      if (tenant) {
        setName(tenant.name || studioName || '');
        setEmail(tenant.email || '');
        setPhone(tenant.phone || '');
        setAddress(tenant.address || '');
        setCity(tenant.city || '');
        setDescription(tenant.description || '');
        setOib(tenant.oib || '');
        setHours(hoursFromWorking(tenant.bookingSettings?.workingHours) as HoursState);
      }

      const services = Array.isArray(servicesData?.services) ? servicesData.services : [];
      const primary =
        services.find((item: { active?: boolean }) => item.active !== false) || services[0];
      if (primary?.id) {
        setServiceId(String(primary.id));
        setCancelWindow(String(primary.cancellationWindowMinutes ?? 60));
      }
    } catch {
      setError('Postavke se nisu učitale.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, studioName]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading) return undefined;
    enter.setValue(0);
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 480,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [loading, enter, tab]);

  function changeHours(key: HourKey, patch: Partial<HourRow>) {
    setHours((current) => ({
      ...current,
      [key]: { ...(current[key] || fallbackHours[key]), ...patch },
    }));
  }

  function filled(body: Record<string, string | undefined>) {
    return Object.fromEntries(
      Object.entries(body).filter(([, value]) => value !== undefined && value !== ''),
    );
  }

  async function saveBusiness() {
    if (!tenantId) {
      setError('Studio još nije učitan.');
      return;
    }
    if (!name.trim()) {
      setError('Upišite naziv studija.');
      return;
    }
    const hoursWrong = hourRows.some(([key]) => {
      const row = hours[key as HourKey] || fallbackHours[key as HourKey];
      return row.works && (!isValidClock(row.from) || !isValidClock(row.to) || row.from >= row.to);
    });
    if (hoursWrong) {
      setError('Provjerite radno vrijeme (HH:MM, zatvaranje nakon otvaranja).');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await updateTenant(tenantId, {
        name: name.trim(),
        ...filled({
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          description: description.trim(),
        }),
        bookingSettings: {
          workingHours: hoursPayload(hours),
        },
      });
      const windowMinutes = Number(cancelWindow) || 60;
      if (serviceId) {
        await updateService(serviceId, { cancellationWindowMinutes: windowMinutes });
      } else {
        const created = await createService(tenantId, {
          name: 'Termin',
          durationMinutes: 60,
          slotIntervalMinutes: 60,
          capacity: 12,
          cancellationWindowMinutes: windowMinutes,
          price: 0,
          membershipRequired: true,
        });
        if (created?.service?.id) setServiceId(String(created.service.id));
      }
      onStudioUpdated?.({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
      });
      setNotice('Podaci poslovanja i rok otkaza su spremljeni.');
    } catch {
      setError('Poslovanje nije spremljeno.');
    } finally {
      setSaving(false);
    }
  }

  async function saveAccount() {
    if (!accountName.trim()) {
      setError('Upišite ime.');
      return;
    }
    if (oib && !/^\d{11}$/.test(oib)) {
      setError('OIB mora imati točno 11 znamenki.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await updateMe({
        name: accountName.trim(),
        email: accountEmail.trim() || undefined,
        phone: accountPhone.trim() || undefined,
      });
      if (tenantId) {
        await updateTenant(tenantId, {
          ...filled({
            address: address.trim(),
            city: city.trim(),
          }),
          oib: oib || '',
        });
        onStudioUpdated?.({
          address: address.trim(),
          city: city.trim(),
        });
      }
      setNotice('Račun je spremljen.');
    } catch {
      setError('Račun nije spremljen.');
    } finally {
      setSaving(false);
    }
  }

  async function saveSecurity() {
    if (!currentPassword || !newPassword) {
      setError('Upišite trenutnu i novu lozinku.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Nova lozinka mora imati barem 8 znakova.');
      return;
    }
    if (newPassword !== again) {
      setError('Ponovljena lozinka se ne podudara.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setAgain('');
      setNotice('Lozinka je promijenjena.');
    } catch (failure: unknown) {
      const code =
        failure && typeof failure === 'object' && 'code' in failure
          ? String((failure as { code?: string }).code || '')
          : '';
      setError(
        code === 'INVALID_CREDENTIALS'
          ? 'Trenutna lozinka nije točna.'
          : 'Lozinka nije promijenjena.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function savePrefs() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await updateMe({ notificationPrefs: prefs });
      setNotice('Obavijesti su spremljene.');
    } catch {
      setError('Obavijesti nisu spremljene.');
    } finally {
      setSaving(false);
    }
  }

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
                  outputRange: [12, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.topBar}>
            <Pressable
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
            Postavke
          </Text>
          <Text style={styles.lead}>{TAB_LEAD[tab]}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRail}
            style={styles.tabScroll}
          >
            {TABS.map((item) => {
              const on = tab === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setTab(item.id);
                    setError('');
                    setNotice('');
                  }}
                  style={({ pressed }) => [
                    styles.tab,
                    on && styles.tabOn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {tab === 'business' ? (
            <View style={styles.form}>
              <Field label="Naziv">
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Naziv studija"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                />
              </Field>
              <Field label="Kratki opis">
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Što članovi trebaju znati"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  multiline
                />
              </Field>
              <Field label="Telefon">
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Kontakt telefon"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  keyboardType="phone-pad"
                />
              </Field>
              <Field label="E-pošta poslovanja">
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="studio@primjer.hr"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Field>
              <Field label="Adresa">
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Ulica i broj"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                />
              </Field>
              <Field label="Grad">
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Grad"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                />
              </Field>

              <Text style={styles.sectionTitle}>Radno vrijeme</Text>
              {hourRows.map(([key, label]) => {
                const row = hours[key as HourKey] || fallbackHours[key as HourKey];
                return (
                  <View key={key} style={styles.hourCard}>
                    <Pressable
                      onPress={() => changeHours(key as HourKey, { works: !row.works })}
                      style={({ pressed }) => [styles.hourToggle, pressed && styles.pressed]}
                    >
                      <View style={[styles.checkbox, row.works && styles.checkboxOn]}>
                        {row.works ? (
                          <Ionicons name="checkmark" size={14} color="#061210" />
                        ) : null}
                      </View>
                      <Text style={styles.hourLabel} numberOfLines={1}>
                        {label}
                      </Text>
                    </Pressable>
                    {row.works ? (
                      <View style={styles.hourTimes}>
                        <TextInput
                          style={styles.timeInput}
                          value={row.from}
                          onChangeText={(from) => changeHours(key as HourKey, { from })}
                          placeholder="07:00"
                          placeholderTextColor="rgba(232, 242, 239, 0.28)"
                          keyboardType="numbers-and-punctuation"
                          maxLength={5}
                          selectTextOnFocus
                        />
                        <Text style={styles.timeDash}>–</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={row.to}
                          onChangeText={(to) => changeHours(key as HourKey, { to })}
                          placeholder="21:00"
                          placeholderTextColor="rgba(232, 242, 239, 0.28)"
                          keyboardType="numbers-and-punctuation"
                          maxLength={5}
                          selectTextOnFocus
                        />
                      </View>
                    ) : (
                      <Text style={styles.closed}>Zatvoreno</Text>
                    )}
                  </View>
                );
              })}

              <Text style={styles.sectionTitle}>Otkazivanje termina</Text>
              <Text style={styles.hint}>
                Članovi ovo vide na Termini. Unutar roka otkaz ne troši dolazak.
              </Text>
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
                        {value === 0 ? '0' : value >= 60 ? `${value / 60}h` : `${value}m`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.hint}>
                Trenutačno: {formatCancellationWindow(Number(cancelWindow))}
              </Text>

              <SaveButton
                label="Spremite poslovanje"
                saving={saving}
                onPress={saveBusiness}
              />
            </View>
          ) : null}

          {tab === 'account' ? (
            <View style={styles.form}>
              <Field label="Ime i prezime">
                <TextInput
                  style={styles.input}
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder="Vaše ime"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                />
              </Field>
              <Field label="Telefon">
                <TextInput
                  style={styles.input}
                  value={accountPhone}
                  onChangeText={setAccountPhone}
                  placeholder="Telefon računa"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  keyboardType="phone-pad"
                />
              </Field>
              <Field label="E-pošta za prijavu">
                <TextInput
                  style={styles.input}
                  value={accountEmail}
                  onChangeText={setAccountEmail}
                  placeholder="email@primjer.hr"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Field>
              <Field label="Adresa studija">
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Ulica i broj"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                />
              </Field>
              <Field label="Grad">
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Grad"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                />
              </Field>
              <Field label="OIB">
                <TextInput
                  style={styles.input}
                  value={oib}
                  onChangeText={(value) => setOib(value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="11 znamenki (opcionalno)"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  keyboardType="number-pad"
                  maxLength={11}
                />
              </Field>
              <Text style={styles.hint}>
                OIB nije obavezan sada — trebat će ga kad uključimo plaćanje i račune.
              </Text>
              <SaveButton label="Spremite račun" saving={saving} onPress={saveAccount} />
            </View>
          ) : null}

          {tab === 'security' ? (
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>Lozinka</Text>
              <Text style={styles.hint}>
                Koristite jaku lozinku koju ne dijelite s osobljem.
              </Text>
              <Field label="Trenutna lozinka">
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  secureTextEntry={!showPasswords}
                />
              </Field>
              <Field label="Nova lozinka">
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Najmanje 8 znakova"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  secureTextEntry={!showPasswords}
                />
              </Field>
              <Field label="Ponovite novu">
                <TextInput
                  style={styles.input}
                  value={again}
                  onChangeText={setAgain}
                  placeholder="Ponovite lozinku"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  secureTextEntry={!showPasswords}
                />
              </Field>
              <Pressable
                onPress={() => setShowPasswords((value) => !value)}
                style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
              >
                <View style={[styles.checkbox, showPasswords && styles.checkboxOn]}>
                  {showPasswords ? (
                    <Ionicons name="checkmark" size={14} color="#061210" />
                  ) : null}
                </View>
                <Text style={styles.checkLabel}>Prikaži lozinke</Text>
              </Pressable>
              <SaveButton
                label="Promijenite lozinku"
                saving={saving}
                onPress={saveSecurity}
              />

              {onLogout ? (
                <View style={styles.dangerBlock}>
                  <Text style={styles.sectionTitle}>Sesija</Text>
                  <Text style={styles.hint}>
                    Odjavom se briše lokalni pristup na ovom uređaju.
                  </Text>
                  <Pressable
                    onPress={onLogout}
                    style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.logoutLabel}>Odjavite se</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}

          {tab === 'privacy' ? (
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>Podaci studija</Text>
              <Text style={styles.privacyLead}>
                Kako se koriste podaci vašeg studija
              </Text>
              <Text style={styles.bodyCopy}>
                Podaci o studiju, članovima i rezervacijama vezani su uz vaš prostor
                i koriste se isključivo za rad aplikacije — prijave, termine i
                komunikaciju s članovima.
              </Text>
              {[
                {
                  title: 'Vaši članovi vide samo svoje.',
                  body: 'Svaki član ima pristup isključivo svojoj stranici i svojim terminima.',
                },
                {
                  title: 'Javno je samo ono što želite.',
                  body: 'Kontakt i radno vrijeme prikazuju se na javnoj stranici studija.',
                },
                {
                  title: 'Lozinke su zaštićene.',
                  body: 'Ne čuvamo ih u čitljivom obliku.',
                },
              ].map((item) => (
                <View key={item.title} style={styles.privacyItem}>
                  <Text style={styles.privacyItemTitle}>{item.title}</Text>
                  <Text style={styles.bulletText}>{item.body}</Text>
                </View>
              ))}
              <Text style={styles.sectionTitle}>Pravila platforme</Text>
              <Text style={styles.bodyCopy}>
                Detaljna pravila svog studija uređujete na webu. Ovdje su osnovna
                pravila platforme.
              </Text>
              <AuthLegalStrip />
            </View>
          ) : null}

          {tab === 'billing' ? (
            <View style={styles.form}>
              <View style={styles.planCard}>
                <View style={styles.planPill}>
                  <Text style={styles.planPillLabel}>Besplatno</Text>
                </View>
                <View style={styles.planCopy}>
                  <Text style={styles.planEyebrow}>Pilot</Text>
                  <Text style={styles.planName}>Trenutačno potpuno besplatno</Text>
                  <Text style={styles.hint}>
                    Aplikacija je u pilotu i sve njezine funkcionalnosti dostupne
                    su bez naplate. Naplata se za sada ne uvodi.
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Što je uključeno</Text>
              {[
                'Članovi i članarine',
                'Kalendar rezervacija',
                'Radno vrijeme i kontakt',
              ].map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <Ionicons name="checkmark" size={16} color="#5EEAD4" />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}

              <Text style={styles.sectionTitle}>Što još gradimo</Text>
              <Text style={styles.privacyLead}>Online plaćanje dolazi kasnije</Text>
              <Text style={styles.bodyCopy}>
                Online plaćanje je u izradi. Čim bude spremno, obavijestit ćemo vas.
              </Text>
              <Text style={styles.hint}>
                Ako netko pita za plaćanje: online plaćanja još nisu dostupna.
                Obavijestit ćemo vas čim budu.
              </Text>
            </View>
          ) : null}

          {tab === 'notifications' ? (
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>E-pošta</Text>
              <Text style={styles.hint}>
                Obavijesti na adresu vlasnika — rezervacije, otkazi i članovi.
              </Text>
              {EMAIL_PREFS.map((item) => (
                <PrefRow
                  key={item.key}
                  label={item.label}
                  note={item.note}
                  on={prefs[item.key]}
                  onToggle={() =>
                    setPrefs((current) => ({
                      ...current,
                      [item.key]: !current[item.key],
                    }))
                  }
                />
              ))}
              <Text style={styles.sectionTitle}>Push</Text>
              <Text style={styles.hint}>Obavijesti na ovom uređaju.</Text>
              {PUSH_PREFS.map((item) => (
                <PrefRow
                  key={item.key}
                  label={item.label}
                  note={item.note}
                  on={prefs[item.key]}
                  onToggle={() =>
                    setPrefs((current) => ({
                      ...current,
                      [item.key]: !current[item.key],
                    }))
                  }
                />
              ))}
              <SaveButton
                label="Spremite obavijesti"
                saving={saving}
                onPress={savePrefs}
              />
            </View>
          ) : null}
        </Animated.View>
        {tab !== 'privacy' ? (
          <View style={styles.footer}>
            <AuthLegalStrip />
          </View>
        ) : (
          <View style={styles.footerSpacer} />
        )}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SaveButton({
  label,
  saving,
  onPress,
}: {
  label: string;
  saving: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={saving}
      style={({ pressed }) => [
        styles.primaryBtn,
        pressed && styles.pressed,
        saving && styles.disabled,
      ]}
    >
      {saving ? (
        <ActivityIndicator color="#061210" />
      ) : (
        <Text style={styles.primaryLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

function PrefRow({
  label,
  note,
  on,
  onToggle,
}: {
  label: string;
  note: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.prefRow, pressed && styles.pressed]}
    >
      <View style={[styles.checkbox, on && styles.checkboxOn]}>
        {on ? <Ionicons name="checkmark" size={14} color="#061210" /> : null}
      </View>
      <View style={styles.prefCopy}>
        <Text style={styles.checkLabel}>{label}</Text>
        <Text style={styles.prefNote}>{note}</Text>
      </View>
    </Pressable>
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
  tabScroll: { marginHorizontal: -24, marginBottom: 16 },
  tabRail: { paddingHorizontal: 24, gap: 8 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.14)',
    backgroundColor: 'rgba(10, 20, 18, 0.35)',
  },
  tabOn: {
    borderColor: 'rgba(94, 234, 212, 0.55)',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  tabLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  tabLabelOn: { color: '#5EEAD4' },
  notice: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#5EEAD4',
    marginBottom: 10,
  },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(251, 113, 133, 0.95)',
    marginBottom: 10,
  },
  form: { gap: 10 },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
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
  textarea: {
    minHeight: 88,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#F7FCFA',
    marginTop: 10,
    marginBottom: 2,
  },
  hourCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.12)',
    borderRadius: 8,
    backgroundColor: 'rgba(10, 20, 18, 0.35)',
  },
  hourToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '52%',
  },
  hourLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.88)',
    flexShrink: 1,
  },
  hourTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  timeInput: {
    width: 58,
    minHeight: 34,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    borderRadius: 6,
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    lineHeight: 16,
    color: '#F7FCFA',
    textAlign: 'center',
    backgroundColor: 'rgba(10, 20, 18, 0.45)',
  },
  timeDash: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.4)',
  },
  closed: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.42)',
    flexShrink: 0,
  },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.6)',
  },
  presetLabelOn: { color: '#5EEAD4' },
  hint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(232, 242, 239, 0.48)',
  },
  bodyCopy: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(232, 242, 239, 0.68)',
  },
  privacyLead: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
    lineHeight: 24,
    color: '#F7FCFA',
    marginTop: -2,
  },
  privacyItem: {
    gap: 4,
    paddingVertical: 4,
  },
  privacyItemTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(232, 242, 239, 0.9)',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  prefCopy: { flex: 1, gap: 2 },
  prefNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(232, 242, 239, 0.45)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: '#5EEAD4',
    borderColor: '#5EEAD4',
  },
  checkLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.88)',
    flex: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#5EEAD4',
    lineHeight: 21,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(232, 242, 239, 0.72)',
  },
  muted: { color: 'rgba(232, 242, 239, 0.4)' },
  planCard: {
    gap: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.28)',
    backgroundColor: 'rgba(94, 234, 212, 0.08)',
  },
  planCopy: { gap: 6 },
  planEyebrow: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(94, 234, 212, 0.8)',
  },
  planName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: '#F7FCFA',
  },
  planPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(94, 234, 212, 0.18)',
  },
  planPillLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
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
    marginTop: 8,
  },
  primaryLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#061210',
  },
  dangerBlock: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 242, 239, 0.1)',
    gap: 8,
  },
  logoutBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 10,
  },
  logoutLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#FCA5A5',
  },
  disabled: { opacity: 0.7 },
  footer: { marginTop: 'auto', paddingTop: 32 },
  footerSpacer: { marginTop: 'auto', paddingTop: 24 },
  pressed: { opacity: 0.72 },
});
