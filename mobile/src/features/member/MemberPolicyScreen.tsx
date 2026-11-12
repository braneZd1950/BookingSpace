import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MemberChrome from './memberChrome';

type MemberPolicyScreenProps = {
  tenant: any;
  onBack: () => void;
};

const DOCS = [
  { kind: 'privacy', index: '01', label: 'Privatnost' },
  { kind: 'terms', index: '02', label: 'Uvjeti' },
  { kind: 'cookies', index: '03', label: 'Kolačići' },
] as const;

const META = {
  privacy: {
    title: 'Politika privatnosti',
    lead: 'Kako ovaj studio obrađuje podatke klijenata i članova.',
  },
  terms: {
    title: 'Uvjeti korištenja',
    lead: 'Pravila rezervacija, članarina i korištenja stranice studija.',
  },
  cookies: {
    title: 'Kolačići',
    lead: 'Što se sprema u pregledniku radi prijave i rada rezervacija.',
  },
};

function paragraphsFromLegal(raw: string) {
  return String(raw || '')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function MemberPolicyScreen({ tenant, onBack }: MemberPolicyScreenProps) {
  const [kind, setKind] = useState<'privacy' | 'terms' | 'cookies'>('privacy');
  const legal = tenant?.siteSettings?.legal || {};
  const body = legal[kind] || '';
  const lines = useMemo(() => paragraphsFromLegal(body), [body]);
  const meta = META[kind];

  return (
    <MemberChrome
      onBack={onBack}
      uiTheme="dark"
      kicker={tenant?.name || 'Studio'}
      title={meta.title}
      lead={meta.lead}
      contentStyle={{ paddingBottom: 36 }}
    >
        <View style={styles.tabs}>
          {DOCS.map((doc) => {
            const on = kind === doc.kind;
            return (
              <Pressable
                key={doc.kind}
                onPress={() => setKind(doc.kind)}
                style={({ pressed }) => [
                  styles.tab,
                  on && styles.tabOn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.tabIndex}>{doc.index}</Text>
                <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>{doc.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {lines.length === 0 ? (
          <Text style={styles.hint}>Dokument još nije objavljen za ovaj studio.</Text>
        ) : (
          lines.map((line, index) => {
            if (index === 0) {
              return (
                <Text key={`h-${index}`} style={styles.docTitle}>
                  {line}
                </Text>
              );
            }
            const dot = line.indexOf('.');
            const maybeNum = dot > 0 ? line.slice(0, dot) : '';
            const sectionTitle = dot > 0 ? line.slice(dot + 1).trimStart() : '';
            if (/^\d+$/.test(maybeNum) && sectionTitle) {
              return (
                <Text key={`s-${index}`} style={styles.docSection}>
                  {maybeNum.padStart(2, '0')}  {sectionTitle}
                </Text>
              );
            }
            return (
              <Text key={`p-${index}`} style={styles.docBody}>
                {line}
              </Text>
            );
          })
        )}
    </MemberChrome>
  );
}

const styles = StyleSheet.create({
  tabs: { gap: 8, marginBottom: 20 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.18)',
  },
  tabOn: {
    borderColor: '#5EEAD4',
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
  },
  tabIndex: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: 'rgba(94, 234, 212, 0.75)',
    width: 22,
  },
  tabLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.72)',
  },
  tabLabelOn: { color: '#5EEAD4' },
  hint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.62)',
  },
  docTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 24,
    color: '#F7FCFA',
    marginBottom: 14,
  },
  docSection: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#E8F2EF',
    marginTop: 12,
    marginBottom: 8,
  },
  docBody: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.72)',
    marginBottom: 10,
  },
  pressed: { opacity: 0.82 },
});
