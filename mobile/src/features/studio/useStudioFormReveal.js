import { useCallback, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';

/**
 * Shared open/close reveal for studio create/edit forms (Services / Members).
 */
export function useStudioFormReveal() {
  const formReveal = useRef(new Animated.Value(0)).current;
  const formAnimRef = useRef(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  const stopFormAnim = useCallback(() => {
    formAnimRef.current?.stop();
    formAnimRef.current = null;
  }, []);

  const openForm = useCallback((onOpen) => {
    stopFormAnim();
    onOpen?.();
    setFormOpen(true);
    setFormVisible(true);
    formReveal.setValue(0);
    requestAnimationFrame(() => {
      const anim = Animated.timing(formReveal, {
        toValue: 1,
        duration: 820,
        easing: Easing.bezier(0.33, 0.1, 0.25, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      });
      formAnimRef.current = anim;
      anim.start();
    });
  }, [formReveal, stopFormAnim]);

  const closeForm = useCallback((after) => {
    stopFormAnim();
    const anim = Animated.timing(formReveal, {
      toValue: 0,
      duration: 460,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    formAnimRef.current = anim;
    anim.start(({ finished }) => {
      if (!finished) return;
      setFormVisible(false);
      setFormOpen(false);
      after?.();
    });
  }, [formReveal, stopFormAnim]);

  const toggleForm = useCallback((onOpen) => {
    if (formOpen || formVisible) {
      closeForm();
      return;
    }
    openForm(onOpen);
  }, [closeForm, formOpen, formVisible, openForm]);

  const formRevealStyle = {
    opacity: formReveal,
    transform: [
      {
        translateY: formReveal.interpolate({
          inputRange: [0, 1],
          outputRange: [-36, 0],
        }),
      },
      {
        scaleY: formReveal.interpolate({
          inputRange: [0, 1],
          outputRange: [0.94, 1],
        }),
      },
    ],
  };

  return {
    formReveal,
    formOpen,
    formVisible,
    openForm,
    closeForm,
    toggleForm,
    formRevealStyle,
  };
}
