import { ReactNode } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AuthLegalStrip from '../auth/AuthLegalStrip';
import {
  STUDIO_GRADIENT,
  STUDIO_GRADIENT_LOCATIONS,
  studioChromeStyles as chrome,
  studioEnterStyle,
  useStudioEnterAnimation,
} from './studioChrome.js';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioScreenShellProps = {
  studioName?: string;
  onBack: () => void;
  title?: string;
  lead?: string;
  titleAccessory?: ReactNode;
  children: ReactNode;
  keyboardShouldPersistTaps?: 'handled' | 'always' | 'never';
  hideFooter?: boolean;
};

/**
 * Shared owner-studio screen frame: gradient, enter anim, back bar, optional title, footer.
 */
export default function StudioScreenShell({
  studioName,
  onBack,
  title,
  lead,
  titleAccessory,
  children,
  keyboardShouldPersistTaps,
  hideFooter = false,
}: StudioScreenShellProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useStudioEnterAnimation();

  return (
    <View style={chrome.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={STUDIO_GRADIENT as [string, string, ...string[]]}
        locations={STUDIO_GRADIENT_LOCATIONS as [number, number, ...number[]]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={chrome.flex}
        contentContainerStyle={[
          chrome.stage,
          {
            paddingTop: compact ? 48 : 64,
            paddingBottom: compact ? 28 : 40,
            minHeight: height,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        bounces={false}
      >
        <Animated.View style={studioEnterStyle(enter)}>
          <View style={chrome.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Natrag na ${studioName || 'studio'}`}
              onPress={onBack}
              hitSlop={10}
              style={({ pressed }) => [chrome.backBtn, pressed && ui.pressed]}
            >
              <Ionicons name="chevron-back" size={22} color="#5EEAD4" />
              <Text style={chrome.backLabel} numberOfLines={1}>
                {studioName || 'Moj studio'}
              </Text>
            </Pressable>
          </View>

          {title ? (
            titleAccessory ? (
              <View style={ui.titleRow}>
                <View style={ui.titleCopy}>
                  <Text style={[ui.title, compact && { fontSize: 34, lineHeight: 38 }]}>
                    {title}
                  </Text>
                  {lead ? <Text style={ui.leadTight}>{lead}</Text> : null}
                </View>
                {titleAccessory}
              </View>
            ) : (
              <>
                <Text style={[ui.title, compact && { fontSize: 34, lineHeight: 38 }]}>
                  {title}
                </Text>
                {lead ? <Text style={chrome.lead}>{lead}</Text> : null}
              </>
            )
          ) : null}

          {children}
        </Animated.View>

        {!hideFooter ? (
          <View style={ui.footer}>
            <AuthLegalStrip />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
