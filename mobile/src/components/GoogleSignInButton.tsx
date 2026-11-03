import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { env } from '../config/env';
import { font } from '../theme/fonts';
import { tokens } from '../theme/tokens';

WebBrowser.maybeCompleteAuthSession();

type Intent = 'login' | 'register';

type Props = {
  intent?: Intent;
  /** Show both login + register Google buttons (one auth session). */
  intents?: Intent[];
  onIdToken: (idToken: string, intent: Intent) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
  label?: string;
};

function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

function titleFor(intent: Intent) {
  return intent === 'register'
    ? 'Registrirajte se s Googleom'
    : 'Prijavite se s Googleom';
}

export default function GoogleSignInButton({
  intent = 'login',
  intents,
  onIdToken,
  onError,
  disabled = false,
  label,
}: Props) {
  const [busy, setBusy] = useState(false);
  const configured = Boolean(env.googleClientId);
  const activeIntent = useRef<Intent>(intent);
  const handlers = useRef({ onIdToken, onError });
  handlers.current = { onIdToken, onError };

  const shown: Intent[] = intents?.length ? intents : [intent];

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: env.googleClientId || undefined,
    iosClientId: env.googleIosClientId || env.googleClientId || undefined,
    androidClientId: env.googleAndroidClientId || env.googleClientId || undefined,
    webClientId: env.googleClientId || undefined,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token
        || (response.authentication as { idToken?: string } | null)?.idToken;
      if (!idToken) {
        handlers.current.onError?.('Google nije vratio token.');
        return;
      }
      void (async () => {
        setBusy(true);
        try {
          await handlers.current.onIdToken(idToken, activeIntent.current);
        } catch (err) {
          handlers.current.onError?.(
            err instanceof Error ? err.message : 'Google prijava nije uspjela.',
          );
        } finally {
          setBusy(false);
        }
      })();
      return;
    }
    if (response.type === 'error') {
      handlers.current.onError?.(response.error?.message || 'Google prijava je otkazana.');
    }
  }, [response]);

  const start = (next: Intent) => {
    if (!configured) {
      onError?.(
        'Google prijava nije konfigurirana. U mobile/.env postavite EXPO_PUBLIC_GOOGLE_CLIENT_ID.',
      );
      return;
    }
    if (!request) {
      onError?.('Google još nije spreman. Pričekajte trenutak pa pokušajte ponovo.');
      return;
    }
    activeIntent.current = next;
    void promptAsync();
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.or}>{label || 'ili'}</Text>
      {shown.map((item, index) => (
        <View key={item}>
          {index > 0 ? <Text style={[styles.or, styles.orGap]}>ili</Text> : null}
          <Pressable
            style={[styles.btn, (disabled || busy) && styles.btnDisabled]}
            disabled={disabled || busy}
            accessibilityRole="button"
            onPress={() => start(item)}
          >
            {busy && activeIntent.current === item ? (
              <ActivityIndicator color={tokens.fg} />
            ) : (
              <>
                <GoogleMark />
                <Text style={styles.btnLabel}>{titleFor(item)}</Text>
              </>
            )}
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    gap: 10,
    width: '100%',
  },
  or: {
    textAlign: 'center',
    fontFamily: font.bodySemi,
    fontSize: 13,
    color: tokens.muted,
    textTransform: 'lowercase',
  },
  orGap: {
    marginTop: 4,
    marginBottom: 4,
  },
  btn: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: tokens.line,
    backgroundColor: tokens.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnLabel: {
    fontFamily: font.bodyBold,
    fontSize: 15,
    color: tokens.fg,
  },
});
