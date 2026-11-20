import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listServices } from '../../api/services.js';
import { legalEntity } from '../auth/platformLegal.js';
import {
  isLocalDesignMode,
  localDesignServices,
} from './localDesignFixtures.js';
import StudioEmptyState from './StudioEmptyState';
import StudioScreenShell from './StudioScreenShell';
import {
  serviceBillingLabel,
  serviceCapacityLabel,
} from './studioFormat.js';
import { formatCancellationWindow } from './studioTime.js';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioServicesScreenProps = {
  tenantId?: string;
  studioName?: string;
  onBack: () => void;
};

type ServiceRow = {
  id: string;
  name?: string;
  description?: string;
  durationMinutes?: number;
  slotIntervalMinutes?: number;
  capacity?: number;
  cancellationWindowMinutes?: number;
  price?: number;
  membershipRequired?: boolean;
  active?: boolean;
};

type FilterId = 'active' | 'all';

function resolveWebServicesUrl() {
  const fromEnv = String(
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_WEB_URL) || '',
  ).trim();
  const base = (fromEnv || legalEntity.website || '').replace(/\/$/, '');
  if (!base || /localhost|127\.0\.0\.1/i.test(base)) return '';
  return `${base}/stranica/usluge`;
}

/**
 * Usluge — pregled ponude. Dodavanje i uređivanje isključivo na webu.
 */
export default function StudioServicesScreen({
  tenantId,
  studioName,
  onBack,
}: StudioServicesScreenProps) {
  const [filter, setFilter] = useState<FilterId>('active');
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [usingLocalFixtures, setUsingLocalFixtures] = useState(false);
  const [loading, setLoading] = useState(Boolean(tenantId) || isLocalDesignMode());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const webServicesUrl = useMemo(() => resolveWebServicesUrl(), []);

  const activeServices = useMemo(
    () => services.filter((item) => item.active !== false),
    [services],
  );
  const visible = useMemo(
    () => (filter === 'active' ? activeServices : services),
    [filter, activeServices, services],
  );

  const load = useCallback(async (opts?: { refresh?: boolean }) => {
    const isRefresh = Boolean(opts?.refresh);
    // Fixtures only for local design when there is no tenant — never override live API.
    if (isLocalDesignMode() && !tenantId) {
      setUsingLocalFixtures(true);
      setServices(localDesignServices() as ServiceRow[]);
      setLoading(false);
      setRefreshing(false);
      setError('');
      return;
    }

    setUsingLocalFixtures(false);
    if (!tenantId) {
      setServices([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await listServices(tenantId);
      setServices(Array.isArray(data?.services) ? data.services : []);
    } catch {
      setServices([]);
      setError('Usluge se nisu učitale. Povucite dolje za ponovni pokušaj.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openWebApp() {
    if (!webServicesUrl) return;
    try {
      await Linking.openURL(webServicesUrl);
    } catch {
      setError('Web aplikacija se nije otvorila. Pokušajte kasnije.');
    }
  }

  const emptyTitle = services.length === 0
    ? 'Još nemate dodanih usluga.'
    : filter === 'active'
      ? 'Nema aktivnih usluga'
      : 'Nema usluga u ovom filteru';

  const emptyBody = services.length === 0
    ? 'Usluge možete dodati putem web aplikacije.'
    : 'Promijenite filter ili dodajte usluge na webu.';

  return (
    <StudioScreenShell
      studioName={studioName}
      onBack={onBack}
      title="Usluge"
      lead="Pregledajte usluge koje vaše poslovanje nudi klijentima."
      keyboardShouldPersistTaps="handled"
      refreshing={refreshing}
      onRefresh={() => {
        void load({ refresh: true });
      }}
    >
      <View style={ui.statsRow}>
        <View style={ui.stat}>
          <Text style={ui.statLabel}>Aktivne</Text>
          <Text style={ui.statValue}>{activeServices.length}</Text>
        </View>
        <View style={ui.stat}>
          <Text style={ui.statLabel}>Ukupno</Text>
          <Text style={ui.statValue}>{services.length}</Text>
        </View>
      </View>

      {usingLocalFixtures ? (
        <Text style={ui.fixtureBanner}>
          Lokalni demo podaci — samo za dizajn (__DEV__).
        </Text>
      ) : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}

      <View style={ui.filterRow}>
        {(
          [
            { id: 'active' as const, label: 'Aktivne' },
            { id: 'all' as const, label: 'Sve usluge' },
          ]
        ).map((item) => {
          const on = filter === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setFilter(item.id)}
              style={({ pressed }) => [
                ui.filterChip,
                on && ui.filterChipOn,
                pressed && ui.pressed,
              ]}
            >
              <Text style={[ui.filterLabel, on && ui.filterLabelOn]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={ui.loadingRow}>
          <ActivityIndicator color="#14B8A6" size="small" />
          <Text style={ui.hint}>Učitavamo usluge…</Text>
        </View>
      ) : null}

      {!loading && visible.length === 0 ? (
        <StudioEmptyState
          icon="list-outline"
          title={emptyTitle}
          body={emptyBody}
          actionLabel={webServicesUrl ? 'Otvori web aplikaciju' : undefined}
          onAction={webServicesUrl ? () => { void openWebApp(); } : undefined}
        />
      ) : null}

      {!loading && visible.length > 0 ? (
        <View style={ui.list}>
          {visible.map((item) => {
            const active = item.active !== false;
            const capacity = serviceCapacityLabel(item.capacity);
            const billing = serviceBillingLabel(item);
            return (
              <View key={item.id} style={[ui.row, !active && ui.rowMuted]}>
                <View style={ui.avatar}>
                  <Ionicons name="time-outline" size={18} color="#14B8A6" />
                </View>
                <View style={ui.rowCopy}>
                  <View style={ui.rowTitle}>
                    <Text style={ui.rowName} numberOfLines={1}>
                      {item.name || 'Usluga'}
                    </Text>
                    <Text
                      style={[ui.badge, active ? ui.badgeOk : ui.badgeMuted]}
                    >
                      {active ? 'Aktivna' : 'Neaktivna'}
                    </Text>
                  </View>
                  <Text style={ui.rowMeta}>
                    {item.durationMinutes || '—'}
                    {' '}
                    min
                    {capacity ? ` · ${capacity}` : ''}
                    {billing ? ` · ${billing}` : ''}
                  </Text>
                  <Text style={ui.rowDates}>
                    Otkaz:
                    {' '}
                    {formatCancellationWindow(item.cancellationWindowMinutes)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={ui.footerNote}>
        <Text style={ui.hint}>
          Usluge dodajete i uređujete u web aplikaciji. Na mobitelu možete
          pregledavati svoju ponudu i pratiti povezane termine i rezervacije.
        </Text>
        {webServicesUrl ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Otvori web aplikaciju"
            onPress={() => {
              void openWebApp();
            }}
            style={({ pressed }) => [ui.textLinkBtn, pressed && ui.pressed]}
          >
            <Text style={ui.textLinkLabel}>Otvori web aplikaciju</Text>
            <Ionicons name="open-outline" size={16} color="#14B8A6" />
          </Pressable>
        ) : null}
      </View>
    </StudioScreenShell>
  );
}
