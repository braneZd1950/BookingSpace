import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { login as loginRequest } from '../../api/auth.js';
import { isEmail } from '../../../../shared/isEmail.js';
import AuthFormShell from './AuthFormShell';
import AuthPasswordField from './AuthPasswordField';
import { authChromeStyles as chrome } from './authChrome.js';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    <AuthFormShell
      backLabel="← Početna"
      onBack={onBack}
      title="Prijavite se."
      lead="Ista prijava za člana i za studio."
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

      <AuthPasswordField
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (fieldErrors.password) {
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }
        }}
        error={fieldErrors.password}
        editable={!submitting}
        onSubmitEditing={onSubmit}
        returnKeyType="go"
      />

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

      <View style={chrome.links}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Zaboravljena lozinka"
          onPress={onForgotPassword}
          style={({ pressed }) => [pressed && chrome.pressed]}
        >
          <Text style={chrome.linkLabel}>Zaboravljena lozinka?</Text>
        </Pressable>
        <Text style={chrome.linkMuted}>
          Nemate račun?{' '}
          <Text style={chrome.linkLabel} onPress={onRegister}>
            Registrirajte se
          </Text>
        </Text>
      </View>
    </AuthFormShell>
  );
}
