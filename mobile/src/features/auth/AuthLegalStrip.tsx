import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import LegalDocumentScreen, { type LegalDocId } from './LegalDocumentScreen';

const LINKS: { id: LegalDocId; label: string }[] = [
  { id: 'privatnost', label: 'Privatnost' },
  { id: 'uvjeti', label: 'Uvjeti' },
  { id: 'kolacici', label: 'Kolačići' },
];

/**
 * Platformski linkovi — otvaraju iste pravne tekstove kao na webu.
 */
export default function AuthLegalStrip() {
  const [docId, setDocId] = useState<LegalDocId | null>(null);

  return (
    <>
      <View
        style={styles.legalStrip}
        accessibilityRole="text"
        accessibilityLabel="Pravila platforme"
      >
        {LINKS.map((item, index) => (
          <View key={item.id} style={styles.legalItem}>
            {index > 0 ? (
              <Text style={styles.legalDot} accessibilityElementsHidden>
                ·
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={item.label}
              onPress={() => setDocId(item.id)}
              style={({ pressed }) => [
                styles.legalLink,
                pressed && styles.legalLinkPressed,
              ]}
            >
              <Text style={styles.legalLinkLabel}>{item.label}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Modal
        visible={docId !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setDocId(null)}
      >
        {docId ? (
          <LegalDocumentScreen
            docId={docId}
            onClose={() => setDocId(null)}
            onChangeDoc={setDocId}
          />
        ) : null}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  legalStrip: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legalDot: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.28)',
    paddingHorizontal: 2,
  },
  legalLink: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  legalLinkPressed: {
    opacity: 0.7,
  },
  legalLinkLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    letterSpacing: 0.2,
    color: 'rgba(232, 242, 239, 0.52)',
  },
});
