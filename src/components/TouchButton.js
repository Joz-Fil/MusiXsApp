import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable } from "react-native";
import { SPRING, USE_NATIVE_DRIVER } from "./anim";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// The standard press-anywhere button of the app: springs down on touch and
// bounces back on release, lifts slightly while hovered (mouse pointers —
// web/desktop) and pops whenever `pulseKey` changes (e.g. a counter increment
// or becoming the active tab).
export default function TouchButton({
  children,
  style,
  onPress,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  disabled,
  pressScale = 0.94,
  pulseKey,
  accessibilityRole = "button",
  accessibilityLabel,
  accessibilityState,
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const hover = useRef(new Animated.Value(0)).current;
  // press depth, hover lift and pulse combine into one transform value
  const transformScale = useRef(
    Animated.multiply(
      Animated.multiply(
        scale,
        hover.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] })
      ),
      pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] })
    )
  ).current;

  useEffect(() => {
    if (pulseKey === undefined) return;
    const anim = Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(pulse, { toValue: 0, friction: 4, tension: 180, useNativeDriver: USE_NATIVE_DRIVER }),
    ]);
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulseKey]);

  const handlePressIn = (event) => {
    Animated.spring(scale, { toValue: pressScale, speed: 60, bounciness: 4, useNativeDriver: USE_NATIVE_DRIVER }).start();
    onPressIn?.(event);
  };

  const handlePressOut = (event) => {
    Animated.spring(scale, { ...SPRING.release, useNativeDriver: USE_NATIVE_DRIVER }).start();
    onPressOut?.(event);
  };

  // Hover only fires for mouse pointers (web/desktop); touch never triggers it.
  const handleHoverIn = (event) => {
    if (disabled) return;
    Animated.timing(hover, {
      toValue: 1,
      duration: 130,
      easing: Easing.out(Easing.quad),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
    onHoverIn?.(event);
  };

  const handleHoverOut = (event) => {
    Animated.timing(hover, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
    onHoverOut?.(event);
  };

  return (
    <AnimatedPressable
      style={[
        style,
        { transform: [{ scale: transformScale }] },
        // pointer affordance for mouse users; native platforms ignore it
        Platform.OS === "web" && { cursor: disabled ? "not-allowed" : "pointer" },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
