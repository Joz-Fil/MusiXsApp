import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { EASE_OUT, USE_NATIVE_DRIVER } from "./anim";

// Entrance wrapper: fades in while sliding a short distance. Remounting it
// (via `key`) replays the entrance — used for page sections and cards.
export default function FadeSlide({
  children,
  delay = 0,
  duration = 420,
  distance = 14,
  direction = "up", // "up" | "down" | "left" | "right"
  style,
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      delay,
      duration,
      easing: EASE_OUT,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [delay, duration, progress]);

  const output = [distance, 0];
  const transform =
    direction === "up"
      ? [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: output }) }]
      : direction === "down"
        ? [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] }) }]
        : direction === "left"
          ? [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }]
          : [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] }) }];

  return (
    <Animated.View style={[style, { opacity: progress, transform }]}>
      {children}
    </Animated.View>
  );
}
