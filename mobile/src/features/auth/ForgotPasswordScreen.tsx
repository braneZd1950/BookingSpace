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
import { forgotPassword } from '../../api/auth.js';
import AuthLegalStrip from './AuthLegalStrip';

type ForgotPasswordScreenProps = {
  onBack?: () => void;
  onLogin?: () => void;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ForgotPasswordScreen({
  onBack,
  onLogin,
}: ForgotPasswordScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useRef(new Animated.Value(0)).current;

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
              accessibilityLabel="Natrag na prijavu"
              onPress={onBack || onLogin}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Text style={styles.backLabel}>← Prijava</Text>
            </Pressable>

            <Text style={styles.brand}>anyminutes</Text>
            <Text style={[styles.title, compact && { fontSize: 32, lineHeight: 36 }]}>
              {sent ? 'Provjerite e-poštu.' : 'Zaboravljena lozinka.'}
            </Text>
            <Text style={styles.lead}>
              {sent
                ? 'Ako račun postoji, poslali smo link za novu lozinku. Link vrijedi 60 minuta.'
                : 'Upišite e-poštu računa — pošaljemo link za novu lozinku.'}
            </Text>
          </Animated.View>

          <Animated.View style={[styles.form, { opacity: enter, marginTop: compact ? 28 : 36 }]}>
            {sent ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Natrag na prijavu"
                onPress={onLogin}
                style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
              >
                <Text style={styles.submitLabel}>Natrag na prijavu</Text>
              </Pressable>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>E-pošta</Text>
                  <TextInput
                    style={[styles.input, error ? styles.inputInvalid : null]}
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

                {error ? <Text style={styles.formError}>{error}</Text> : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Pošaljite link"
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
                    <Text style={styles.submitLabel}>Pošaljite link</Text>
                  )}
                </Pressable>
              </>
            )}
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
  boot: { flex: 1, backgroundColor: '#060908' },
  root: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#060908',
  },
  flex: { flex: 1, minHeight: 0 },
  stage: {
    flexGrow: 1,
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
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: '#E8F2EF',
    marginBottom: 10,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.68)',
    maxWidth: 340,
  },
  form: { gap: 18 },
  field: { gap: 8 },
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
  footer: {
    marginTop: 'auto',
    paddingTop: 28,
  },
  pressed: { opacity: 0.82 },
});
