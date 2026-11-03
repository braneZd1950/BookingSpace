import { Text, View } from 'react-native';
import { env } from '../config/env';
import { brandEdge, space, tokens } from '../theme/tokens';
import { ui } from '../ui/styles';

/** `.login__spine-mark` + inline `::after` accent (≤720px web) */
export function BrandMark({ subtitle }: { subtitle?: string }) {
  return (
    <View
      style={{
        paddingBottom: 14,
        marginBottom: subtitle ? 12 : 18,
        borderBottomWidth: 1,
        borderBottomColor: brandEdge(0.18),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[ui.brandMark, { marginBottom: 0 }]}>{env.appName}</Text>
        <View
          style={{
            width: 38.4,
            height: space.loginRule,
            borderRadius: 999,
            backgroundColor: tokens.accent,
            marginLeft: 12,
          }}
        />
      </View>
      {subtitle ? (
        <Text style={[ui.loginKicker, { marginTop: 8, marginBottom: 0 }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
