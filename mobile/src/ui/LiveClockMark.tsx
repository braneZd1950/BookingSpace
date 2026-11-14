import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { USE_NATIVE_DRIVER } from '../lib/nativeDriver.js';

type LiveClockMarkProps = {
  size?: number;
  accentColor?: string;
  faceColor?: string;
  /** Decorative “slobodan termin” mark — landing only. */
  showSlotMark?: boolean;
};

function clockAngles(now = new Date()) {
  const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;
  return {
    secondDeg: seconds * 6,
    minuteDeg: minutes * 6,
    hourDeg: hours * 30,
  };
}

function timeLabel(now = new Date()) {
  try {
    return now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }
}

/**
 * Brand sat — kazaljke prate lokalno vrijeme uređaja (sustavna vremenska zona).
 */
export default function LiveClockMark({
  size = 36,
  accentColor = '#5EEAD4',
  faceColor = 'rgba(10, 20, 18, 0.55)',
  showSlotMark = false,
}: LiveClockMarkProps) {
  const [now, setNow] = useState(() => new Date());
  const [{ minuteDeg, hourDeg, secondDeg }, setAngles] = useState(() => clockAngles());
  const markPulse = useRef(new Animated.Value(0.55)).current;
  const compact = size < 56;
  const showSeconds = size >= 64;

  useEffect(() => {
    const sync = () => {
      const next = new Date();
      setNow(next);
      setAngles(clockAngles(next));
    };
    sync();
    const id = setInterval(sync, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!showSlotMark) return undefined;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(markPulse, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(markPulse, {
          toValue: 0.45,
          duration: 2200,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [markPulse, showSlotMark]);

  const ticks = Array.from({ length: 12 }, (_, i) => i);
  const handOrigin = size / 2;
  const tickTop = Math.max(3, size * 0.06);
  const majorH = Math.max(3, size * 0.064);
  const minorH = Math.max(2, size * 0.035);
  const hubOuter = Math.max(4, size * 0.07);
  const hubInner = Math.max(2, size * 0.03);

  return (
    <View
      style={[
        styles.clock,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: faceColor,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Trenutno vrijeme ${timeLabel(now)}`}
    >
      <View
        style={[
          styles.clockRing,
          {
            borderRadius: size / 2,
            borderWidth: compact ? 1 : 1.5,
          },
        ]}
      />
      <View
        style={[
          styles.clockInner,
          {
            width: size * 0.78,
            height: size * 0.78,
            borderRadius: size * 0.39,
            borderColor: `${accentColor}2E`,
          },
        ]}
      />

      {ticks.map((tick) => (
        <View
          key={tick}
          style={[
            styles.tickWrap,
            {
              width: size,
              height: size,
              transform: [{ rotate: `${tick * 30}deg` }],
            },
          ]}
        >
          <View
            style={[
              styles.tick,
              {
                top: tickTop,
                width: tick % 3 === 0 ? (compact ? 1.5 : 2) : (compact ? 1 : 1.5),
                height: tick % 3 === 0 ? majorH : minorH,
                backgroundColor:
                  tick % 3 === 0
                    ? 'rgba(232, 242, 239, 0.82)'
                    : 'rgba(232, 242, 239, 0.35)',
              },
            ]}
          />
        </View>
      ))}

      {showSlotMark ? (
        <Animated.View
          style={[
            styles.slotMarkWrap,
            {
              width: size,
              height: size,
              opacity: markPulse,
              transform: [{ rotate: '150deg' }],
            },
          ]}
        >
          <View
            style={[
              styles.slotMark,
              {
                top: size * 0.1,
                backgroundColor: accentColor,
                shadowColor: accentColor,
              },
            ]}
          />
        </Animated.View>
      ) : null}

      <View
        style={[
          styles.handWrap,
          {
            width: size,
            height: size,
            transform: [{ rotate: `${hourDeg}deg` }],
          },
        ]}
      >
        <View
          style={[
            styles.handHour,
            {
              width: compact ? 2 : 3,
              height: size * 0.22,
              top: handOrigin - size * 0.22,
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.handWrap,
          {
            width: size,
            height: size,
            transform: [{ rotate: `${minuteDeg}deg` }],
          },
        ]}
      >
        <View
          style={[
            styles.handMinute,
            {
              width: compact ? 1.5 : 2,
              height: size * 0.32,
              top: handOrigin - size * 0.32,
              backgroundColor: accentColor,
            },
          ]}
        />
      </View>

      {showSeconds ? (
        <View
          style={[
            styles.handWrap,
            {
              width: size,
              height: size,
              transform: [{ rotate: `${secondDeg}deg` }],
            },
          ]}
        >
          <View
            style={[
              styles.handSecond,
              {
                height: size * 0.36,
                top: handOrigin - size * 0.36,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.hubOuter,
          {
            width: hubOuter,
            height: hubOuter,
            borderRadius: hubOuter / 2,
          },
        ]}
      />
      <View
        style={[
          styles.hubInner,
          {
            width: hubInner,
            height: hubInner,
            borderRadius: hubInner / 2,
            backgroundColor: accentColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockRing: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(232, 242, 239, 0.22)',
  },
  clockInner: {
    position: 'absolute',
    borderWidth: 1,
    backgroundColor: 'rgba(5, 10, 9, 0.35)',
  },
  tickWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  tick: {
    position: 'absolute',
    borderRadius: 1,
  },
  slotMarkWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  slotMark: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.65,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  handWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  handHour: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: 'rgba(232, 242, 239, 0.88)',
  },
  handMinute: {
    position: 'absolute',
    borderRadius: 2,
  },
  handSecond: {
    position: 'absolute',
    width: 1,
    borderRadius: 1,
    opacity: 0.85,
  },
  hubOuter: {
    backgroundColor: 'rgba(232, 242, 239, 0.35)',
  },
  hubInner: {
    position: 'absolute',
  },
});
