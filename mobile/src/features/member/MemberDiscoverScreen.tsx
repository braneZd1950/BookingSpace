import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { listMyMemberships } from '../../api/memberships.js';
import { discoverTenants } from '../../api/tenants.js';
import { signupNiches } from '../auth/signupDefaults.js';

type MemberDiscoverScreenProps = {
  slug: string;
  studioName?: string;
  onBack: () => void;
  onOpenStudio: (next: { slug: string; tenantName?: string }) => void;
};

type Place = {
  id?: string;
  name: string;
  slug: string;
  niche?: string;
  city?: string;
  categoryId?: string;
};

const CATEGORIES = [
  { id: 'all', label: 'Sve' },
  { id: 'fitness', label: 'Treninzi' },
  { id: 'services', label: 'Usluge' },
  { id: 'playroom', label: 'Igraonice' },
  { id: 'generic', label: 'Ostalo' },
];

function nicheCategory(niche?: string) {
  if (!niche) return 'generic';
  if (['fitness', 'pilates', 'yoga', 'powerplate'].includes(niche)) return 'fitness';
  if (niche === 'services' || niche === 'playroom' || niche === 'generic') return niche;
  return 'generic';
}

export default function MemberDiscoverScreen({
  slug,
  studioName,
  onBack,
  onOpenStudio,
}: MemberDiscoverScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim());
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [otherStudios, setOtherStudios] = useState<Place[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [discover, mine] = await Promise.all([
          discoverTenants({ q: deferredQuery, category: 'all', limit: 100 }),
          listMyMemberships(50).catch(() => null),
        ]);
        if (cancelled) return;

        const live = (discover?.places || []).map((place: any) => ({
          id: place.id || place.slug,
          name: place.name || place.tenant?.name || 'Studio',
          slug: place.slug || place.tenant?.slug || '',
          niche: place.niche || place.tenant?.niche || '',
          city: place.city || place.tenant?.city || '',
          categoryId: nicheCategory(place.niche || place.categoryId),
        })).filter((item: Place) => item.slug);

        setPlaces(live);

        const memberships = Array.isArray(mine?.memberships) ? mine.memberships : [];
        setOtherStudios(
          memberships
            .filter((item: any) => item.status === 'ACTIVE' && item.tenant?.slug && item.tenant.slug !== slug)
            .map((item: any) => ({
              id: item.id,
              name: item.tenant?.name || 'Studio',
              slug: item.tenant.slug,
              niche: item.tenant?.niche || '',
            })),
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Pregled nije učitan.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deferredQuery, slug]);

  const filtered = useMemo(() => {
    return places.filter((place) => {
      if (place.slug === slug) return false;
      if (category !== 'all' && place.categoryId !== category) return false;
      return true;
    });
  }, [places, category, slug]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0C1815', '#070B0A', '#050706']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: compact ? 44 : 56, paddingBottom: 36 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={18} color="#5EEAD4" />
          <Text style={styles.backLabel}>Početna</Text>
        </Pressable>

        <Text style={styles.studio}>{studioName || 'anyminutes'}</Text>
        <Text style={styles.title}>Otkrij</Text>
        <Text style={styles.lead}>
          Pronađite druge studije ili prijeđite na studio u kojem ste član.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Traži studio…"
          placeholderTextColor="rgba(232, 242, 239, 0.35)"
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cats}>
          {CATEGORIES.map((item) => {
            const on = category === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.id)}
                style={({ pressed }) => [
                  styles.catChip,
                  on && styles.catChipOn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.catLabel, on && styles.catLabelOn]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {otherStudios.length > 0 ? (
          <View style={styles.block}>
            <Text style={styles.kicker}>Vaši studiji</Text>
            {otherStudios.map((item) => (
              <Pressable
                key={item.id || item.slug}
                onPress={() => onOpenStudio({ slug: item.slug, tenantName: item.name })}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowMeta}>Aktivna članarina</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#5EEAD4" />
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.kicker}>Studiji</Text>
        {loading ? (
          <ActivityIndicator color="#5EEAD4" style={{ marginTop: 12 }} />
        ) : filtered.length === 0 ? (
          <Text style={styles.hint}>Nema rezultata za ovaj upit.</Text>
        ) : (
          filtered.map((place) => {
            const niche = signupNiches.find((item) => item.id === nicheCategory(place.niche));
            return (
              <Pressable
                key={place.id || place.slug}
                onPress={() => onOpenStudio({ slug: place.slug, tenantName: place.name })}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{place.name}</Text>
                  <Text style={styles.rowMeta}>
                    {[niche?.name, place.city].filter(Boolean).join(' · ') || place.slug}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#5EEAD4" />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060908' },
  content: {
    paddingHorizontal: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#5EEAD4',
  },
  studio: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: 'rgba(94, 234, 212, 0.85)',
    marginBottom: 6,
  },
  title: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 36,
    lineHeight: 40,
    color: '#E8F2EF',
    marginBottom: 8,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.68)',
    marginBottom: 16,
  },
  search: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.24)',
    paddingHorizontal: 14,
    color: '#F7FCFA',
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    marginBottom: 12,
  },
  cats: { marginBottom: 16 },
  catChip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.22)',
  },
  catChipOn: {
    borderColor: '#5EEAD4',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  catLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.72)',
  },
  catLabelOn: { color: '#5EEAD4' },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#FCA5A5',
    marginBottom: 10,
  },
  block: { marginBottom: 18 },
  kicker: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#5EEAD4',
    marginBottom: 10,
  },
  hint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.62)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(232, 242, 239, 0.14)',
  },
  rowTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#F7FCFA',
  },
  rowMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.58)',
    marginTop: 2,
  },
  pressed: { opacity: 0.82 },
});
