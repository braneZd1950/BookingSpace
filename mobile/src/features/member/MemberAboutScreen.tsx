import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colorsForTheme } from '../../lib/uiTheme.js';
import { ABOUT_PROMISES, ABOUT_SECTIONS } from './memberContent.js';

type MemberAboutScreenProps = {
  onBack: () => void;
  uiTheme?: string;
};

export default function MemberAboutScreen({
  onBack,
  uiTheme = 'dark',
}: MemberAboutScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const colors = colorsForTheme(uiTheme);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={colors.status as 'light' | 'dark'} />
      <LinearGradient colors={colors.gradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: compact ? 44 : 56, paddingBottom: 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.accent} />
          <Text style={[styles.backLabel, { color: colors.accent }]}>Početna</Text>
        </Pressable>

        <Text style={[styles.studio, { color: colors.accent }]}>anyminutes</Text>
        <Text style={[styles.title, { color: colors.title }]}>O nama</Text>
        <Text style={[styles.lead, { color: colors.muted }]}>
          Jedna ideja i želja da vođenje posla bude jednostavnije.
        </Text>

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
  },
  studio: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    marginBottom: 6,
  },
  title: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 36,
    lineHeight: 40,
    marginBottom: 8,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
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
  pressed: { opacity: 0.86 },
});
