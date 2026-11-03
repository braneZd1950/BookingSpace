/**
 * Exact mirror of `client/src/styles/tokens.scss` (:root light)
 * + login locals from `LoginPage.scss`.
 */
export const tokens = {
  bg: '#f5f8f8',
  surface: '#ffffff',
  line: '#d9e2e3',
  fg: '#112b2e',
  muted: '#55696c',
  brand: '#0e6b73',
  onBrand: '#ffffff',
  brandStrong: '#0a4f56',
  brandSoft: '#dceff0',
  accent: '#f2a33a',
  onAccent: '#3a2400',
  ok: '#1f8a5b',
  okSoft: '#ddf3e8',
  okInk: '#14663f',
  low: '#c98a1b',
  lowSoft: '#fbefd3',
  lowInk: '#8a5a0f',
  full: '#c73e3e',
  fullSoft: '#fae0e0',
  fullInk: '#a82e2e',
  member: '#4a5fc1',
  memberSoft: '#e3e7f8',
  memberInk: '#3a4dae',
  loginMist: '#e8f1f0',
  loginInk: '#102c2f',
  loginPanel: 'rgba(250, 253, 252, 0.88)',
  /** color-mix(#fff 88%, brandSoft) ≈ termini/members boards */
  board: '#f7fbfb',
} as const;

/** 1rem = 16px web baseline */
export const space = {
  radius: 3.2, // 0.2rem
  pagePad: 20,
  panelPad: 18,
  headGap: 10,
  ruleWidth: 41.6, // 2.6rem
  ruleHeight: 2.9, // 0.18rem
  loginRule: 3.2, // 0.2rem spine
  loginRuleH: 54, // 3.4rem
} as const;

export const type = {
  /** .login__kicker 0.78rem / 700 / 0.16em */
  loginKicker: 12.5,
  loginKickerTrack: 2,
  /** .termini__eyebrow 0.72rem / 800 / 0.14em */
  eyebrow: 11.5,
  eyebrowTrack: 1.6,
  /** .login h1 clamp ~2.15rem */
  loginDisplay: 34.4,
  loginDisplayLine: 33.7, // 0.98
  loginDisplayTrack: -1.2, // -0.035em
  /** .termini__head h1 ~2rem+ */
  sectionDisplay: 32,
  sectionDisplayLine: 33.6,
  /** .login__lead 1.05rem */
  lede: 16.8,
  ledeLine: 25.2,
  body: 15.5,
  bodyLine: 24,
  /** .login__field 0.9rem */
  label: 14.4,
  meta: 12,
} as const;

export function brandEdge(alpha = 0.18): string {
  return `rgba(14, 107, 115, ${alpha})`;
}

export function loginInkMuted(alpha = 0.62): string {
  return `rgba(16, 44, 47, ${alpha})`;
}

export function fgMuted(alpha = 0.58): string {
  return `rgba(17, 43, 46, ${alpha})`;
}
