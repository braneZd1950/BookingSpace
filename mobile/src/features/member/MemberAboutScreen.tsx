import { StyleSheet, Text, View } from 'react-native';
import { colorsForTheme } from '../../lib/uiTheme.js';
import { ABOUT_PROMISES, ABOUT_SECTIONS } from './memberContent.js';
import MemberChrome from './memberChrome';

type MemberAboutScreenProps = {
  onBack: () => void;
  uiTheme?: string;
};

export default function MemberAboutScreen({
  onBack,
  uiTheme = 'dark',
}: MemberAboutScreenProps) {
  const colors = colorsForTheme(uiTheme);

  return (
    <MemberChrome
      onBack={onBack}
      uiTheme={uiTheme}
      title="O nama"
      lead="Jedna ideja i želja da vođenje posla bude jednostavnije."
    >
      {ABOUT_SECTIONS.map((section) => (
        <View key={section.kicker} style={styles.section}>
          <Text style={[styles.kicker, { color: colors.accent }]}>{section.kicker}</Text>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>{section.title}</Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph.slice(0, 24)} style={[styles.body, { color: colors.muted }]}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}

      <Text style={[styles.kicker, { color: colors.accent }]}>Moje obećanje vama</Text>
      <Text style={[styles.sectionTitle, { color: colors.title }]}>Što možete očekivati</Text>
      {ABOUT_PROMISES.map((item) => (
        <View
          key={item.title}
          style={[styles.promise, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Text style={[styles.promiseTitle, { color: colors.title }]}>{item.title}</Text>
          <Text style={[styles.body, { color: colors.muted }]}>{item.text}</Text>
        </View>
      ))}
    </MemberChrome>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 22 },
  kicker: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 24,
    lineHeight: 28,
    marginBottom: 10,
  },
  body: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  promise: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 10,
  },
  promiseTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    marginBottom: 6,
  },
});
