import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { register as registerRequest } from '../../api/auth.js';
import AuthFormShell from './AuthFormShell';
import AuthPasswordField from './AuthPasswordField';
import { isEmail } from '../../../../shared/isEmail.js';
import { authChromeStyles as chrome } from './authChrome.js';
import { createTenant } from '../../api/tenants.js';
import {
  defaultsForNiche,
  findSignupNiche,
  previewSlug,
  signupNiches,
} from './signupDefaults.js';

type RegisterScreenProps = {
  onBack?: () => void;
  onLogin?: () => void;
  onSuccess?: (result: unknown) => void;
};

type Intent = 'choose' | 'civilian' | 'partner';

/**
 * Registracija: civilni korisnik ili partner (s izborom niše).
 */
export default function RegisterScreen({
  onBack,
  onLogin,
  onSuccess,
}: RegisterScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useRef(new Animated.Value(0)).current;

  const [intent, setIntent] = useState<Intent>('choose');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [niche, setNiche] = useState('fitness');
  const [nicheCustom, setNicheCustom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    
    enter.setValue(0);
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 480,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [enter, intent]);

  function goBack() {
    if (intent !== 'choose') {
      setIntent('choose');
      setFieldErrors({});
      setFormError('');
      return;
    }
    if (onBack) onBack();
    else onLogin?.();
  }

  async function submitCivilian() {
    const nextName = name.trim();
    const nextEmail = email.trim().toLowerCase();
    const problems: Record<string, string> = {};
    if (!nextName) problems.name = 'Upišite ime.';
    if (!isEmail(nextEmail)) problems.email = 'Upišite ispravnu e-poštu.';
    if (!password || password.length < 8) {
      problems.password = 'Lozinka mora imati najmanje 8 znakova.';
    }
    if (!acceptTerms) {
      problems.acceptTerms = 'Prihvatite privatnost i uvjete korištenja.';
    }
    setFieldErrors(problems);
    setFormError('');
    if (Object.keys(problems).length) return;

    setSubmitting(true);
    try {
      const result = await registerRequest({
        name: nextName,
        email: nextEmail,
        password,
        role: 'CUSTOMER',
      });
      onSuccess?.(result);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPartner() {
    const nextName = businessName.trim();
    const nextEmail = email.trim().toLowerCase();
    const problems: Record<string, string> = {};
    if (!nextName) problems.businessName = 'Upišite naziv poslovanja.';
    else if (!previewSlug(nextName)) {
      problems.businessName = 'Naziv treba sadržavati barem jedno slovo ili broj.';
    }
    if (!niche) problems.niche = 'Odaberite vrstu poslovanja.';
    if (niche === 'generic' && !nicheCustom.trim()) {
      problems.nicheCustom = 'Upišite čime se bavite.';
    }
    if (!isEmail(nextEmail)) problems.email = 'Upišite ispravnu e-poštu.';
    if (!password || password.length < 8) {
      problems.password = 'Lozinka mora imati najmanje 8 znakova.';
    }
    if (!passwordAgain) problems.passwordAgain = 'Potvrdite lozinku.';
    else if (password !== passwordAgain) {
      problems.passwordAgain = 'Lozinke se ne podudaraju.';
    }
    if (!acceptTerms) {
      problems.acceptTerms = 'Prihvatite privatnost i uvjete korištenja.';
    }
    setFieldErrors(problems);
    setFormError('');
    if (Object.keys(problems).length) return;

    setSubmitting(true);
    try {
      const account = await registerRequest({
        name: nextName,
        email: nextEmail,
        password,
        role: 'BUSINESS_OWNER',
      });
      const defaults = defaultsForNiche(niche);
      await createTenant({
        name: nextName,
        niche,
        nicheCustom: niche === 'generic' ? nicheCustom.trim() : '',
        email: nextEmail,
        timezone: 'Europe/Zagreb',
        template: defaults.template,
        layout: defaults.layout,
        paletteId: defaults.paletteId,
        visibleSections: defaults.visibleSections,
      });
      onSuccess?.(account);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    intent === 'choose'
      ? 'Kako se želite registrirati?'
      : intent === 'civilian'
        ? 'Otvorite račun.'
        : 'Pokrenite prostor.';

  const lead =
    intent === 'choose'
      ? 'Odaberite što vam odgovara. Klijenti rezerviraju termine kod partnera, a partneri nude svoje usluge.'
      : intent === 'civilian'
        ? 'Za pretraživanje i rezervacije kod partnera — bez otvaranja vlastitog prostora.'
        : 'Naziv, vrsta poslovanja i račun. Izgled stranice kasnije doradite na webu — ovdje odmah otvarate studio.';

  return (
    <AuthFormShell
      backLabel={intent === 'choose' ? '← Prijava' : '← Izbor uloge'}
      onBack={goBack}
      title={title}
      lead={lead}
      compactTitleSize={30}
      enter={enter}
      stagePaddingTop={compact ? 40 : 52}
      formMarginTop={compact ? 22 : 30}
    >
      {intent === 'choose' ? (
              <View style={styles.intentList}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Nastavi kao klijent"
                  onPress={() => setIntent('civilian')}
                  style={({ pressed }) => [styles.intentCard, pressed && chrome.pressed]}
                >
                  <Text style={styles.intentEyebrow}>Klijent</Text>
                  <Text style={styles.intentTitle}>Želim rezervirati termine</Text>
                  <Text style={styles.intentNote}>
                    Račun za rezervacije kod partnera, bez otvaranja vlastitog prostora.
                  </Text>
                  <Text style={styles.intentCta}>Nastavi kao klijent</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Nastavi kao partner"
                  onPress={() => setIntent('partner')}
                  style={({ pressed }) => [styles.intentCard, pressed && chrome.pressed]}
                >
                  <Text style={styles.intentEyebrow}>Partner</Text>
                  <Text style={styles.intentTitle}>Nudim svoje usluge</Text>
                  <Text style={styles.intentNote}>
                    Studio, igraonica, salon ili wellness — odaberite vrstu posla i
                    pokrenite vlastiti prostor.
                  </Text>
                  <Text style={styles.intentCta}>Nastavi kao partner</Text>
                </Pressable>
              </View>
            ) : null}

            {intent === 'civilian' ? (
              <>
                <Field
                  label="Ime"
                  error={fieldErrors.name}
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    clearError(setFieldErrors, 'name');
                  }}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  placeholder="Vaše ime"
                  editable={!submitting}
                />
                <Field
                  label="E-pošta"
                  error={fieldErrors.email}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    clearError(setFieldErrors, 'email');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="ime@email.com"
                  editable={!submitting}
                />
                <AuthPasswordField
                  label="Lozinka"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    clearError(setFieldErrors, 'password');
                  }}
                  error={fieldErrors.password}
                  editable={!submitting}
                  placeholder="Najmanje 8 znakova"
                  textContentType="newPassword"
                  autoComplete="new-password"
                />
                <TermsRow
                  checked={acceptTerms}
                  error={fieldErrors.acceptTerms}
                  onToggle={() => {
                    setAcceptTerms((v) => !v);
                    clearError(setFieldErrors, 'acceptTerms');
                  }}
                />
                {formError ? <Text style={chrome.formError}>{formError}</Text> : null}
                <SubmitButton
                  label="Registrirajte se"
                  submitting={submitting}
                  onPress={submitCivilian}
                />
              </>
            ) : null}

            {intent === 'partner' ? (
              <>
                <Field
                  label="Naziv poslovanja"
                  error={fieldErrors.businessName}
                  value={businessName}
                  onChangeText={(v) => {
                    setBusinessName(v);
                    clearError(setFieldErrors, 'businessName');
                  }}
                  autoCapitalize="words"
                  placeholder="npr. Studio Sjever"
                  editable={!submitting}
                />
                {businessName.trim() && previewSlug(businessName) ? (
                  <Text style={styles.slugHint}>
                    Poveznica: {previewSlug(businessName)}.booking.hr
                  </Text>
                ) : null}

                <View style={chrome.field}>
                  <Text style={chrome.label}>Vrsta poslovanja</Text>
                  <View style={styles.nicheList}>
                    {signupNiches.map((item) => {
                      const selected = niche === item.id;
                      return (
                        <Pressable
                          key={item.id}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          accessibilityLabel={item.name}
                          onPress={() => {
                            setNiche(item.id);
                            if (item.id !== 'generic') setNicheCustom('');
                            clearError(setFieldErrors, 'niche');
                          }}
                          style={({ pressed }) => [
                            styles.nicheCard,
                            selected && styles.nicheCardSelected,
                            pressed && chrome.pressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.nicheName,
                              selected && styles.nicheNameSelected,
                            ]}
                          >
                            {item.name}
                          </Text>
                          <Text style={styles.nicheNote}>{item.note}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {fieldErrors.niche ? (
                    <Text style={chrome.fieldError}>{fieldErrors.niche}</Text>
                  ) : null}
                </View>

                {niche === 'generic' ? (
                  <Field
                    label="Čime se bavite?"
                    error={fieldErrors.nicheCustom}
                    value={nicheCustom}
                    onChangeText={(v) => {
                      setNicheCustom(v);
                      clearError(setFieldErrors, 'nicheCustom');
                    }}
                    placeholder="npr. wellness, coworking…"
                    editable={!submitting}
                  />
                ) : (
                  <Text style={styles.nicheHint}>
                    Odabrano: {findSignupNiche(niche).name}
                  </Text>
                )}

                <Field
                  label="E-pošta"
                  error={fieldErrors.email}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    clearError(setFieldErrors, 'email');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="studio@email.com"
                  editable={!submitting}
                />
                <AuthPasswordField
                  label="Lozinka"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    clearError(setFieldErrors, 'password');
                  }}
                  error={fieldErrors.password}
                  editable={!submitting}
                  placeholder="Najmanje 8 znakova"
                  textContentType="newPassword"
                  autoComplete="new-password"
                />
                <AuthPasswordField
                  label="Ponovite lozinku"
                  value={passwordAgain}
                  onChangeText={(v) => {
                    setPasswordAgain(v);
                    clearError(setFieldErrors, 'passwordAgain');
                  }}
                  error={fieldErrors.passwordAgain}
                  editable={!submitting}
                  placeholder="Ponovite lozinku"
                  textContentType="newPassword"
                  autoComplete="new-password"
                  accessibilityLabel="Ponovite lozinku"
                />
                <TermsRow
                  checked={acceptTerms}
                  error={fieldErrors.acceptTerms}
                  onToggle={() => {
                    setAcceptTerms((v) => !v);
                    clearError(setFieldErrors, 'acceptTerms');
                  }}
                />
                {formError ? <Text style={chrome.formError}>{formError}</Text> : null}
                <SubmitButton
                  label="Otvorite studio"
                  submitting={submitting}
                  onPress={submitPartner}
                />
              </>
            ) : null}

      {intent !== 'choose' ? (
        <Text style={chrome.linkMuted}>
          Već imate račun?{' '}
          <Text style={chrome.linkLabel} onPress={onLogin}>
            Prijavite se
          </Text>
        </Text>
      ) : null}
    </AuthFormShell>
  );
}

function errorMessage(error: unknown) {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code || '')
      : '';
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: string }).message || '')
      : '';
  if (code === 'EMAIL_TAKEN') return 'Ova e-pošta je već registrirana.';
  return message || 'Registracija nije uspjela. Pokušajte ponovno.';
}

function clearError(
  setFieldErrors: Dispatch<SetStateAction<Record<string, string>>>,
  key: string,
) {
  setFieldErrors((prev) => {
    if (!prev[key]) return prev;
    const next = { ...prev };
    delete next[key];
    return next;
  });
}

function Field({
  label,
  error,
  ...inputProps
}: {
  label: string;
  error?: string;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={chrome.field}>
      <Text style={chrome.label}>{label}</Text>
      <TextInput
        style={[chrome.input, error ? chrome.inputInvalid : null]}
        placeholderTextColor="rgba(232, 242, 239, 0.28)"
        accessibilityLabel={label}
        {...inputProps}
      />
      {error ? <Text style={chrome.fieldError}>{error}</Text> : null}
    </View>
  );
}

function TermsRow({
  checked,
  error,
  onToggle,
}: {
  checked: boolean;
  error?: string;
  onToggle: () => void;
}) {
  return (
    <View style={chrome.field}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onToggle}
        style={({ pressed }) => [styles.termsRow, pressed && chrome.pressed]}
      >
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
        </View>
        <Text style={styles.termsText}>
          Prihvaćam privatnost i uvjete korištenja platforme.
        </Text>
      </Pressable>
      {error ? <Text style={chrome.fieldError}>{error}</Text> : null}
    </View>
  );
}

function SubmitButton({
  label,
  submitting,
  onPress,
}: {
  label: string;
  submitting: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={submitting}
      style={({ pressed }) => [
        chrome.submit,
        (pressed || submitting) && chrome.pressed,
      ]}
    >
      {submitting ? (
        <ActivityIndicator color="#061210" />
      ) : (
        <Text style={chrome.submitLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  intentList: { gap: 12 },
  intentCard: {
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'rgba(10, 20, 18, 0.45)',
    gap: 6,
  },
  intentEyebrow: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#5EEAD4',
  },
  intentTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 24,
    lineHeight: 28,
    color: '#F7FCFA',
  },
  intentNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(232, 242, 239, 0.62)',
  },
  intentCta: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(94, 234, 212, 0.14)',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: '#5EEAD4',
  },
  slugHint: {
    marginTop: -8,
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(94, 234, 212, 0.75)',
  },
  nicheList: { gap: 8 },
  nicheCard: {
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.18)',
    borderRadius: 6,
    padding: 12,
    backgroundColor: 'rgba(10, 20, 18, 0.35)',
    gap: 4,
  },
  nicheCardSelected: {
    borderColor: 'rgba(94, 234, 212, 0.65)',
    backgroundColor: 'rgba(94, 234, 212, 0.08)',
  },
  nicheName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#E8F2EF',
  },
  nicheNameSelected: {
    color: '#5EEAD4',
  },
  nicheNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  nicheHint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.5)',
    marginTop: -4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: '#5EEAD4',
    borderColor: '#5EEAD4',
  },
  checkboxMark: {
    fontSize: 13,
    fontWeight: '700',
    color: '#061210',
  },
  termsText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(232, 242, 239, 0.68)',
  },
});
