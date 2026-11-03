import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/features/auth/AuthContext';
import { isOwnerRole } from '../../src/features/auth/resolveHomeHref';

/** Member shell — customers only; owners go to studio tools. */
export default function MemberGroupLayout() {
  const { ready, token, user } = useAuth();

  if (ready && !token) {
    return <Redirect href="/(auth)/login" />;
  }

  if (ready && token && isOwnerRole(user)) {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
