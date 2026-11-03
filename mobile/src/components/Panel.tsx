import { type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { ui } from '../ui/styles';

type PanelProps = {
  children: ReactNode;
  /** login form strip (border-top only) vs app board card */
  variant?: 'board' | 'login';
  style?: ViewStyle;
};

export function Panel({ children, variant = 'board', style }: PanelProps) {
  return (
    <View style={[variant === 'login' ? ui.loginPanel : ui.panel, style]}>
      {children}
    </View>
  );
}
