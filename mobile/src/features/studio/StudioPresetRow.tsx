import { Pressable, Text, View } from 'react-native';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioPresetRowProps = {
  label: string;
  values: readonly number[];
  selected: string;
  onSelect: (value: string) => void;
  formatValue?: (value: number) => string;
  disabled?: boolean;
};

export default function StudioPresetRow({
  label,
  values,
  selected,
  onSelect,
  formatValue = (value) => String(value),
  disabled = false,
}: StudioPresetRowProps) {
  return (
    <>
      <Text style={ui.fieldLabel}>{label}</Text>
      <View style={ui.presetRow}>
        {values.map((value) => {
          const on = selected === String(value);
          return (
            <Pressable
              key={value}
              disabled={disabled}
              onPress={() => onSelect(String(value))}
              style={({ pressed }) => [
                ui.preset,
                on && ui.presetOn,
                pressed && ui.pressed,
              ]}
            >
              <Text style={[ui.presetLabel, on && ui.presetLabelOn]}>
                {formatValue(value)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}
