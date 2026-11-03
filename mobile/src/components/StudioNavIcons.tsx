import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Exact icons from `client/.../StudioLayout.jsx` (18×18 stroke). */
type IconProps = { color: string };

function Frame({ children }: { children: ReactNode }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      {children}
    </Svg>
  );
}

export function IconHome({ color }: IconProps) {
  return (
    <Frame>
      <Path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1v-9.5z"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Frame>
  );
}

export function IconSlots({ color }: IconProps) {
  return (
    <Frame>
      <Path d="M8 3v3M16 3v3" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Rect x={4} y={5.5} width={16} height={14.5} rx={2} fill="none" stroke={color} strokeWidth={2} />
      <Path d="M4 10.5h16" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Frame>
  );
}

export function IconCalendar({ color }: IconProps) {
  return (
    <Frame>
      <Path d="M8 3.5v3M16 3.5v3" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Rect x={4} y={5.5} width={16} height={14.5} rx={2} fill="none" stroke={color} strokeWidth={2} />
      <Path
        d="M8 12.2h.01M12 12.2h.01M16 12.2h.01M8 15.8h.01M12 15.8h.01"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Frame>
  );
}

export function IconPeople({ color }: IconProps) {
  return (
    <Frame>
      <Circle cx={9} cy={8.2} r={2.4} fill="none" stroke={color} strokeWidth={2} />
      <Path
        d="M4.2 18.5c.4-2.6 2.4-4 4.8-4s4.4 1.4 4.8 4"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={16.4} cy={8.8} r={2} fill="none" stroke={color} strokeWidth={2} />
      <Path
        d="M15.2 14.6c1.7.3 3 1.4 3.4 3.9"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Frame>
  );
}

export function IconChart({ color }: IconProps) {
  return (
    <Frame>
      <Path d="M4.5 19.5h15" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M7 16.5V11M12 16.5V7.5M17 16.5v-3.5"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Frame>
  );
}

export function IconGear({ color }: IconProps) {
  return (
    <Frame>
      <Circle cx={12} cy={12} r={3} fill="none" stroke={color} strokeWidth={2} />
      <Path
        d="M12 3.5v2.2M12 18.3v2.2M4.8 7.2l1.9 1.1M17.3 15.7l1.9 1.1M4.8 16.8l1.9-1.1M17.3 8.3l1.9-1.1"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Frame>
  );
}

export function IconPower({ color }: IconProps) {
  return (
    <Frame>
      <Path d="M12 3.2v8.2" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Path
        d="M7.1 6.4a7.2 7.2 0 1 0 9.8 0"
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Frame>
  );
}

/** Member nav — Otkrij (compass). */
export function IconDiscover({ color }: IconProps) {
  return (
    <Frame>
      <Circle cx={12} cy={12} r={8} fill="none" stroke={color} strokeWidth={2} />
      <Path
        d="M14.8 9.2 13 13l-3.8 1.8L11 11l3.8-1.8z"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Frame>
  );
}

/** Member nav — Privatnost (shield). */
export function IconPrivacy({ color }: IconProps) {
  return (
    <Frame>
      <Path
        d="M12 3.5 19 6.5v5.2c0 4.2-2.9 7.3-7 8.8-4.1-1.5-7-4.6-7-8.8V6.5L12 3.5z"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 12.1 11.2 13.8 14.8 10"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Frame>
  );
}
