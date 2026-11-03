import { Text, View } from 'react-native';
import { PageHeader } from './PageHeader';
import { Panel } from './Panel';
import { Screen } from './Screen';
import { ui } from '../ui/styles';

type Props = {
  kicker: string;
  title: string;
  lead: string;
};

/** Temporary stand-in until each studio page is ported from web. */
export function StudioPlaceholder({ kicker, title, lead }: Props) {
  return (
    <Screen withAtmosphere={false} embedInShell>
      <PageHeader variant="app" kicker={kicker} title={title} lead={lead} />
      <Panel>
        <Text style={ui.eyebrow}>Status</Text>
        <Text style={ui.cardTitle}>U pripremi na native</Text>
        <Text style={[ui.body, { marginTop: 6 }]}>
          Na webu je ova sekcija već aktivna — ovdje dolazi isti sadržaj.
        </Text>
        <Text style={ui.statusAccent}>U pripremi</Text>
      </Panel>
    </Screen>
  );
}
