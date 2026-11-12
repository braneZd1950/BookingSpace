import { ReactNode } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientScrollShell from '../../ui/GradientScrollShell';
import AuthLegalStrip from '../auth/AuthLegalStrip';
import {
  studioChromeStyles as chrome,
  useStudioEnterAnimation,
} from './studioChrome.js';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioScreenShellProps = {
  studioName?: string;
  onBack?: () => void;
  title?: string;
  lead?: string;
  titleAccessory?: ReactNode;
  /** Replaces the default back-button top bar (e.g. Home brand + logout). */
  topBar?: ReactNode;
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
  topBar,
  children,
  keyboardShouldPersistTaps,
  hideFooter = false,
}: StudioScreenShellProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useStudioEnterAnimation();

  return (
    <GradientScrollShell
      rootStyle={chrome.root}
      flexStyle={chrome.flex}
      stageStyle={chrome.stage}
      enter={enter}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      footer={
        hideFooter ? null : (
          <View style={ui.footer}>
            <AuthLegalStrip />
          </View>
        )
      }
    >
      {topBar != null ? (
        topBar
      ) : onBack ? (
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
      ) : null}

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
            <Text
              style={[ui.title, compact && { fontSize: 34, lineHeight: 38 }]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {lead ? <Text style={chrome.lead}>{lead}</Text> : null}
          </>
        )
      ) : null}

      {children}
    </GradientScrollShell>
  );
}
