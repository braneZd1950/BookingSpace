import { ReactNode } from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import GradientScrollShell from '../../ui/GradientScrollShell';
import LiveClockMark from '../../ui/LiveClockMark';
import AuthLegalStrip from './AuthLegalStrip';
import {
  authChromeStyles as chrome,
  useAuthEnterAnimation,
} from './authChrome.js';

type AuthFormShellProps = {
  backLabel: string;
  onBack?: () => void;
  title: string;
  lead: string;
  children: ReactNode;
  compactTitleSize?: number;
  /** Override default enter animation (e.g. Register intent reset). */
  enter?: Animated.Value;
  stagePaddingTop?: number;
  stagePaddingBottom?: number;
  formMarginTop?: number;
};

/**
 * Shared auth screen frame used by Login / Forgot / Register.
 */
export default function AuthFormShell({
  backLabel,
  onBack,
  title,
  lead,
  children,
  compactTitleSize = 34,
  enter: enterProp,
  stagePaddingTop,
  stagePaddingBottom,
  formMarginTop,
}: AuthFormShellProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enterDefault = useAuthEnterAnimation();
  const enter = enterProp || enterDefault;
  const marginTop = formMarginTop ?? (compact ? 28 : 36);

  return (
    <GradientScrollShell
      rootStyle={chrome.root}
      flexStyle={chrome.flex}
      stageStyle={chrome.stage}
      enter={enter}
      keyboardAvoiding
      keyboardShouldPersistTaps="handled"
      paddingTop={stagePaddingTop ?? (compact ? 44 : 56)}
      paddingBottom={stagePaddingBottom ?? (compact ? 28 : 40)}
      footer={
        <View style={chrome.footer}>
          <AuthLegalStrip />
        </View>
      }
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [chrome.backBtn, pressed && chrome.pressed]}
        >
          <Text style={chrome.backLabel}>{backLabel}</Text>
        </Pressable>
      ) : null}
      <View style={chrome.brandRow}>
        <LiveClockMark size={28} />
        <Text style={chrome.brand}>anyminutes</Text>
      </View>
      <Text
        style={[
          chrome.title,
          compact && {
            fontSize: compactTitleSize,
            lineHeight: compactTitleSize + 4,
          },
        ]}
      >
        {title}
      </Text>
      <Text style={chrome.lead}>{lead}</Text>

      <Animated.View style={[chrome.form, { opacity: enter, marginTop }]}>
        {children}
      </Animated.View>
    </GradientScrollShell>
  );
}
