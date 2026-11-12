import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioEntityRowProps = {
  name: string;
  initialFallback?: string;
  badge: string;
  badgeOk?: boolean;
  muted?: boolean;
  meta: string;
  extra?: ReactNode;
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Avatar + title/badge + meta + optional extras/actions for members/team lists. */
export default function StudioEntityRow({
  name,
  initialFallback = '·',
  badge,
  badgeOk = true,
  muted = false,
  meta,
  extra,
  actions,
  style,
}: StudioEntityRowProps) {
  const initial = name.trim().slice(0, 1).toUpperCase() || initialFallback;
  return (
    <View style={[ui.row, muted && ui.rowMuted, style]}>
      <View style={ui.avatar}>
        <Text style={ui.avatarText}>{initial}</Text>
      </View>
      <View style={ui.rowCopy}>
        <View style={ui.rowTitle}>
          <Text style={ui.rowName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[ui.badge, badgeOk ? ui.badgeOk : ui.badgeMuted]}>
            {badge}
          </Text>
        </View>
        <Text style={ui.rowMeta} numberOfLines={2}>
          {meta}
        </Text>
        {extra}
        {actions ? <View style={ui.actions}>{actions}</View> : null}
      </View>
    </View>
  );
}

export const entityRowStyles = StyleSheet.create({
  rowPlan: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.72)',
  },
  barTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(232, 242, 239, 0.1)',
    overflow: 'hidden',
    marginTop: 2,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(94, 234, 212, 0.75)',
  },
  barHot: {
    backgroundColor: 'rgba(251, 191, 36, 0.85)',
  },
  expiry: {
    color: 'rgba(232, 242, 239, 0.48)',
  },
  expirySoon: {
    color: 'rgba(251, 191, 36, 0.95)',
  },
  teamNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.45)',
    paddingVertical: 6,
  },
});
