import '../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '../src/components/AppErrorBoundary';
import { MaintenanceScreen } from '../src/components/StatusScreen';
import { env } from '../src/config/env';
import { AuthProvider } from '../src/features/auth/AuthContext';
import { ThemeProvider, useTheme } from '../src/features/theme/ThemeContext';
import { appFonts } from '../src/theme/fonts';
import { paperTheme } from '../src/theme/paperTheme';
import { tokens } from '../src/theme/tokens';

function ThemedApp() {
  const { scheme, colors } = useTheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsReady] = useFonts(appFonts);

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg }}>
        <ActivityIndicator color={tokens.brand} size="large" />
      </View>
    );
  }

  // Mirror web `VITE_MAINTENANCE=true` — whole app gated until rebuild with flag off.
  if (env.maintenance) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <MaintenanceScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <AppErrorBoundary>
            <AuthProvider>
              <ThemeProvider>
                <ThemedApp />
              </ThemeProvider>
            </AuthProvider>
          </AppErrorBoundary>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
