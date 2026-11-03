import { ActivityIndicator, View } from 'react-native';
import { AuthRedirect } from '../src/components/AuthRedirect';
import HomeLanding from '../src/components/HomeLanding';
import { useAuth } from '../src/features/auth/AuthContext';
import { tokens } from '../src/theme/tokens';

/**
 * Public entry: marketing landing (web HomePage parity) when logged out;
 * role-aware shell when logged in.
 */
export default function Index() {
  const { ready, token } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg }}>
        <ActivityIndicator color={tokens.brand} size="large" />
      </View>
    );
  }

  if (token) {
    return <AuthRedirect mode="root" />;
  }

  return <HomeLanding />;
}
