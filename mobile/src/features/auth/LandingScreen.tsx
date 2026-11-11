import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AuthLegalStrip from './AuthLegalStrip';

type LandingScreenProps = {
  onLogin?: () => void;
  onBrowse?: () => void;
  onDiscover?: () => void;
  onFaq?: () => void;
  onAbout?: () => void;
};

function clockAngles(now = new Date()) {
  const minutes = now.getMinutes() + now.getSeconds() / 60;
  const hours = (now.getHours() % 12) + minutes / 60;
  return {
    minuteDeg: minutes * 6,
    hourDeg: hours * 30,
  };
}

/** Studio sat s pravim vremenom — brand „vrijeme”, ne dekorativna petlja. */
function StudioClock({ size = 172 }: { size?: number }) {
  const [{ minuteDeg, hourDeg }, setAngles] = useState(clockAngles);
  const markPulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const sync = () => setAngles(clockAngles());
    sync();
    const id = setInterval(sync, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(markPulse, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(markPulse, {
          toValue: 0.45,
          duration: 2200,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [markPulse]);

  const ticks = Array.from({ length: 12 }, (_, i) => i);
  const handOrigin = size / 2;

  return (
    <View
      style={[styles.clock, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityRole="image"
      accessibilityLabel={`Trenutno vrijeme, sat`}
    >
      <View style={[styles.clockRing, { borderRadius: size / 2 }]} />
      <View
        style={[
          styles.clockInner,
          {
            width: size * 0.78,
            height: size * 0.78,
            borderRadius: size * 0.39,
          },
        ]}
      />

      {ticks.map((tick) => (
        <View
          key={tick}
          style={[
            styles.tickWrap,
            {
              width: size,
              height: size,
              transform: [{ rotate: `${tick * 30}deg` }],
            },
          ]}
        >
          <View
            style={[
              styles.tick,
              tick % 3 === 0 ? styles.tickMajor : styles.tickMinor,
            ]}
          />
        </View>
      ))}

      {/* Metafora slobodnog termina — ne pravi booking slot */}
      <Animated.View
        style={[
          styles.slotMarkWrap,
          {
            width: size,
            height: size,
            opacity: markPulse,
            transform: [{ rotate: '150deg' }],
          },
        ]}
      >
        <View style={styles.slotMark} />
      </Animated.View>

      <View
        style={[
          styles.handWrap,
          {
            width: size,
            height: size,
            transform: [{ rotate: `${hourDeg}deg` }],
          },
        ]}
      >
        <View
          style={[
            styles.handHour,
            {
              height: size * 0.22,
              top: handOrigin - size * 0.22,
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.handWrap,
          {
            width: size,
            height: size,
            transform: [{ rotate: `${minuteDeg}deg` }],
          },
        ]}
      >
        <View
          style={[
            styles.handMinute,
            {
              height: size * 0.32,
              top: handOrigin - size * 0.32,
            },
          ]}
        />
      </View>

      <View style={styles.hubOuter} />
      <View style={styles.hubInner} />
    </View>
  );
}

/**
 * Mobilni landing ≠ web HomePage.
 * Web prodaje studio vlasnicima (dugi copy, FAQ, partneri).
 * App landing samo dočekuje: brand, jedna obećanje, ulaz.
 */
export default function LandingScreen({
  onLogin,
  onBrowse,
  onDiscover,
  onFaq,
  onAbout,
}: LandingScreenProps) {
  const { height, width } = useWindowDimensions();
  // Drži „anyminutes” u jednoj liniji na uskom mobilnom layoutu.
  const brandFontSize = Math.min(48, Math.max(34, Math.round(width * 0.112)));
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(22)).current;
  const ruleScale = useRef(new Animated.Value(0)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.32)).current;
  const clockIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    

    Animated.sequence([
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 780,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(brandY, {
          toValue: 0,
          duration: 780,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(clockIn, {
          toValue: 1,
          duration: 900,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.timing(ruleScale, {
        toValue: 1,
        duration: 420,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(bodyOpacity, {
        toValue: 1,
        duration: 560,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 480,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.58,
          duration: 3400,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(glow, {
          toValue: 0.28,
          duration: 3400,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [brandOpacity, brandY, ruleScale, bodyOpacity, ctaOpacity, glow, clockIn]);

  const compact = height < 740;
  const glowSize = Math.min(width * 0.62, 260);
  const clockSize = Math.min(width * 0.42, height * 0.22, compact ? 148 : 176);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0C1815', '#070B0A', '#050706']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            opacity: glow,
            top: Math.min(height * 0.06, 56),
            left: (width - glowSize) / 2,
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(94, 234, 212, 0.34)', 'rgba(94, 234, 212, 0.0)']}
          style={styles.glowInner}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.clockAnchor,
          {
            top: Math.min(height * 0.12, 96),
            opacity: clockIn,
            transform: [
              {
                translateY: clockIn.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
              {
                scale: clockIn.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
                }),
              },
            ],
          },
        ]}
      >
        <StudioClock size={clockSize} />
      </Animated.View>

      <View style={styles.haze} pointerEvents="none" />

      <View
        style={[
          styles.stage,
          {
            paddingTop: compact ? 48 : 64,
            paddingBottom: compact ? 24 : Math.max(28, height * 0.04),
            // RN web: padding unutar širine
            boxSizing: 'border-box',
          },
        ]}
      >
        <View style={styles.topBlock}>
          <Animated.View
            style={{
              opacity: brandOpacity,
              transform: [{ translateY: brandY }],
            }}
          >
            <Text
              style={[
                styles.brand,
                {
                  fontSize: brandFontSize,
                  lineHeight: brandFontSize + 4,
                },
              ]}
              accessibilityRole="header"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              anyminutes
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.rule,
              {
                marginTop: compact ? 14 : 20,
                transform: [{ scaleX: ruleScale }],
              },
            ]}
          />
        </View>

        <Animated.View style={[styles.bodyBlock, { opacity: bodyOpacity }]}>
          <Text
            style={[
              styles.headline,
              compact && { fontSize: 30, lineHeight: 34, marginBottom: 10 },
            ]}
          >
            Vaš termin.{'\n'}
            U džepu.
          </Text>
          <Text
            style={[
              styles.lead,
              compact && { fontSize: 15, lineHeight: 22, marginBottom: 12 },
            ]}
          >
            Rezervirajte, otkažite i pratite članarinu u jednoj aplikaciji — isti
            račun kao na webu, bez poruka i dogovaranja.
          </Text>
          <Text style={styles.cue}>
            Termini · Članarina · Obavijesti
          </Text>
        </Animated.View>

        <Animated.View
          style={[styles.actions, { opacity: ctaOpacity, paddingTop: compact ? 12 : 16 }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Prijavite se"
            onPress={onLogin}
            style={({ pressed }) => [
              styles.ctaPrimary,
              pressed && styles.ctaPressed,
            ]}
          >
            <Text style={styles.ctaPrimaryLabel}>Prijavite se</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nastavite bez prijave"
            onPress={onBrowse || onDiscover}
            style={({ pressed }) => [
              styles.ctaGhost,
              pressed && styles.ctaPressed,
            ]}
          >
            <Text style={styles.ctaGhostLabel}>Nastavite bez prijave</Text>
          </Pressable>

          <View style={styles.quickLinks} accessibilityRole="summary">
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Otkrij"
              onPress={onDiscover || onBrowse}
              style={({ pressed }) => [styles.quickLink, pressed && styles.ctaPressed]}
            >
              <Text style={styles.quickLinkLabel}>Otkrij</Text>
            </Pressable>
            <Text style={styles.quickDot} accessibilityElementsHidden>·</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Česta pitanja"
              onPress={onFaq}
              style={({ pressed }) => [styles.quickLink, pressed && styles.ctaPressed]}
            >
              <Text style={styles.quickLinkLabel}>Česta pitanja</Text>
            </Pressable>
            <Text style={styles.quickDot} accessibilityElementsHidden>·</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="O nama"
              onPress={onAbout}
              style={({ pressed }) => [styles.quickLink, pressed && styles.ctaPressed]}
            >
              <Text style={styles.quickLinkLabel}>O nama</Text>
            </Pressable>
          </View>

          <AuthLegalStrip />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#060908',
  },
  root: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#060908',
  },
  glow: {
    position: 'absolute',
  },
  glowInner: {
    flex: 1,
    borderRadius: 999,
  },
  haze: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '38%',
    bottom: 0,
    backgroundColor: 'transparent',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(232, 242, 239, 0.06)',
  },
  clockAnchor: {
    position: 'absolute',
    right: 12,
    maxWidth: '46%',
    alignItems: 'flex-end',
  },
  clock: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 20, 18, 0.55)',
  },
  clockRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: 'rgba(232, 242, 239, 0.22)',
  },
  clockInner: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.18)',
    backgroundColor: 'rgba(5, 10, 9, 0.35)',
  },
  tickWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  tick: {
    position: 'absolute',
    top: 10,
    borderRadius: 1,
    backgroundColor: 'rgba(232, 242, 239, 0.55)',
  },
  tickMajor: {
    width: 2,
    height: 11,
    backgroundColor: 'rgba(232, 242, 239, 0.82)',
  },
  tickMinor: {
    width: 1.5,
    height: 6,
    backgroundColor: 'rgba(232, 242, 239, 0.35)',
  },
  slotMarkWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  slotMark: {
    position: 'absolute',
    top: 18,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5EEAD4',
    shadowColor: '#5EEAD4',
    shadowOpacity: 0.65,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  handWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  handHour: {
    position: 'absolute',
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(232, 242, 239, 0.88)',
  },
  handMinute: {
    position: 'absolute',
    width: 2,
    borderRadius: 2,
    backgroundColor: '#5EEAD4',
  },
  hubOuter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(232, 242, 239, 0.35)',
  },
  hubInner: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#5EEAD4',
  },
  stage: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  topBlock: {
    flexShrink: 0,
    paddingTop: 8,
    maxWidth: '78%',
    alignSelf: 'flex-start',
  },
  brand: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.2,
    color: '#F7FCFA',
  },
  rule: {
    alignSelf: 'flex-start',
    width: 56,
    height: 2,
    marginTop: 20,
    backgroundColor: '#5EEAD4',
  },
  bodyBlock: {
    flexShrink: 1,
    minHeight: 0,
    maxWidth: '100%',
  },
  headline: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.5,
    color: '#E8F2EF',
    marginBottom: 14,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    lineHeight: 25,
    color: 'rgba(232, 242, 239, 0.74)',
    maxWidth: '100%',
    marginBottom: 18,
  },
  cue: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(94, 234, 212, 0.9)',
    marginBottom: 8,
  },
  actions: {
    flexShrink: 0,
    gap: 12,
    paddingTop: 16,
    maxWidth: '100%',
  },
  ctaPrimary: {
    minHeight: 56,
    borderRadius: 6,
    backgroundColor: '#5EEAD4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ctaPrimaryLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.15,
    color: '#061210',
  },
  ctaGhost: {
    minHeight: 56,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ctaGhostLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#E8F2EF',
  },
  quickLinks: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickLink: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  quickLinkLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: '#5EEAD4',
  },
  quickDot: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.35)',
  },
  ctaPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
