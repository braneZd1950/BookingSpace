import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioEmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  extra?: ReactNode;
};

export default function StudioEmptyState({
  icon = 'list-outline',
  title,
  body,
  actionLabel,
  onAction,
  extra,
}: StudioEmptyStateProps) {
  return (
    <View style={ui.empty}>
      <View style={ui.emptyIcon}>
        <Ionicons name={icon} size={22} color="#5EEAD4" />
      </View>
      <Text style={ui.emptyTitle}>{title}</Text>
      <Text style={ui.emptyBody}>{body}</Text>
      {extra}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [ui.primaryBtn, pressed && ui.pressed]}
        >
          <Text style={ui.primaryLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
