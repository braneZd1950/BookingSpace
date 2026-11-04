import { StyleSheet } from 'react-native';
import { font } from '../theme/fonts';
import { tokens } from '../theme/tokens';

/** Mirror of `client/.../StudioLayout.scss` `.studio-topbar` / `.studio-nav*` */
export const navStyles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: tokens.bg,
  },

  /** .studio-topbar */
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: tokens.brand,
  },

  /** .studio-nav__brand */
  brand: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '42%',
  },
  brandText: {
    fontFamily: font.bodyBold,
    fontSize: 16,
    color: tokens.onBrand,
  },

  /** .studio-nav__tabs */
  items: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    minWidth: 0,
  },

  /** .studio-nav__item — mobile ~2rem */
  item: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  itemActive: {
    backgroundColor: tokens.brandSoft,
  },

  /** .studio-nav__power */
  power: {
    marginLeft: 3,
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.38)',
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
});
