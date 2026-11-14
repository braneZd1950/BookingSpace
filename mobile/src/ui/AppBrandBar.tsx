import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LiveClockMark from './LiveClockMark';

type AppBrandBarProps = {
  onLogout: () => void;
  loggingOut?: boolean;
  accentColor?: string;
  brandColor?: string;
  marginBottom?: number;
};

/** Brand + live clock logo + logout control for studio / member home tops. */
export default function AppBrandBar({
  onLogout,
  loggingOut = false,
  accentColor = '#5EEAD4',
  brandColor = '#F7FCFA',
  marginBottom = 22,
}: AppBrandBarProps) {
  return (
    <View style={[styles.topBar, { marginBottom }]}>
      <View style={styles.brandRow}>
        <LiveClockMark size={30} accentColor={accentColor} />
        <Text style={[styles.brand, { color: brandColor }]}>anyminutes</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Odjava"
        onPress={onLogout}
        disabled={loggingOut}
        hitSlop={10}
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
      >
        {loggingOut ? (
          <ActivityIndicator color={accentColor} size="small" />
        ) : (
          <Ionicons name="power-outline" size={22} color={accentColor} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  brand: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.72 },
});
