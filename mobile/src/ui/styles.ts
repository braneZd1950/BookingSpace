import { StyleSheet } from 'react-native';
import { brandEdge, fgMuted, loginInkMuted, space, tokens, type } from '../theme/tokens';
import { font } from '../theme/fonts';

/**
 * StyleSheet mirror of web SCSS:
 * LoginPage.scss, TerminiPage.scss, MembersPage.scss, tokens.scss
 */
export const ui = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: tokens.bg,
  },
  screenBody: {
    flexGrow: 1,
    paddingHorizontal: space.pagePad,
    paddingTop: 28,
    paddingBottom: 40,
  },

  /** .login__spine-mark — horizontal-tb on ≤720px */
  brandMark: {
    fontFamily: font.brand,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -1.1,
    color: tokens.brandStrong,
    marginBottom: 10,
  },


  /** .login__kicker */
  loginKicker: {
    fontFamily: font.bodyBold,
    fontSize: type.loginKicker,
    letterSpacing: type.loginKickerTrack,
    textTransform: 'uppercase',
    color: tokens.brandStrong,
    marginBottom: 10,
  },

  /** .termini__eyebrow / .members__eyebrow */
  eyebrow: {
    fontFamily: font.bodyExtra,
    fontSize: type.eyebrow,
    letterSpacing: type.eyebrowTrack,
    textTransform: 'uppercase',
    color: tokens.brand,
    marginBottom: 8,
  },

  /** .login h1 */
  loginTitle: {
    fontFamily: font.display,
    fontSize: type.loginDisplay,
    lineHeight: type.loginDisplayLine,
    letterSpacing: type.loginDisplayTrack,
    color: tokens.loginInk,
    maxWidth: 200,
  },

  /** .termini__head h1 */
  sectionTitle: {
    fontFamily: font.display,
    fontSize: type.sectionDisplay,
    lineHeight: type.sectionDisplayLine,
    letterSpacing: -1.1,
    color: tokens.fg,
  },

  /** h1::after accent (termini/members) — NOT on login */
  accentRule: {
    width: space.ruleWidth,
    height: space.ruleHeight,
    borderRadius: 999,
    backgroundColor: tokens.accent,
    marginTop: 11,
  },

  /** .login__lead */
  loginLead: {
    fontFamily: font.bodyRegular,
    fontSize: type.lede,
    lineHeight: type.ledeLine,
    color: loginInkMuted(0.62),
    marginTop: 10,
    maxWidth: 260,
  },

  /** .termini__lede */
  lede: {
    fontFamily: font.bodyRegular,
    fontSize: 16.3,
    lineHeight: 25.3,
    color: fgMuted(0.58),
    marginTop: 10,
    maxWidth: 360,
  },

  body: {
    fontFamily: font.bodyRegular,
    fontSize: type.body,
    lineHeight: type.bodyLine,
    color: fgMuted(0.72),
  },

  meta: {
    fontFamily: font.bodySemi,
    fontSize: type.meta,
    color: tokens.muted,
  },

  /** App section head border like .termini__head */
  headDivider: {
    borderBottomWidth: 1,
    borderBottomColor: brandEdge(0.16),
    paddingBottom: 22,
    marginBottom: 18,
  },

  /** Login intro — no bottom rule box */
  loginIntro: {
    marginBottom: 8,
    gap: 0,
  },

  /**
   * .login__panel — transparent, only top border
   * (not a card)
   */
  loginPanel: {
    marginTop: 8,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: brandEdge(0.18),
    backgroundColor: 'transparent',
    gap: 17,
  },

  /** Board / sheet (termini stats & panels) */
  panel: {
    borderWidth: 1,
    borderColor: brandEdge(0.16),
    borderRadius: space.radius,
    backgroundColor: tokens.board,
    paddingHorizontal: space.panelPad,
    paddingVertical: space.panelPad,
  },

  fieldLabel: {
    fontFamily: font.bodySemi,
    fontSize: type.label,
    color: tokens.loginInk,
    marginBottom: 6,
  },

  /** .login input — underline only */
  underlineInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: brandEdge(0.22),
    paddingVertical: 11,
    paddingHorizontal: 0,
    fontFamily: font.body,
    fontSize: 16,
    color: tokens.loginInk,
    backgroundColor: 'transparent',
  },

  /** .login__submit */
  primaryBtn: {
    marginTop: 6,
    backgroundColor: tokens.brand,
    borderRadius: space.radius,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryBtnLabel: {
    fontFamily: font.bodyBold,
    fontSize: 16,
    color: tokens.onBrand,
    letterSpacing: 0.15,
  },

  /** .termini__link / ghost */
  ghostBtn: {
    minHeight: 48,
    borderRadius: space.radius,
    borderWidth: 1,
    borderColor: brandEdge(0.28),
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ghostBtnLabel: {
    fontFamily: font.bodyBold,
    fontSize: 15,
    color: tokens.brand,
  },

  indexBadge: {
    fontFamily: font.bodyExtra,
    fontSize: 12,
    color: tokens.brand,
    marginTop: 2,
    minWidth: 22,
  },

  statusAccent: {
    fontFamily: font.bodyExtra,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.accent,
    marginTop: 8,
  },

  errorText: {
    fontFamily: font.body,
    fontSize: 13.8,
    fontWeight: '500',
    color: tokens.fullInk,
  },

  cardTitle: {
    fontFamily: font.display,
    fontSize: 18,
    letterSpacing: -0.3,
    color: tokens.fg,
  },
});
