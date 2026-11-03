import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { env } from '../config/env';
import { useAuth } from '../features/auth/AuthContext';
import { useStudio } from '../features/studio/StudioContext';
import { tokens } from '../theme/tokens';
import { navStyles as s } from '../ui/navStyles';
import {
  IconCalendar,
  IconChart,
  IconGear,
  IconHome,
  IconPeople,
  IconPower,
  IconSlots,
} from './StudioNavIcons';

type NavIcon = ComponentType<{ color: string }>;

type NavItem = {
  href: Href;
  match: (path: string) => boolean;
  label: string;
  Icon: NavIcon;
};

/** Same pilot set as web StudioLayout (prep flags off). */
const LINKS: NavItem[] = [
  {
    href: '/(app)',
    match: (p) =>
      (p === '/' || p === '' || /\/\(app\)\/?$/.test(p) || /\/index$/.test(p))
      && !/(termini|studio|kalendar|clanovi|member|analitika|postavke)/.test(p),
    label: 'Početna',
    Icon: IconHome,
  },
  {
    href: '/(app)/termini',
    match: (p) => /termini|studio/.test(p),
    label: 'Termini',
    Icon: IconSlots,
  },
  {
    href: '/(app)/kalendar',
    match: (p) => /kalendar/.test(p),
    label: 'Kalendar',
    Icon: IconCalendar,
  },
  {
    href: '/(app)/clanovi',
    match: (p) => /clanovi|member/.test(p),
    label: 'Članovi',
    Icon: IconPeople,
  },
  {
    href: '/(app)/analitika',
    match: (p) => /analitika/.test(p),
    label: 'Analitika',
    Icon: IconChart,
  },
  {
    href: '/(app)/postavke',
    match: (p) => /postavke/.test(p),
    label: 'Postavke',
    Icon: IconGear,
  },
];

/** Top bar = web `.studio-nav` with identical SVG icons. */
export function StudioNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { studio } = useStudio();

  const brand = studio?.theme.primaryColor || tokens.brand;
  const soft = studio?.theme.secondaryColor || tokens.brandSoft;
  const label = studio?.name || env.appName;

  return (
    <View style={[s.bar, { backgroundColor: brand }]} accessibilityRole="header">
      <Pressable
        style={s.brand}
        onPress={() => router.push('/(app)')}
        accessibilityRole="link"
        accessibilityLabel={label}
      >
        <Text style={s.brandText} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>

      <View style={s.items} accessibilityRole="navigation" accessibilityLabel="Studio">
        {LINKS.map((link) => {
          const active = link.match(pathname);
          const color = active ? brand : tokens.onBrand;
          const Icon = link.Icon;
          return (
            <Pressable
              key={String(link.href)}
              onPress={() => router.push(link.href)}
              style={[s.item, active ? { backgroundColor: soft } : null]}
              accessibilityRole="button"
              accessibilityLabel={link.label}
              accessibilityState={{ selected: active }}
            >
              <Icon color={color} />
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => logout()}
          style={s.power}
          accessibilityRole="button"
          accessibilityLabel="Odjava"
        >
          <IconPower color={tokens.onBrand} />
        </Pressable>
      </View>
    </View>
  );
}
