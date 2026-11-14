import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { mediaUrl } from '../../lib/mediaUrl.js';
import { memberChromeStyles as chrome } from './memberChrome';

type ViewToken = {
  item?: unknown;
  key?: string;
  index?: number | null;
  isViewable?: boolean;
};

type MemberGalleryScreenProps = {
  tenant: any;
  onBack: () => void;
};

type Shot = {
  id: string;
  uri: string;
  alt?: string;
};

function collectShots(tenant: any): Shot[] {
  const gallery = Array.isArray(tenant?.siteSettings?.gallery)
    ? tenant.siteSettings.gallery
    : [];
  const fromGallery = gallery
    .map((item: any, index: number) => {
      const raw = typeof item === 'string' ? item : item?.url;
      const uri = mediaUrl(raw);
      if (!uri) return null;
      return {
        id: item?.publicId || item?.url || `gallery-${index}`,
        uri,
        alt: item?.alt || tenant?.name || 'Fotografija studija',
      };
    })
    .filter(Boolean) as Shot[];

  if (fromGallery.length) return fromGallery;

  const fallbacks: Shot[] = [];
  const hero = mediaUrl(tenant?.heroImageUrl);
  if (hero) {
    fallbacks.push({ id: 'hero', uri: hero, alt: `${tenant?.name || 'Studio'} — naslovnica` });
  }
  const logo = mediaUrl(tenant?.logoUrl);
  if (logo) {
    fallbacks.push({ id: 'logo', uri: logo, alt: `${tenant?.name || 'Studio'} — logo` });
  }
  return fallbacks;
}

function pageIndexFromOffset(offsetX: number, pageWidth: number) {
  if (pageWidth <= 0) return 0;
  return Math.max(0, Math.round(offsetX / pageWidth));
}

export default function MemberGalleryScreen({ tenant, onBack }: MemberGalleryScreenProps) {
  const { height, width } = useWindowDimensions();
  const compact = height < 740;
  const shots = useMemo(() => collectShots(tenant), [tenant]);
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const listRef = useRef<FlatList<Shot>>(null);
  const lightboxRef = useRef<FlatList<Shot>>(null);

  const stageWidth = Math.min(440, width);
  const slideWidth = stageWidth;
  const slideHeight = Math.min(Math.round(height * (compact ? 0.42 : 0.48)), 360);

  function onCarouselScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(pageIndexFromOffset(event.nativeEvent.contentOffset.x, slideWidth));
  }

  function onLightboxScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setLightboxIndex(pageIndexFromOffset(event.nativeEvent.contentOffset.x, width));
  }

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index == null) return;
    setIndex(first.index);
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  function openLightbox(at: number) {
    setLightboxIndex(at);
    setLightboxOpen(true);
    requestAnimationFrame(() => {
      lightboxRef.current?.scrollToIndex({ index: at, animated: false });
    });
  }

  return (
    <View style={[chrome.root, { backgroundColor: '#0E1614' }]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#163028', '#111A18', '#0E1614']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.header,
          {
            paddingTop: compact ? 44 : 56,
            maxWidth: stageWidth,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [chrome.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={18} color="#5EEAD4" />
          <Text style={[chrome.backLabel, { color: '#5EEAD4' }]}>Početna</Text>
        </Pressable>

        <Text style={[chrome.studio, { color: 'rgba(94, 234, 212, 0.85)' }]}>
          {tenant?.name || 'Studio'}
        </Text>
        <Text style={[chrome.title, { color: '#E8F2EF' }]}>Galerija</Text>
        <Text style={styles.lead}>
          Povucite prstom lijevo ili desno za pregled fotografija.
        </Text>
      </View>

      {shots.length === 0 ? (
        <View style={[styles.empty, { maxWidth: stageWidth }]}>
          <Ionicons name="images-outline" size={28} color="#5EEAD4" />
          <Text style={styles.emptyTitle}>Još nema fotografija</Text>
          <Text style={styles.emptyLead}>
            Studio još nije objavio galeriju. Provjerite kasnije.
          </Text>
        </View>
      ) : (
        <View style={[styles.carouselWrap, { maxWidth: stageWidth }]}>
          <FlatList
            ref={listRef}
            data={shots}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            bounces
            style={{ width: slideWidth }}
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, itemIndex) => ({
              length: slideWidth,
              offset: slideWidth * itemIndex,
              index: itemIndex,
            })}
            renderItem={({ item, index: itemIndex }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.alt || 'Otvori fotografiju'}
                onPress={() => openLightbox(itemIndex)}
                style={{ width: slideWidth, height: slideHeight, paddingHorizontal: 24 }}
              >
                <View style={styles.slideFrame}>
                  <Image
                    source={{ uri: item.uri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    accessibilityLabel={item.alt}
                  />
                  <View style={styles.slideShade} />
                </View>
              </Pressable>
            )}
          />

          <View style={styles.dots}>
            {shots.map((shot, dotIndex) => (
              <Pressable
                key={shot.id}
                accessibilityRole="button"
                accessibilityLabel={`Slika ${dotIndex + 1}`}
                onPress={() => {
                  listRef.current?.scrollToIndex({ index: dotIndex, animated: true });
                  setIndex(dotIndex);
                }}
                style={[styles.dot, dotIndex === index && styles.dotOn]}
              />
            ))}
          </View>
        </View>
      )}

      <Modal
        visible={lightboxOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxOpen(false)}
      >
        <View style={styles.lightbox}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zatvori"
            onPress={() => setLightboxOpen(false)}
            style={styles.lightboxClose}
          >
            <Ionicons name="close" size={24} color="#F7FCFA" />
          </Pressable>

          <FlatList
            ref={lightboxRef}
            data={shots}
            keyExtractor={(item) => `lb-${item.id}`}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={lightboxIndex}
            getItemLayout={(_, itemIndex) => ({
              length: width,
              offset: width * itemIndex,
              index: itemIndex,
            })}
            onScroll={onLightboxScroll}
            scrollEventThrottle={16}
            onScrollToIndexFailed={({ index: failedIndex }) => {
              requestAnimationFrame(() => {
                lightboxRef.current?.scrollToIndex({ index: failedIndex, animated: false });
              });
            }}
            renderItem={({ item }) => (
              <View style={{ width, height, justifyContent: 'center' }}>
                <Image
                  source={{ uri: item.uri }}
                  style={[styles.lightboxImage, { height: height * 0.72 }]}
                  resizeMode="contain"
                  accessibilityLabel={item.alt}
                />
              </View>
            )}
          />

          <Text style={styles.lightboxCaption}>
            {shots[lightboxIndex]?.alt || ''}
            {shots.length > 1 ? `  ·  ${lightboxIndex + 1}/${shots.length}` : ''}
          </Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    width: '100%',
    alignSelf: 'center',
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.68)',
    marginBottom: 18,
  },
  empty: {
    marginHorizontal: 24,
    alignSelf: 'center',
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.2)',
    padding: 20,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 24,
    color: '#F7FCFA',
  },
  emptyLead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(232, 242, 239, 0.68)',
  },
  carouselWrap: {
    width: '100%',
    alignSelf: 'center',
  },
  slideFrame: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(12, 28, 24, 0.8)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.14)',
  },
  slideShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6, 9, 8, 0.06)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 24,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(232, 242, 239, 0.28)',
  },
  dotOn: {
    width: 18,
    backgroundColor: '#5EEAD4',
  },
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(4, 8, 7, 0.96)',
    justifyContent: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 28,
    right: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  lightboxImage: {
    width: '100%',
    height: '78%',
  },
  lightboxCaption: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.72)',
    textAlign: 'center',
  },
  pressed: { opacity: 0.86 },
});
