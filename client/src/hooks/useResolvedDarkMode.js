import { useEffect, useState } from 'react';
import { isResolvedDarkMode } from '../lib/uiTheme.js';

/** Re-renders when <html data-theme> or OS color-scheme changes. */
export default function useResolvedDarkMode() {
  const [dark, setDark] = useState(() => isResolvedDarkMode());

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setDark(isResolvedDarkMode());
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    mq.addEventListener('change', sync);
    window.addEventListener('ui-theme-changed', sync);
    sync();
    return () => {
      obs.disconnect();
      mq.removeEventListener('change', sync);
      window.removeEventListener('ui-theme-changed', sync);
    };
  }, []);

  return dark;
}
