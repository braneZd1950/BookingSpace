import { ReactNode } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  APP_GRADIENT,
  APP_GRADIENT_LOCATIONS,
  enterStyle,
} from '../lib/appShell.js';

type GradientScrollShellProps = {
  rootStyle: StyleProp<ViewStyle>;
  flexStyle: StyleProp<ViewStyle>;
  stageStyle: StyleProp<ViewStyle>;
  enter: Animated.Value;
  children: ReactNode;
  footer?: ReactNode;
  keyboardAvoiding?: boolean;
  keyboardShouldPersistTaps?: 'handled' | 'always' | 'never';
  paddingTop?: number;
  paddingBottom?: number;
  contentMinHeight?: boolean;
};

/**
 * Shared gradient + scroll frame for studio and auth shells.
 */
export default function GradientScrollShell({
  rootStyle,
  flexStyle,
  stageStyle,
  enter,
  children,
  footer,
  keyboardAvoiding = false,
  keyboardShouldPersistTaps,
  paddingTop,
  paddingBottom,
  contentMinHeight = true,
}: GradientScrollShellProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const top = paddingTop ?? (compact ? 48 : 64);
  const bottom = paddingBottom ?? (compact ? 28 : 40);

  const scroll = (
    <ScrollView
      style={flexStyle}
      contentContainerStyle={[
        stageStyle,
        {
          paddingTop: top,
          paddingBottom: bottom,
          ...(contentMinHeight ? { minHeight: height } : null),
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      bounces={false}
    >
      <Animated.View style={enterStyle(enter)}>{children}</Animated.View>
      {footer}
    </ScrollView>
  );

  return (
    <View style={rootStyle}>
      <StatusBar style="light" />
      <LinearGradient
        colors={APP_GRADIENT as [string, string, ...string[]]}
        locations={APP_GRADIENT_LOCATIONS as [number, number, ...number[]]}
        style={StyleSheet.absoluteFill}
      />
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={flexStyle}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {scroll}
        </KeyboardAvoidingView>
      ) : (
        scroll
      )}
    </View>
  );
}
