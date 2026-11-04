export const UI_THEME_KEY = 'bookingspace.uiTheme';
export const UI_THEMES = ['system', 'light', 'dark'];

export function normalizeUiTheme(value) {
  return UI_THEMES.includes(value) ? value : 'system';
}

export function readStoredUiTheme() {
  try {
    return normalizeUiTheme(localStorage.getItem(UI_THEME_KEY));
  } catch {
    return 'system';
  }
}

export function storeUiTheme(theme) {
  const next = normalizeUiTheme(theme);
  try {
    localStorage.setItem(UI_THEME_KEY, next);
  } catch {
    /* ignore quota / private mode */
  }
  return next;
}

/**
 * App shells where the signed-in user's theme may apply.
 * Marketing / auth / legal public pages stay light always.
 */
export function pathAllowsUserTheme(pathname = '') {
  const path = String(pathname || '');
  return path.startsWith('/stranica')
    || path.startsWith('/s/')
    || path.startsWith('/admin')
    || path.startsWith('/analitika')
    || path.startsWith('/postavljanje');
}

export function shouldApplyUserTheme(pathname, token) {
  return Boolean(token) && pathAllowsUserTheme(pathname);
}

function emitUiThemeChanged(theme) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ui-theme-changed', { detail: theme }));
  }
}

/** Apply theme to <html data-theme>. `system` removes the attribute. Does not write localStorage. */
export function applyUiTheme(theme) {
  const next = normalizeUiTheme(theme);
  const root = document.documentElement;
  if (next === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', next);
  }
  emitUiThemeChanged(next);
  return next;
}

/** Persist preference and apply it (for signed-in settings). */
export function syncUiTheme(theme) {
  const next = storeUiTheme(theme);
  return applyUiTheme(next);
}

/** Re-apply the last saved theme (never clears the preference). */
export function restoreStoredUiTheme() {
  return applyUiTheme(readStoredUiTheme());
}

/** Public surfaces: force light chrome without erasing the saved preference. */
export function applyPublicLightTheme() {
  return applyUiTheme('light');
}

/** True when the effective UI is dark (explicit dark or system + OS dark). */
export function isResolvedDarkMode() {
  if (typeof document === 'undefined') return false;
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') return true;
  if (attr === 'light') return false;
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Studio/member CSS variables from a palette theme.
 * In dark mode, ink/canvas follow global tokens so body text stays readable
 * (inline palette ink is dark-on-light and would otherwise win over CSS).
 */
export function paletteSurfaceVars(theme, { dark = isResolvedDarkMode() } = {}) {
  if (!theme) return {};
  if (dark) {
    return {
      '--site-brand': theme.primaryColor,
      '--site-on': '#ffffff',
      '--site-soft': `color-mix(in srgb, ${theme.primaryColor} 26%, var(--surface))`,
      '--site-ink': 'var(--fg)',
      '--site-canvas': 'var(--bg)',
      '--site-radius': theme.borderRadius,
      '--brand': theme.primaryColor,
      '--on-brand': '#ffffff',
      '--brand-soft': `color-mix(in srgb, ${theme.primaryColor} 26%, var(--surface))`,
      /* Light accent for labels/controls on dark chrome (primary is often dark navy). */
      '--brand-strong': `color-mix(in srgb, ${theme.primaryColor} 42%, #ffffff)`,
      '--member-ink': 'var(--fg)',
      '--member-canvas': 'var(--bg)',
      fontFamily: theme.fontFamily,
    };
  }
  return {
    '--site-brand': theme.primaryColor,
    '--site-on': theme.onPrimary,
    '--site-soft': theme.secondaryColor,
    '--site-ink': theme.ink,
    '--site-canvas': theme.canvas,
    '--site-radius': theme.borderRadius,
    '--brand': theme.primaryColor,
    '--on-brand': theme.onPrimary,
    '--brand-soft': theme.secondaryColor,
    '--brand-strong': theme.primaryColor,
    '--member-ink': theme.ink,
    '--member-canvas': theme.canvas,
    fontFamily: theme.fontFamily,
  };
}
