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
import { forgotPassword } from '../../api/auth.js';
import { isEmail } from '../../../../shared/isEmail.js';
import AuthLegalStrip from './AuthLegalStrip';
import {
  AUTH_GRADIENT,
  AUTH_GRADIENT_LOCATIONS,
  authChromeStyles as chrome,
  authEnterStyle,
  useAuthEnterAnimation,
} from './authChrome.js';

type ForgotPasswordScreenProps = {
  onBack?: () => void;
  onLogin?: () => void;
};

export default function ForgotPasswordScreen({
  onBack,
  onLogin,
}: ForgotPasswordScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useAuthEnterAnimation();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const nextEmail = email.trim().toLowerCase();
    if (!isEmail(nextEmail)) {
      setError('Upišite ispravnu e-poštu.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await forgotPassword({ email: nextEmail });
      setSent(true);
    } catch (failure) {
      const status =
        failure && typeof failure === 'object' && 'status' in failure
          ? Number((failure as { status?: number }).status)
          : 0;
      if (status === 429) {
        setError('Previše pokušaja. Pričekajte malo pa pokušajte ponovno.');
      } else {
        setError('Zahtjev nije uspio. Pokušajte ponovno.');
      }
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
              accessibilityLabel="Natrag na prijavu"
              onPress={onBack || onLogin}
              style={({ pressed }) => [chrome.backBtn, pressed && chrome.pressed]}
            >
              <Text style={chrome.backLabel}>← Prijava</Text>
            </Pressable>

            <Text style={chrome.brand}>anyminutes</Text>
            <Text style={[chrome.title, compact && { fontSize: 32, lineHeight: 36 }]}>
              {sent ? 'Provjerite e-poštu.' : 'Zaboravljena lozinka.'}
            </Text>
            <Text style={chrome.lead}>
              {sent
                ? 'Ako račun postoji, poslali smo link za novu lozinku. Link vrijedi 60 minuta.'
                : 'Upišite e-poštu računa — pošaljemo link za novu lozinku.'}
            </Text>
          </Animated.View>

          <Animated.View style={[chrome.form, { opacity: enter, marginTop: compact ? 28 : 36 }]}>
            {sent ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Natrag na prijavu"
                onPress={onLogin}
                style={({ pressed }) => [chrome.submit, pressed && chrome.pressed]}
              >
                <Text style={chrome.submitLabel}>Natrag na prijavu</Text>
              </Pressable>
            ) : (
              <>
                <View style={chrome.field}>
                  <Text style={chrome.label}>E-pošta</Text>
                  <TextInput
                    style={[chrome.input, error ? chrome.inputInvalid : null]}
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      if (error) setError('');
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
                    onSubmitEditing={onSubmit}
                    returnKeyType="send"
                  />
                </View>

                {error ? <Text style={chrome.formError}>{error}</Text> : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Pošaljite link"
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
                    <Text style={chrome.submitLabel}>Pošaljite link</Text>
                  )}
                </Pressable>
              </>
            )}
          </Animated.View>

          <View style={chrome.footer}>
            <AuthLegalStrip />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
