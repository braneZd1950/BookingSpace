import { Image, StyleSheet, View } from 'react-native';

type BrandMarkProps = {
  size?: number;
};

/**
 * Compact Blizari “B” mark for chrome bars (app icon lockup).
 */
export default function BrandMark({ size = 28 }: BrandMarkProps) {
  return (
    <View
      style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.28 }]}
      accessibilityRole="image"
      accessibilityLabel="Blizari"
    >
      <Image
        source={require('../../assets/blizari-mark.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
