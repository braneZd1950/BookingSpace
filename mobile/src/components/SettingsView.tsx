import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ApiError } from '../api/client';
import { openWebPath } from '../lib/openWeb';
import {
  changePassword,
  getMe,
  updateMe,
  type NotificationPrefs,
} from '../api/auth';
import { createService, listServices, updateService, type Service } from '../api/services';
import { updateSite, updateTenant } from '../api/tenants';
import { usePrivacyConsent } from '../features/consent/usePrivacyConsent';
import { useAuth } from '../features/auth/AuthContext';
import { useStudio } from '../features/studio/StudioContext';
import type { DayHours, StudioHours } from '../features/studio/studioMap';
import { generateAllStudioLegal } from '../lib/studioLegal';
import { getItem, setItem } from '../lib/storage';
import {
  CANCEL_WINDOW_OPTIONS,
  fallbackHours,
  formatCancellationWindow,
  hourRows,
  hoursPayload,
  studioHours,
  timeOptions,
} from '../lib/studioTime';
import { tokens } from '../theme/tokens';
import { makeSettingsStyles } from '../ui/settingsStyles';

const REAL_ID = /^[a-f\d]{24}$/i;
const PREFS_KEY = 'anyminutes.prefs';
const SITE_HOST = 'booking.hr';
const TIMES = timeOptions(30);

const sections = [
  { id: 'business', label: 'Poslovanje' },
  { id: 'account', label: 'Račun' },
  { id: 'security', label: 'Sigurnost' },
  { id: 'privacy', label: 'Privatnost' },
  { id: 'billing', label: 'Pretplata' },
  { id: 'notifications', label: 'Obavijesti' },
] as const;

type TabId = (typeof sections)[number]['id'];

const LEGAL_DOCS = [
  { id: 'privacy', index: '01', label: 'Privatnost', title: 'Politika privatnosti' },
  { id: 'terms', index: '02', label: 'Uvjeti', title: 'Uvjeti korištenja' },
  { id: 'cookies', index: '03', label: 'Kolačići', title: 'Kolačići i sigurnost' },
] as const;

type LegalTab = (typeof LEGAL_DOCS)[number]['id'];

type BusinessForm = {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  oib: string;
  hours: StudioHours;
};

type LegalState = { privacy: string; terms: string; cookies: string };

const defaultPrefs: NotificationPrefs = {
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

function filled(body: Record<string, string>) {
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== ''));
}

function studioHost(slug?: string) {
  const clean = String(slug || '').trim().toLowerCase();
  return clean ? `${clean}.${SITE_HOST}` : `vas-studio.${SITE_HOST}`;
}

function fromStudio(studio: {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  oib: string;
  hours: StudioHours;
}): BusinessForm {
  return {
    name: studio.name || '',
    description: studio.description || '',
    phone: studio.phone || '',
    email: studio.email || '',
    address: studio.address || '',
    city: studio.city || '',
    oib: studio.oib || '',
    hours: studioHours(studio.hours),
  };
}

function studioLegalSource(studio: BusinessForm) {
  return {
    name: studio.name || 'Studio',
    email: studio.email || '',
    phone: studio.phone || '',
    address: studio.address || '',
  };
}

function resolveLegalState(
  stored: { privacy?: string; terms?: string; cookies?: string },
  form: BusinessForm,
): LegalState {
  const generated = generateAllStudioLegal(studioLegalSource(form));
  return {
    privacy: (stored.privacy || '').trim() || generated.privacy,
    terms: (stored.terms || '').trim() || generated.terms,
    cookies: (stored.cookies || '').trim() || generated.cookies,
  };
}

type PickerState =
  | { kind: 'time'; key: keyof StudioHours; field: 'from' | 'to' }
  | { kind: 'cancel' }
  | null;

export function SettingsView() {
  const { user, setUser, logout, persistToken } = useAuth();
  const {
    accepted: consentAccepted,
    accept: acceptConsent,
    withdraw: withdrawConsent,
    busy: consentBusy,
  } = usePrivacyConsent();
  const { studio, ready: studioReady, refresh } = useStudio();
  const brand = studio?.theme.primaryColor || tokens.brand;
  const soft = studio?.theme.secondaryColor || tokens.brandSoft;
  const ink = studio?.theme.ink || tokens.fg;
  const styles = useMemo(() => makeSettingsStyles(brand, soft, ink), [brand, soft, ink]);

  const tenantId = String(studio?.id || '');
  const ready = REAL_ID.test(tenantId);
  const host = studioHost(studio?.slug);

  const [tab, setTab] = useState<TabId>('business');
  const [form, setForm] = useState<BusinessForm>(() => (
    studio ? fromStudio(studio) : fromStudio({
      name: '',
      description: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      oib: '',
      hours: fallbackHours,
    })
  ));
  const [account, setAccount] = useState({ name: '', email: '', phone: '' });
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    again: '',
  });
  const [showPw, setShowPw] = useState({ current: false, next: false, again: false });
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [legal, setLegal] = useState<LegalState>({ privacy: '', terms: '', cookies: '' });
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');
  const [legalConfirmOpen, setLegalConfirmOpen] = useState(false);
  const [cancelWindow, setCancelWindow] = useState(60);
  const [primaryService, setPrimaryService] = useState<Service | null>(null);
  const [picker, setPicker] = useState<PickerState>(null);
  const [flash, setFlash] = useState<{ type: 'ok' | 'err'; text: string }>({ type: 'ok', text: '' });
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingLegal, setSavingLegal] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);

  const activeSection = sections.find((item) => item.id === tab) || sections[0];
  const activeLegalDoc = LEGAL_DOCS.find((item) => item.id === legalTab) || LEGAL_DOCS[0];
  const legalUpdatedAt = studio?.legal.updatedAt
    ? new Date(studio.legal.updatedAt).toLocaleString('hr-HR')
    : '';

  const emailPrefsOn = (
    ['bookingEmail', 'cancelEmail', 'memberEmail', 'weeklyDigest', 'marketing'] as const
  ).filter((key) => prefs[key]).length;
  const pushPrefsOn = (
    ['bookingPush', 'cancelPush', 'memberPush', 'reminderPush'] as const
  ).filter((key) => prefs[key]).length;

  const note = useCallback((type: 'ok' | 'err', text: string) => {
    setFlash({ type, text });
  }, []);

  useEffect(() => {
    if (!studio) return;
    setForm(fromStudio(studio));
    setLegal(resolveLegalState(studio.legal, fromStudio(studio)));
  }, [studio]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await getItem(PREFS_KEY);
        if (raw && !cancelled) {
          setPrefs({ ...defaultPrefs, ...JSON.parse(raw) });
        }
      } catch {
        /* ignore */
      }
      try {
        const me = await getMe();
        if (cancelled) return;
        setUser(me.user);
        setAccount({
          name: me.user.name || '',
          email: me.user.email || '',
          phone: me.user.phone || '',
        });
        if (me.user.notificationPrefs) {
          setPrefs({ ...defaultPrefs, ...me.user.notificationPrefs });
        }
      } catch {
        /* keep session user from AuthContext */
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  useEffect(() => {
    if (!user) return;
    setAccount({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  }, [user]);

  useEffect(() => {
    if (!studioReady || !ready) {
      setBootLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const services = await listServices(tenantId);
        const primary = services.find((item) => item.active !== false) || services[0] || null;
        if (cancelled) return;
        setPrimaryService(primary);
        if (primary?.cancellationWindowMinutes != null) {
          setCancelWindow(Number(primary.cancellationWindowMinutes) || 60);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studioReady, ready, tenantId]);

  function selectTab(id: TabId) {
    setTab(id);
    setFlash({ type: 'ok', text: '' });
    setPicker(null);
  }

  function changeBusiness<K extends keyof BusinessForm>(field: K, value: BusinessForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setFlash({ type: 'ok', text: '' });
  }

  function changeHours(key: keyof StudioHours, patch: Partial<DayHours>) {
    setForm((current) => ({
      ...current,
      hours: {
        ...current.hours,
        [key]: { ...(current.hours[key] || fallbackHours[key]), ...patch },
      },
    }));
    setFlash({ type: 'ok', text: '' });
  }

  async function saveBusiness() {
    if (!form.name.trim()) {
      note('err', 'Upišite naziv poslovanja.');
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      note('err', 'Upišite ispravnu e-poštu poslovanja.');
      return;
    }
    const hoursWrong = hourRows.some(([key]) => {
      const row = form.hours[key] || fallbackHours[key];
      return row.works && row.from >= row.to;
    });
    if (hoursWrong) {
      note('err', 'Zatvaranje treba biti nakon otvaranja.');
      return;
    }
    if (!ready) {
      note('err', 'Studio još nije u bazi. Otvorite ga registracijom.');
      return;
    }

    setSavingBusiness(true);
    try {
      await updateTenant(tenantId, {
        name: form.name.trim(),
        ...filled({
          description: form.description.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
        }),
        bookingSettings: {
          workingHours: hoursPayload(form.hours),
        },
      });

      const windowMinutes = Number(cancelWindow) || 60;
      if (primaryService?.id) {
        const updated = await updateService(String(primaryService.id), {
          cancellationWindowMinutes: windowMinutes,
        });
        setPrimaryService(updated);
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
        setPrimaryService(created);
      }

      await refresh();
      note('ok', 'Podaci poslovanja i rok otkaza su spremljeni.');
    } catch (err) {
      note('err', err instanceof ApiError && err.status === 0
        ? 'Poslužitelj nije dostupan.'
        : 'Poslovanje nije spremljeno.');
    } finally {
      setSavingBusiness(false);
    }
  }

  async function saveAccount() {
    if (!account.name.trim()) {
      note('err', 'Upišite ime.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email.trim())) {
      note('err', 'Upišite ispravnu e-poštu računa.');
      return;
    }
    const oib = form.oib.trim();
    if (oib && !/^\d{11}$/.test(oib)) {
      note('err', 'OIB mora imati točno 11 znamenki.');
      return;
    }

    setSavingAccount(true);
    try {
      const result = await updateMe({
        name: account.name.trim(),
        email: account.email.trim().toLowerCase(),
        phone: account.phone.trim() || undefined,
      });
      setUser(result.user);

      if (ready) {
        await updateTenant(tenantId, {
          address: form.address.trim(),
          city: form.city.trim(),
          oib,
        });
        await refresh();
      }

      note('ok', 'Račun je ažuriran.');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_TAKEN') {
        note('err', 'Ta e-pošta je već zauzeta.');
        return;
      }
      note('err', err instanceof ApiError && err.status === 0
        ? 'Poslužitelj nije dostupan.'
        : 'Račun nije spremljen.');
    } finally {
      setSavingAccount(false);
    }
  }

  async function savePassword() {
    if (password.newPassword.length < 8) {
      note('err', 'Nova lozinka treba barem 8 znakova.');
      return;
    }
    if (password.newPassword !== password.again) {
      note('err', 'Nove lozinke se ne podudaraju.');
      return;
    }
    setSavingPassword(true);
    try {
      const result = await changePassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      if (result?.token) {
        await persistToken(result.token);
      } else {
        note('err', 'Lozinka je promijenjena — prijavite se ponovo.');
        await logout();
        return;
      }
      setPassword({ currentPassword: '', newPassword: '', again: '' });
      note('ok', 'Lozinka je promijenjena. Možete nastaviti raditi prijavljeni.');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
        note('err', 'Trenutna lozinka nije točna.');
        return;
      }
      note('err', err instanceof ApiError && err.status === 0
        ? 'Poslužitelj nije dostupan.'
        : 'Lozinka nije promijenjena.');
    } finally {
      setSavingPassword(false);
    }
  }

  function fillLegalTemplate() {
    setLegal(generateAllStudioLegal(studioLegalSource(form)));
    note('ok', 'Gotovi predložak je upisan — pregledajte i spremite ako vam odgovara.');
  }

  function requestSaveLegal() {
    if (!ready) {
      note('err', 'Studio još nije spreman na poslužitelju.');
      return;
    }
    if (!legal.privacy.trim() || !legal.terms.trim() || !legal.cookies.trim()) {
      note('err', 'Sva tri dokumenta moraju imati tekst prije spremanja.');
      return;
    }
    setLegalConfirmOpen(true);
  }

  async function confirmSaveLegal() {
    const nextLegal = {
      privacy: legal.privacy.trim(),
      terms: legal.terms.trim(),
      cookies: legal.cookies.trim(),
    };
    setSavingLegal(true);
    try {
      await updateSite(tenantId, { legal: nextLegal });
      await refresh();
      setLegalConfirmOpen(false);
      note('ok', 'Pravila studija su spremljena u bazu i na stranicu.');
    } catch {
      setLegalConfirmOpen(false);
      note('err', 'Pravila nisu spremljena. Pokušajte ponovno.');
    } finally {
      setSavingLegal(false);
    }
  }

  async function savePrefs() {
    setSavingPrefs(true);
    try {
      await setItem(PREFS_KEY, JSON.stringify(prefs));
      if (!ready) {
        note('ok', 'Postavke su spremljene na ovom uređaju.');
        return;
      }
      const result = await updateMe({ notificationPrefs: prefs });
      setUser(result.user);
      note('ok', 'Obavijesti su spremljene.');
    } catch (err) {
      note('err', err instanceof ApiError && err.status === 0
        ? 'Poslužitelj nije dostupan.'
        : 'Obavijesti nisu spremljene.');
    } finally {
      setSavingPrefs(false);
    }
  }

  function Toggle({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (next: boolean) => void;
  }) {
    return (
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: `${ink}22`, true: brand }}
        thumbColor="#fff"
      />
    );
  }

  if (!studioReady || bootLoading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center', minHeight: 240 }]}>
        <ActivityIndicator color={brand} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
      <View style={styles.stage}>
        <View style={styles.rail}>
          <Text style={styles.railLabel}>Postavke</Text>
          <View style={styles.tabs}>
            {sections.map((item) => {
              const on = tab === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.tab, on && styles.tabOn]}
                  onPress={() => selectTab(item.id)}
                >
                  <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.head}>
          <Text style={styles.eyebrow}>{activeSection.label}</Text>
          <Text style={styles.title}>{studio?.name || 'Postavke'}</Text>
          <View style={styles.accent} />
          <Text style={styles.lede}>
            {tab === 'business' && 'Naziv, kontakt, radno vrijeme i rok otkaza koji vide članovi.'}
            {tab === 'account' && 'Podaci za prijavu, adresa studija i OIB za buduću naplatu.'}
            {tab === 'security' && 'Lozinka i sesija na ovom uređaju.'}
            {tab === 'privacy' && 'Kako se koriste podaci studija i gdje su pravila.'}
            {tab === 'billing' && 'Plan usluge i naplata — trenutačno u pilotu.'}
            {tab === 'notifications' && 'E-pošta i push o rezervacijama i članovima.'}
          </Text>
          {host ? (
            <View style={styles.host}>
              <Text style={styles.hostLabel}>Javna adresa</Text>
              <Text style={styles.hostValue}>{host}</Text>
            </View>
          ) : null}
        </View>

        {flash.text ? (
          <Text style={flash.type === 'ok' ? styles.flashOk : styles.flashErr}>{flash.text}</Text>
        ) : null}

        {tab === 'business' ? (
          <View style={styles.sheet}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Naziv</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(value) => changeBusiness('name', value)}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Kratki opis</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                multiline
                value={form.description}
                onChangeText={(value) => changeBusiness('description', value)}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Telefon</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(value) => changeBusiness('phone', value)}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>E-pošta poslovanja</Text>
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(value) => changeBusiness('email', value)}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Ulica</Text>
              <TextInput
                style={styles.input}
                value={form.address}
                onChangeText={(value) => changeBusiness('address', value)}
                placeholder="Ulica i kućni broj"
                placeholderTextColor={`${ink}66`}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Grad</Text>
              <TextInput
                style={styles.input}
                value={form.city}
                onChangeText={(value) => changeBusiness('city', value)}
                placeholder="npr. Zagreb"
                placeholderTextColor={`${ink}66`}
              />
            </View>

            <View style={styles.hoursBlock}>
              <Text style={styles.sheetTitle}>Radno vrijeme</Text>
              {hourRows.map(([key, label]) => {
                const row = form.hours[key] || fallbackHours[key];
                return (
                  <View style={styles.hoursRow} key={key}>
                    <Pressable
                      style={styles.checkRow}
                      onPress={() => changeHours(key, { works: !row.works })}
                    >
                      <View style={[styles.checkBox, row.works && styles.checkBoxOn]}>
                        {row.works ? <Text style={styles.checkMark}>✓</Text> : null}
                      </View>
                      <Text style={styles.checkLabel}>{label}</Text>
                    </Pressable>
                    {row.works ? (
                      <View style={styles.hoursSpan}>
                        <Pressable
                          style={styles.pickBtn}
                          onPress={() => setPicker({ kind: 'time', key, field: 'from' })}
                        >
                          <Text style={styles.pickLabel}>{row.from}</Text>
                        </Pressable>
                        <Text style={styles.closed}>–</Text>
                        <Pressable
                          style={styles.pickBtn}
                          onPress={() => setPicker({ kind: 'time', key, field: 'to' })}
                        >
                          <Text style={styles.pickLabel}>{row.to}</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.closed}>Zatvoreno</Text>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.hoursBlock}>
              <Text style={styles.sheetTitle}>Otkazivanje termina</Text>
              <Text style={styles.sheetLead}>
                Članovi ovo vide na stranici Termini. Ako otkažu unutar roka, termin im se ne broji
                kao iskorišten.
              </Text>
              <Pressable style={styles.pickBtn} onPress={() => setPicker({ kind: 'cancel' })}>
                <Text style={styles.pickLabel}>{formatCancellationWindow(cancelWindow)}</Text>
              </Pressable>
              <Text style={styles.fine}>
                Trenutačno:
                {' '}
                {formatCancellationWindow(cancelWindow)}
                {' '}
                · sprema se tipkom „Spremite poslovanje”
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[styles.primary, savingBusiness && styles.primaryDisabled]}
                disabled={savingBusiness}
                onPress={() => void saveBusiness()}
              >
                <Text style={styles.primaryLabel}>
                  {savingBusiness ? 'Spremamo…' : 'Spremite poslovanje'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {tab === 'account' ? (
          <View style={styles.sheet}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Ime i prezime</Text>
              <TextInput
                style={styles.input}
                value={account.name}
                onChangeText={(value) => setAccount((current) => ({ ...current, name: value }))}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Telefon</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                value={account.phone}
                onChangeText={(value) => setAccount((current) => ({ ...current, phone: value }))}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>E-pošta za prijavu</Text>
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={account.email}
                onChangeText={(value) => setAccount((current) => ({ ...current, email: value }))}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Ulica</Text>
              <TextInput
                style={styles.input}
                value={form.address}
                onChangeText={(value) => changeBusiness('address', value)}
                placeholder="Ulica i kućni broj"
                placeholderTextColor={`${ink}66`}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Grad</Text>
              <TextInput
                style={styles.input}
                value={form.city}
                onChangeText={(value) => changeBusiness('city', value)}
                placeholder="npr. Zagreb"
                placeholderTextColor={`${ink}66`}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>OIB</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                maxLength={11}
                value={form.oib}
                onChangeText={(value) => changeBusiness('oib', value.replace(/\D/g, '').slice(0, 11))}
                placeholder="11 znamenki (opcionalno)"
                placeholderTextColor={`${ink}66`}
              />
            </View>
            <Text style={styles.fine}>
              OIB nije obavezan sada — trebat će ga kad uključimo plaćanje karticom i izdavanje računa.
            </Text>
            <View style={styles.actions}>
              <Pressable
                style={[styles.primary, savingAccount && styles.primaryDisabled]}
                disabled={savingAccount}
                onPress={() => void saveAccount()}
              >
                <Text style={styles.primaryLabel}>
                  {savingAccount ? 'Spremamo…' : 'Spremite račun'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {tab === 'security' ? (
          <View style={{ gap: 14 }}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Lozinka</Text>
              <Text style={styles.sheetLead}>Koristite jaku lozinku koju ne dijelite s osobljem.</Text>
              {(
                [
                  ['currentPassword', 'Trenutna lozinka', 'current'],
                  ['newPassword', 'Nova lozinka', 'next'],
                  ['again', 'Ponovite novu', 'again'],
                ] as const
              ).map(([field, label, eyeKey]) => (
                <View style={styles.field} key={field}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <View style={styles.passwordWrap}>
                    <TextInput
                      style={[styles.input, { paddingRight: 72 }]}
                      secureTextEntry={!showPw[eyeKey]}
                      autoCapitalize="none"
                      value={password[field]}
                      onChangeText={(value) => setPassword((current) => ({
                        ...current,
                        [field]: value,
                      }))}
                    />
                    <Pressable
                      style={styles.eye}
                      onPress={() => setShowPw((current) => ({
                        ...current,
                        [eyeKey]: !current[eyeKey],
                      }))}
                    >
                      <Text style={styles.eyeText}>{showPw[eyeKey] ? 'Sakrij' : 'Prikaži'}</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              <View style={styles.actions}>
                <Pressable
                  style={[styles.primary, savingPassword && styles.primaryDisabled]}
                  disabled={savingPassword}
                  onPress={() => void savePassword()}
                >
                  <Text style={styles.primaryLabel}>
                    {savingPassword ? 'Spremamo…' : 'Promijenite lozinku'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.sheet, styles.sheetDanger]}>
              <Text style={styles.sheetTitle}>Sesija</Text>
              <Text style={styles.sheetLead}>Odjavom se briše lokalni pristup na ovom uređaju.</Text>
              <Pressable style={styles.dangerBtn} onPress={() => void logout()}>
                <Text style={styles.dangerLabel}>Odjavite se</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {tab === 'privacy' ? (
          <View style={{ gap: 14 }}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Privola platforme</Text>
              <Text style={styles.sheetLead}>
                {consentAccepted
                  ? 'Privola je aktivna. Možete rezervirati i otkazivati termine. Povlačenje privole zaustavlja te radnje dok je ponovno ne prihvatite.'
                  : 'Bez privole možete pregledavati studio, ali ne možete rezervirati ni otkazivati termine.'}
              </Text>
              <View style={styles.actions}>
                {consentAccepted ? (
                  <Pressable
                    style={[styles.dangerBtn, consentBusy && styles.primaryDisabled]}
                    disabled={consentBusy}
                    onPress={() => void withdrawConsent('settings')}
                  >
                    <Text style={styles.dangerLabel}>
                      {consentBusy ? 'Spremamo…' : 'Povuci privolu'}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.primary, consentBusy && styles.primaryDisabled]}
                    disabled={consentBusy}
                    onPress={() => void acceptConsent('settings')}
                  >
                    <Text style={styles.primaryLabel}>
                      {consentBusy ? 'Spremamo…' : 'Prihvati privolu'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Podaci studija</Text>
              <Text style={styles.sheetLead}>
                Podaci članova i rezervacija vezani su uz vaš studio i koriste se isključivo za rad
                aplikacije — prijave, termine i komunikaciju s članovima.
              </Text>
              <View style={styles.rules}>
                <Text style={styles.rule}>Članovi koje upišete vide samo svoju stranicu i termine.</Text>
                <Text style={styles.rule}>Kontakt i radno vrijeme prikazuju se na javnoj stranici studija.</Text>
                <Text style={styles.rule}>Lozinke se ne spremaju u čitljivom obliku.</Text>
              </View>
            </View>

            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Pravila studija</Text>
              <Text style={styles.sheetLead}>
                Gotovi tekstovi (GDPR / RH) već su u bazi od registracije. Uredite ih samo ako
                trebate — inače ostavite predložak. Vi ste voditelj obrade; anyminutes je platforma.
              </Text>
              {legalUpdatedAt ? (
                <Text style={styles.fine}>
                  Zadnja izmjena u bazi:
                  {' '}
                  {legalUpdatedAt}
                </Text>
              ) : null}

              <View style={styles.tabs}>
                {LEGAL_DOCS.map((item) => {
                  const on = legalTab === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.tab, on && styles.tabOn]}
                      onPress={() => setLegalTab(item.id)}
                    >
                      <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>
                        {item.index}
                        {' '}
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.actions}>
                <Pressable style={styles.ghost} onPress={fillLegalTemplate}>
                  <Text style={styles.ghostLabel}>Vrati gotovi predložak</Text>
                </Pressable>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{activeLegalDoc.title}</Text>
                <TextInput
                  style={[styles.input, styles.textareaTall]}
                  multiline
                  value={legal[legalTab]}
                  onChangeText={(value) => setLegal((current) => ({
                    ...current,
                    [legalTab]: value,
                  }))}
                />
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.primary, savingLegal && styles.primaryDisabled]}
                  disabled={savingLegal}
                  onPress={requestSaveLegal}
                >
                  <Text style={styles.primaryLabel}>
                    {savingLegal ? 'Spremamo…' : 'Spremi pravila studija'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Pravila platforme</Text>
              <Text style={styles.sheetLead}>
                Odvojeno od studija — obostrana zaštita: vi pokrivate klijente studija, anyminutes
                pokriva rad aplikacije.
              </Text>
              <View style={styles.actions}>
                {(
                  [
                    ['/privatnost', 'Privatnost'],
                    ['/uvjeti', 'Uvjeti korištenja'],
                    ['/kolacici', 'Kolačići'],
                  ] as const
                ).map(([path, label]) => (
                  <Pressable
                    key={path}
                    style={styles.ghost}
                    onPress={() => void openWebPath(path)}
                  >
                    <Text style={styles.ghostLabel}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {tab === 'billing' ? (
          <View style={{ gap: 14 }}>
            <View style={styles.sheet}>
              <View style={styles.planRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planEm}>Trenutni plan</Text>
                  <Text style={styles.planName}>Starter</Text>
                  <Text style={styles.sheetLead}>
                    Pilot: članovi, termini i kalendar bez online naplate.
                  </Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Aktivno</Text>
                </View>
              </View>
              <View style={styles.rules}>
                <Text style={styles.rule}>Članovi i članarine</Text>
                <Text style={styles.rule}>Kalendar rezervacija</Text>
                <Text style={styles.rule}>Radno vrijeme i kontakt</Text>
                <Text style={[styles.rule, styles.ruleMuted]}>Online plaćanje — kasnije</Text>
              </View>
            </View>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Naplata</Text>
              <Text style={styles.sheetLead}>
                Kartice, računi i salonska blagajna nisu dio trenutačnog pilota. Online naplata
                dolazi kasnije.
              </Text>
            </View>
          </View>
        ) : null}

        {tab === 'notifications' ? (
          <View style={styles.sheet}>
            <View style={styles.notifyHead}>
              <Text style={styles.notifyIndex}>01</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.planEm}>Kanal</Text>
                <Text style={styles.sheetTitle}>E-pošta</Text>
                <Text style={styles.sheetLead}>
                  Obavijesti na adresu vlasnika — rezervacije, otkazi i članovi.
                </Text>
              </View>
              <View style={styles.notifyMeta}>
                <Text style={styles.notifyMetaStrong}>{emailPrefsOn}</Text>
                <Text style={styles.notifyMetaLabel}>uključeno</Text>
              </View>
            </View>
            {(
              [
                ['bookingEmail', 'Nova rezervacija', 'E-pošta kad netko rezervira termin'],
                ['cancelEmail', 'Otkaz termina', 'E-pošta kad član ili trener otkaže rezervaciju'],
                ['memberEmail', 'Novi član', 'Obavijest kad dodate ili obnovite člana'],
                ['weeklyDigest', 'Tjedni sažetak', 'Jednom tjedno pregled popunjenosti'],
                ['marketing', 'Novosti proizvoda', 'Rijetke obavijesti o anyminutesu'],
              ] as const
            ).map(([key, title, noteText]) => (
              <View style={styles.toggleRow} key={key}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>{title}</Text>
                  <Text style={styles.toggleNote}>{noteText}</Text>
                </View>
                <Toggle
                  value={Boolean(prefs[key])}
                  onChange={(next) => setPrefs((current) => ({ ...current, [key]: next }))}
                />
              </View>
            ))}

            <View style={[styles.notifyHead, { marginTop: 18 }]}>
              <Text style={styles.notifyIndex}>02</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.planEm}>Kanal</Text>
                <Text style={styles.sheetTitle}>Push na uređaj</Text>
                <Text style={styles.sheetLead}>
                  Preferencije za push. Uređajske dozvole na native dolaze s Expo notifikacijama.
                </Text>
              </View>
              <View style={styles.notifyMeta}>
                <Text style={styles.notifyMetaStrong}>{pushPrefsOn}</Text>
                <Text style={styles.notifyMetaLabel}>uključeno</Text>
              </View>
            </View>
            {(
              [
                ['bookingPush', 'Nova rezervacija', 'Push kad netko rezervira'],
                ['cancelPush', 'Otkaz', 'Push kad se termin otkaže'],
                ['memberPush', 'Članstvo', 'Push o novim ili obnovljenim članovima'],
                ['reminderPush', 'Podsjetnik', 'Podsjetnik prije termina'],
              ] as const
            ).map(([key, title, noteText]) => (
              <View style={styles.toggleRow} key={key}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>{title}</Text>
                  <Text style={styles.toggleNote}>{noteText}</Text>
                </View>
                <Toggle
                  value={Boolean(prefs[key])}
                  onChange={(next) => setPrefs((current) => ({ ...current, [key]: next }))}
                />
              </View>
            ))}

            <View style={styles.actions}>
              <Pressable
                style={[styles.primary, savingPrefs && styles.primaryDisabled]}
                disabled={savingPrefs}
                onPress={() => void savePrefs()}
              >
                <Text style={styles.primaryLabel}>
                  {savingPrefs ? 'Spremamo…' : 'Spremite obavijesti'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <Modal visible={picker != null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPicker(null)}>
          <Pressable style={styles.modalPanel} onPress={(event) => event.stopPropagation?.()}>
            <Text style={styles.modalTitle}>
              {picker?.kind === 'cancel' ? 'Rok otkaza' : 'Odaberite vrijeme'}
            </Text>
            <ScrollView>
              {picker?.kind === 'time'
                ? TIMES.map((value) => {
                  const on = form.hours[picker.key]?.[picker.field] === value;
                  return (
                    <Pressable
                      key={value}
                      style={[styles.modalOption, on && styles.modalOptionOn]}
                      onPress={() => {
                        changeHours(picker.key, { [picker.field]: value });
                        setPicker(null);
                      }}
                    >
                      <Text style={styles.modalOptionLabel}>{value}</Text>
                    </Pressable>
                  );
                })
                : CANCEL_WINDOW_OPTIONS.map((minutes) => {
                  const on = cancelWindow === minutes;
                  return (
                    <Pressable
                      key={minutes}
                      style={[styles.modalOption, on && styles.modalOptionOn]}
                      onPress={() => {
                        setCancelWindow(minutes);
                        setFlash({ type: 'ok', text: '' });
                        setPicker(null);
                      }}
                    >
                      <Text style={styles.modalOptionLabel}>
                        {formatCancellationWindow(minutes)}
                      </Text>
                    </Pressable>
                  );
                })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={legalConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!savingLegal) setLegalConfirmOpen(false);
        }}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => !savingLegal && setLegalConfirmOpen(false)}
        >
          <View style={styles.confirmPanel}>
            <Text style={styles.modalTitle}>Spremiti izmjene pravila?</Text>
            <Text style={styles.sheetLead}>
              Jeste li sigurni da želite spremiti izmjene privatnosti, uvjeta i kolačića u bazu?
              Tekst će odmah biti vidljiv na stranici studija.
            </Text>
            <View style={styles.actions}>
              <Pressable
                style={styles.ghost}
                disabled={savingLegal}
                onPress={() => setLegalConfirmOpen(false)}
              >
                <Text style={styles.ghostLabel}>Odustani</Text>
              </Pressable>
              <Pressable
                style={[styles.primary, savingLegal && styles.primaryDisabled]}
                disabled={savingLegal}
                onPress={() => void confirmSaveLegal()}
              >
                <Text style={styles.primaryLabel}>
                  {savingLegal ? 'Spremamo…' : 'Da, spremi'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
