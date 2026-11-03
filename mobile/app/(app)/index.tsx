import { ScrollView, Text, View } from 'react-native';
import { SiteLive, SiteLoading, SiteSetupPending } from '../../src/components/SiteLive';
import { useStudio } from '../../src/features/studio/StudioContext';
import { ui } from '../../src/ui/styles';

/**
 * Owner Početna — same as web `/stranica` StudioHome:
 * live SiteFrame preview when guideDone, else setup prompt.
 */
export default function HomeScreen() {
  const { ready, studio, error } = useStudio();

  if (!ready) return <SiteLoading />;

  if (error) {
    return (
      <View style={[ui.screenBody, { flex: 1 }]}>
        <Text style={ui.errorText}>{error}</Text>
      </View>
    );
  }

  if (!studio) {
    return (
      <View style={[ui.screenBody, { flex: 1 }]}>
        <Text style={ui.sectionTitle}>Nema studija</Text>
        <Text style={[ui.lede, { marginTop: 8 }]}>
          Prijavite se kao vlasnik studija ili dovršite registraciju na webu.
        </Text>
      </View>
    );
  }

  if (!studio.guideDone) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <SiteSetupPending
          studioName={studio.name}
          hostHint={`/s/${studio.slug}`}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: studio.theme.canvas }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <SiteLive studio={studio} />
    </ScrollView>
  );
}
