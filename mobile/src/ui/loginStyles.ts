import { Platform, StyleSheet } from 'react-native';
import { font } from '../theme/fonts';
import { brandEdge, loginInkMuted, tokens } from '../theme/tokens';

/**
 * Pixel-oriented mirror of `client/src/pages/public/LoginPage.scss`
 * (mobile breakpoint ≤720px).
 */
export const loginStyles = StyleSheet.create({
  /** .login */
  root: {
    flex: 1,
    position: 'relative',
    backgroundColor: tokens.loginMist,
    // Ensure web mouse hits form, not atmosphere
    ...(Platform.OS === 'web' ? { cursor: 'auto' as const } : null),
  },

  /** .login__layout @ ≤720px */
  layout: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    paddingHorizontal: 19,
    paddingTop: 36,
    paddingBottom: 48,
    gap: 22,
  },

  /** .login__spine @ ≤720px — row + bottom border */
  spine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: brandEdge(0.18),
  },

  /** wraps mark + ::after like inline web markup */
  spineMarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /** .login__spine-mark */
  spineMark: {
    fontFamily: font.brand,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1.4,
    color: tokens.brandStrong,
  },

  /** .login__spine-mark::after @ ≤720px — inline after text, not far right */
  spineRule: {
    width: 38.4,
    height: 3.2,
    borderRadius: 999,
    backgroundColor: tokens.accent,
    marginLeft: 12, // 0.75rem
  },

  /** .login__stage */
  stage: {
    gap: 24,
  },

  /** .login__intro */
  intro: {
    gap: 10,
  },

  /** .login__kicker */
  kicker: {
    fontFamily: font.bodyBold,
    fontSize: 12.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: tokens.brandStrong,
  },

  /** .login h1 */
  title: {
    maxWidth: 180,
    fontFamily: font.display,
    fontSize: 36,
    letterSpacing: -1.25,
    lineHeight: 35,
    color: tokens.loginInk,
  },

  /** .login__lead */
  lead: {
    maxWidth: 260,
    fontFamily: font.bodyRegular,
    fontSize: 16.8,
    lineHeight: 25.2,
    color: loginInkMuted(0.62),
  },

  /** .login__panel — transparent, top border only */
  panel: {
    gap: 17,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: brandEdge(0.18),
    backgroundColor: 'transparent',
  },

  /** .login__field */
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: font.bodySemi,
    fontSize: 14.4,
    color: tokens.loginInk,
  },

  /** .login input */
  input: {
    width: '100%',
    paddingVertical: 11.5,
    paddingHorizontal: 0,
    borderWidth: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(14, 107, 115, 0.22)',
    borderRadius: 0,
    backgroundColor: 'transparent',
    color: tokens.loginInk,
    fontFamily: font.body,
    fontSize: 16,
  },

  /** .login__password-wrap */
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 42,
  },

  /** .login__eye */
  eye: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5.6,
  },

  /** .login__form-error */
  formError: {
    color: tokens.fullInk,
    fontFamily: font.body,
    fontSize: 13.8,
  },

  /** .login__submit */
  submit: {
    marginTop: 6,
    minHeight: 52,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 3.2,
    backgroundColor: tokens.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    fontFamily: font.bodyBold,
    fontSize: 16,
    letterSpacing: 0.16,
    color: tokens.onBrand,
  },
  submitDisabled: {
    opacity: 0.72,
  },

  /** .login__links */
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  linksMuted: {
    fontFamily: font.bodyRegular,
    fontSize: 14.7,
    color: loginInkMuted(0.55),
  },
  link: {
    fontFamily: font.bodyBold,
    fontSize: 14.7,
    color: tokens.brandStrong,
    textDecorationLine: 'underline',
  },

  /** .login__keys */
  keys: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: brandEdge(0.24),
  },
  keysTitle: {
    marginBottom: 4,
    fontFamily: font.bodyBold,
    fontSize: 11.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: tokens.brandStrong,
  },
  keysBody: {
    fontFamily: font.bodyRegular,
    fontSize: 12.8,
    lineHeight: 20,
    color: loginInkMuted(0.58),
  },
  keysCode: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 12.5,
    color: tokens.loginInk,
  },
});
