import { StyleSheet } from 'react-native';
import {
  APP_GRADIENT,
  APP_GRADIENT_LOCATIONS,
  enterStyle,
  useEnterAnimation,
} from '../../lib/appShell.js';

export const STUDIO_GRADIENT = APP_GRADIENT;
export const STUDIO_GRADIENT_LOCATIONS = APP_GRADIENT_LOCATIONS;

/** Shared shell styles for owner studio screens (boot → lead / title row). */
export const studioChromeStyles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1614',
  },
  root: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#0E1614',
  },
  flex: { flex: 1, minHeight: 0 },
  stage: {
    flexGrow: 1,
    paddingHorizontal: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: -6,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: '#5EEAD4',
    maxWidth: 260,
  },
  title: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.6,
    color: '#E8F2EF',
    marginBottom: 8,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.66)',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  addBtn: {
    marginTop: 6,
    minWidth: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(94, 234, 212, 0.35)',
  },
});

export function useStudioEnterAnimation() {
  return useEnterAnimation(520);
}

export function studioEnterStyle(enter) {
  return enterStyle(enter);
}
