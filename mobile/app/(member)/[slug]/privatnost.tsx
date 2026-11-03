import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPublicTenant } from '../../../src/api/tenants';
import { generateAllStudioLegal } from '../../../src/lib/studioLegal';
import { studioFromTenant } from '../../../src/features/studio/studioMap';
import { font } from '../../../src/theme/fonts';
import { tokens } from '../../../src/theme/tokens';

const DOCS = [
  { id: 'privacy', label: 'Privatnost' },
  { id: 'terms', label: 'Uvjeti' },
  { id: 'cookies', label: 'Kolačići' },
] as const;

type DocId = (typeof DOCS)[number]['id'];

/** Member Privatnost — same idea as web `/s/:slug/privatnost`. */
export default function MemberPrivatnostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [doc, setDoc] = useState<DocId>('privacy');
  const [brand, setBrand] = useState<string>(tokens.brand);
  const [ink, setInk] = useState<string>(tokens.fg);
  const [body, setBody] = useState({ privacy: '', terms: '', cookies: '' });
  const [studioName, setStudioName] = useState('Studio');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) return;
      setLoading(true);
      setError('');
      try {
        const tenant = await getPublicTenant(String(slug));
        if (cancelled) return;
        const studio = studioFromTenant(tenant);
        setBrand(studio.theme.primaryColor || tokens.brand);
        setInk(studio.theme.ink || tokens.fg);
        setStudioName(studio.name);
        const generated = generateAllStudioLegal({
          name: studio.name,
          email: studio.email,
          phone: studio.phone,
          address: studio.address,
        });
        setBody({
          privacy: (tenant.siteSettings?.legal?.privacy || '').trim() || generated.privacy,
          terms: (tenant.siteSettings?.legal?.terms || '').trim() || generated.terms,
          cookies: (tenant.siteSettings?.legal?.cookies || '').trim() || generated.cookies,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Pravila nisu učitana.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={brand} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
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
        {studioName}
      </Text>
      <Text style={{ fontFamily: font.display, fontSize: 32, letterSpacing: -1, color: ink }}>
        Privatnost.
      </Text>
      <Text style={{ fontFamily: font.bodyRegular, fontSize: 15, lineHeight: 22, color: `${ink}94` }}>
        Pravila ovog studija — privatnost, uvjeti i kolačići.
      </Text>

      {error ? (
        <Text style={{ color: tokens.fullInk, backgroundColor: tokens.fullSoft, padding: 12, borderRadius: 3.2 }}>
          {error}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {DOCS.map((item) => {
          const on = doc === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setDoc(item.id)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 3.2,
                borderWidth: 1,
                borderColor: on ? brand : `${brand}33`,
                backgroundColor: on ? brand : '#fff',
              }}
            >
              <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: on ? '#fff' : brand }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text
        style={{
          fontFamily: font.bodyRegular,
          fontSize: 14.5,
          lineHeight: 22,
          color: ink,
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: `${brand}29`,
          borderRadius: 3.2,
          padding: 14,
        }}
      >
        {body[doc]}
      </Text>
    </ScrollView>
  );
}
