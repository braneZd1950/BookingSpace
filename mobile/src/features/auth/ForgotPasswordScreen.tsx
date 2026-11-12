import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { forgotPassword } from '../../api/auth.js';
import { isEmail } from '../../../../shared/isEmail.js';
import AuthFormShell from './AuthFormShell';
import { authChromeStyles as chrome } from './authChrome.js';

type ForgotPasswordScreenProps = {
  onBack?: () => void;
  onLogin?: () => void;
};

export default function ForgotPasswordScreen({
  onBack,
  onLogin,
}: ForgotPasswordScreenProps) {
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

  const goBack = onBack ?? onLogin;

  return (
    <AuthFormShell
      backLabel="← Prijava"
      onBack={goBack}
      title={sent ? 'Provjerite e-poštu.' : 'Zaboravljena lozinka.'}
      lead={
        sent
          ? 'Ako račun postoji, poslali smo link za novu lozinku. Link vrijedi 60 minuta.'
          : 'Upišite e-poštu računa — pošaljemo link za novu lozinku.'
      }
      compactTitleSize={32}
    >
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
    </AuthFormShell>
  );
}
