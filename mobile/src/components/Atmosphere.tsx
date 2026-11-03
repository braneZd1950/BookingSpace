import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../theme/tokens';

const none = 'none' as const;

/** Shared atmosphere — must never capture mouse/touch on web */
export function Atmosphere() {
  return (
    <View
      pointerEvents={none}
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 0 },
        Platform.OS === 'web' ? styles.webNone : null,
      ]}
    >
      <LinearGradient
        colors={['#d7e8e6', tokens.loginMist, '#f7faf9']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents={none}
        style={[StyleSheet.absoluteFill, Platform.OS === 'web' ? styles.webNone : null]}
      />
      <View pointerEvents={none} style={styles.orbA} />
      <View pointerEvents={none} style={styles.orbB} />
      <LinearGradient
        colors={['rgba(14,107,115,0.16)', 'transparent', 'rgba(242,163,58,0.10)']}
        pointerEvents={none}
        style={[styles.shaft, Platform.OS === 'web' ? styles.webNone : null]}
      />
      <View pointerEvents={none} style={styles.grain} />
    </View>
  );
}

const styles = StyleSheet.create({
  webNone: {
    pointerEvents: 'none',
  },
  orbA: {
    position: 'absolute',
    top: -96,
    right: -64,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(242, 163, 58, 0.22)',
  },
  orbB: {
    position: 'absolute',
    bottom: -110,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 999,
    backgroundColor: 'rgba(14, 107, 115, 0.18)',
  },
  shaft: {
    position: 'absolute',
    top: '-10%',
    left: '18%',
    width: 90,
    height: '120%',
    transform: [{ skewX: '-12deg' }],
    opacity: 0.85,
  },
  grain: {
    ...StyleSheet.absoluteFill,
    opacity: 0.35,
    backgroundColor: 'transparent',
  },
});
