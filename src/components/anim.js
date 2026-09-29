import { Animated, Easing, Platform } from "react-native";

// Every animation in the app drives only transform + opacity. On iOS/Android
// that lets them run on the native driver (GPU); react-native-web runs the
// same values through its JS driver.
export const USE_NATIVE_DRIVER = Platform.OS !== "web";

export const EASE_OUT = Easing.out(Easing.cubic);
export const EASE_IN = Easing.in(Easing.cubic);
export const EASE_SINE = Easing.inOut(Easing.sin);

// Spring presets (spread into Animated.spring alongside useNativeDriver).
export const SPRING = {
  // release: lively bounce back
  release: { toValue: 1, friction: 4, tension: 240 },
  // something appearing: soft overshoot
  popIn: { toValue: 1, friction: 6, tension: 180 },
  // selection state change: tight snap
  select: { toValue: 1, friction: 7, tension: 160 },
};

export function pressTiming(value, toValue, duration) {
  return Animated.timing(value, { toValue, duration, easing: EASE_IN, useNativeDriver: USE_NATIVE_DRIVER });
}

// Horizontal wobble used for "wrong answer" feedback.
export function runShake(value) {
  return Animated.sequence([
    pressTiming(value, -9, 55),
    pressTiming(value, 9, 55),
    pressTiming(value, -6, 50),
    pressTiming(value, 6, 50),
    pressTiming(value, 0, 45),
  ]);
}
