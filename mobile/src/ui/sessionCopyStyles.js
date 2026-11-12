import { StyleSheet } from 'react-native';

/** Shared typography for member home + session success copy blocks. */
export const sessionCopyStyles = StyleSheet.create({
  brand: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: '#F7FCFA',
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
    marginBottom: 12,
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
    marginBottom: 22,
  },
});
