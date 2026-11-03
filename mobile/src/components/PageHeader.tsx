import { Text, View } from 'react-native';
import { env } from '../config/env';
import { brandEdge, space, tokens } from '../theme/tokens';
import { ui } from '../ui/styles';

type PageHeaderProps = {
  kicker?: string;
  title: string;
  lead?: string;
  /** login = LoginPage.scss intro; app = termini/members head */
  variant?: 'login' | 'app';
  showBrand?: boolean;
};

export function PageHeader({
  kicker,
  title,
  lead,
  variant = 'app',
  showBrand = false,
}: PageHeaderProps) {
  if (variant === 'login') {
    return (
      <View style={ui.loginIntro}>
        {showBrand ? (
          <View
            style={{
              paddingBottom: 14,
              marginBottom: 18,
              borderBottomWidth: 1,
              borderBottomColor: brandEdge(0.18),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[ui.brandMark, { marginBottom: 0 }]}>{env.appName}</Text>
              {/* .login__spine-mark::after — inline beside mark */}
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
          </View>
        ) : null}
        {kicker ? <Text style={ui.loginKicker}>{kicker}</Text> : null}
        <Text style={ui.loginTitle}>{title}</Text>
        {lead ? <Text style={ui.loginLead}>{lead}</Text> : null}
      </View>
    );
  }

  return (
    <View style={ui.headDivider}>
      {showBrand ? <Text style={ui.brandMark}>{env.appName}</Text> : null}
      {kicker ? <Text style={ui.eyebrow}>{kicker}</Text> : null}
      <Text style={ui.sectionTitle}>{title}</Text>
      <View style={ui.accentRule} />
      {lead ? <Text style={ui.lede}>{lead}</Text> : null}
    </View>
  );
}
