import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFonts } from 'expo-font';
import LandingScreen from './src/features/auth/LandingScreen';
import LoginScreen from './src/features/auth/LoginScreen';
import ForgotPasswordScreen from './src/features/auth/ForgotPasswordScreen';
import RegisterScreen from './src/features/auth/RegisterScreen';
import SessionSuccessScreen from './src/features/auth/SessionSuccessScreen';
import MemberAboutScreen from './src/features/member/MemberAboutScreen';
import MemberDiscoverScreen from './src/features/member/MemberDiscoverScreen';
import MemberFaqScreen from './src/features/member/MemberFaqScreen';
import MemberHomeScreen from './src/features/member/MemberHomeScreen';
import StudioHomeScreen from './src/features/studio/StudioHomeScreen';
import { getMe } from './src/api/auth.js';
import { clearToken, getToken } from './src/api/token.js';
import { APP_FONTS } from './src/lib/appFonts.js';
import { resolveMemberStudio } from './src/lib/resolveMemberStudio.js';
import {
  applyUiTheme,
  normalizeUiTheme,
  readStoredUiTheme,
  syncUiTheme,
} from './src/lib/uiTheme.js';

type AppScreen =
  | 'landing'
  | 'login'
  | 'forgot'
  | 'register'
  | 'discover'
  | 'faq'
  | 'about'
  | 'session'
  | 'member'
  | 'studio';

type SessionUser = {
  role?: string;
  name?: string;
  email?: string;
  uiTheme?: string;
};

type MemberStudio = {
  slug: string;
  tenantId?: string;
  tenantName?: string;
  membership?: Record<string, unknown> | null;
};

/**
 * Partner → StudioHome. Član → studio članarine. Token → restore bez ponovne prijave.
 */
export default function App() {
  const [fontsLoaded] = useFonts(APP_FONTS);
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionSource, setSessionSource] = useState<'login' | 'register'>('login');
  const [memberStudio, setMemberStudio] = useState<MemberStudio | null>(null);
  const [uiTheme, setUiTheme] = useState(() => readStoredUiTheme());

  useEffect(() => {
    applyUiTheme(uiTheme);
  }, [uiTheme]);

  function applyUserTheme(user: SessionUser | null | undefined) {
    if (!user?.uiTheme) return;
    const next = normalizeUiTheme(user.uiTheme);
    syncUiTheme(next);
    setUiTheme(next);
  }

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    const style = document.createElement('style');
    style.setAttribute('data-anyminutes-overflow', 'true');
    style.textContent = `
      html, body, #root {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        overscroll-behavior: none;
      }
      body {
        position: fixed;
        inset: 0;
      }
      #root {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getMe();
        const user = (data?.user || data) as SessionUser | null;
        if (cancelled || !user) return;
        setSessionUser(user);
        setSessionSource('login');
        applyUserTheme(user);
        if (user.role === 'BUSINESS_OWNER') {
          setMemberStudio(null);
          setScreen('studio');
          return;
        }
        const studio = await resolveMemberStudio();
        if (cancelled) return;
        if (studio?.slug) {
          setMemberStudio(studio);
          setScreen('member');
          return;
        }
        setMemberStudio(null);
        setScreen('session');
      } catch {
        await clearToken();
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openSession(result: unknown, source: 'login' | 'register') {
    const user =
      result && typeof result === 'object' && 'user' in result
        ? (result as { user?: SessionUser }).user || null
        : null;
    setSessionUser(user);
    setSessionSource(source);
    applyUserTheme(user);
    if (user?.role === 'BUSINESS_OWNER') {
      setMemberStudio(null);
      setScreen('studio');
      return;
    }
    setBooting(true);
    try {
      const studio = await resolveMemberStudio();
      if (studio?.slug) {
        setMemberStudio(studio);
        setScreen('member');
        return;
      }
      setMemberStudio(null);
      setScreen('session');
    } catch {
      setMemberStudio(null);
      setScreen('session');
    } finally {
      setBooting(false);
    }
  }

  if (booting || !fontsLoaded) {
    return (
      <View style={[styles.shell, styles.boot]}>
        <ActivityIndicator color="#5EEAD4" />
      </View>
    );
  }

  if (screen === 'landing') {
    return (
      <View style={styles.shell}>
        <LandingScreen
          onLogin={() => setScreen('login')}
          onBrowse={() => setScreen('discover')}
          onDiscover={() => setScreen('discover')}
          onFaq={() => setScreen('faq')}
          onAbout={() => setScreen('about')}
        />
      </View>
    );
  }

  if (screen === 'discover') {
    return (
      <View style={styles.shell}>
        <MemberDiscoverScreen
          slug=""
          studioName="anyminutes"
          onBack={() => setScreen('landing')}
          onOpenStudio={() => setScreen('login')}
        />
      </View>
    );
  }

  if (screen === 'faq') {
    return (
      <View style={styles.shell}>
        <MemberFaqScreen
          onBack={() => setScreen('landing')}
          uiTheme={uiTheme}
        />
      </View>
    );
  }

  if (screen === 'about') {
    return (
      <View style={styles.shell}>
        <MemberAboutScreen
          onBack={() => setScreen('landing')}
          uiTheme={uiTheme}
        />
      </View>
    );
  }

  if (screen === 'login') {
    return (
      <View style={styles.shell}>
        <LoginScreen
          onBack={() => setScreen('landing')}
          onForgotPassword={() => setScreen('forgot')}
          onRegister={() => setScreen('register')}
          onSuccess={(result) => {
            void openSession(result, 'login');
          }}
        />
      </View>
    );
  }

  if (screen === 'forgot') {
    return (
      <View style={styles.shell}>
        <ForgotPasswordScreen
          onBack={() => setScreen('login')}
          onLogin={() => setScreen('login')}
        />
      </View>
    );
  }

  if (screen === 'register') {
    return (
      <View style={styles.shell}>
        <RegisterScreen
          onBack={() => setScreen('login')}
          onLogin={() => setScreen('login')}
          onSuccess={(result) => {
            void openSession(result, 'register');
          }}
        />
      </View>
    );
  }

  if (screen === 'studio') {
    return (
      <View style={styles.shell}>
        <StudioHomeScreen
          fallbackName={sessionUser?.name}
          fallbackEmail={sessionUser?.email}
          fromRegister={sessionSource === 'register'}
          onLogout={() => {
            setSessionUser(null);
            setMemberStudio(null);
            setScreen('landing');
          }}
        />
      </View>
    );
  }

  if (screen === 'member' && memberStudio?.slug) {
    return (
      <View style={styles.shell}>
        <MemberHomeScreen
          slug={memberStudio.slug}
          fallbackName={sessionUser?.name}
          fallbackEmail={sessionUser?.email}
          initialTenantName={memberStudio.tenantName}
          initialMembership={memberStudio.membership as never}
          uiTheme={uiTheme}
          onThemeChange={setUiTheme}
          onSwitchStudio={(next) => {
            setMemberStudio({
              slug: next.slug,
              tenantName: next.tenantName,
              membership: (next.membership as MemberStudio['membership']) || null,
            });
          }}
          onLogout={() => {
            setSessionUser(null);
            setMemberStudio(null);
            setScreen('landing');
          }}
        />
      </View>
    );
  }

  if (screen === 'session') {
    return (
      <View style={styles.shell}>
        <SessionSuccessScreen
          role={sessionUser?.role}
          name={sessionUser?.name}
          email={sessionUser?.email}
          source={sessionSource}
          onHome={() => setScreen('landing')}
          onContinue={() => setScreen('landing')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.shell, styles.placeholder]}>
      <Text style={styles.placeholderBrand}>anyminutes</Text>
      <Text style={styles.placeholderTitle}>Pregled</Text>
      <Text style={styles.placeholderLead}>
        Ekran pregleda stiže u sljedećem koraku. Za sada se vratite na početnu.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setScreen('landing')}
        style={({ pressed }) => [pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.placeholderLink}>← Natrag na početnu</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#060908',
  },
  boot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    paddingHorizontal: 28,
    paddingTop: 96,
  },
  placeholderBrand: {
    color: '#5EEAD4',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  placeholderTitle: {
    color: '#F4FBF8',
    fontSize: 32,
    marginBottom: 12,
  },
  placeholderLead: {
    color: 'rgba(232, 242, 239, 0.7)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
  },
  placeholderLink: {
    color: '#5EEAD4',
    fontSize: 16,
  },
});
