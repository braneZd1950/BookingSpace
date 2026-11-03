import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../features/auth/AuthContext';
import { tokens } from '../theme/tokens';
import { memberNavStyles as s } from '../ui/memberNavStyles';
import {
  IconDiscover,
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

type LinkItem = {
  href: string;
  match: (path: string) => boolean;
  label: string;
  Icon: NavIcon;
};

function memberLinks(slug: string): LinkItem[] {
  const base = `/(member)/${slug}`;
  return [
    {
      href: base,
      match: (p) =>
        (p === base || p === `${base}/` || p.endsWith(`/${slug}`))
        && !/(termini|otkrij|privatnost)/.test(p),
      label: 'Početna',
      Icon: IconHome,
    },
    {
      href: `${base}/termini`,
      match: (p) => /termini/.test(p),
      label: 'Termini',
      Icon: IconSlots,
    },
    {
      href: `${base}/otkrij`,
      match: (p) => /otkrij/.test(p),
      label: 'Otkrij',
      Icon: IconDiscover,
    },
    {
      href: `${base}/privatnost`,
      match: (p) => /privatnost/.test(p),
      label: 'Privatnost',
      Icon: IconPrivacy,
    },
  ];
}

/** Top brand strip — studio name only. */
export function MemberTopBar({
  slug,
  studioName,
  brand = tokens.brand,
}: Pick<Props, 'slug' | 'studioName' | 'brand'>) {
  const router = useRouter();
  const base = `/(member)/${slug}`;

  return (
    <View style={[s.top, { backgroundColor: brand }]} accessibilityRole="header">
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
    </View>
  );
}

/**
 * Bottom tab bar — same destinations as web `nav[aria-label=Član]`:
 * Početna · Termini · Otkrij · Privatnost · Odjava
 */
export function MemberBottomNav({
  slug,
  brand = tokens.brand,
  soft = tokens.brandSoft,
}: Omit<Props, 'studioName'>) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const links = memberLinks(slug);

  return (
    <View
      style={[
        s.bottom,
        {
          borderTopColor: `${brand}29`,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
      accessibilityRole="navigation"
      accessibilityLabel="Član"
    >
      <View style={s.tabs}>
        {links.map((link) => {
          const active = link.match(pathname);
          const color = active ? brand : `${tokens.fg}99`;
          const Icon = link.Icon;
          return (
            <Pressable
              key={link.href}
              onPress={() => router.push(link.href as Href)}
              style={[s.tab, active ? { backgroundColor: soft } : null]}
              accessibilityRole="button"
              accessibilityLabel={link.label}
              accessibilityState={{ selected: active }}
            >
              <Icon color={color} />
              <Text style={[s.tabLabel, { color }]}>{link.label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => void logout()}
          style={[s.power, { borderColor: `${brand}55` }]}
          accessibilityRole="button"
          accessibilityLabel="Odjava"
        >
          <IconPower color={brand} />
        </Pressable>
      </View>
    </View>
  );
}

/** @deprecated Prefer MemberTopBar + MemberBottomNav in layout. */
export function MemberNav(props: Props) {
  return (
    <>
      <MemberTopBar {...props} />
      <MemberBottomNav {...props} />
    </>
  );
}
