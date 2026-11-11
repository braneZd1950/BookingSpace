import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
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
import { MEMBER_FAQS } from './memberContent.js';

type MemberFaqScreenProps = {
  onBack: () => void;
  uiTheme?: string;
};

type ThemeColors = ReturnType<typeof colorsForTheme>;

type FaqItemProps = {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
  colors: ThemeColors;
};

function FaqItem({ question, answer, open, onToggle, colors }: FaqItemProps) {
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 320,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [open, progress]);

  function onAnswerLayout(event: LayoutChangeEvent) {
    const next = Math.ceil(event.nativeEvent.layout.height);
    if (next > 0 && next !== contentHeight) setContentHeight(next);
  }

  const bodyHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(contentHeight, 1)],
  });
  const bodyOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
  });
  const bodyShift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });
  const chevronRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const borderAccent = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.cardBorder || colors.accent],
  });

  return (
    <Animated.View
      style={[
        styles.item,
        {
          backgroundColor: colors.card,
          borderColor: borderAccent,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={({ pressed }) => [styles.itemPress, pressed && styles.pressed]}
      >
        <View style={styles.itemHead}>
          <Text style={[styles.question, { color: colors.title }]}>{question}</Text>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons name="chevron-down" size={16} color={colors.accent} />
          </Animated.View>
        </View>
      </Pressable>

      {/* Hidden measurer keeps accurate open height for long answers */}
      <View style={styles.measure} pointerEvents="none" onLayout={onAnswerLayout}>
        <Text style={[styles.answer, { color: colors.muted }]}>{answer}</Text>
      </View>

      <Animated.View
        style={{
          height: bodyHeight,
          opacity: bodyOpacity,
          overflow: 'hidden',
          transform: [{ translateY: bodyShift }],
        }}
      >
        <Text style={[styles.answer, { color: colors.muted }]}>{answer}</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function MemberFaqScreen({
  onBack,
  uiTheme = 'dark',
}: MemberFaqScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const colors = colorsForTheme(uiTheme);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
        <Text style={[styles.title, { color: colors.title }]}>Česta pitanja</Text>
        <Text style={[styles.lead, { color: colors.muted }]}>
          Kratki odgovori o rezervacijama, stranici studija i platformi.
        </Text>

        {MEMBER_FAQS.map((item, index) => {
          const open = openIndex === index;
          return (
            <FaqItem
              key={item.q}
              question={item.q}
              answer={item.a}
              open={open}
              colors={colors}
              onToggle={() => setOpenIndex(open ? null : index)}
            />
          );
        })}
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
    marginBottom: 18,
  },
  item: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  itemPress: {
    marginHorizontal: -2,
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  question: {
    flex: 1,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
  answer: {
    marginTop: 10,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  measure: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 0,
    opacity: 0,
    zIndex: -1,
  },
  pressed: { opacity: 0.86 },
});
