import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyTenants } from '../../api/tenants.js';
import { useCancelledEffect } from '../../lib/useCancelledEffect.js';
import { useOwnerLogout } from '../../lib/useOwnerLogout.js';
import AppBrandBar from '../../ui/AppBrandBar';
import { findSignupNiche } from '../auth/signupDefaults.js';
import StudioAnalyticsScreen from './StudioAnalyticsScreen';
import StudioBookingsScreen from './StudioBookingsScreen';
import StudioBoot from './StudioBoot';
import StudioCalendarScreen from './StudioCalendarScreen';
import StudioMembersScreen from './StudioMembersScreen';
import StudioPhoneField, { StudioFactRow } from './StudioPhoneField';
import StudioScreenShell from './StudioScreenShell';
import StudioServicesScreen from './StudioServicesScreen';
import StudioSettingsScreen from './StudioSettingsScreen';
import { STUDIO_HOME_NAV } from './studioHomeNav.js';
import { studioHomeStyles as styles } from './studioHomeStyles.js';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioHomeScreenProps = {
  fallbackName?: string;
  fallbackEmail?: string;
  fromRegister?: boolean;
  onLogout?: () => void;
};

type StudioInfo = {
  id?: string;
  name: string;
  slug?: string;
  niche?: string;
  nicheCustom?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
};

type PanelId =
  | 'home'
  | 'bookings'
  | 'calendar'
  | 'members'
  | 'services'
  | 'analytics'
  | 'settings';

/**
 * Početni ekran prostora — osnovni podaci + brzi izbornik.
 */
export default function StudioHomeScreen({
  fallbackName,
  fallbackEmail,
  onLogout,
}: StudioHomeScreenProps) {
  const { loggingOut, handleLogout } = useOwnerLogout(onLogout);
  const [studio, setStudio] = useState<StudioInfo | null>(
    fallbackName ? { name: fallbackName, email: fallbackEmail } : null,
  );
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<PanelId>('home');
  const [hint, setHint] = useState('');

  useCancelledEffect(({ cancelled }) => {
    void (async () => {
      try {
        const data = await getMyTenants();
        const owned = data?.tenants?.find(
          (item: { role?: string }) => item.role === 'BUSINESS_OWNER',
        );
        const tenant = owned?.tenant;
        if (!cancelled() && tenant) {
          setStudio({
            id: tenant.id || tenant._id,
            name: tenant.name || fallbackName || 'Studio',
            slug: tenant.slug,
            niche: tenant.niche,
            nicheCustom: tenant.nicheCustom,
            email: tenant.email || fallbackEmail,
            phone: tenant.phone,
            address: tenant.address,
            city: tenant.city,
          });
        }
      } catch {
        /* fallback */
      } finally {
        if (!cancelled()) setLoading(false);
      }
    })();
  }, [fallbackName, fallbackEmail]);

  if (loading) return <StudioBoot />;

  const studioName = studio?.name || fallbackName || 'Studio';
  const host = studio?.slug ? `${studio.slug}.booking.hr` : null;
  const nicheLabel =
    studio?.niche === 'generic' && studio?.nicheCustom
      ? studio.nicheCustom
      : studio?.niche
        ? findSignupNiche(studio.niche).name
        : null;
  const email = studio?.email || fallbackEmail || null;
  const phone = studio?.phone?.trim() || null;
  const goHome = () => setPanel('home');

  function onNavPress(id: PanelId | string, label: string) {
    const known = STUDIO_HOME_NAV.some((item) => item.id === id);
    if (known) {
      setHint('');
      setPanel(id as PanelId);
      return;
    }
    setHint(`${label} stiže u sljedećem koraku.`);
  }

  if (panel === 'bookings') {
    return (
      <StudioBookingsScreen
        tenantId={studio?.id}
        studioName={studioName}
        siteHost={host}
        onBack={goHome}
      />
    );
  }

  if (panel !== 'home') {
    const shared = {
      tenantId: studio?.id,
      studioName,
      onBack: goHome,
    };
    if (panel === 'members') return <StudioMembersScreen {...shared} />;
    if (panel === 'services') return <StudioServicesScreen {...shared} />;
    if (panel === 'analytics') return <StudioAnalyticsScreen {...shared} />;
    if (panel === 'calendar') return <StudioCalendarScreen {...shared} />;
    if (panel === 'settings') {
      return (
        <StudioSettingsScreen
          {...shared}
          onLogout={handleLogout}
          onStudioUpdated={(patch) => {
            setStudio((current) =>
              current
                ? {
                    ...current,
                    ...patch,
                    name: patch.name || current.name,
                  }
                : current,
            );
          }}
        />
      );
    }
  }

  return (
    <StudioScreenShell
      title={studioName}
      lead="Sve za vaš studio na jednom mjestu — termini, kalendar, članovi, usluge i analitika."
      topBar={<AppBrandBar onLogout={handleLogout} loggingOut={loggingOut} />}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.facts} accessibilityLabel="Podaci poslovanja">
        <Text style={ui.sectionLabel}>Podaci poslovanja</Text>

        {host ? (
          <StudioFactRow icon="globe-outline" label="Adresa stranice" value={host} />
        ) : null}
        {nicheLabel ? (
          <StudioFactRow icon="apps-outline" label="Vrsta poslovanja" value={nicheLabel} />
        ) : null}
        {email ? <StudioFactRow icon="mail-outline" label="E-pošta" value={email} /> : null}

        <StudioPhoneField
          studioId={studio?.id}
          phone={phone}
          onSaved={(next) => {
            setStudio((current) => (current ? { ...current, phone: next } : current));
          }}
        />
      </View>

      <Text style={[ui.sectionLabel, styles.menuTitle]}>Brzi izbornik</Text>
      <View style={styles.menuGrid}>
        {STUDIO_HOME_NAV.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => onNavPress(item.id, item.label)}
            style={({ pressed }) => [styles.menuCard, pressed && ui.pressed]}
          >
            <Ionicons name={item.icon as any} size={20} color="#5EEAD4" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuNote}>{item.note}</Text>
          </Pressable>
        ))}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </StudioScreenShell>
  );
}
