import { ActivityIndicator, Pressable, Text } from 'react-native';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioDangerActionProps = {
  label?: string;
  accessibilityLabel: string;
  busy?: boolean;
  disabled?: boolean;
  onPress: () => void;
  spinnerColor?: string;
};

/** Shared destructive list action (ukloni člana / trenera). */
export default function StudioDangerAction({
  label = 'Uklonite',
  accessibilityLabel,
  busy = false,
  disabled = false,
  onPress,
  spinnerColor = '#FCA5A5',
}: StudioDangerActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        ui.actionBtn,
        ui.actionDanger,
        pressed && ui.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <Text style={ui.actionDangerLabel}>{label}</Text>
      )}
    </Pressable>
  );
}
