import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useAuth } from '../features/auth/AuthContext';
import {
  buildMemberNavLinks,
  memberBaseHref,
} from '../features/nav/memberNavConfig';
import { tokens } from '../theme/tokens';
import { memberNavStyles as s } from '../ui/memberNavStyles';
import {
  IconDiscover,
  IconGear,
  IconHome,
  IconPower,
  IconPrivacy,
  IconSlots,
} from './StudioNavIcons';

type NavIcon = ComponentType<{ color: string }>;

type Props = {
  slug: string;
  studioName: string;
  brand?: string;
  soft?: string;
};

const ICONS: Record<string, NavIcon> = {
  home: IconHome,
  slots: IconSlots,
  discover: IconDiscover,
  privacy: IconPrivacy,
  settings: IconGear,
};

/**
 * Single top bar — same layout as owner StudioNav / web member header:
 * studio name left, icons + logout right.
 */
export function MemberNav({
  slug,
  studioName,
  brand = tokens.brand,
  soft = tokens.brandSoft,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const base = memberBaseHref(slug);
  const links = buildMemberNavLinks(slug);

  return (
    <View style={[s.bar, { backgroundColor: brand }]} accessibilityRole="header">
      <Pressable
        style={s.brand}
        onPress={() => router.push(base as Href)}
        accessibilityRole="link"
        accessibilityLabel={studioName}
      >
        <Text style={s.brandText} numberOfLines={1}>
          {studioName}
        </Text>
      </Pressable>

      <View style={s.items} accessibilityRole="navigation" accessibilityLabel="Član">
        {links.map((link) => {
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
          onPress={() => void logout()}
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

/** @deprecated Use MemberNav */
export function MemberTopBar(props: Props) {
  return <MemberNav {...props} />;
}

/** @deprecated Icons live in MemberNav header now. */
export function MemberBottomNav(_props: Omit<Props, 'studioName'>) {
  return null;
}
