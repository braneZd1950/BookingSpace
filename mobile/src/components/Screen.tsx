import { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Atmosphere } from './Atmosphere';
import { ui } from '../ui/styles';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  withAtmosphere?: boolean;
  /** When nested under StudioNav shell, skip top inset */
  embedInShell?: boolean;
};

export function Screen({
  children,
  scroll = true,
  withAtmosphere = true,
  embedInShell = false,
}: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={ui.screenBody}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[ui.screenBody, { flex: 1 }]}>{children}</View>
  );

  const content = (
    <>
      {withAtmosphere ? <Atmosphere /> : null}
      <View style={{ flex: 1, zIndex: 1 }}>{body}</View>
    </>
  );

  if (embedInShell) {
    return (
      <View style={[ui.screenRoot, withAtmosphere ? { backgroundColor: '#e8f1f0' } : null]}>
        {content}
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[ui.screenRoot, withAtmosphere ? { backgroundColor: '#e8f1f0' } : null]}
      edges={['top', 'left', 'right']}
    >
      {content}
    </SafeAreaView>
  );
}
