import { useEffect, useRef, useState } from 'react';
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
import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { login as loginRequest } from '../../api/auth.js';
import AuthLegalStrip from './AuthLegalStrip';

type LoginScreenProps = {
  onBack?: () => void;
  onForgotPassword?: () => void;
  onRegister?: () => void;
  onSuccess?: (result: unknown) => void;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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

  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [enter]);

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
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0C1815', '#070B0A', '#050706']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.stage,
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
          <Animated.View
            style={{
              opacity: enter,
              transform: [
                {
                  translateY: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Natrag na početnu"
              onPress={onBack}
              style={({ pressed }) => [
                styles.backBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.backLabel}>← Početna</Text>
            </Pressable>

            <Text style={styles.brand}>anyminutes</Text>
            <Text style={[styles.title, compact && { fontSize: 34, lineHeight: 38 }]}>
              Prijavite se.
            </Text>
            <Text style={styles.lead}>Ista prijava za člana i za studio.</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.form,
              {
                opacity: enter,
                marginTop: compact ? 28 : 36,
              },
            ]}
          >
            <View style={styles.field}>
              <Text style={styles.label}>E-pošta</Text>
              <TextInput
                style={[styles.input, fieldErrors.email && styles.inputInvalid]}
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
                <Text style={styles.fieldError}>{fieldErrors.email}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Lozinka</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    fieldErrors.password && styles.inputInvalid,
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
                    pressed && styles.pressed,
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
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              ) : null}
            </View>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Prijavite se"
              onPress={onSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submit,
                (pressed || submitting) && styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#061210" />
              ) : (
                <Text style={styles.submitLabel}>Prijavite se</Text>
              )}
            </Pressable>

            <View style={styles.links}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Zaboravljena lozinka"
                onPress={onForgotPassword}
                style={({ pressed }) => [pressed && styles.pressed]}
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

          <View style={styles.footer}>
            <AuthLegalStrip />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
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
  flex: {
    flex: 1,
    minHeight: 0,
  },
  stage: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 20,
  },
  backLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.62)',
  },
  brand: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: '#F7FCFA',
    marginBottom: 18,
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
    color: 'rgba(232, 242, 239, 0.68)',
    maxWidth: 320,
  },
  form: {
    gap: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.5)',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    borderRadius: 6,
    paddingHorizontal: 14,
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#F7FCFA',
    backgroundColor: 'rgba(10, 20, 18, 0.45)',
  },
  inputInvalid: {
    borderColor: 'rgba(251, 113, 133, 0.7)',
  },
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
  fieldError: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(251, 113, 133, 0.95)',
  },
  formError: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(251, 113, 133, 0.95)',
  },
  submit: {
    minHeight: 56,
    marginTop: 6,
    borderRadius: 6,
    backgroundColor: '#5EEAD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.15,
    color: '#061210',
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
  footer: {
    marginTop: 'auto',
    paddingTop: 28,
  },
  pressed: {
    opacity: 0.82,
  },
});
