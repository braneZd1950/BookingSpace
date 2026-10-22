import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '@client/app/store.js';
import { registerPushServiceWorker } from '@client/push.js';
import App from './App.jsx';
import '@client/styles/global.scss';
import './mobile.scss';

if (typeof window !== 'undefined') {
  registerPushServiceWorker().catch(() => {});
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
