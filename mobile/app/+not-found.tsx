import { router } from 'expo-router';
import { NotFoundScreen } from '../src/components/StatusScreen';

export default function NotFoundRoute() {
  return (
    <NotFoundScreen
      onHome={() => {
        try {
          router.replace('/');
        } catch {
          /* ignore */
        }
      }}
    />
  );
}
