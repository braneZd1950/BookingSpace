import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { env } from '../config/env';
import { font } from '../theme/fonts';
import { tokens } from '../theme/tokens';

const CONTACT_EMAIL = 'kontakt@anyminutes.hr';

type Props = {
  code: string;
  title: string;
  lead: string;
  note?: string;
  hint?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  showContact?: boolean;
  contactPrefix?: string;
};

export function StatusScreen({
  code,
  title,
  lead,
  note,
  hint,
  primaryLabel = 'Pokušajte ponovno',
  onPrimary,
  secondaryLabel,
  onSecondary,
  showContact = false,
  contactPrefix = 'Hitno?',
}: Props) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.wash} pointerEvents="none" />
      <View style={styles.panel}>
        <Text style={styles.brand}>{env.appName}</Text>
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.lead}>{lead}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}

        <View style={styles.actions}>
          {onPrimary ? (
            <Pressable style={styles.cta} onPress={onPrimary} accessibilityRole="button">
              <Text style={styles.ctaLabel}>{primaryLabel}</Text>
            </Pressable>
          ) : null}
          {onSecondary && secondaryLabel ? (
            <Pressable style={styles.ghost} onPress={onSecondary} accessibilityRole="button">
              <Text style={styles.ghostLabel}>{secondaryLabel}</Text>
            </Pressable>
          ) : null}
        </View>

        {hint ? <Text style={styles.hint}>{hint}</Text> : null}

        {showContact ? (
          <Pressable
            onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            accessibilityRole="link"
          >
            <Text style={styles.meta}>
              {contactPrefix}
              {' '}
              <Text style={styles.metaLink}>{CONTACT_EMAIL}</Text>
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

export function MaintenanceScreen({ onRetry }: { onRetry?: () => void }) {
  const [hint, setHint] = useState(false);

  return (
    <StatusScreen
      code="Održavanje"
      title="Kratko smo na pauzi"
      lead="Trenutačno radimo na sustavu, pa je AnyMinutes privremeno nedostupan. Rezervacije i prijave vraćaju se čim završimo. Hvala vam na strpljenju."
      note="Sve vaše rezervacije i podaci ostaju sigurni i čekaju vas na istom mjestu."
      primaryLabel="Pokušajte ponovno"
      onPrimary={() => {
        setHint(true);
        onRetry?.();
      }}
      hint={hint ? 'Još uvijek radimo na tome. Pokušajte ponovno za koji trenutak.' : undefined}
      showContact
      contactPrefix="Hitno? Javite nam se na"
    />
  );
}

export function NotFoundScreen({ onHome }: { onHome?: () => void }) {
  return (
    <StatusScreen
      code="Termin ne postoji"
      title="Ovaj sat nije u rasporedu."
      lead="Ova stranica nije dio rasporeda — nema studija ni termina ovdje. Vratite se na početnu ili se prijavite."
      primaryLabel="Početna"
      onPrimary={onHome}
      secondaryLabel="Prijava"
      onSecondary={onHome}
    />
  );
}

export function ErrorScreen({ onRetry, onHome }: { onRetry?: () => void; onHome?: () => void }) {
  return (
    <StatusScreen
      code="Greška"
      title="Nešto je pošlo po zlu."
      lead="Aplikacija se nije učitala kako treba. Pokušajte ponovno — ako se problem ponovi, javite nam i nastavit ćemo odmah."
      primaryLabel="Pokušajte ponovno"
      onPrimary={onRetry}
      secondaryLabel="Početna"
      onSecondary={onHome}
      showContact
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.bg,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  wash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: tokens.brandSoft,
    opacity: 0.35,
  },
  panel: {
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    gap: 10,
  },
  brand: {
    fontFamily: font.brand,
    fontSize: 28,
    color: tokens.brandStrong,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  code: {
    fontFamily: font.bodyExtra,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: tokens.brand,
  },
  title: {
    fontFamily: font.brand,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: tokens.fg,
  },
  lead: {
    fontFamily: font.body,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.muted,
    marginTop: 2,
  },
  note: {
    fontFamily: font.bodySemi,
    fontSize: 15,
    lineHeight: 22,
    color: tokens.fg,
    marginTop: 4,
  },
  hint: {
    fontFamily: font.bodySemi,
    fontSize: 14,
    lineHeight: 20,
    color: tokens.muted,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  cta: {
    backgroundColor: tokens.brand,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: font.bodyBold,
    color: tokens.onBrand,
    fontSize: 15,
  },
  ghost: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: tokens.line,
  },
  ghostLabel: {
    fontFamily: font.bodyBold,
    color: tokens.fg,
    fontSize: 15,
  },
  meta: {
    marginTop: 16,
    fontFamily: font.body,
    fontSize: 14,
    color: tokens.muted,
  },
  metaLink: {
    fontFamily: font.bodyBold,
    color: tokens.brand,
  },
});
