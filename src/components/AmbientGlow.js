import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { EASE_SINE, USE_NATIVE_DRIVER } from "./anim";

// Concentric rings that slowly breathe behind a focal element. Position the
// container absolutely and render content above it.
export function GlowRings({ color, size = 320, ringCount = 3, opacity = 0.22, style }) {
  const pulses = useRef(
    Array.from({ length: ringCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const anims = pulses.map((value, i) =>
      Animated.sequence([
        Animated.delay(i * 420),
        Animated.loop(
          Animated.timing(value, {
            toValue: 1,
            duration: 2400,
            easing: EASE_SINE,
            useNativeDriver: USE_NATIVE_DRIVER,
          })
        ),
      ])
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [pulses]);

  return (
    <View pointerEvents="none" style={[styles.center, { width: size, height: size }, style]}>
      {pulses.map((value, i) => {
        const ringSize = size * (1 - i * 0.26);
        return (
          <Animated.View
            key={i}
            style={[
              styles.ring,
              {
                width: ringSize,
                height: ringSize,
                borderRadius: ringSize / 2,
                borderColor: color,
                opacity: value.interpolate({ inputRange: [0, 1], outputRange: [opacity, opacity * 0.35] }),
                transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// A soft equalizer strip whose bars sway like a quiet audio spectrum.
export function SpectrumBars({ color, count = 9, height = 26, opacity = 0.35, style }) {
  const values = useRef(Array.from({ length: count }, () => new Animated.Value(Math.random()))).current;

  useEffect(() => {
    const anims = values.map((value, i) =>
      Animated.sequence([
        Animated.delay(i * 120),
        Animated.loop(
          Animated.sequence([
            Animated.timing(value, { toValue: 1, duration: 620 + (i % 4) * 90, easing: EASE_SINE, useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.timing(value, { toValue: 0.25, duration: 620 + (i % 3) * 110, easing: EASE_SINE, useNativeDriver: USE_NATIVE_DRIVER }),
          ])
        ),
      ])
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [values]);

  return (
    <View pointerEvents="none" style={[styles.bars, { height }, style]}>
      {values.map((value, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            { backgroundColor: color, opacity },
            i === 0 && styles.barFirst,
            i === count - 1 && styles.barLast,
            { transform: [{ scaleY: value.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderWidth: 1.5 },
  bars: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bar: { width: 4, height: "100%", borderRadius: 3 },
  barFirst: { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
  barLast: { borderTopRightRadius: 3, borderBottomRightRadius: 3 },
});
