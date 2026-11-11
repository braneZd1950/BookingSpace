import { useEffect, useRef } from 'react';
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

export type SessionRole = 'CUSTOMER' | 'BUSINESS_OWNER' | string;

type SessionSuccessScreenProps = {
  role?: SessionRole | null;
  name?: string;
  email?: string;
  source?: 'login' | 'register';
  onHome?: () => void;
  onContinue?: () => void;
};

/**
 * Uspjeh nakon prijave / registracije — zaseban copy za klijenta i partnera.
 * Shell tabova dolazi u nastavku M1.
 */
export default function SessionSuccessScreen({
  role,
  name,
  email,
  source = 'login',
  onHome,
  onContinue,
}: SessionSuccessScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useRef(new Animated.Value(0)).current;
  const isPartner = role === 'BUSINESS_OWNER';
  const fromRegister = source === 'register';

  useEffect(() => {
    
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [enter]);

  const kicker = isPartner ? 'Vaš studio' : 'Klijent';
  const title = fromRegister
    ? isPartner
      ? 'Studio je spreman.'
      : 'Račun je spreman.'
    : isPartner
      ? 'Dobrodošli u studio.'
      : 'Prijavljeni ste.';

  const lead = isPartner
    ? fromRegister
      ? 'Račun i prostor su aktivni. Izgled javne stranice, termine i članarine uredite na webu — mobilni vodič stiže uskoro.'
      : 'Sesija partnera je aktivna. Upravljanje studijem na webu; mobilni shell stiže u nastavku M1.'
    : fromRegister
      ? 'Možete pretraživati partnere i rezervirati termine. Pregled u aplikaciji stiže u nastavku M1.'
      : 'Sesija je aktivna. Pregled partnera i rezervacije u aplikaciji stižu uskoro.';

  const identity = [name, email].filter(Boolean).join('\n');

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0C1815', '#070B0A', '#050706']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.stage,
          {
            paddingTop: compact ? 52 : 72,
            paddingBottom: compact ? 28 : 40,
          },
        ]}
      >
        <Animated.View
          style={{
            opacity: enter,
            transform: [
              {
                translateY: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          }}
        >
          <Text style={styles.brand}>anyminutes</Text>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={[styles.title, compact && { fontSize: 34, lineHeight: 38 }]}>
            {title}
          </Text>
          {identity ? <Text style={styles.identity}>{identity}</Text> : null}
          <Text style={styles.lead}>{lead}</Text>
        </Animated.View>

        <Animated.View style={[styles.actions, { opacity: enter }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nastavite"
            onPress={onContinue || onHome}
            style={({ pressed }) => [styles.ctaPrimary, pressed && styles.pressed]}
          >
            <Text style={styles.ctaPrimaryLabel}>
              {isPartner ? 'U studio' : 'Nastavite'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Natrag na početnu"
            onPress={onHome}
            style={({ pressed }) => [styles.ctaGhost, pressed && styles.pressed]}
          >
            <Text style={styles.ctaGhostLabel}>← Natrag na početnu</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.footer}>
          <AuthLegalStrip />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: '#060908' },
  root: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#060908',
  },
  stage: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  brand: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: '#F7FCFA',
    marginBottom: 18,
  },
  kicker: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#5EEAD4',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.6,
    color: '#E8F2EF',
    marginBottom: 14,
  },
  identity: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.78)',
    marginBottom: 12,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(232, 242, 239, 0.64)',
    maxWidth: 360,
  },
  actions: {
    marginTop: 36,
    gap: 12,
  },
  ctaPrimary: {
    minHeight: 56,
    borderRadius: 6,
    backgroundColor: '#5EEAD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.15,
    color: '#061210',
  },
  ctaGhost: {
    minHeight: 52,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaGhostLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: '#E8F2EF',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 28,
  },
  pressed: { opacity: 0.82 },
});
