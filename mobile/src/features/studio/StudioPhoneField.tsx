import React, { useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { updateTenant } from '../../api/tenants.js';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioPhoneFieldProps = {
  studioId?: string;
  phone?: string | null;
  onSaved: (phone: string) => void;
};

/** Inline phone fact row with reveal edit for studio home. */
export default function StudioPhoneField({
  studioId,
  phone,
  onSaved,
}: StudioPhoneFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const reveal = useRef(new Animated.Value(0)).current;
  const actions = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  function stopAnim() {
    animRef.current?.stop();
    animRef.current = null;
  }

  function openEdit() {
    stopAnim();
    setDraft('');
    setError('');
    setEditing(true);
    reveal.setValue(0);
    actions.setValue(0);
    requestAnimationFrame(() => {
      const anim = Animated.parallel([
        Animated.timing(reveal, {
          toValue: 1,
          duration: 780,
          easing: Easing.bezier(0.33, 0.1, 0.25, 1),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.sequence([
          Animated.delay(280),
          Animated.timing(actions, {
            toValue: 1,
            duration: 520,
            easing: Easing.bezier(0.33, 0.1, 0.25, 1),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      ]);
      animRef.current = anim;
      anim.start(({ finished }) => {
        if (finished) {
          setTimeout(() => inputRef.current?.focus(), 60);
        }
      });
    });
  }

  function closeEdit(after?: () => void) {
    stopAnim();
    inputRef.current?.blur();
    const anim = Animated.parallel([
      Animated.timing(actions, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(reveal, {
        toValue: 0,
        duration: 420,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    animRef.current = anim;
    anim.start(({ finished }) => {
      if (!finished) return;
      setEditing(false);
      setDraft('');
      setError('');
      after?.();
    });
  }

  async function save() {
    const next = draft.trim();
    if (!next) {
      setError('Upišite broj telefona.');
      return;
    }
    if (!studioId) {
      setError('Studio još nije učitan. Pokušajte ponovno.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateTenant(studioId, { phone: next });
      onSaved(next);
      closeEdit();
    } catch {
      setError('Spremanje nije uspjelo. Pokušajte ponovno.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[ui.factRow, editing && styles.factRowPhoneEdit]}>
      <View style={ui.factIcon}>
        <Ionicons name="call-outline" size={18} color="#5EEAD4" />
      </View>
      {editing ? (
        <View style={styles.phoneEditWrap}>
          <View style={styles.phoneEditRow}>
            <Animated.View
              style={[
                styles.phoneInputShell,
                {
                  opacity: reveal,
                  transform: [
                    {
                      translateX: reveal.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-22, 0],
                      }),
                    },
                    {
                      scaleX: reveal.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.92, 1],
                      }),
                    },
                    {
                      scaleY: reveal.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.98, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={ui.inputCompact}
                value={draft}
                onChangeText={(value) => {
                  setDraft(value);
                  if (error) setError('');
                }}
                placeholder="+385 …"
                placeholderTextColor="rgba(232, 242, 239, 0.28)"
                keyboardType="phone-pad"
                editable={!saving}
                accessibilityLabel="Telefon"
                returnKeyType="done"
                onSubmitEditing={save}
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.phoneActionGroup,
                {
                  opacity: actions,
                  transform: [
                    {
                      translateX: actions.interpolate({
                        inputRange: [0, 1],
                        outputRange: [8, 0],
                      }),
                    },
                    {
                      scale: actions.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.94, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Spremi telefon"
                onPress={() => {
                  void save();
                }}
                disabled={saving}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.phoneIconBtn,
                  styles.phoneIconBtnPrimary,
                  pressed && ui.pressed,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#061210" size="small" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="#061210" />
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Odustani"
                onPress={() => closeEdit()}
                disabled={saving}
                hitSlop={8}
                style={({ pressed }) => [styles.phoneIconBtn, pressed && ui.pressed]}
              >
                <Ionicons name="close" size={18} color="rgba(232, 242, 239, 0.55)" />
              </Pressable>
            </Animated.View>
          </View>
          {error ? <Text style={ui.error}>{error}</Text> : null}
        </View>
      ) : (
        <View style={ui.factCopy}>
          <Text style={ui.factLabel}>Telefon</Text>
          {phone ? (
            <Text style={ui.factValue}>{phone}</Text>
          ) : (
            <View style={styles.phoneIdle}>
              <Text style={[ui.factValue, ui.factMuted]}>Nije upisan</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dodaj telefon"
                onPress={openEdit}
                hitSlop={8}
                style={({ pressed }) => [styles.phoneAddBtn, pressed && ui.pressed]}
              >
                <Ionicons name="add-outline" size={18} color="#5EEAD4" />
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

type FactRowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

export function StudioFactRow({ icon, label, value }: FactRowProps) {
  return (
    <View style={ui.factRow}>
      <View style={ui.factIcon}>
        <Ionicons name={icon} size={18} color="#5EEAD4" />
      </View>
      <View style={ui.factCopy}>
        <Text style={ui.factLabel}>{label}</Text>
        <Text style={ui.factValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  factRowPhoneEdit: { alignItems: 'center' },
  phoneIdle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  phoneEditWrap: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    overflow: 'hidden',
  },
  phoneEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneInputShell: {
    flex: 1,
    minWidth: 0,
    transformOrigin: 'left center',
  },
  phoneActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232, 242, 239, 0.08)',
  },
  phoneIconBtnPrimary: {
    backgroundColor: '#5EEAD4',
  },
});
