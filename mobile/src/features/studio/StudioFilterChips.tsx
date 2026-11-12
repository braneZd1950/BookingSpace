import { Pressable, Text, View } from 'react-native';
import { studioUiStyles as ui } from './studioUiStyles.js';

type Chip<T extends string> = {
  id: T;
  label: string;
};

type StudioFilterChipsProps<T extends string> = {
  items: Chip<T>[];
  selected: T;
  onSelect: (id: T) => void;
};

/** Horizontal filter / segment chip row for studio lists. */
export default function StudioFilterChips<T extends string>({
  items,
  selected,
  onSelect,
}: StudioFilterChipsProps<T>) {
  return (
    <View style={ui.filterRow}>
      {items.map((item) => {
        const on = selected === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onSelect(item.id)}
            style={({ pressed }) => [
              ui.filterChip,
              on && ui.filterChipOn,
              pressed && ui.pressed,
            ]}
          >
            <Text style={[ui.filterLabel, on && ui.filterLabelOn]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
