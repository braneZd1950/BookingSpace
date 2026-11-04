import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { env } from '../config/env';
import { useAuth } from '../features/auth/AuthContext';
import { STUDIO_NAV_LINKS } from '../features/nav/studioNavConfig';
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

const ICONS: Record<string, NavIcon> = {
  home: IconHome,
  slots: IconSlots,
  calendar: IconCalendar,
  members: IconPeople,
  analytics: IconChart,
  settings: IconGear,
};

/** Top bar = web `.studio-topbar` — brand left, icon tabs right. */
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
        {STUDIO_NAV_LINKS.map((link) => {
          const active = link.match(pathname);
          const color = active ? brand : tokens.onBrand;
          const Icon = ICONS[link.key];
          return (
            <Pressable
              key={link.key}
              onPress={() => router.push(link.href as Href)}
              style={[s.item, active ? { backgroundColor: soft } : null]}
              accessibilityRole="button"
              accessibilityLabel={link.label}
              accessibilityState={{ selected: active }}
            >
              {Icon ? <Icon color={color} /> : null}
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
