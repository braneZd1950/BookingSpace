import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  aboutPhoto,
  heroPhoto,
  HOUR_ROWS,
  hoursLine,
  type StudioView,
} from '../features/studio/studioMap';
import { siteStyles as s } from '../ui/siteStyles';

type Props = {
  studio: StudioView;
  /** Override book CTA (member shell uses `/(member)/[slug]/termini`). */
  onBook?: () => void;
};

/**
 * Live studio home — mirror of web `SiteFrame` with `withBar={false}`
 * (owner Početna after guideDone).
 */
export function SiteLive({ studio, onBook }: Props) {
  const router = useRouter();
  const theme = studio.theme;
  const canBook = studio.sections.schedule || studio.sections.services;
  const heroSrc = heroPhoto(studio);
  const aboutSrc = aboutPhoto(studio);

  function goBook() {
    if (onBook) {
      onBook();
      return;
    }
    router.push('/(app)/termini');
  }

  return (
    <View style={[s.root, { backgroundColor: theme.canvas }]}>
      <ImageBackground
        source={{ uri: heroSrc }}
        style={s.hero}
        imageStyle={{ opacity: 1 }}
      >
        <View
          style={{
            ...StyleSheetAbsolute,
            backgroundColor: 'rgba(12,18,24,0.55)',
          }}
        />
        <View style={s.heroCopy}>
          {studio.logoUrl ? (
            <Image source={{ uri: studio.logoUrl }} style={s.logo} />
          ) : null}
          <Text style={s.heroTitle}>{studio.name}</Text>
          {studio.description ? (
            <Text style={s.heroLead}>{studio.description}</Text>
          ) : null}
          {canBook ? (
            <Pressable
              style={s.bookLight}
              onPress={goBook}
              accessibilityRole="button"
              accessibilityLabel="Odaberite termin"
            >
              <Text style={[s.bookLightLabel, { color: theme.primaryColor }]}>
                Odaberite termin
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ImageBackground>

      {studio.sections.about && studio.description ? (
        <View style={s.section}>
          <Text style={[s.sectionEyebrow, { color: theme.primaryColor }]}>O studiju</Text>
          <Text style={[s.sectionBody, { color: theme.ink }]}>{studio.description}</Text>
          <Image
            source={{ uri: aboutSrc }}
            style={[s.bandPhoto, { backgroundColor: theme.secondaryColor }]}
          />
        </View>
      ) : null}

      {canBook ? (
        <View style={s.ctaRow}>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={[s.sectionEyebrow, { color: theme.primaryColor }]}>Termini</Text>
            <Text style={[s.sectionBody, { color: theme.ink }]}>
              Odaberite sat. Mjesto je slobodno ili puno — to se vidi odmah.
            </Text>
          </View>
          <Pressable
            style={[s.bookSolid, { backgroundColor: theme.primaryColor }]}
            onPress={goBook}
            accessibilityRole="button"
          >
            <Text style={s.bookSolidLabel}>Odaberite termin</Text>
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          s.foot,
          {
            borderTopColor: `${theme.primaryColor}29`,
            backgroundColor: `${theme.secondaryColor}6A`,
          },
        ]}
      >
        <View>
          <Text style={[s.footEyebrow, { color: theme.primaryColor }]}>Vaša poveznica</Text>
          <Text style={[s.footBrand, { color: theme.ink }]}>{studio.name}</Text>
          <Text style={[s.sectionBody, { color: theme.ink, opacity: 0.78 }]}>
            Rezervirajte termin online — prema radnom vremenu i pravilima studija.
          </Text>
          {canBook ? (
            <Pressable
              style={[s.bookSolid, { backgroundColor: theme.primaryColor, marginTop: 14, alignSelf: 'flex-start' }]}
              onPress={goBook}
            >
              <Text style={s.bookSolidLabel}>Termini</Text>
            </Pressable>
          ) : null}
        </View>

        {studio.sections.openingHours ? (
          <View>
            <Text style={[s.sectionEyebrow, { color: theme.primaryColor }]}>Radno vrijeme</Text>
            <View style={s.footList}>
              {HOUR_ROWS.map(([key, label]) => (
                <Text key={key} style={[s.sectionBody, { color: theme.ink, fontSize: 15 }]}>
                  {hoursLine(label, studio.hours[key])}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {studio.sections.contact || studio.sections.location ? (
          <View>
            <Text style={[s.sectionEyebrow, { color: theme.primaryColor }]}>Kontakt</Text>
            <View style={s.footList}>
              {studio.sections.contact && studio.phone ? (
                <Text
                  style={[s.sectionBody, { color: theme.primaryColor, fontSize: 15 }]}
                  onPress={() => Linking.openURL(`tel:${studio.phone.replace(/[^\d+]/g, '')}`)}
                >
                  {studio.phone}
                </Text>
              ) : null}
              {studio.sections.contact && studio.email ? (
                <Text
                  style={[s.sectionBody, { color: theme.primaryColor, fontSize: 15 }]}
                  onPress={() => Linking.openURL(`mailto:${studio.email}`)}
                >
                  {studio.email}
                </Text>
              ) : null}
              {studio.sections.location && studio.address ? (
                <Text style={[s.sectionBody, { color: theme.ink, fontSize: 15 }]}>
                  {studio.address}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function SiteSetupPending({
  studioName,
  hostHint,
}: {
  studioName?: string;
  hostHint?: string;
}) {
  return (
    <View style={[s.setupPanel, { borderColor: '#d9e2e3', backgroundColor: '#fff' }]}>
      <Text style={[s.footBrand, { color: '#112b2e' }]}>Početna</Text>
      <Text style={[s.sectionBody, { color: '#55696c' }]}>
        Dovršite postavljanje da klijenti vide {hostHint || studioName || 'stranicu studija'}.
      </Text>
    </View>
  );
}

export function SiteLoading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator size="large" color="#0e6b73" />
    </View>
  );
}

const StyleSheetAbsolute = {
  position: 'absolute' as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};
