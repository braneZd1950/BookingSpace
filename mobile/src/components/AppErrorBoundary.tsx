import { Component, type ErrorInfo, type ReactNode } from 'react';
import { router } from 'expo-router';
import { ErrorScreen } from './StatusScreen';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/** Catches native render crashes — mirrors web ErrorBoundary. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('[AppErrorBoundary]', error, info.componentStack);
    }
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  private goHome = () => {
    this.setState({ hasError: false });
    try {
      router.replace('/');
    } catch {
      /* ignore */
    }
  };

  render() {
    if (this.state.hasError) {
      return <ErrorScreen onRetry={this.retry} onHome={this.goHome} />;
    }
    return this.props.children;
  }
}
