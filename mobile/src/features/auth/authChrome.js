import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';

export const AUTH_GRADIENT = ['#0C1815', '#070B0A', '#050706'];
export const AUTH_GRADIENT_LOCATIONS = [0, 0.42, 1];

/** Shared shell styles for Login / Forgot / related auth screens. */
export const authChromeStyles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: '#060908' },
  root: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#060908',
  },
  flex: { flex: 1, minHeight: 0 },
  stage: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 20,
  },
  backLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.62)',
  },
  brand: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: '#F7FCFA',
    marginBottom: 18,
  },
  title: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.6,
    color: '#E8F2EF',
    marginBottom: 10,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.68)',
    maxWidth: 320,
  },
  form: { gap: 18 },
  field: { gap: 8 },
  label: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.5)',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    borderRadius: 6,
    paddingHorizontal: 14,
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#F7FCFA',
    backgroundColor: 'rgba(10, 20, 18, 0.45)',
  },
  inputInvalid: {
    borderColor: 'rgba(251, 113, 133, 0.7)',
  },
  fieldError: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(251, 113, 133, 0.95)',
  },
  formError: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(251, 113, 133, 0.95)',
  },
  submit: {
    minHeight: 56,
    marginTop: 6,
    borderRadius: 6,
    backgroundColor: '#5EEAD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.15,
    color: '#061210',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 28,
  },
  links: {
    marginTop: 8,
    gap: 12,
  },
  linkLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#5EEAD4',
  },
  linkMuted: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  pressed: { opacity: 0.82 },
});

export function useAuthEnterAnimation() {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [enter]);
  return enter;
}

export function authEnterStyle(enter) {
  return {
    opacity: enter,
    transform: [
      {
        translateY: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };
}
