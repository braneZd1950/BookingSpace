import './instrument.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store.js';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { armAppInstallListener } from './lib/appInstall.js';
import { registerPushServiceWorker } from './lib/push.js';
import { applyPublicLightTheme } from './lib/uiTheme.js';
import App from './app/App.jsx';
import './styles/global.scss';

/* Public chrome by default; ThemeSync switches to the account theme after login. */
applyPublicLightTheme();
armAppInstallListener();
void registerPushServiceWorker().catch(() => {});

createRoot(document.getElementById('root'), {
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    if (import.meta.env.DEV) {
      console.error('[Uncaught]', error, errorInfo?.componentStack);
    }
  }),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
