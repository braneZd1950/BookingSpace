import { Image, ImageStyle, StyleProp, StyleSheet } from 'react-native';

type BrandWordmarkProps = {
  /** light = white ink for dark backgrounds; dark = navy ink for light backgrounds */
  tone?: 'light' | 'dark';
  style?: StyleProp<ImageStyle>;
  height?: number;
};

const SOURCES = {
  light: require('../../assets/blizari-wordmark-on-dark.png'),
  dark: require('../../assets/blizari-wordmark.png'),
};

/**
 * Same Blizari wordmark lockup as the web BrandWordmark / browser chrome.
 */
export default function BrandWordmark({
  tone = 'light',
  style,
  height = 36,
}: BrandWordmarkProps) {
  const width = Math.round(height * 4.2);
  return (
    <Image
      source={SOURCES[tone]}
      accessibilityLabel="Blizari"
      resizeMode="contain"
      style={[styles.mark, { width, height }, style]}
    />
  );
}

const styles = StyleSheet.create({
  mark: {
    alignSelf: 'flex-start',
  },
});
