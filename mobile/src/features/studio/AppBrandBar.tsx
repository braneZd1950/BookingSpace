import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { studioUiStyles as ui } from './studioUiStyles.js';

type AppBrandBarProps = {
  onLogout: () => void;
  loggingOut?: boolean;
};

/** Brand + logout control used on studio (and similar) home tops. */
export default function AppBrandBar({ onLogout, loggingOut = false }: AppBrandBarProps) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.brand}>anyminutes</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Odjava"
        onPress={onLogout}
        disabled={loggingOut}
        hitSlop={10}
        style={({ pressed }) => [styles.logoutBtn, pressed && ui.pressed]}
      >
        {loggingOut ? (
          <ActivityIndicator color="#5EEAD4" size="small" />
        ) : (
          <Ionicons name="power-outline" size={22} color="#5EEAD4" />
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
    marginBottom: 22,
  },
  brand: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: '#F7FCFA',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
