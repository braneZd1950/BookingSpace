import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, DARK_SURFACE } from '../../lib/brandColors.js';
import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioTopCurtainProps = {
  open: boolean;
  onClose: () => void;
  kicker?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Optional footer pinned below the scroll area (actions). */
  footer?: ReactNode;
};

const SCREEN_H = Dimensions.get('window').height;
const SHEET_H = Math.min(SCREEN_H * 0.78, 640);
const SHEET_OFFSET = SHEET_H + 48;

/**
 * Zastor s vrha — detalji / forme bez skrolanja liste ispod.
 */
export default function StudioTopCurtain({
  open,
  onClose,
  kicker,
  title,
  subtitle,
  children,
  footer,
}: StudioTopCurtainProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!mounted) return undefined;
    animRef.current?.stop();
    const next = Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: open ? 300 : 220,
      easing: open
        ? Easing.bezier(0.33, 0.1, 0.25, 1)
        : Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animRef.current = next;
    next.start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
    return () => {
      next.stop();
    };
  }, [open, mounted, anim]);

  if (!mounted) return null;

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHEET_OFFSET, 0],
  });
  const backdrop = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.curtain,
            {
              height: SHEET_H,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>
          <View style={styles.head}>
            <View style={styles.headCopy}>
              {kicker ? (
                <Text style={[ui.sectionLabel, styles.kicker]}>{kicker}</Text>
              ) : null}
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.close, pressed && ui.pressed]}
              accessibilityLabel="Zatvori"
            >
              <Ionicons name="close" size={20} color={BRAND.onDark} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  curtain: {
    width: '100%',
    maxHeight: '86%',
    paddingTop: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: BRAND.navySoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(37, 99, 235, 0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  handleRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.45)',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  headCopy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: DARK_SURFACE.accent,
  },
  title: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: BRAND.onDark,
    marginTop: -2,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(148, 163, 184, 0.95)',
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    gap: 4,
  },
  footer: {
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.22)',
    gap: 8,
  },
});
