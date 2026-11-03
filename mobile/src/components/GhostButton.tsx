import { Pressable, Text, type PressableProps } from 'react-native';
import { ui } from '../ui/styles';

type Props = PressableProps & { label: string };

export function GhostButton({ label, disabled, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[ui.ghostBtn, disabled ? { opacity: 0.7 } : null]}
      {...rest}
    >
      <Text style={ui.ghostBtnLabel}>{label}</Text>
    </Pressable>
  );
}
