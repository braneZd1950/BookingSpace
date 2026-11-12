import { ActivityIndicator, Pressable, Text } from 'react-native';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioFormSubmitProps = {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void | Promise<void>;
  saving?: boolean;
  error?: string;
};

export default function StudioFormSubmit({
  label,
  accessibilityLabel,
  onPress,
  saving = false,
  error,
}: StudioFormSubmitProps) {
  return (
    <>
      {error ? <Text style={ui.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        onPress={() => {
          void onPress();
        }}
        disabled={saving}
        style={({ pressed }) => [
          ui.primaryBtn,
          pressed && ui.pressed,
          saving && ui.disabled,
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#061210" size="small" />
        ) : (
          <Text style={ui.primaryLabel}>{label}</Text>
        )}
      </Pressable>
    </>
  );
}
