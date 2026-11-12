import { ReactNode } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AuthLegalStrip from './AuthLegalStrip';
import {
  AUTH_GRADIENT,
  AUTH_GRADIENT_LOCATIONS,
  authChromeStyles as chrome,
  authEnterStyle,
  useAuthEnterAnimation,
} from './authChrome.js';

type AuthFormShellProps = {
  backLabel: string;
  onBack?: () => void;
  title: string;
  lead: string;
  children: ReactNode;
  compactTitleSize?: number;
};

/**
 * Shared auth screen frame used by Login / Forgot / related flows.
 */
export default function AuthFormShell({
  backLabel,
  onBack,
  title,
  lead,
  children,
  compactTitleSize = 34,
}: AuthFormShellProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useAuthEnterAnimation();

  return (
    <View style={chrome.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={AUTH_GRADIENT as [string, string, ...string[]]}
        locations={AUTH_GRADIENT_LOCATIONS as [number, number, ...number[]]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={chrome.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={chrome.flex}
          contentContainerStyle={[
            chrome.stage,
            {
              paddingTop: compact ? 44 : 56,
              paddingBottom: compact ? 28 : 40,
              minHeight: height,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={authEnterStyle(enter)}>
            {onBack ? (
              <Pressable
                accessibilityRole="button"
                onPress={onBack}
                style={({ pressed }) => [chrome.backBtn, pressed && chrome.pressed]}
              >
                <Text style={chrome.backLabel}>{backLabel}</Text>
              </Pressable>
            ) : null}
            <Text style={chrome.brand}>anyminutes</Text>
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
          </Animated.View>

          <Animated.View
            style={[chrome.form, { opacity: enter, marginTop: compact ? 28 : 36 }]}
          >
            {children}
          </Animated.View>

          <View style={chrome.footer}>
            <AuthLegalStrip />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
