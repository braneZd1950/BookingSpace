import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  changePassword,
  deleteMyAccount,
  exportMyData,
  getMe,
  logoutAll,
  recordConsentWait,
  resendEmailChange,
  updateMe,
} from './memberSettingsApi.js';
import { setToken } from '../../api/token.js';
import { CONSENT_VERSION, hasValidConsent } from '../../lib/consent.js';
import {
  colorsForTheme,
  normalizeUiTheme,
  syncUiTheme,
} from '../../lib/uiTheme.js';
import {
  ACCOUNT_SETTINGS_SECTIONS,
  LEGAL_LINKS,
  OPERATIONAL_NOTIFY_OPTIONS,
  PROMOTIONAL_NOTIFY_OPTIONS,
  emailStatusLabel,
  mergeMemberNotifyPrefs,
} from '../../../../shared/memberAccountSettings.js';
import { BRAND } from '../../lib/brandColors.js';
import { type LegalDocId } from '../auth/LegalDocumentScreen';
import { findLegalDoc, LEGAL_UPDATED } from '../auth/platformLegal.js';
import StudioTopCurtain from '../studio/StudioTopCurtain';

const LEGAL_DOC_BY_LINK: Record<string, LegalDocId> = {
  privacy: 'privatnost',
  terms: 'uvjeti',
  cookies: 'kolacici',
};

type MemberSettingsScreenProps = {
  tenantName?: string;
  onBack: () => void;
  onLogout?: () => void;
  uiTheme?: string;
  onThemeChange?: (theme: string) => void;
};

type SectionId = (typeof ACCOUNT_SETTINGS_SECTIONS)[number]['id'];

const THEME_OPTIONS = [
  { value: 'light', label: 'Svijetla', hint: 'Uvijek svijetlo' },
  { value: 'dark', label: 'Tamna', hint: 'Uvijek tamno' },
  {
    value: 'system',
    label: 'Prema uređaju',
    hint: 'Prati postavku telefona ili računala',
  },
];

export default function MemberSettingsScreen({
  tenantName,
  onBack,
  onLogout,
  uiTheme = 'system',
  onThemeChange,
}: MemberSettingsScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const colors = colorsForTheme(uiTheme);

  const [loading, setLoading] = useState(true);
  const [userMeta, setUserMeta] = useState<{
    email?: string;
    emailVerified?: boolean;
    pendingEmail?: string | null;
    hasPassword?: boolean;
  }>({});
  const [account, setAccount] = useState({ name: '', phone: '' });
  const [emailDraft, setEmailDraft] = useState('');
  const [prefs, setPrefs] = useState(mergeMemberNotifyPrefs());
  const [theme, setTheme] = useState(normalizeUiTheme(uiTheme));
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    again: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [consentOk, setConsentOk] = useState(false);
  const [consentInfo, setConsentInfo] = useState<{ version?: string; acceptedAt?: string }>({});
  const [busy, setBusy] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [section, setSection] = useState<SectionId>('osobni');
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);
  const activeSection = ACCOUNT_SETTINGS_SECTIONS.find((item) => item.id === section)
    || ACCOUNT_SETTINGS_SECTIONS[0];
  const legalDocument = legalDoc ? findLegalDoc(legalDoc) : null;
  const legalSections = legalDocument
    ? ((legalDocument.sections?.() as Array<{
      id?: string;
      title: string;
      summary?: string;
      paragraphs?: string[];
      bullets?: string[];
      note?: string;
      law?: string;
    }>) || [])
    : [];

  function openLegalLink(linkId: string, href: string) {
    const docId = LEGAL_DOC_BY_LINK[linkId];
    if (docId) {
      setLegalDoc(docId);
      return;
    }
    void Linking.openURL(href);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getMe();
        const user = data?.user || data;
        if (cancelled || !user) return;
        setAccount({
          name: user.name || '',
          phone: user.phone || '',
        });
        setUserMeta({
          email: user.email,
          emailVerified: Boolean(user.emailVerified),
          pendingEmail: user.pendingEmail || null,
          hasPassword: user.hasPassword !== false,
        });
        setPrefs(mergeMemberNotifyPrefs(user.notificationPrefs));
        setTheme(normalizeUiTheme(user.uiTheme || uiTheme));
        setConsentOk(hasValidConsent(user));
        setConsentInfo({
          version: user.privacyConsent?.version,
          acceptedAt: user.privacyConsent?.acceptedAt,
        });
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uiTheme]);

  function note(key: string, text: string) {
    setNotes((current) => ({ ...current, [key]: text }));
  }

  function fail(key: string, text: string) {
    setErrors((current) => ({ ...current, [key]: text }));
  }

  async function saveUiTheme(nextRaw: string) {
    const next = normalizeUiTheme(nextRaw);
    setTheme(next);
    syncUiTheme(next);
    onThemeChange?.(next);
    note('theme', '');
    try {
      await updateMe({ uiTheme: next });
      note(
        'theme',
        next === 'dark'
          ? 'Tamna tema je spremljena na račun.'
          : next === 'light'
            ? 'Svijetla tema je spremljena na račun.'
            : 'Tema uređaja je spremljena na račun.',
      );
    } catch {
      note('theme', 'Tema ostaje lokalno — nije spremljena na račun.');
    }
  }

  async function saveAccount() {
    fail('account', '');
    note('account', '');
    const name = account.name.trim();
    if (!name) {
      fail('account', 'Ime i prezime su obavezni.');
      return;
    }
    setBusy('account');
    try {
      await updateMe({
        name,
        phone: account.phone.trim() || undefined,
      });
      note('account', 'Osobni podaci su spremljeni.');
    } catch (err) {
      fail('account', err instanceof Error ? err.message : 'Podaci nisu spremljeni.');
    } finally {
      setBusy('');
    }
  }

  async function requestEmailChange() {
    fail('email', '');
    note('email', '');
    const email = emailDraft.trim().toLowerCase();
    if (!email || email === userMeta.email) {
      fail('email', 'Unesite novu e-poštu različitu od trenutne.');
      return;
    }
    setBusy('email');
    try {
      const result = await updateMe({ email });
      const pending = result?.user?.pendingEmail || email;
      setUserMeta((current) => ({ ...current, pendingEmail: pending }));
      setEmailDraft('');
      note('email', `Poslali smo potvrdu na ${pending}.`);
    } catch (err) {
      fail('email', err instanceof Error ? err.message : 'E-pošta nije ažurirana.');
    } finally {
      setBusy('');
    }
  }

  async function onResendEmail() {
    fail('email', '');
    note('email', '');
    setBusy('email');
    try {
      const result = await resendEmailChange();
      note('email', `Ponovno smo poslali potvrdu na ${result.pendingEmail}.`);
    } catch {
      fail('email', 'Ponovno slanje nije uspjelo.');
    } finally {
      setBusy('');
    }
  }

  async function savePrefs() {
    note('prefs', '');
    setBusy('prefs');
    try {
      await updateMe({
        notificationPrefs: {
          bookingEmail: Boolean(prefs.bookingEmail),
          cancelEmail: Boolean(prefs.cancelEmail),
          marketingStudio: Boolean(prefs.marketingStudio),
          marketingPlatform: Boolean(prefs.marketingPlatform),
          marketing: Boolean(prefs.marketingStudio),
        },
      });
      note('prefs', 'Obavijesti su spremljene.');
    } catch {
      note('prefs', 'Obavijesti nisu spremljene.');
    } finally {
      setBusy('');
    }
  }

  async function savePassword() {
    fail('password', '');
    note('password', '');
    if (password.newPassword.length < 8) {
      fail('password', 'Nova lozinka mora imati barem 8 znakova.');
      return;
    }
    if (password.newPassword !== password.again) {
      fail('password', 'Nova lozinka i ponavljanje se ne podudaraju.');
      return;
    }
    setBusy('password');
    try {
      const result = await changePassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      if (result?.token) await setToken(result.token);
      setPassword({ currentPassword: '', newPassword: '', again: '' });
      note('password', 'Lozinka je promijenjena.');
    } catch (err) {
      fail('password', err instanceof Error ? err.message : 'Lozinka nije promijenjena.');
    } finally {
      setBusy('');
    }
  }

  async function onLogoutAll() {
    setBusy('logout');
    try {
      await logoutAll();
    } catch {
      /* local still */
    } finally {
      setBusy('');
      onLogout?.();
    }
  }

  async function acceptConsent() {
    setBusy('consent');
    note('consent', '');
    try {
      await recordConsentWait({
        action: 'accept',
        version: CONSENT_VERSION,
        source: 'settings',
      });
      setConsentOk(true);
      setConsentInfo({ version: CONSENT_VERSION, acceptedAt: new Date().toISOString() });
      note('consent', 'Privola je spremljena.');
    } catch (err) {
      note('consent', err instanceof Error ? err.message : 'Privola nije spremljena.');
    } finally {
      setBusy('');
    }
  }

  async function withdrawConsent() {
    setBusy('consent');
    note('consent', '');
    try {
      await recordConsentWait({
        action: 'withdraw',
        version: CONSENT_VERSION,
        source: 'settings',
      });
      setConsentOk(false);
      note('consent', 'Privola je povučena.');
    } catch (err) {
      note('consent', err instanceof Error ? err.message : 'Privola nije povučena.');
    } finally {
      setBusy('');
    }
  }

  async function onExport() {
    note('privacy', '');
    setBusy('export');
    try {
      const payload = await exportMyData();
      await Share.share({
        message: JSON.stringify(payload, null, 2),
        title: 'Blizari — izvoz podataka',
      });
      note('privacy', 'Izvoz je spreman za dijeljenje.');
    } catch {
      note('privacy', 'Izvoz nije uspio.');
    } finally {
      setBusy('');
    }
  }

  function onDeleteAccount() {
    Alert.alert(
      'Brisanje računa',
      'Račun će se deaktivirati i osobni podaci anonimizirati.',
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              fail('delete', '');
              note('delete', '');
              setBusy('delete');
              try {
                const body = userMeta.hasPassword === false
                  ? { confirm: deleteConfirm }
                  : { password: deleteConfirm };
                await deleteMyAccount(body);
                onLogout?.();
              } catch (err) {
                fail('delete', err instanceof Error ? err.message : 'Račun nije obrisan.');
              } finally {
                setBusy('');
              }
            })();
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={colors.status as 'light' | 'dark'} />
      <LinearGradient
        colors={colors.gradient as [string, string, ...string[]]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: compact ? 44 : 56, paddingBottom: 36 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.accent} />
          <Text style={[styles.backLabel, { color: colors.accent }]}>Početna</Text>
        </Pressable>

        <Text style={[styles.studio, { color: colors.accent }]}>{tenantName || 'Studio'}</Text>
        <Text style={[styles.kicker, { color: colors.accent }]}>Blizari račun</Text>
        <Text style={[styles.title, { color: colors.title }]}>Postavke</Text>
        <Text style={[styles.lead, { color: colors.muted }]}>
          Opće postavke pripadaju vašem Blizari računu i sinkroniziraju se između uređaja.
        </Text>

        <View style={styles.sectionNav} accessibilityRole="tablist">
          {ACCOUNT_SETTINGS_SECTIONS.map((item) => {
            const on = item.id === section;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setSection(item.id)}
                style={({ pressed }) => [
                  styles.sectionTab,
                  {
                    borderColor: on ? colors.accent : colors.border,
                    backgroundColor: on
                      ? `${colors.accent}22`
                      : colors.card,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.sectionTabLabel,
                    { color: on ? colors.accent : colors.title },
                  ]}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.title }]}>{activeSection.label}</Text>

        {section === 'osobni' ? (
          <>
            <TextInput
              value={account.name}
              onChangeText={(value) => setAccount((current) => ({ ...current, name: value }))}
              placeholder="Ime i prezime"
              placeholderTextColor="rgba(148, 163, 184, 0.55)"
              style={[styles.input, { borderColor: colors.border, color: colors.title }]}
            />
            <TextInput
              value={account.phone}
              onChangeText={(value) => setAccount((current) => ({ ...current, phone: value }))}
              placeholder="Telefon"
              keyboardType="phone-pad"
              placeholderTextColor="rgba(148, 163, 184, 0.55)"
              style={[styles.input, { borderColor: colors.border, color: colors.title }]}
            />
            <Text style={[styles.prefHint, { color: colors.muted }]}>
              {userMeta.email || '—'}
              {'\n'}
              {emailStatusLabel(userMeta)}
            </Text>
            {errors.account ? <Text style={styles.error}>{errors.account}</Text> : null}
            {notes.account ? <Text style={[styles.note, { color: colors.accent }]}>{notes.account}</Text> : null}
            <Pressable
              disabled={busy === 'account'}
              onPress={() => { void saveAccount(); }}
              style={({ pressed }) => [styles.cta, { backgroundColor: colors.ctaBg }, pressed && styles.pressed]}
            >
              <Text style={[styles.ctaLabel, { color: colors.ctaText }]}>
                {busy === 'account' ? 'Spremamo…' : 'Spremi podatke'}
              </Text>
            </Pressable>

            <Text style={[styles.section, { color: colors.title }]}>Promjena e-pošte</Text>
            <TextInput
              value={emailDraft}
              onChangeText={setEmailDraft}
              placeholder="Nova e-pošta"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="rgba(148, 163, 184, 0.55)"
              style={[styles.input, { borderColor: colors.border, color: colors.title }]}
            />
            {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
            {notes.email ? <Text style={[styles.note, { color: colors.accent }]}>{notes.email}</Text> : null}
            <Pressable
              disabled={busy === 'email'}
              onPress={() => { void requestEmailChange(); }}
              style={({ pressed }) => [styles.ctaGhost, { borderColor: colors.border }, pressed && styles.pressed]}
            >
              <Text style={[styles.ctaGhostLabel, { color: colors.title }]}>
                {busy === 'email' ? 'Šaljemo…' : 'Pošalji potvrdu'}
              </Text>
            </Pressable>
            {userMeta.pendingEmail ? (
              <Pressable
                disabled={busy === 'email'}
                onPress={() => { void onResendEmail(); }}
                style={({ pressed }) => [styles.ctaGhost, { borderColor: colors.border }, pressed && styles.pressed]}
              >
                <Text style={[styles.ctaGhostLabel, { color: colors.title }]}>Pošalji ponovno</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        {section === 'izgled' ? (
          <>
            <View style={styles.themeList}>
              {THEME_OPTIONS.map((option) => {
                const on = theme === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => { void saveUiTheme(option.value); }}
                    style={({ pressed }) => [
                      styles.themeOption,
                      {
                        borderColor: on ? colors.accent : colors.border,
                        backgroundColor: colors.card,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prefLabel, { color: colors.title }]}>{option.label}</Text>
                      <Text style={[styles.prefHint, { color: colors.muted }]}>{option.hint}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {notes.theme ? <Text style={[styles.note, { color: colors.accent }]}>{notes.theme}</Text> : null}
          </>
        ) : null}

        {section === 'obavijesti' ? (
          <>
            <Text style={[styles.prefHint, { color: colors.muted, marginBottom: 8 }]}>
              Operativne (e-pošta). Push još nije dostupan za klijente.
            </Text>
            {OPERATIONAL_NOTIFY_OPTIONS.map((item) => (
              <View key={item.key} style={[styles.prefRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.prefLabel, { color: colors.title }]}>{item.label}</Text>
                  <Text style={[styles.prefHint, { color: colors.muted }]}>{item.hint}</Text>
                </View>
                <Switch
                  value={Boolean((prefs as any)[item.key])}
                  onValueChange={(value) => setPrefs((current) => ({ ...current, [item.key]: value }))}
                  trackColor={{ false: '#334155', true: 'rgba(37, 99, 235, 0.55)' }}
                  thumbColor={(prefs as any)[item.key] ? BRAND.blueBright : '#94A3B8'}
                />
              </View>
            ))}
            <Text style={[styles.prefHint, { color: colors.muted, marginTop: 12, marginBottom: 8 }]}>
              Promotivne (nisu unaprijed uključene).
            </Text>
            {PROMOTIONAL_NOTIFY_OPTIONS.map((item) => (
              <View key={item.key} style={[styles.prefRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.prefLabel, { color: colors.title }]}>{item.label}</Text>
                  <Text style={[styles.prefHint, { color: colors.muted }]}>{item.hint}</Text>
                </View>
                <Switch
                  value={Boolean((prefs as any)[item.key])}
                  onValueChange={(value) => setPrefs((current) => ({ ...current, [item.key]: value }))}
                  trackColor={{ false: '#334155', true: 'rgba(37, 99, 235, 0.55)' }}
                  thumbColor={(prefs as any)[item.key] ? BRAND.blueBright : '#94A3B8'}
                />
              </View>
            ))}
            {notes.prefs ? <Text style={[styles.note, { color: colors.accent }]}>{notes.prefs}</Text> : null}
            <Pressable
              disabled={busy === 'prefs'}
              onPress={() => { void savePrefs(); }}
              style={({ pressed }) => [styles.ctaGhost, { borderColor: colors.border }, pressed && styles.pressed]}
            >
              <Text style={[styles.ctaGhostLabel, { color: colors.title }]}>
                {busy === 'prefs' ? 'Spremamo…' : 'Spremi obavijesti'}
              </Text>
            </Pressable>
          </>
        ) : null}

        {section === 'sigurnost' ? (
          <>
            {userMeta.hasPassword === false ? (
              <Text style={[styles.prefHint, { color: colors.muted }]}>
                Ovaj račun koristi Google prijavu — lozinka se ne postavlja ovdje.
              </Text>
            ) : (
              <>
                <TextInput
                  value={password.currentPassword}
                  onChangeText={(value) => setPassword((current) => ({ ...current, currentPassword: value }))}
                  placeholder="Trenutna lozinka"
                  secureTextEntry
                  placeholderTextColor="rgba(148, 163, 184, 0.55)"
                  style={[styles.input, { borderColor: colors.border, color: colors.title }]}
                />
                <TextInput
                  value={password.newPassword}
                  onChangeText={(value) => setPassword((current) => ({ ...current, newPassword: value }))}
                  placeholder="Nova lozinka"
                  secureTextEntry
                  placeholderTextColor="rgba(148, 163, 184, 0.55)"
                  style={[styles.input, { borderColor: colors.border, color: colors.title }]}
                />
                <TextInput
                  value={password.again}
                  onChangeText={(value) => setPassword((current) => ({ ...current, again: value }))}
                  placeholder="Ponovite novu lozinku"
                  secureTextEntry
                  placeholderTextColor="rgba(148, 163, 184, 0.55)"
                  style={[styles.input, { borderColor: colors.border, color: colors.title }]}
                />
                {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
                {notes.password ? <Text style={[styles.note, { color: colors.accent }]}>{notes.password}</Text> : null}
                <Pressable
                  disabled={busy === 'password'}
                  onPress={() => { void savePassword(); }}
                  style={({ pressed }) => [styles.ctaGhost, { borderColor: colors.border }, pressed && styles.pressed]}
                >
                  <Text style={[styles.ctaGhostLabel, { color: colors.title }]}>
                    {busy === 'password' ? 'Spremamo…' : 'Promijeni lozinku'}
                  </Text>
                </Pressable>
              </>
            )}
            <Pressable
              disabled={busy === 'logout'}
              onPress={() => { void onLogoutAll(); }}
              style={({ pressed }) => [styles.ctaGhost, { borderColor: colors.border }, pressed && styles.pressed]}
            >
              <Text style={[styles.ctaGhostLabel, { color: colors.title }]}>
                {busy === 'logout' ? 'Odjavljujemo…' : 'Odjava sa svih uređaja'}
              </Text>
            </Pressable>
          </>
        ) : null}

        {section === 'privatnost' ? (
          <>
            <Text style={[styles.prefHint, { color: colors.muted }]}>
              {consentOk
                ? `Privola aktivna${consentInfo.version ? ` · v${consentInfo.version}` : ''}${
                  consentInfo.acceptedAt
                    ? ` · ${new Date(consentInfo.acceptedAt).toLocaleString('hr-HR')}`
                    : ''
                }`
                : 'Privola nije aktivna — potrebna za rezervacije.'}
            </Text>
            {notes.consent ? <Text style={[styles.note, { color: colors.accent }]}>{notes.consent}</Text> : null}
            {consentOk ? (
              <Pressable
                disabled={busy === 'consent'}
                onPress={() => { void withdrawConsent(); }}
                style={({ pressed }) => [styles.ctaGhost, { borderColor: colors.border }, pressed && styles.pressed]}
              >
                <Text style={[styles.ctaGhostLabel, { color: colors.title }]}>Povucite privolu</Text>
              </Pressable>
            ) : (
              <Pressable
                disabled={busy === 'consent'}
                onPress={() => { void acceptConsent(); }}
                style={({ pressed }) => [styles.cta, { backgroundColor: colors.ctaBg }, pressed && styles.pressed]}
              >
                <Text style={[styles.ctaLabel, { color: colors.ctaText }]}>
                  {busy === 'consent' ? 'Spremamo…' : 'Prihvatite privolu'}
                </Text>
              </Pressable>
            )}
            <Pressable
              disabled={busy === 'export'}
              onPress={() => { void onExport(); }}
              style={({ pressed }) => [styles.ctaGhost, { borderColor: colors.border }, pressed && styles.pressed]}
            >
              <Text style={[styles.ctaGhostLabel, { color: colors.title }]}>
                {busy === 'export' ? 'Pripremamo…' : 'Izvezi osobne podatke'}
              </Text>
            </Pressable>
            {notes.privacy ? <Text style={[styles.note, { color: colors.accent }]}>{notes.privacy}</Text> : null}

            <Text style={[styles.prefHint, { color: colors.muted, marginTop: 12 }]}>
              Brisanje računa
            </Text>
            <TextInput
              value={deleteConfirm}
              onChangeText={setDeleteConfirm}
              placeholder={userMeta.hasPassword === false ? 'Upišite DELETE' : 'Lozinka za potvrdu'}
              secureTextEntry={userMeta.hasPassword !== false}
              placeholderTextColor="rgba(148, 163, 184, 0.55)"
              style={[styles.input, { borderColor: colors.border, color: colors.title }]}
            />
            {errors.delete ? <Text style={styles.error}>{errors.delete}</Text> : null}
            <Pressable
              disabled={busy === 'delete'}
              onPress={onDeleteAccount}
              style={({ pressed }) => [styles.dangerBtn, pressed && styles.pressed]}
            >
              <Text style={styles.dangerLabel}>
                {busy === 'delete' ? 'Brišemo…' : 'Obriši račun'}
              </Text>
            </Pressable>
          </>
        ) : null}

        {section === 'pravno' ? (
          <>
            {LEGAL_LINKS.map((item) => {
              const inApp = Boolean(LEGAL_DOC_BY_LINK[item.id]);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => openLegalLink(item.id, item.href)}
                  style={({ pressed }) => [styles.legalRow, { borderColor: colors.border }, pressed && styles.pressed]}
                >
                  <Text style={[styles.legalLabel, { color: colors.accent }]}>{item.label}</Text>
                  <Ionicons
                    name={inApp ? 'chevron-forward' : 'mail-outline'}
                    size={16}
                    color={colors.muted}
                  />
                </Pressable>
              );
            })}
          </>
        ) : null}
      </ScrollView>

      <StudioTopCurtain
        open={legalDoc !== null}
        onClose={() => setLegalDoc(null)}
        kicker="Blizari"
        title={legalDocument?.title || 'Pravne informacije'}
        subtitle={legalDocument?.lead || undefined}
      >
        {legalDocument ? (
          <View style={styles.legalDoc}>
            <Text style={styles.legalMeta}>Na snazi od {LEGAL_UPDATED}</Text>
            {legalDocument.basis ? (
              <Text style={styles.legalBasis}>{legalDocument.basis}</Text>
            ) : null}
            {legalSections.map((clause, index) => (
              <View key={clause.id || clause.title} style={styles.legalClause}>
                <Text style={styles.legalClauseIndex}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.legalClauseTitle}>{clause.title}</Text>
                {clause.summary ? (
                  <Text style={styles.legalParagraph}>{clause.summary}</Text>
                ) : null}
                {(clause.paragraphs || []).map((text) => (
                  <Text key={text} style={styles.legalParagraph}>{text}</Text>
                ))}
                {(clause.bullets || []).map((item) => (
                  <Text key={item} style={styles.legalParagraph}>• {item}</Text>
                ))}
                {clause.note ? (
                  <Text style={styles.legalParagraph}>{clause.note}</Text>
                ) : null}
                {clause.law ? <Text style={styles.legalLaw}>{clause.law}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </StudioTopCurtain>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  root: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
  },
  studio: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    marginBottom: 6,
  },
  kicker: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 36,
    lineHeight: 40,
    marginBottom: 8,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  sectionNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  sectionTab: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  sectionTabLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    marginTop: 14,
    marginBottom: 10,
  },
  themeList: { gap: 8, marginBottom: 8 },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  input: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    marginBottom: 10,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  prefLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
  },
  prefHint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#FCA5A5',
    marginBottom: 8,
  },
  note: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    marginBottom: 8,
  },
  cta: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ctaLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
  },
  ctaGhost: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaGhostLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
  },
  dangerBtn: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  dangerLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    marginBottom: 8,
  },
  legalLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    flex: 1,
  },
  legalDoc: {
    gap: 12,
    paddingBottom: 8,
  },
  legalMeta: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: BRAND.teal,
  },
  legalBasis: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(148, 163, 184, 0.95)',
  },
  legalClause: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.22)',
  },
  legalClauseIndex: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: BRAND.teal,
  },
  legalClauseTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: BRAND.onDark,
  },
  legalParagraph: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(148, 163, 184, 0.95)',
  },
  legalLaw: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.teal,
  },
  pressed: { opacity: 0.82 },
});
