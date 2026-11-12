import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { USE_NATIVE_DRIVER } from './nativeDriver.js';

/** Shared dark atelier gradient for studio + auth screens. */
export const APP_GRADIENT = ['#0C1815', '#070B0A', '#050706'];
export const APP_GRADIENT_LOCATIONS = [0, 0.42, 1];

export function useEnterAnimation(duration = 520) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [duration, enter]);
  return enter;
}

export function enterStyle(enter) {
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
