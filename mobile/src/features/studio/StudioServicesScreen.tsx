import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createService, listServices, updateService } from '../../api/services.js';
import {
  isFixtureId,
  isLocalDesignMode,
  localDesignServices,
} from './localDesignFixtures.js';
import StudioEmptyState from './StudioEmptyState';
import StudioListHead from './StudioListHead';
import StudioPresetRow from './StudioPresetRow';
import StudioScreenShell from './StudioScreenShell';
import { serviceCountLabel } from './studioFormat.js';
import { formatCancellationWindow } from './studioTime.js';
import { studioUiStyles as ui } from './studioUiStyles.js';
import { useStudioFormReveal } from './useStudioFormReveal.js';

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

const DURATION_PRESETS = [30, 45, 60, 90] as const;
const CAPACITY_PRESETS = [1, 6, 8, 12] as const;
const CANCEL_PRESETS = [0, 30, 60, 120] as const;

/**
 * Usluge — ponuda, trajanje, kapacitet i rok otkaza.
 */
export default function StudioServicesScreen({
  tenantId,
  studioName,
  onBack,
}: StudioServicesScreenProps) {
  const {
    formOpen,
    formVisible,
    openForm: revealOpen,
    closeForm: revealClose,
    formRevealStyle,
  } = useStudioFormReveal();

  const [filter, setFilter] = useState<FilterId>('active');
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [usingLocalFixtures, setUsingLocalFixtures] = useState(false);
  const [loading, setLoading] = useState(Boolean(tenantId) || isLocalDesignMode());
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [name, setName] = useState('Termin');
  const [duration, setDuration] = useState('60');
  const [capacity, setCapacity] = useState('12');
  const [cancelWindow, setCancelWindow] = useState('60');
  const [membershipRequired, setMembershipRequired] = useState(true);

  const activeServices = useMemo(
    () => services.filter((item) => item.active !== false),
    [services],
  );
  const visible = useMemo(
    () => (filter === 'active' ? activeServices : services),
    [filter, activeServices, services],
  );

  const load = useCallback(async () => {
    if (isLocalDesignMode()) {
      setUsingLocalFixtures(true);
      setServices(localDesignServices() as ServiceRow[]);
      setLoading(false);
      setError('');
      return;
    }

    setUsingLocalFixtures(false);
    if (!tenantId) {
      setServices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await listServices(tenantId);
      setServices(Array.isArray(data?.services) ? data.services : []);
    } catch {
      setServices([]);
      setError('Usluge se nisu učitale. Pokušajte ponovno.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm(defaults?: Partial<ServiceRow>) {
    setName(defaults?.name || 'Termin');
    setDuration(String(defaults?.durationMinutes ?? 60));
    setCapacity(String(defaults?.capacity ?? 12));
    setCancelWindow(String(defaults?.cancellationWindowMinutes ?? 60));
    setMembershipRequired(defaults?.membershipRequired !== false);
    setFormError('');
    setEditingId(defaults?.id || null);
  }

  function openForm(service?: ServiceRow) {
    revealOpen(() => {
      setNotice('');
      resetForm(service);
    });
  }

  function closeForm(after?: () => void) {
    revealClose(() => {
      resetForm();
      after?.();
    });
  }

  function toggleForm() {
    if (formOpen || formVisible) {
      closeForm();
      return;
    }
    openForm();
  }

  async function onSave() {
    if (!name.trim()) {
      setFormError('Upišite naziv usluge.');
      return;
    }
    const durationMinutes = Number(duration);
    const capacityValue = Number(capacity);
    const cancellationWindowMinutes = Number(cancelWindow);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
      setFormError('Upišite trajanje u minutama.');
      return;
    }
    if (!Number.isFinite(capacityValue) || capacityValue < 1) {
      setFormError('Upišite kapacitet (najmanje 1).');
      return;
    }
    if (!Number.isFinite(cancellationWindowMinutes) || cancellationWindowMinutes < 0) {
      setFormError('Upišite rok otkaza u minutama.');
      return;
    }

    if (isFixtureId(editingId || undefined) || usingLocalFixtures) {
      setNotice('Lokalni demo podatak — spremanje u bazu je isključeno.');
      closeForm();
      return;
    }
    if (!tenantId) {
      setFormError('Studio još nije učitan.');
      return;
    }

    const body = {
      name: name.trim(),
      durationMinutes,
      slotIntervalMinutes: durationMinutes,
      capacity: capacityValue,
      cancellationWindowMinutes,
      price: 0,
      membershipRequired,
    };

    setSaving(true);
    setFormError('');
    try {
      if (editingId) {
        await updateService(editingId, body);
        closeForm(() => setNotice('Usluga je spremljena.'));
      } else {
        await createService(tenantId, body);
        closeForm(() => setNotice('Usluga je dodana.'));
      }
      await load();
    } catch {
      setFormError('Usluga nije spremljena. Provjerite podatke i pokušajte ponovno.');
    } finally {
      setSaving(false);
    }
  }

  async function onToggleActive(item: ServiceRow) {
    if (isFixtureId(item.id) || usingLocalFixtures) {
      setNotice('Lokalni demo podatak — promjena statusa je isključena.');
      return;
    }
    setBusyId(item.id);
    setNotice('');
    try {
      await updateService(item.id, { active: item.active === false });
      setNotice(
        item.active === false
          ? `${item.name || 'Usluga'} je ponovno aktivna.`
          : `${item.name || 'Usluga'} je deaktivirana.`,
      );
      await load();
    } catch {
      setError('Status usluge nije promijenjen.');
    } finally {
      setBusyId('');
    }
  }

  const addButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={formOpen ? 'Zatvori formu' : 'Dodaj uslugu'}
      onPress={toggleForm}
      style={({ pressed }) => [ui.addBtnSolid, pressed && ui.pressed]}
    >
      <Ionicons
        name={formOpen ? 'close' : 'add-outline'}
        size={20}
        color="#061210"
      />
    </Pressable>
  );

  return (
    <StudioScreenShell
      studioName={studioName}
      onBack={onBack}
      title="Usluge"
      lead="Ponuda i trajanja"
      titleAccessory={addButton}
      keyboardShouldPersistTaps="handled"
    >
      <View style={ui.statsRow}>
        <View style={ui.stat}>
          <Text style={ui.statLabel}>Aktivne</Text>
          <Text style={ui.statValue}>{activeServices.length}</Text>
        </View>
        <View style={ui.stat}>
          <Text style={ui.statLabel}>Sve</Text>
          <Text style={ui.statValue}>{services.length}</Text>
        </View>
      </View>

      {usingLocalFixtures ? (
        <Text style={ui.fixtureBanner}>
          Lokalni demo podaci — samo za dizajn (__DEV__).
        </Text>
      ) : null}
      {notice ? <Text style={ui.notice}>{notice}</Text> : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}

      {formVisible ? (
        <View style={ui.formShell}>
          <Animated.View style={[ui.form, formRevealStyle]}>
            <Text style={ui.sectionLabel}>
              {editingId ? 'Uredi uslugu' : 'Nova usluga'}
            </Text>
            <Text style={ui.formHint}>
              Trajanje, kapacitet i rok otkaza vrijede za rezervacije ove usluge.
            </Text>
            <TextInput
              style={ui.input}
              value={name}
              onChangeText={setName}
              placeholder="Naziv usluge"
              placeholderTextColor="rgba(232, 242, 239, 0.28)"
              editable={!saving}
            />

            <StudioPresetRow
              label="Trajanje (min)"
              values={DURATION_PRESETS}
              selected={duration}
              onSelect={setDuration}
              disabled={saving}
            />
            <TextInput
              style={ui.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="Trajanje"
              placeholderTextColor="rgba(232, 242, 239, 0.28)"
              editable={!saving}
            />

            <StudioPresetRow
              label="Kapacitet"
              values={CAPACITY_PRESETS}
              selected={capacity}
              onSelect={setCapacity}
              disabled={saving}
            />
            <TextInput
              style={ui.input}
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
              placeholder="Kapacitet"
              placeholderTextColor="rgba(232, 242, 239, 0.28)"
              editable={!saving}
            />

            <StudioPresetRow
              label="Rok otkaza (min)"
              values={CANCEL_PRESETS}
              selected={cancelWindow}
              onSelect={setCancelWindow}
              formatValue={(value) => (value === 0 ? '0' : String(value))}
              disabled={saving}
            />
            <Text style={ui.cancelHint}>
              {formatCancellationWindow(Number(cancelWindow))}
            </Text>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: membershipRequired }}
              onPress={() => setMembershipRequired((value) => !value)}
              style={({ pressed }) => [ui.checkRow, pressed && ui.pressed]}
            >
              <View style={[ui.checkbox, membershipRequired && ui.checkboxOn]}>
                {membershipRequired ? (
                  <Ionicons name="checkmark" size={14} color="#061210" />
                ) : null}
              </View>
              <Text style={ui.checkLabel}>Zahtijeva aktivnu članarinu</Text>
            </Pressable>

            {formError ? <Text style={ui.error}>{formError}</Text> : null}
            <Pressable
              accessibilityRole="button"
              onPress={onSave}
              disabled={saving}
              style={({ pressed }) => [
                ui.primaryBtn,
                pressed && ui.pressed,
                saving && ui.disabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#061210" size="small" />
              ) : (
                <Text style={ui.primaryLabel}>
                  {editingId ? 'Spremi izmjene' : 'Dodaj uslugu'}
                </Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      ) : null}

      <View style={ui.filterRow}>
        {(
          [
            { id: 'active' as const, label: `Aktivne (${activeServices.length})` },
            { id: 'all' as const, label: `Sve (${services.length})` },
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

      <StudioListHead
        sectionLabel="Ponuda"
        dayLabel="Usluge za rezervacije"
        countLabel={serviceCountLabel(visible.length)}
        countStrong={visible.length > 0}
      />

      {loading ? (
        <View style={ui.loadingRow}>
          <ActivityIndicator color="#5EEAD4" size="small" />
          <Text style={ui.hint}>Učitavamo usluge…</Text>
        </View>
      ) : null}

      {!loading && visible.length === 0 ? (
        <StudioEmptyState
          icon="list-outline"
          title="Još nema usluga"
          body="Dodajte prvu uslugu da članovi mogu rezervirati termine."
          actionLabel={!formVisible ? 'Dodajte uslugu' : undefined}
          onAction={!formVisible ? () => openForm() : undefined}
        />
      ) : null}

      {!loading && visible.length > 0 ? (
        <View style={ui.list}>
          {visible.map((item) => {
            const active = item.active !== false;
            const busy = busyId === item.id;
            return (
              <View key={item.id} style={[ui.row, !active && ui.rowMuted]}>
                <View style={ui.avatar}>
                  <Ionicons name="time-outline" size={18} color="#5EEAD4" />
                </View>
                <View style={ui.rowCopy}>
                  <View style={ui.rowTitle}>
                    <Text style={ui.rowName} numberOfLines={1}>
                      {item.name || 'Usluga'}
                    </Text>
                    <Text
                      style={[ui.badge, active ? ui.badgeOk : ui.badgeMuted]}
                    >
                      {active ? 'Aktivno' : 'Neaktivno'}
                    </Text>
                  </View>
                  <Text style={ui.rowMeta}>
                    {item.durationMinutes || '—'} min
                    {' · '}
                    max {item.capacity || '—'}
                    {item.membershipRequired ? ' · članarina' : ''}
                  </Text>
                  <Text style={ui.rowDates}>
                    Otkaz: {formatCancellationWindow(item.cancellationWindowMinutes)}
                  </Text>
                  <View style={ui.actions}>
                    <Pressable
                      onPress={() => openForm(item)}
                      style={({ pressed }) => [ui.actionBtn, pressed && ui.pressed]}
                    >
                      <Text style={ui.actionLabel}>Uredi</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        void onToggleActive(item);
                      }}
                      disabled={Boolean(busyId)}
                      style={({ pressed }) => [
                        ui.actionBtn,
                        active ? ui.actionDanger : null,
                        pressed && ui.pressed,
                      ]}
                    >
                      {busy ? (
                        <ActivityIndicator
                          color={active ? '#FCA5A5' : '#5EEAD4'}
                          size="small"
                        />
                      ) : (
                        <Text
                          style={
                            active ? ui.actionDangerLabel : ui.actionLabel
                          }
                        >
                          {active ? 'Deaktiviraj' : 'Aktiviraj'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </StudioScreenShell>
  );
}
