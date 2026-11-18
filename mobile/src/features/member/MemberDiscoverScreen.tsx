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
import {
  categoryLabel,
  discoverCategories,
  discoverCategoryTabs,
  toPublicDiscoverCategory,
} from '../../lib/discoverCategories.js';
import {
  allowsOnlineBookingFromDiscover,
  DISCOVER_VISIBILITY,
  isDiscoverExcludedTenant,
  isListedOnDiscover,
} from '../../lib/discoverVisibility.js';
import { colorsForTheme } from '../../lib/uiTheme.js';
import { memberChromeStyles as chrome } from './memberChrome';

type MemberDiscoverScreenProps = {
  slug: string;
  studioName?: string;
  uiTheme?: string;
  onBack: () => void;
  onOpenStudio: (next: { slug: string; tenantName?: string }) => void;
};

type Place = {
  id?: string;
  name: string;
  slug: string;
  niche?: string;
  city?: string;
  note?: string;
  categoryId?: string;
  discoverVisibility?: string;
  onlineBooking?: boolean;
};

function normalizePlace(place: any): Place | null {
  const slug = String(place.slug || place.tenant?.slug || '').trim();
  const name = String(place.name || place.tenant?.name || '').trim();
  if (!slug || !name) return null;
  if (isDiscoverExcludedTenant({ slug, name })) return null;

  const visibility = place.discoverVisibility || DISCOVER_VISIBILITY.PRIVATE;
  if (!isListedOnDiscover(visibility)) return null;

  const categoryId = toPublicDiscoverCategory(place.categoryId || place.niche || place.tenant?.niche);
  if (!categoryId) return null;

  return {
    id: place.id || slug,
    name,
    slug,
    niche: place.niche || place.tenant?.niche || '',
    city: place.city || place.tenant?.city || '',
    note: typeof place.note === 'string' ? place.note.trim() : '',
    categoryId,
    discoverVisibility: visibility,
    onlineBooking: allowsOnlineBookingFromDiscover(visibility),
  };
}

export default function MemberDiscoverScreen({
  slug,
  studioName,
  uiTheme = 'system',
  onBack,
  onOpenStudio,
}: MemberDiscoverScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const isPublicEntry = !slug;
  const colors = colorsForTheme(uiTheme);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim());
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [otherStudios, setOtherStudios] = useState<Place[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const [discover, mine] = await Promise.all([
          discoverTenants({ q: deferredQuery, category: 'all', limit: 100 }),
          listMyMemberships(50).catch(() => null),
        ]);
        if (cancelled) return;

        const live = (discover?.places || [])
          .map(normalizePlace)
          .filter(Boolean) as Place[];

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

  const sections = useMemo(() => {
    return discoverCategories
      .map((item) => ({
        ...item,
        places: filtered.filter((place) => place.categoryId === item.id),
      }))
      .filter((item) => item.places.length > 0);
  }, [filtered]);

  return (
    <View style={[chrome.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={colors.status as 'light' | 'dark'} />
      <LinearGradient
        colors={colors.gradient as [string, string, ...string[]]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          chrome.content,
          { paddingTop: compact ? 44 : 56, paddingBottom: 36 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [chrome.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.accent} />
          <Text style={[chrome.backLabel, { color: colors.accent }]}>
            {isPublicEntry ? 'Početna' : 'Natrag'}
          </Text>
        </Pressable>

        <Text style={[chrome.studio, { color: colors.accent }]}>
          {studioName || 'Blizari'}
        </Text>
        <Text style={[chrome.title, { color: colors.title }]}>Otkrij</Text>
        <Text style={[styles.headline, { color: colors.title }]}>
          Pronađite uslugu ili mjesto koje tražite.
        </Text>
        <Text style={[chrome.lead, { color: colors.muted }]}>
          Istražite igraonice, wellness, beauty, aktivnosti i druge usluge.
          Pronađite poslovanje koje vam odgovara i otvorite njegovu stranicu.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Pronađite poslovanje, uslugu, aktivnost ili grad."
          placeholderTextColor={colors.muted}
          style={[
            styles.search,
            {
              borderColor: colors.border,
              color: colors.title,
              backgroundColor: colors.card,
            },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Pretraživanje"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cats}>
          {discoverCategoryTabs.map((item) => {
            const on = category === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.id)}
                style={({ pressed }) => [
                  styles.catChip,
                  { borderColor: colors.border },
                  on && { borderColor: colors.accent, backgroundColor: colors.card },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.catLabel, { color: colors.soft }, on && { color: colors.accent }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        {otherStudios.length > 0 ? (
          <View style={styles.block}>
            <Text style={[styles.kicker, { color: colors.accent }]}>Vaša poslovanja</Text>
            {otherStudios.map((item) => (
              <Pressable
                key={item.id || item.slug}
                onPress={() => onOpenStudio({ slug: item.slug, tenantName: item.name })}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.title }]}>{item.name}</Text>
                  <Text style={[styles.rowMeta, { color: colors.muted }]}>Aktivna članarina</Text>
                </View>
                <Text style={[styles.rowAction, { color: colors.accent }]}>Otvori</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={[styles.kicker, { color: colors.accent }]}>Ponuda</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />
        ) : sections.length === 0 ? (
          <Text style={[styles.hint, { color: colors.muted }]}>
            {deferredQuery
              ? `Nema rezultata za „${deferredQuery}”. Pokušajte drugi pojam.`
              : 'Još nema javno vidljivih poslovanja. Vlasnici koji žele nove klijente mogu uključiti prikaz u Otkrij.'}
          </Text>
        ) : (
          sections.map((section) => (
            <View key={section.id} style={styles.block}>
              <Text style={[styles.sectionTitle, { color: colors.title }]}>{section.name}</Text>
              <Text style={[styles.sectionNote, { color: colors.muted }]}>{section.note}</Text>
              {section.places.map((place) => (
                <Pressable
                  key={place.id || place.slug}
                  onPress={() => onOpenStudio({ slug: place.slug, tenantName: place.name })}
                  style={({ pressed }) => [
                    styles.row,
                    { borderBottomColor: colors.border },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.title }]}>{place.name}</Text>
                    <Text style={[styles.rowMeta, { color: colors.muted }]}>
                      {[categoryLabel(place.categoryId), place.city].filter(Boolean).join(' · ')
                        || place.slug}
                    </Text>
                    {place.note ? (
                      <Text style={[styles.rowNote, { color: colors.muted }]} numberOfLines={2}>
                        {place.note}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.rowAction, { color: colors.accent }]}>
                    {place.onlineBooking ? 'Otvori' : 'Pogledaj'}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))
        )}

        <View style={[styles.block, styles.footerBlock, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>Istražite ponudu</Text>
          <Text style={[styles.footerCopy, { color: colors.muted }]}>
            Pregledajte dostupna poslovanja i njihove usluge. Kada pronađete ono
            što tražite, otvorite njihovu stranicu i provjerite mogućnosti rezervacije.
          </Text>
          <Text style={[styles.footerCopy, { color: colors.muted }]}>
            Rezervirajte izravno kod odabranog poslovanja — svako poslovanje
            samostalno upravlja svojom ponudom.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 22,
    lineHeight: 28,
    marginTop: 4,
    marginBottom: 8,
  },
  search: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
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
  },
  catLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
  },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    marginBottom: 10,
  },
  block: { marginBottom: 18 },
  footerBlock: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  kicker: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  sectionNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    marginBottom: 8,
  },
  footerCopy: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  hint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
  },
  rowMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  rowNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
  rowAction: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
  },
  pressed: { opacity: 0.82 },
});
