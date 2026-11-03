import { MD3LightTheme, configureFonts, type MD3Theme } from 'react-native-paper';
import { space, tokens } from './tokens';

const fonts = configureFonts({
  config: {
    fontFamily: 'Figtree_500Medium',
  },
});

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts,
  roundness: space.radius,
  colors: {
    ...MD3LightTheme.colors,
    primary: tokens.brand,
    onPrimary: tokens.onBrand,
    primaryContainer: tokens.brandSoft,
    onPrimaryContainer: tokens.fg,
    secondary: tokens.accent,
    onSecondary: tokens.onAccent,
    secondaryContainer: tokens.lowSoft,
    onSecondaryContainer: tokens.lowInk,
    background: tokens.bg,
    onBackground: tokens.fg,
    surface: tokens.surface,
    onSurface: tokens.fg,
    surfaceVariant: tokens.brandSoft,
    onSurfaceVariant: tokens.muted,
    outline: tokens.line,
    error: tokens.full,
    onError: tokens.onBrand,
    errorContainer: tokens.fullSoft,
    onErrorContainer: tokens.fullInk,
  },
};
