import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { updateMe } from '../../../src/api/auth';
import { useAuth } from '../../../src/features/auth/AuthContext';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import type { UiTheme } from '../../../src/lib/uiTheme';
import { font } from '../../../src/theme/fonts';
import { tokens } from '../../../src/theme/tokens';

const OPTIONS: { value: UiTheme; label: string; hint: string }[] = [
  { value: 'light', label: 'Svijetla', hint: 'Uvijek svijetlo' },
  { value: 'dark', label: 'Tamna', hint: 'Uvijek tamno' },
  {
    value: 'system',
    label: 'Prema sustavu',
    hint: 'Prati postavku vašeg telefona ili računala',
  },
];

const NOTIFY_OPTIONS = [
  { key: 'bookingEmail' as const, label: 'Potvrda rezervacije', hint: 'E-pošta kad rezervirate termin' },
  { key: 'cancelEmail' as const, label: 'Otkazivanje', hint: 'E-pošta kad se termin otkaže' },
  { key: 'marketing' as const, label: 'Novosti', hint: 'Povremene obavijesti' },
  { key: 'reminderPush' as const, label: 'Podsjetnik', hint: 'Push prije termina (uskoro)' },
];

/** Member Postavke — same idea as web `/s/:slug/postavke`. */
export default function MemberPostavkeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user, setUser, token } = useAuth();
  const { uiTheme, setUiTheme, colors } = useTheme();
  const [account, setAccount] = useState({ name: '', email: '', phone: '' });
  const [prefs, setPrefs] = useState({
    bookingEmail: true,
    cancelEmail: true,
    marketing: false,
    reminderPush: false,
  });
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const brand = colors.brand || tokens.brand;
  const ink = colors.fg || tokens.fg;
  const muted = colors.muted || tokens.muted;
  const surface = colors.surface || tokens.surface;
  const bg = colors.bg || tokens.bg;

  useEffect(() => {
    if (!user) return;
    setAccount({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setPrefs({
      bookingEmail: user.notificationPrefs?.bookingEmail !== false,
      cancelEmail: user.notificationPrefs?.cancelEmail !== false,
      marketing: Boolean(user.notificationPrefs?.marketing),
      reminderPush: Boolean(user.notificationPrefs?.reminderPush),
    });
  }, [user]);

  async function saveAccount() {
    if (!token) return;
    setBusy('account');
    setNote(null);
    try {
      const result = await updateMe({
        name: account.name.trim(),
        email: account.email.trim().toLowerCase(),
        phone: account.phone.trim() || undefined,
      });
      setUser?.(result.user);
      setNote({ kind: 'ok', text: 'Račun je spremljen.' });
    } catch (err) {
      setNote({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Račun nije spremljen.',
      });
    } finally {
      setBusy('');
    }
  }

  async function saveTheme(next: UiTheme) {
    setBusy('theme');
    setNote(null);
    await setUiTheme(next);
    setNote({
      kind: 'ok',
      text: next === 'dark'
        ? 'Tamna tema je spremljena na račun.'
        : next === 'light'
          ? 'Svijetla tema je spremljena na račun.'
          : 'Tema uređaja je spremljena na račun.',
    });
    setBusy('');
  }

  async function savePrefs() {
    if (!token) return;
    setBusy('prefs');
    setNote(null);
    try {
      const result = await updateMe({ notificationPrefs: prefs });
      setUser?.(result.user);
      setNote({ kind: 'ok', text: 'Obavijesti su spremljene.' });
    } catch (err) {
      setNote({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Obavijesti nisu spremljene.',
      });
    } finally {
      setBusy('');
    }
  }

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
        <ActivityIndicator color={brand} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
    >
      <Text
        style={{
          fontFamily: font.bodyExtra,
          fontSize: 11.5,
          letterSpacing: 0.08,
          textTransform: 'uppercase',
          color: brand,
        }}
      >
        {slug || 'Studio'}
      </Text>
      <Text style={{ fontFamily: font.display, fontSize: 28, color: ink, letterSpacing: -0.5 }}>
        Postavke
      </Text>
      <Text style={{ fontFamily: font.body, fontSize: 15, lineHeight: 22, color: muted }}>
        Tema, kontakt i obavijesti spremaju se na vaš račun.
      </Text>

      {note ? (
        <Text
          style={{
            fontFamily: font.body,
            fontSize: 13,
            color: note.kind === 'err' ? '#9b1c1c' : tokens.okInk,
          }}
        >
          {note.text}
        </Text>
      ) : null}

      <View style={sheet(surface, brand)}>
        <Text style={title(ink)}>Račun</Text>
        <Field
          label="Ime i prezime"
          value={account.name}
          onChangeText={(name) => setAccount((c) => ({ ...c, name }))}
          ink={ink}
          muted={muted}
          brand={brand}
        />
        <Field
          label="Telefon"
          value={account.phone}
          onChangeText={(phone) => setAccount((c) => ({ ...c, phone }))}
          ink={ink}
          muted={muted}
          brand={brand}
          keyboardType="phone-pad"
        />
        <Field
          label="E-pošta"
          value={account.email}
          onChangeText={(email) => setAccount((c) => ({ ...c, email }))}
          ink={ink}
          muted={muted}
          brand={brand}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Primary
          label={busy === 'account' ? 'Spremamo…' : 'Spremi račun'}
          disabled={Boolean(busy)}
          onPress={() => void saveAccount()}
          brand={brand}
        />
      </View>

      <View style={sheet(surface, brand)}>
        <Text style={title(ink)}>Tema sučelja</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {OPTIONS.map((option) => {
            const on = uiTheme === option.value;
            return (
              <Pressable
                key={option.value}
                disabled={Boolean(busy)}
                onPress={() => void saveTheme(option.value)}
                style={{
                  minWidth: 96,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: on ? brand : `${ink}22`,
                  backgroundColor: on ? `${brand}18` : surface,
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: on ? brand : ink }}>
                  {option.label}
                </Text>
                <Text style={{ fontFamily: font.body, fontSize: 12, color: muted, marginTop: 2 }}>
                  {option.hint}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={sheet(surface, brand)}>
        <Text style={title(ink)}>Obavijesti</Text>
        {NOTIFY_OPTIONS.map((option) => {
          const on = Boolean(prefs[option.key]);
          return (
            <Pressable
              key={option.key}
              onPress={() => setPrefs((current) => ({
                ...current,
                [option.key]: !current[option.key],
              }))}
              style={{
                flexDirection: 'row',
                gap: 10,
                alignItems: 'flex-start',
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: `${ink}12`,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  marginTop: 2,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: on ? brand : `${ink}33`,
                  backgroundColor: on ? brand : 'transparent',
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: ink }}>
                  {option.label}
                </Text>
                <Text style={{ fontFamily: font.body, fontSize: 12, color: muted, marginTop: 2 }}>
                  {option.hint}
                </Text>
              </View>
            </Pressable>
          );
        })}
        <Primary
          label={busy === 'prefs' ? 'Spremamo…' : 'Spremi obavijesti'}
          disabled={Boolean(busy)}
          onPress={() => void savePrefs()}
          brand={brand}
        />
      </View>
    </ScrollView>
  );
}

function sheet(surface: string, brand: string) {
  return {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${brand}29`,
    backgroundColor: surface,
    gap: 10,
  } as const;
}

function title(ink: string) {
  return {
    fontFamily: font.bodySemi,
    fontSize: 16,
    color: ink,
  } as const;
}

function Primary({
  label,
  onPress,
  disabled,
  brand,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  brand: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        alignSelf: 'flex-start',
        marginTop: 4,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: brand,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: '#fff' }}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  ink,
  muted,
  brand,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  ink: string;
  muted: string;
  brand: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: muted }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={`${ink}66`}
        style={{
          borderWidth: 1,
          borderColor: `${brand}2e`,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontFamily: font.body,
          fontSize: 15,
          color: ink,
        }}
      />
    </View>
  );
}
