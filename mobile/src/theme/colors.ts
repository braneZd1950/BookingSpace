import { tokens } from './tokens';

/** Convenience alias — values from tokens.scss mirror. */
export const colors = {
  brand: tokens.brand,
  brandStrong: tokens.brandStrong,
  brandSoft: tokens.brandSoft,
  brandInk: tokens.fg,
  mist: tokens.loginMist,
  canvas: tokens.bg,
  panel: tokens.loginPanel,
  onBrand: tokens.onBrand,
  accent: tokens.accent,
  surface: tokens.surface,
  muted: tokens.muted,
  line: tokens.line,
  danger: tokens.fullInk,
  ok: tokens.okInk,
} as const;
