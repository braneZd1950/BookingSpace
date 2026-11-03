import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { tokens } from '../theme/tokens';
import { ui } from '../ui/styles';

type Props = PressableProps & {
  label: string;
  loading?: boolean;
};

export function PrimaryButton({ label, loading, disabled, ...rest }: Props) {
  const idle = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={idle}
      style={[ui.primaryBtn, idle ? { opacity: 0.7 } : null]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={tokens.onBrand} />
      ) : (
        <Text style={ui.primaryBtnLabel}>{label}</Text>
      )}
    </Pressable>
  );
}
