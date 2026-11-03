import { StyleSheet } from 'react-native';
import { font } from '../theme/fonts';
import { tokens } from '../theme/tokens';

/** Mirror of `client/.../StudioLayout.scss` `.studio-nav*` */
export const navStyles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: tokens.bg,
  },

  /** .studio-nav */
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: tokens.brand,
  },

  /** .studio-nav__brand */
  brand: {
    flexShrink: 1,
    maxWidth: 160,
  },
  brandText: {
    fontFamily: font.bodyBold,
    fontSize: 16,
    color: tokens.onBrand,
  },

  /** .studio-nav nav */
  items: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },

  /** .studio-nav__item — 2.2rem circle */
  item: {
    width: 35,
    height: 35,
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
    marginLeft: 6,
    width: 35,
    height: 35,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.38)',
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
});
