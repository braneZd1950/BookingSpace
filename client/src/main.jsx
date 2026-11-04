import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store.js';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { registerPushServiceWorker } from './lib/push.js';
import { applyPublicLightTheme } from './lib/uiTheme.js';
import App from './app/App.jsx';
import './styles/global.scss';

/* Public chrome by default; ThemeSync switches to the account theme after login. */
applyPublicLightTheme();
registerPushServiceWorker().catch(() => {});

createRoot(document.getElementById('root')).render(
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
