import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { USE_NATIVE_DRIVER } from "./anim";

// Multi-round progress bar: the neon fill springs to each new position.
// Animates scaleX (GPU) with its origin pinned to the left edge.
export default function RoundProgress({ current, total, colors, style }) {
  const progress = useRef(new Animated.Value(total > 0 ? current / total : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: total > 0 ? current / total : 0,
      friction: 7,
      tension: 110,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [current, total, progress]);

  return (
    <View style={[styles.track, { backgroundColor: colors.surface2 }, style]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: colors.purple, transform: [{ scaleX: progress }], transformOrigin: "0% 50%" },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 14,
  },
  fill: {
    flex: 1,
    borderRadius: 5,
  },
});
