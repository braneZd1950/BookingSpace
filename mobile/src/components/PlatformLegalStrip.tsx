import { Pressable, StyleSheet, Text, View } from 'react-native';
import { openWebPath } from '../lib/openWeb';
import { font } from '../theme/fonts';
import { tokens } from '../theme/tokens';

type Props = {
  brand?: string;
  ink?: string;
  soft?: string;
  studioSlug?: string;
};

/** Compact legal bar for owner tool screens (not the SiteLive home preview). */
export function PlatformLegalStrip({
  brand = tokens.brand,
  ink = tokens.fg,
  soft = tokens.brandSoft,
  studioSlug,
}: Props) {
  const studioBase = studioSlug ? `/s/${studioSlug}` : '';

  return (
    <View style={[styles.root, { backgroundColor: soft, borderTopColor: `${brand}29` }]}>
      {studioBase ? (
        <View style={styles.row}>
          <Text style={[styles.kicker, { color: brand }]}>Studio</Text>
          <Pressable onPress={() => void openWebPath(`${studioBase}/privatnost`)}>
            <Text style={[styles.link, { color: `${ink}A3` }]}>Privatnost</Text>
          </Pressable>
          <Text style={[styles.dot, { color: `${ink}66` }]}>·</Text>
          <Pressable onPress={() => void openWebPath(`${studioBase}/uvjeti`)}>
            <Text style={[styles.link, { color: `${ink}A3` }]}>Uvjeti</Text>
          </Pressable>
          <Text style={[styles.dot, { color: `${ink}66` }]}>·</Text>
          <Pressable onPress={() => void openWebPath(`${studioBase}/kolacici`)}>
            <Text style={[styles.link, { color: `${ink}A3` }]}>Kolačići</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.row}>
        <Text style={[styles.kicker, { color: brand }]}>anyminutes</Text>
        <Pressable onPress={() => void openWebPath('/privatnost')}>
          <Text style={[styles.link, { color: `${ink}A3` }]}>Privatnost</Text>
        </Pressable>
        <Text style={[styles.dot, { color: `${ink}66` }]}>·</Text>
        <Pressable onPress={() => void openWebPath('/uvjeti')}>
          <Text style={[styles.link, { color: `${ink}A3` }]}>Uvjeti</Text>
        </Pressable>
        <Text style={[styles.dot, { color: `${ink}66` }]}>·</Text>
        <Pressable onPress={() => void openWebPath('/kolacici')}>
          <Text style={[styles.link, { color: `${ink}A3` }]}>Kolačići</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  kicker: {
    fontFamily: font.bodyExtra,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginRight: 2,
  },
  link: {
    fontFamily: font.bodySemi,
    fontSize: 12.5,
  },
  dot: {
    fontFamily: font.body,
    fontSize: 12,
  },
});
