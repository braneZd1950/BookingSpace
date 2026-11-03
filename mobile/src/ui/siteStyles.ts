import { StyleSheet } from 'react-native';
import { font } from '../theme/fonts';

/** Mirror of `SiteFrame.scss` live mode (`.site--live`) */
export const siteStyles = StyleSheet.create({
  root: {
    flexGrow: 1,
  },

  /** .site__hero--photo */
  hero: {
    minHeight: 420,
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
    paddingTop: 48,
    paddingBottom: 42,
    backgroundColor: '#182028',
  },
  heroCopy: {
    maxWidth: 520,
  },
  logo: {
    width: 67,
    height: 67,
    borderRadius: 13,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  heroTitle: {
    maxWidth: 280,
    color: '#ffffff',
    fontFamily: font.display,
    fontSize: 42,
    letterSpacing: -1.6,
    lineHeight: 41,
  },
  heroLead: {
    marginTop: 11,
    maxWidth: 420,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: font.bodyRegular,
    fontSize: 18,
    lineHeight: 27,
  },
  bookLight: {
    alignSelf: 'flex-start',
    marginTop: 18,
    paddingVertical: 11,
    paddingHorizontal: 17,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  bookLightLabel: {
    fontFamily: font.bodyBold,
    fontSize: 15,
  },

  section: {
    width: '100%',
    paddingHorizontal: 19,
    paddingTop: 38,
  },
  sectionEyebrow: {
    marginBottom: 7,
    fontFamily: font.bodyBold,
    fontSize: 12.5,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  sectionBody: {
    fontFamily: font.bodyRegular,
    fontSize: 16.8,
    lineHeight: 26,
  },

  bandPhoto: {
    marginTop: 19,
    minHeight: 220,
    borderRadius: 16,
    backgroundColor: '#dceff0',
  },

  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 35,
    paddingHorizontal: 19,
  },
  bookSolid: {
    paddingVertical: 11,
    paddingHorizontal: 17,
    borderRadius: 8,
  },
  bookSolidLabel: {
    fontFamily: font.bodyBold,
    fontSize: 15,
    color: '#ffffff',
  },

  foot: {
    marginTop: 42,
    paddingTop: 38,
    paddingHorizontal: 19,
    paddingBottom: 48,
    borderTopWidth: 1,
    gap: 28,
  },
  footEyebrow: {
    marginBottom: 6,
    fontFamily: font.bodyBold,
    fontSize: 12.5,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  footBrand: {
    fontFamily: font.display,
    fontSize: 22,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  footList: {
    gap: 6,
    marginTop: 4,
  },
  setupPanel: {
    margin: 20,
    padding: 22,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
});
