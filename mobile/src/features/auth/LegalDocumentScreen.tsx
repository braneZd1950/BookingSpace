import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, DARK_SURFACE } from '../../lib/brandColors.js';
import {
  LEGAL_DOCS,
  LEGAL_UPDATED,
  findLegalDoc,
  legalEntity,
} from './platformLegal.js';

export type LegalDocId = 'privatnost' | 'uvjeti' | 'kolacici';

type LegalSection = {
  id?: string;
  title: string;
  summary?: string;
  paragraphs?: string[];
  bullets?: string[];
  note?: string;
  law?: string;
};

type LegalDocumentScreenProps = {
  docId: LegalDocId;
  onClose: () => void;
  onChangeDoc?: (id: LegalDocId) => void;
};

/**
 * Platformski pravni dokument — isti sadržaj kao web /privatnost|/uvjeti|/kolacici.
 */
export default function LegalDocumentScreen({
  docId,
  onClose,
  onChangeDoc,
}: LegalDocumentScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;

  const doc = useMemo(() => findLegalDoc(docId), [docId]);
  const sections = useMemo(
    () => (doc.sections() as LegalSection[]) || [],
    [doc],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={DARK_SURFACE.gradient as [string, string, ...string[]]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.stage,
          {
            paddingTop: compact ? 48 : 64,
            paddingBottom: compact ? 28 : 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={22} color={BRAND.teal} />
          <Text style={styles.backLabel}>Natrag</Text>
        </Pressable>

        <Text style={styles.brand}>{legalEntity.productName}</Text>
        <Text style={styles.kicker}>Jasna pravila · RH i EU</Text>
        <Text style={[styles.title, compact && { fontSize: 32, lineHeight: 36 }]}>
          {doc.title}
        </Text>
        <Text style={styles.lead}>{doc.lead}</Text>
        {doc.basis ? <Text style={styles.basis}>{doc.basis}</Text> : null}
        <Text style={styles.meta}>Na snazi od {LEGAL_UPDATED}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRail}
          style={styles.tabScroll}
        >
          {LEGAL_DOCS.map((item) => {
            const on = item.id === docId;
            return (
              <Pressable
                key={item.id}
                onPress={() => onChangeDoc?.(item.id as LegalDocId)}
                style={({ pressed }) => [
                  styles.tab,
                  on && styles.tabOn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.aside}>
          <Text style={styles.asideLabel}>Tko stoji iza usluge</Text>
          <Text style={styles.asideBody}>
            {legalEntity.legalName}
            {legalEntity.address ? ` · ${legalEntity.address}` : ''}
            {` · ${legalEntity.email}`}
          </Text>
          <Text style={styles.asideNote}>
            {legalEntity.productName} je alat za rezervacije. Studio nudi termin
            ili članstvo; mi držimo tehniku.
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={section.id || section.title} style={styles.clause}>
            <Text style={styles.clauseIndex}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            <View style={styles.clauseCopy}>
              <Text style={styles.clauseTitle}>{section.title}</Text>
              {section.summary ? (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Ukratko</Text>
                  <Text style={styles.summaryText}>{section.summary}</Text>
                </View>
              ) : null}
              {(section.paragraphs || []).map((text) => (
                <Text key={text} style={styles.paragraph}>
                  {text}
                </Text>
              ))}
              {section.bullets?.length ? (
                <View style={styles.bullets}>
                  {section.bullets.map((item) => (
                    <View key={item} style={styles.bulletRow}>
                      <Text style={styles.bulletMark}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {section.note ? (
                <Text style={styles.note}>{section.note}</Text>
              ) : null}
              {section.law ? <Text style={styles.law}>{section.law}</Text> : null}
            </View>
          </View>
        ))}

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
        >
          <Text style={styles.closeLabel}>Zatvorite</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: BRAND.navy },
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: BRAND.navy,
  },
  flex: { flex: 1, minHeight: 0 },
  stage: {
    paddingHorizontal: 24,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: -6,
    marginBottom: 18,
    paddingVertical: 4,
    paddingRight: 8,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: BRAND.teal,
  },
  brand: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 22,
    color: BRAND.onDark,
    marginBottom: 8,
  },
  kicker: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: BRAND.teal,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: BRAND.onDark,
    marginBottom: 12,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(248, 250, 252, 0.72)',
    marginBottom: 10,
  },
  basis: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(148, 163, 184, 0.85)',
    marginBottom: 8,
  },
  meta: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: BRAND.tealBright,
    marginBottom: 18,
  },
  tabScroll: { marginHorizontal: -24, marginBottom: 18 },
  tabRail: { paddingHorizontal: 24, gap: 8 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    backgroundColor: 'rgba(30, 41, 59, 0.55)',
  },
  tabOn: {
    borderColor: 'rgba(20, 184, 166, 0.55)',
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
  },
  tabLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(226, 232, 240, 0.55)',
  },
  tabLabelOn: { color: BRAND.teal },
  aside: {
    gap: 6,
    padding: 14,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.28)',
    backgroundColor: 'rgba(30, 41, 59, 0.72)',
  },
  asideLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: BRAND.blueBright,
  },
  asideBody: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(248, 250, 252, 0.9)',
  },
  asideNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(148, 163, 184, 0.95)',
  },
  clause: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  clauseIndex: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: BRAND.tealBright,
    marginTop: 3,
    width: 28,
  },
  clauseCopy: { flex: 1, gap: 8, minWidth: 0 },
  clauseTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
    lineHeight: 24,
    color: BRAND.onDark,
  },
  summaryBox: {
    gap: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.28)',
  },
  summaryLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: BRAND.blueBright,
  },
  summaryText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(226, 232, 240, 0.85)',
  },
  paragraph: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(148, 163, 184, 0.95)',
  },
  bullets: { gap: 6 },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bulletMark: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: BRAND.teal,
    lineHeight: 21,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(148, 163, 184, 0.95)',
  },
  note: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(148, 163, 184, 0.85)',
    fontStyle: 'italic',
  },
  law: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(45, 212, 191, 0.65)',
  },
  closeBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.4)',
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  pressed: { opacity: 0.75 },
});
