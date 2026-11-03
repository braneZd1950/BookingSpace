import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { usePrivacyConsent } from '../features/consent/usePrivacyConsent';
import { tokens } from '../theme/tokens';

type Props = {
  title?: string;
  brand?: string;
  children: React.ReactNode;
};

export default function ConsentGate({
  title = 'Potrebna je privola',
  brand = tokens.brand,
  children,
}: Props) {
  const { accepted, accept, busy, openPrivacy, openTerms } = usePrivacyConsent();

  if (accepted) return <>{children}</>;

  return (
    <View
      style={{
        marginTop: 16,
        padding: 18,
        borderRadius: 16,
        backgroundColor: tokens.surface,
        borderWidth: 1,
        borderColor: tokens.line,
        gap: 10,
      }}
      accessibilityRole="summary"
    >
      <Text style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: brand }}>
        Privola
      </Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: tokens.fg }}>{title}</Text>
      <Text style={{ fontSize: 15, lineHeight: 22, color: tokens.muted }}>
        Bez privole možete pregledavati sadržaj, ali ne možete rezervirati ni mijenjati termine.
        Prihvatite pravila da nastavite.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
        <Pressable onPress={() => void openPrivacy()} accessibilityRole="link">
          <Text style={{ color: brand, fontWeight: '600' }}>Privatnost</Text>
        </Pressable>
        <Pressable onPress={() => void openTerms()} accessibilityRole="link">
          <Text style={{ color: brand, fontWeight: '600' }}>Uvjeti</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => void accept('banner')}
        disabled={busy}
        style={{
          marginTop: 8,
          backgroundColor: brand,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          opacity: busy ? 0.7 : 1,
        }}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color={tokens.onBrand} />
        ) : (
          <Text style={{ color: tokens.onBrand, fontWeight: '700', fontSize: 16 }}>
            Prihvaćam privolu
          </Text>
        )}
      </Pressable>
    </View>
  );
}
