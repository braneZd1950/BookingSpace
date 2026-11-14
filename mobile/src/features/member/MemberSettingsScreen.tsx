import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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
  getMe,
  updateMe,
} from '../../api/auth.js';
import { recordConsent } from '../../api/consent.js';
import { setToken } from '../../api/token.js';
import { CONSENT_VERSION, hasValidConsent } from '../../lib/consent.js';
import {
  colorsForTheme,
  normalizeUiTheme,
  syncUiTheme,
} from '../../lib/uiTheme.js';

type MemberSettingsScreenProps = {
  tenantName?: string;
  onBack: () => void;
  onLogout?: () => void;
  uiTheme?: string;
  onThemeChange?: (theme: string) => void;
};

const THEME_OPTIONS = [
  { value: 'light', label: 'Svijetla', hint: 'Uvijek svijetlo' },
  { value: 'dark', label: 'Tamna', hint: 'Uvijek tamno' },
  {
    value: 'system',
    label: 'Prema sustavu',
    hint: 'Prati postavku telefona ili računala',
  },
];

const DEFAULT_PREFS = {
  bookingEmail: true,
  cancelEmail: true,
  marketing: false,
  reminderPush: false,
};

const NOTIFY_OPTIONS = [
  {
    key: 'bookingEmail' as const,
    label: 'Potvrda rezervacije',
    hint: 'E-pošta kad rezervirate termin',
  },
  {
    key: 'cancelEmail' as const,
    label: 'Otkazivanje',
    hint: 'E-pošta kad se termin otkaže',
  },
  {
    key: 'marketing' as const,
    label: 'Novosti',
    hint: 'Povremene obavijesti studija i platforme',
  },
  {
    key: 'reminderPush' as const,
    label: 'Podsjetnik',
    hint: 'Push prije početka termina (uskoro)',
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
  const [account, setAccount] = useState({ name: '', email: '', phone: '' });
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [theme, setTheme] = useState(normalizeUiTheme(uiTheme));
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    again: '',
  });
  const [consentOk, setConsentOk] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [notes, setNotes] = useState({
    account: '',
    theme: '',
    prefs: '',
    password: '',
    consent: '',
  });
  const [errors, setErrors] = useState({ account: '', password: '' });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getMe();
        const user = data?.user || data;
        if (cancelled || !user) return;
        setAccount({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        });
        setPrefs({ ...DEFAULT_PREFS, ...(user.notificationPrefs || {}) });
        setTheme(normalizeUiTheme(user.uiTheme || uiTheme));
        setConsentOk(hasValidConsent(user));
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

  async function saveUiTheme(nextRaw: string) {
    const next = normalizeUiTheme(nextRaw);
    setTheme(next);
    syncUiTheme(next);
    onThemeChange?.(next);
    setNotes((current) => ({ ...current, theme: '' }));
    try {
      await updateMe({ uiTheme: next });
      setNotes((current) => ({
        ...current,
        theme: next === 'dark'
          ? 'Tamna tema je spremljena na račun.'
          : next === 'light'
            ? 'Svijetla tema je spremljena na račun.'
            : 'Tema uređaja je spremljena na račun.',
      }));
    } catch {
      setNotes((current) => ({
        ...current,
        theme: 'Tema ostaje lokalno — nije spremljena na račun.',
      }));
    }
  }

  async function saveAccount() {
    setErrors((current) => ({ ...current, account: '' }));
    setNotes((current) => ({ ...current, account: '' }));
    const name = account.name.trim();
    const email = account.email.trim().toLowerCase();
    if (!name || !email) {
      setErrors((current) => ({ ...current, account: 'Ime i e-pošta su obavezni.' }));
      return;
    }
    setSavingAccount(true);
    try {
      await updateMe({
        name,
        email,
        phone: account.phone.trim() || undefined,
      });
      setNotes((current) => ({ ...current, account: 'Račun je spremljen.' }));
    } catch (err) {
      setErrors((current) => ({
        ...current,
        account: err instanceof Error ? err.message : 'Račun nije spremljen.',
      }));
    } finally {
      setSavingAccount(false);
    }
  }

  async function savePrefs() {
    setNotes((current) => ({ ...current, prefs: '' }));
    setSavingPrefs(true);
    try {
      await updateMe({
        notificationPrefs: {
          bookingEmail: Boolean(prefs.bookingEmail),
          cancelEmail: Boolean(prefs.cancelEmail),
          marketing: Boolean(prefs.marketing),
          reminderPush: Boolean(prefs.reminderPush),
        },
      });
      setNotes((current) => ({ ...current, prefs: 'Obavijesti su spremljene.' }));
    } catch {
      setNotes((current) => ({ ...current, prefs: 'Obavijesti nisu spremljene.' }));
    } finally {
      setSavingPrefs(false);
    }
  }

  async function savePassword() {
    setErrors((current) => ({ ...current, password: '' }));
    setNotes((current) => ({ ...current, password: '' }));
    if (password.newPassword.length < 8) {
      setErrors((current) => ({
        ...current,
        password: 'Nova lozinka mora imati barem 8 znakova.',
      }));
      return;
    }
    if (password.newPassword !== password.again) {
      setErrors((current) => ({
        ...current,
        password: 'Nova lozinka i ponavljanje se ne podudaraju.',
      }));
      return;
    }
    setSavingPassword(true);
    try {
      const result = await changePassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      if (result?.token) {
        await setToken(result.token);
      } else {
        setNotes((current) => ({
          ...current,
          password: 'Lozinka je promijenjena — prijavite se ponovo.',
        }));
        setPassword({ currentPassword: '', newPassword: '', again: '' });
        onLogout?.();
        return;
      }
      setPassword({ currentPassword: '', newPassword: '', again: '' });
      setNotes((current) => ({ ...current, password: 'Lozinka je promijenjena.' }));
    } catch (err) {
      setErrors((current) => ({
        ...current,
        password: err instanceof Error ? err.message : 'Lozinka nije promijenjena.',
      }));
    } finally {
      setSavingPassword(false);
    }
  }

  async function acceptConsent() {
    setSavingConsent(true);
    setNotes((current) => ({ ...current, consent: '' }));
    try {
      await recordConsent({
        action: 'accept',
        version: CONSENT_VERSION,
        source: 'member-settings',
      });
      setConsentOk(true);
      setNotes((current) => ({ ...current, consent: 'Privola je spremljena.' }));
    } catch (err) {
      setNotes((current) => ({
        ...current,
        consent: err instanceof Error ? err.message : 'Privola nije spremljena.',
      }));
    } finally {
      setSavingConsent(false);
    }
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

        <Text style={[styles.studio, { color: colors.accent }]}>{tenantName || 'anyminutes'}</Text>
        <Text style={[styles.kicker, { color: colors.accent }]}>Vaš račun</Text>
        <Text style={[styles.title, { color: colors.title }]}>Postavke</Text>
        <Text style={[styles.lead, { color: colors.muted }]}>
          Tema, kontakt i obavijesti spremaju se na vaš račun i vrijede na svim uređajima.
        </Text>

        <Text style={[styles.section, { color: colors.title }]}>01 · Tema</Text>
        <View style={styles.themeList}>
          {THEME_OPTIONS.map((option) => {
            const on = theme === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  void saveUiTheme(option.value);
                }}
                style={({ pressed }) => [
                  styles.themeOption,
                  {
                    borderColor: on ? colors.accent : colors.border,
                    backgroundColor: colors.card,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.themeSwatch,
                    option.value === 'light' && styles.themeSwatchLight,
                    option.value === 'dark' && styles.themeSwatchDark,
                    option.value === 'system' && styles.themeSwatchSystem,
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.prefLabel, { color: colors.title }]}>{option.label}</Text>
                  <Text style={[styles.prefHint, { color: colors.muted }]}>{option.hint}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        {notes.theme ? <Text style={[styles.note, { color: colors.accent }]}>{notes.theme}</Text> : null}

        <Text style={[styles.section, { color: colors.title }]}>02 · Račun</Text>
        <TextInput
          value={account.name}
          onChangeText={(value) => setAccount((current) => ({ ...current, name: value }))}
          placeholder="Ime"
          placeholderTextColor="rgba(232, 242, 239, 0.35)"
          style={styles.input}
        />
        <TextInput
          value={account.email}
          onChangeText={(value) => setAccount((current) => ({ ...current, email: value }))}
          placeholder="E-pošta"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="rgba(232, 242, 239, 0.35)"
          style={styles.input}
        />
        <TextInput
          value={account.phone}
          onChangeText={(value) => setAccount((current) => ({ ...current, phone: value }))}
          placeholder="Telefon"
          keyboardType="phone-pad"
          placeholderTextColor="rgba(232, 242, 239, 0.35)"
          style={styles.input}
        />
        {errors.account ? <Text style={styles.error}>{errors.account}</Text> : null}
        {notes.account ? <Text style={[styles.note, { color: colors.accent }]}>{notes.account}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={savingAccount}
          onPress={saveAccount}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Text style={styles.ctaLabel}>
            {savingAccount ? 'Spremamo…' : 'Spremi račun'}
          </Text>
        </Pressable>

        <Text style={[styles.section, { color: colors.title }]}>03 · Obavijesti</Text>
        {NOTIFY_OPTIONS.map((item) => (
          <View key={item.key} style={[styles.prefRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.prefLabel, { color: colors.title }]}>{item.label}</Text>
              <Text style={[styles.prefHint, { color: colors.muted }]}>{item.hint}</Text>
            </View>
            <Switch
              value={Boolean(prefs[item.key])}
              onValueChange={(value) => setPrefs((current) => ({ ...current, [item.key]: value }))}
              trackColor={{ false: '#24302C', true: '#2A6B5F' }}
              thumbColor={prefs[item.key] ? '#5EEAD4' : '#9CA3AF'}
            />
          </View>
        ))}
        {notes.prefs ? <Text style={[styles.note, { color: colors.accent }]}>{notes.prefs}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={savingPrefs}
          onPress={savePrefs}
          style={({ pressed }) => [styles.ctaGhost, pressed && styles.pressed]}
        >
          <Text style={styles.ctaGhostLabel}>
            {savingPrefs ? 'Spremamo…' : 'Spremi obavijesti'}
          </Text>
        </Pressable>

        <Text style={[styles.section, { color: colors.title }]}>04 · Lozinka</Text>
        <TextInput
          value={password.currentPassword}
          onChangeText={(value) => setPassword((current) => ({ ...current, currentPassword: value }))}
          placeholder="Trenutna lozinka"
          secureTextEntry
          placeholderTextColor="rgba(232, 242, 239, 0.35)"
          style={styles.input}
        />
        <TextInput
          value={password.newPassword}
          onChangeText={(value) => setPassword((current) => ({ ...current, newPassword: value }))}
          placeholder="Nova lozinka"
          secureTextEntry
          placeholderTextColor="rgba(232, 242, 239, 0.35)"
          style={styles.input}
        />
        <TextInput
          value={password.again}
          onChangeText={(value) => setPassword((current) => ({ ...current, again: value }))}
          placeholder="Ponovite novu lozinku"
          secureTextEntry
          placeholderTextColor="rgba(232, 242, 239, 0.35)"
          style={styles.input}
        />
        {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
        {notes.password ? <Text style={[styles.note, { color: colors.accent }]}>{notes.password}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={savingPassword}
          onPress={savePassword}
          style={({ pressed }) => [styles.ctaGhost, pressed && styles.pressed]}
        >
          <Text style={styles.ctaGhostLabel}>
            {savingPassword ? 'Spremamo…' : 'Promijeni lozinku'}
          </Text>
        </Pressable>

        <Text style={[styles.section, { color: colors.title }]}>05 · Privola</Text>
        <Text style={[styles.prefHint, { color: colors.muted }]}>
          {consentOk
            ? 'Privola za rezervacije je aktivna.'
            : 'Za rezervacije i otkaze potrebna je privola.'}
        </Text>
        {notes.consent ? <Text style={[styles.note, { color: colors.accent }]}>{notes.consent}</Text> : null}
        {!consentOk ? (
          <Pressable
            accessibilityRole="button"
            disabled={savingConsent}
            onPress={acceptConsent}
            style={({ pressed }) => [styles.ctaGhost, pressed && styles.pressed]}
          >
            <Text style={styles.ctaGhostLabel}>
              {savingConsent ? 'Spremamo…' : 'Prihvatite privolu'}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1614',
  },
  root: { flex: 1, backgroundColor: '#0E1614' },
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
    color: '#5EEAD4',
  },
  studio: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: 'rgba(94, 234, 212, 0.85)',
    marginBottom: 6,
  },
  kicker: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#5EEAD4',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 36,
    lineHeight: 40,
    color: '#E8F2EF',
    marginBottom: 8,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.68)',
    marginBottom: 18,
  },
  section: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    marginTop: 18,
    marginBottom: 10,
  },
  themeList: { gap: 8, marginBottom: 8 },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  themeSwatch: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  themeSwatchLight: { backgroundColor: '#F7FBFA' },
  themeSwatchDark: { backgroundColor: '#0C1815' },
  themeSwatchSystem: {
    backgroundColor: '#F7FBFA',
    borderRightWidth: 14,
    borderRightColor: '#0C1815',
  },
  input: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.24)',
    paddingHorizontal: 14,
    color: '#F7FCFA',
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
    borderBottomColor: 'rgba(232, 242, 239, 0.12)',
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
    minHeight: 48,
    borderRadius: 6,
    backgroundColor: '#5EEAD4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ctaLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#061210',
  },
  ctaGhost: {
    minHeight: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaGhostLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#E8F2EF',
  },
  pressed: { opacity: 0.82 },
});
