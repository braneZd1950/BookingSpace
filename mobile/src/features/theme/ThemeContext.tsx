import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { updateMe } from '../../api/auth';
import {
  normalizeUiTheme,
  readStoredUiTheme,
  storeUiTheme,
  type UiTheme,
} from '../../lib/uiTheme';
import {
  paletteForScheme,
  resolveColorScheme,
  type AppPalette,
} from '../../theme/palette';

type ThemeContextValue = {
  uiTheme: UiTheme;
  scheme: 'light' | 'dark';
  colors: AppPalette;
  setUiTheme: (theme: UiTheme) => Promise<void>;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, token, setUser } = useAuth();
  const [uiTheme, setUiThemeState] = useState<UiTheme>('system');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(() => (
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  ));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await readStoredUiTheme();
      if (!cancelled) {
        setUiThemeState(stored);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.uiTheme) return;
    const next = normalizeUiTheme(user.uiTheme);
    setUiThemeState(next);
    void storeUiTheme(next);
  }, [user?.uiTheme]);

  const setUiTheme = useCallback(async (theme: UiTheme) => {
    const next = normalizeUiTheme(theme);
    setUiThemeState(next);
    await storeUiTheme(next);
    if (!token) return;
    try {
      const result = await updateMe({ uiTheme: next });
      setUser?.(result.user);
    } catch {
      /* local preference still applied */
    }
  }, [token, setUser]);

  const scheme = resolveColorScheme(uiTheme, systemScheme);
  const colors = paletteForScheme(scheme);

  const value = useMemo(
    () => ({ uiTheme, scheme, colors, setUiTheme, ready }),
    [uiTheme, scheme, colors, setUiTheme, ready],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
