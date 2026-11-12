import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { login as loginRequest } from '../../api/auth.js';
import { isEmail } from '../../../../shared/isEmail.js';
import AuthLegalStrip from './AuthLegalStrip';
import {
  AUTH_GRADIENT,
  AUTH_GRADIENT_LOCATIONS,
  authChromeStyles as chrome,
  authEnterStyle,
  useAuthEnterAnimation,
} from './authChrome.js';

type LoginScreenProps = {
  onBack?: () => void;
  onForgotPassword?: () => void;
  onRegister?: () => void;
  onSuccess?: (result: unknown) => void;
};

/**
 * Mobilna prijava — isti vizualni jezik kao landing, ne web LoginPage.
 */
export default function LoginScreen({
  onBack,
  onForgotPassword,
  onRegister,
  onSuccess,
}: LoginScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const enter = useAuthEnterAnimation();

  async function onSubmit() {
    const nextEmail = email.trim().toLowerCase();
    const problems: { email?: string; password?: string } = {};
    if (!isEmail(nextEmail)) problems.email = 'Upišite ispravnu e-poštu.';
    if (!password) problems.password = 'Upišite lozinku.';
    setFieldErrors(problems);
    setFormError('');
    if (Object.keys(problems).length) return;

    setSubmitting(true);
    try {
      const result = await loginRequest({ email: nextEmail, password });
      onSuccess?.(result);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message || '')
          : '';
      setFormError(message || 'Prijava nije uspjela. Provjerite podatke.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={chrome.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={AUTH_GRADIENT as [string, string, ...string[]]}
        locations={AUTH_GRADIENT_LOCATIONS as [number, number, ...number[]]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={chrome.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={chrome.flex}
          contentContainerStyle={[
            chrome.stage,
            {
              paddingTop: compact ? 44 : 56,
              paddingBottom: compact ? 28 : 40,
              minHeight: height,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={authEnterStyle(enter)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Natrag na početnu"
              onPress={onBack}
              style={({ pressed }) => [
                chrome.backBtn,
                pressed && chrome.pressed,
              ]}
            >
              <Text style={chrome.backLabel}>← Početna</Text>
            </Pressable>

            <Text style={chrome.brand}>anyminutes</Text>
            <Text style={[chrome.title, compact && { fontSize: 34, lineHeight: 38 }]}>
              Prijavite se.
            </Text>
            <Text style={chrome.lead}>Ista prijava za člana i za studio.</Text>
          </Animated.View>

          <Animated.View
            style={[
              chrome.form,
              {
                opacity: enter,
                marginTop: compact ? 28 : 36,
              },
            ]}
          >
            <View style={chrome.field}>
              <Text style={chrome.label}>E-pošta</Text>
              <TextInput
                style={[chrome.input, fieldErrors.email && chrome.inputInvalid]}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="ime@studio.hr"
                placeholderTextColor="rgba(232, 242, 239, 0.28)"
                editable={!submitting}
                accessibilityLabel="E-pošta"
              />
              {fieldErrors.email ? (
                <Text style={chrome.fieldError}>{fieldErrors.email}</Text>
              ) : null}
            </View>

            <View style={chrome.field}>
              <Text style={chrome.label}>Lozinka</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[
                    chrome.input,
                    styles.passwordInput,
                    fieldErrors.password && chrome.inputInvalid,
                  ]}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  placeholder="••••••••"
                  placeholderTextColor="rgba(232, 242, 239, 0.28)"
                  editable={!submitting}
                  accessibilityLabel="Lozinka"
                  onSubmitEditing={onSubmit}
                  returnKeyType="go"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.eyeBtn,
                    pressed && chrome.pressed,
                  ]}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#5EEAD4"
                  />
                </Pressable>
              </View>
              {fieldErrors.password ? (
                <Text style={chrome.fieldError}>{fieldErrors.password}</Text>
              ) : null}
            </View>

            {formError ? <Text style={chrome.formError}>{formError}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Prijavite se"
              onPress={onSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                chrome.submit,
                (pressed || submitting) && chrome.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#061210" />
              ) : (
                <Text style={chrome.submitLabel}>Prijavite se</Text>
              )}
            </Pressable>

            <View style={styles.links}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Zaboravljena lozinka"
                onPress={onForgotPassword}
                style={({ pressed }) => [pressed && chrome.pressed]}
              >
                <Text style={styles.linkLabel}>Zaboravljena lozinka?</Text>
              </Pressable>
              <Text style={styles.linkMuted}>
                Nemate račun?{' '}
                <Text style={styles.linkLabel} onPress={onRegister}>
                  Registrirajte se
                </Text>
              </Text>
            </View>
          </Animated.View>

          <View style={chrome.footer}>
            <AuthLegalStrip />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  links: {
    marginTop: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  linkLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#5EEAD4',
  },
  linkMuted: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.5)',
  },
});
