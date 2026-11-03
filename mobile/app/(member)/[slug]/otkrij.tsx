import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { discoverTenants, getPublicTenant, type DiscoverPlace } from '../../../src/api/tenants';
import { studioFromTenant } from '../../../src/features/studio/studioMap';
import { font } from '../../../src/theme/fonts';
import { tokens } from '../../../src/theme/tokens';

/** Member Otkrij — same route idea as web `/s/:slug/otkrij`. */
export default function MemberOtkrijScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<DiscoverPlace[]>([]);
  const [brand, setBrand] = useState<string>(tokens.brand);
  const [ink, setInk] = useState<string>(tokens.fg);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (slug) {
          const tenant = await getPublicTenant(String(slug));
          if (!cancelled) {
            const studio = studioFromTenant(tenant);
            setBrand(studio.theme.primaryColor || tokens.brand);
            setInk(studio.theme.ink || tokens.fg);
          }
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError('');
        try {
          const rows = await discoverTenants({ q: query.trim(), limit: 60 });
          if (!cancelled) setPlaces(rows);
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Pretraga nije uspjela.');
            setPlaces([]);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={{
          fontFamily: font.bodyExtra,
          fontSize: 11.5,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: brand,
        }}
      >
        Član
      </Text>
      <Text style={{ fontFamily: font.display, fontSize: 32, letterSpacing: -1, color: ink }}>
        Otkrij.
      </Text>
      <Text style={{ fontFamily: font.bodyRegular, fontSize: 15, lineHeight: 22, color: `${ink}94` }}>
        Pronađite druge studio stranice na platformi.
      </Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Traži studio…"
        placeholderTextColor={`${ink}66`}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: `${brand}33`,
          borderRadius: 3.2,
          backgroundColor: '#fff',
          paddingVertical: 11,
          paddingHorizontal: 14,
          fontFamily: font.body,
          fontSize: 15,
          color: ink,
        }}
      />

      {error ? (
        <Text style={{ color: tokens.fullInk, backgroundColor: tokens.fullSoft, padding: 12, borderRadius: 3.2 }}>
          {error}
        </Text>
      ) : null}

      {loading ? (
        <ActivityIndicator color={brand} />
      ) : places.length === 0 ? (
        <Text style={{ fontFamily: font.bodyRegular, color: `${ink}8C` }}>Nema rezultata.</Text>
      ) : (
        places.map((place) => (
          <Pressable
            key={place.slug || place.id || place.name}
            onPress={() => {
              if (!place.slug) return;
              router.push(`/(member)/${place.slug}` as Href);
            }}
            style={{
              borderWidth: 1,
              borderColor: `${brand}29`,
              borderRadius: 3.2,
              backgroundColor: '#fff',
              padding: 14,
              gap: 4,
            }}
          >
            <Text style={{ fontFamily: font.bodySemi, fontSize: 16, color: ink }}>{place.name}</Text>
            {place.city ? (
              <Text style={{ fontFamily: font.bodyRegular, fontSize: 13, color: `${ink}8C` }}>
                {place.city}
              </Text>
            ) : null}
            {place.description ? (
              <Text
                numberOfLines={2}
                style={{ fontFamily: font.bodyRegular, fontSize: 13.5, lineHeight: 19, color: `${ink}94` }}
              >
                {place.description}
              </Text>
            ) : null}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
