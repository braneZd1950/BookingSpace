import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginAtmosphere } from '../../src/components/LoginAtmosphere';
import GoogleSignInButton from '../../src/components/GoogleSignInButton';
import { ApiError } from '../../src/api/client';
import { env } from '../../src/config/env';
import { useAuth } from '../../src/features/auth/AuthContext';
import { resolveHomeHref } from '../../src/features/auth/resolveHomeHref';
import { openWebPath } from '../../src/lib/openWeb';
import { tokens } from '../../src/theme/tokens';
import { loginStyles as s } from '../../src/ui/loginStyles';

/** Same demo credentials as `client/src/mock/data.js` (seed:demo). */
const DEMO = {
  memberEmail: 'ivan.horvat@demo.hr',
  studioEmail: 'ana.kovac@demo.hr',
  password: 'lozinka1234',
};

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function enterApp(user: Awaited<ReturnType<typeof login>>) {
    const href = await resolveHomeHref(user);
    router.replace(href as Href);
  }

  async function onGoogleIdToken(idToken: string, intent: 'login' | 'register') {
    setError('');
    setBusy(true);
    try {
      const user = await loginWithGoogle(idToken, intent);
      await enterApp(user);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'GOOGLE_NOT_CONFIGURED') {
        setError('Google prijava nije uključena na poslužitelju.');
      } else if (err instanceof ApiError) {
        setError(err.message || 'Google prijava nije uspjela.');
      } else {
        setError('Google prijava nije uspjela.');
      }
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit() {
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      await enterApp(user);
    } catch (err) {
      let message = 'Prijava nije uspjela.';
      if (err instanceof ApiError) {
        if (err.code === 'GOOGLE_ONLY') {
          message = 'Ovaj račun koristi Google — kliknite gumb ispod.';
        } else {
          message = err.status === 401
            ? 'Neispravna e-pošta ili lozinka.'
            : err.message;
        }
      } else if (
        err instanceof TypeError
        || (err instanceof Error && /fetch|network|Failed/i.test(err.message))
      ) {
        message = 'API nije dostupan. Pokrenite server (npm run dev) i provjerite EXPO_PUBLIC_API_URL.';
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  const idle = busy || !email.trim() || !password;

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <LoginAtmosphere />
      <KeyboardAvoidingView
        style={{ flex: 1, zIndex: 1, position: 'relative' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.layout}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* .login__spine — accent is ::after next to mark (not space-between) */}
          <View style={s.spine}>
            <View style={s.spineMarkRow}>
              <Text style={s.spineMark}>{env.appName}</Text>
              <View style={s.spineRule} />
            </View>
          </View>

          {/* .login__stage */}
          <View style={s.stage}>
            <View style={s.intro}>
              <Text style={s.kicker}>Jedan ulaz</Text>
              <Text style={s.title}>Prijavite se.</Text>
              <Text style={s.lead}>Ista prijava za člana i za studio.</Text>
            </View>

            <View style={s.panel}>
              <View style={s.field}>
                <Text style={s.fieldLabel}>E-pošta</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCorrect={false}
                  placeholderTextColor={tokens.muted}
                  style={s.input}
                />
              </View>

              <View style={s.field}>
                <Text style={s.fieldLabel}>Lozinka</Text>
                <View style={s.passwordWrap}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    placeholderTextColor={tokens.muted}
                    style={[s.input, s.passwordInput]}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    style={s.eye}
                    accessibilityLabel={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={loginInkMuted45}
                    />
                  </Pressable>
                </View>
              </View>

              {error ? <Text style={s.formError}>{error}</Text> : null}

              <Pressable
                accessibilityRole="button"
                disabled={idle}
                onPress={onSubmit}
                style={[s.submit, idle ? s.submitDisabled : null]}
              >
                {busy ? (
                  <ActivityIndicator color={tokens.onBrand} />
                ) : (
                  <Text style={s.submitLabel}>Prijavite se</Text>
                )}
              </Pressable>

              <GoogleSignInButton
                intent="login"
                disabled={busy}
                onIdToken={onGoogleIdToken}
                onError={(message) => setError(message)}
              />
            </View>

            <View style={s.links}>
              <Pressable
                accessibilityRole="link"
                onPress={() => void openWebPath('/zaboravljena-lozinka')}
              >
                <Text style={s.link}>Zaboravljena lozinka?</Text>
              </Pressable>
              <View style={s.linksRow}>
                <Text style={s.linksMuted}>Nemate račun? </Text>
                <Pressable
                  accessibilityRole="link"
                  hitSlop={8}
                  onPress={() => void openWebPath('/register')}
                >
                  <Text style={s.link}>Registrirajte se</Text>
                </Pressable>
              </View>
              <Pressable accessibilityRole="link" onPress={() => router.replace('/')}>
                <Text style={s.link}>Natrag na početnu</Text>
              </Pressable>
            </View>

            {__DEV__ ? (
              <View style={s.keys}>
                <Text style={s.keysTitle}>Probni ključevi</Text>
                <Text style={s.keysBody}>
                  Član: <Text style={s.keysCode}>{DEMO.memberEmail}</Text>
                  {'\n'}
                  Studio: <Text style={s.keysCode}>{DEMO.studioEmail}</Text>
                  {'\n'}
                  Lozinka: <Text style={s.keysCode}>{DEMO.password}</Text>
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const loginInkMuted45 = 'rgba(16, 44, 47, 0.45)';
