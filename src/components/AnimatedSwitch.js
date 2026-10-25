import React, { useEffect, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import { EASE_IN, EASE_OUT, USE_NATIVE_DRIVER } from "./anim";

const ENTER_MS = 300;
const EXIT_MS = 200;
let nextEntryId = 1;

// Cross-fade page transitions for the manual router: when `activeKey`
// changes, the outgoing screen fades out on top while the incoming one fades
// in beneath it. `render(key)` builds the screen for a route key.
export default function AnimatedSwitch({ activeKey, render }) {
  const [entries, setEntries] = useState(() => [
    {
      id: nextEntryId++,
      key: activeKey,
      value: new Animated.Value(1),
      ty: new Animated.Value(0),
      exiting: false,
      started: true,
    },
  ]);

  useEffect(() => {
    setEntries((prev) => {
      const active = prev.find((entry) => !entry.exiting);
      if (active && active.key === activeKey) {
        return prev;
      }

      const entering = {
        id: nextEntryId++,
        key: activeKey,
        value: new Animated.Value(active ? 0 : 1),
        ty: new Animated.Value(active ? 12 : 0),
        exiting: false,
        started: !active,
      };

      if (!active) {
        // If all previous screens were exiting or empty, immediately mount entering screen
        return [entering];
      }

      const outgoing = { ...active, exiting: true, started: false };
      // Keep only one outgoing screen to prevent stacking during rapid taps
      return [entering, outgoing];
    });
  }, [activeKey]);

  useEffect(() => {
    for (const entry of entries) {
      if (entry.started) continue;
      entry.started = true;
      if (entry.exiting) {
        Animated.parallel([
          Animated.timing(entry.value, {
            toValue: 0,
            duration: EXIT_MS,
            easing: EASE_IN,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(entry.ty, {
            toValue: -10,
            duration: EXIT_MS,
            easing: EASE_IN,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]).start(({ finished }) => {
          if (finished) {
            setEntries((prev) => prev.filter((e) => e !== entry));
          }
        });
      } else {
        Animated.parallel([
          Animated.timing(entry.value, {
            toValue: 1,
            duration: ENTER_MS,
            easing: EASE_OUT,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(entry.ty, {
            toValue: 0,
            duration: ENTER_MS,
            easing: EASE_OUT,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]).start();
      }
    }
  }, [entries]);

  // Fallback resilience: never allow a blank or white screen if entries somehow emptied
  if (!entries || entries.length === 0) {
    return (
      <Animated.View
        key={`fallback-${activeKey}`}
        style={styles.layer}
      >
        {render(activeKey)}
      </Animated.View>
    );
  }

  return entries.map((entry) => (
    <Animated.View
      key={entry.id}
      pointerEvents={entry.exiting ? "none" : "auto"}
      style={[
        styles.layer,
        {
          opacity: entry.value,
          transform: [{ translateY: entry.ty }],
        },
      ]}
    >
      {render(entry.key)}
    </Animated.View>
  ));
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
