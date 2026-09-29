import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { USE_NATIVE_DRIVER } from "./anim";

const NOTE_GLYPHS = ["♪", "♫", "♩", "♬"];

// Floating music-note particles that rise and fade. Fires whenever `trigger`
// increments (pass a counter). Set `fireOnMount` for celebration-on-arrival.
export default function NoteBurst({
  trigger = 0,
  fireOnMount = false,
  count = 8,
  color = "#b49cee",
  rise = 130,
  spread = 110,
}) {
  const [particles, setParticles] = useState([]);
  const lastTrigger = useRef(trigger);
  const firedOnMount = useRef(false);

  useEffect(() => {
    if (fireOnMount && !firedOnMount.current) {
      firedOnMount.current = true;
      lastTrigger.current = trigger;
      spawn(count);
      return;
    }
    if (trigger !== lastTrigger.current) {
      lastTrigger.current = trigger;
      spawn(count);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, fireOnMount, count]);

  const spawn = (n) => {
    const batch = [];
    for (let i = 0; i < n; i++) {
      const id = `p${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
      const progress = new Animated.Value(0);
      batch.push({
        id,
        progress,
        glyph: NOTE_GLYPHS[i % NOTE_GLYPHS.length],
        size: 13 + Math.random() * 12,
        drift: (Math.random() - 0.5) * spread,
        offset: (Math.random() - 0.5) * spread * 0.7,
      });
      Animated.timing(progress, {
        toValue: 1,
        delay: i * 45,
        duration: 950,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (finished) setParticles((prev) => prev.filter((p) => p.id !== id));
      });
    }
    setParticles((prev) => [...prev, ...batch]);
  };

  return (
    <View pointerEvents="none" style={styles.fill}>
      {particles.map((p) => (
        <Animated.Text
          key={p.id}
          style={[
            styles.note,
            {
              color,
              fontSize: p.size,
              left: "50%",
              opacity: p.progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.9, 0] }),
              transform: [
                { translateX: p.progress.interpolate({ inputRange: [0, 1], outputRange: [p.offset, p.drift] }) },
                { translateY: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, -rise] }) },
                { scale: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.25] }) },
              ],
            },
          ]}
        >
          {p.glyph}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  note: {
    position: "absolute",
    bottom: 6,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
