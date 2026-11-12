import { ReactNode } from 'react';
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

type MemberChromeProps = {
  onBack: () => void;
  backLabel?: string;
  kicker?: string;
  title: string;
  lead?: string;
  uiTheme?: string;
  children: ReactNode;
  contentStyle?: object;
};

/**
 * Shared member sub-screen shell: gradient, back row, kicker/title/lead.
 */
export default function MemberChrome({
  onBack,
  backLabel = 'Početna',
  kicker = 'anyminutes',
  title,
  lead,
  uiTheme = 'dark',
  children,
  contentStyle,
}: MemberChromeProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const colors = colorsForTheme(uiTheme);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={colors.status as 'light' | 'dark'} />
      <LinearGradient
        colors={colors.gradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: compact ? 44 : 56, paddingBottom: 36 },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.accent} />
          <Text style={[styles.backLabel, { color: colors.accent }]}>{backLabel}</Text>
        </Pressable>

        <Text style={[styles.studio, { color: colors.accent }]}>{kicker}</Text>
        <Text style={[styles.title, { color: colors.title }]}>{title}</Text>
        {lead ? (
          <Text style={[styles.lead, { color: colors.muted }]}>{lead}</Text>
        ) : null}

        {children}
      </ScrollView>
    </View>
  );
}

export const memberChromeStyles = StyleSheet.create({
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
  pressed: { opacity: 0.86 },
});

const styles = memberChromeStyles;
