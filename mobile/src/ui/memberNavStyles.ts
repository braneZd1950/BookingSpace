import { StyleSheet } from 'react-native';
import { font } from '../theme/fonts';
import { tokens } from '../theme/tokens';

/** Member chrome: slim top brand + bottom icon tab bar. */
export const memberNavStyles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: tokens.bg,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  brand: {
    flexShrink: 1,
    maxWidth: '78%',
  },
  brandText: {
    fontFamily: font.bodyBold,
    fontSize: 16,
    color: tokens.onBrand,
  },
  bottom: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 2,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3.2,
    paddingVertical: 8,
    gap: 3,
  },
  tabLabel: {
    fontFamily: font.bodyBold,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  power: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: `${tokens.brand}47`,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
});
