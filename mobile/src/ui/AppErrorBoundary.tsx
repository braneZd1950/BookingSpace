import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Native production builds hide redboxes — show a recoverable screen instead. */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('[AppErrorBoundary]', error, info?.componentStack);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.shell}>
        <Text style={styles.title}>Aplikacija se nije učitala</Text>
        <Text style={styles.lead}>
          {this.state.error.message || 'Nepoznata greška pri pokretanju.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => this.setState({ error: null })}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.btnLabel}>Pokušajte ponovno</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#060908',
    paddingHorizontal: 28,
    paddingTop: 96,
  },
  title: {
    color: '#F7FCFA',
    fontSize: 28,
    marginBottom: 12,
  },
  lead: {
    color: 'rgba(232, 242, 239, 0.7)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: '#5EEAD4',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  btnLabel: {
    color: '#061210',
    fontSize: 15,
    fontWeight: '600',
  },
});
