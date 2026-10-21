import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useAppTheme } from "../theme";
import { EASE_SINE, USE_NATIVE_DRIVER } from "./anim";

export const BackgroundInteractionContext = createContext({
  triggerRipple: () => {},
  triggerSurge: () => {},
});

export function useBackgroundInteraction() {
  return useContext(BackgroundInteractionContext);
}

const RIPPLE_POOL_SIZE = 6;
const AMBIENT_PARTICLES = [
  { id: 1, glyph: "✦", x: "10%", y: "14%", size: 13, speed: 3200, delay: 0 },
  { id: 2, glyph: "♪", x: "85%", y: "18%", size: 16, speed: 3800, delay: 500 },
  { id: 3, glyph: "•", x: "22%", y: "32%", size: 8, speed: 2900, delay: 200 },
  { id: 4, glyph: "♫", x: "78%", y: "38%", size: 15, speed: 3400, delay: 800 },
  { id: 5, glyph: "✧", x: "14%", y: "54%", size: 12, speed: 3100, delay: 400 },
  { id: 6, glyph: "✨", x: "88%", y: "60%", size: 14, speed: 3600, delay: 100 },
  { id: 7, glyph: "♩", x: "28%", y: "72%", size: 14, speed: 3300, delay: 700 },
  { id: 8, glyph: "✦", x: "82%", y: "78%", size: 12, speed: 3000, delay: 300 },
  { id: 9, glyph: "•", x: "48%", y: "10%", size: 7, speed: 3500, delay: 600 },
  { id: 10, glyph: "♬", x: "65%", y: "22%", size: 15, speed: 3700, delay: 900 },
  { id: 11, glyph: "✧", x: "38%", y: "85%", size: 13, speed: 3200, delay: 150 },
  { id: 12, glyph: "♪", x: "6%", y: "88%", size: 16, speed: 3900, delay: 450 },
];

/**
 * Dynamic interactive background that reacts to:
 * 1. User touch anywhere on screen (spawning acoustic shockwave ripples).
 * 2. Button interactions (surging ambient halo glow and energizing floating particles).
 */
export function DynamicBackground({
  children,
  style,
  rippleColor,
}) {
  const { colors } = useAppTheme();
  const [containerLayout, setContainerLayout] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Pre-allocated ripple animations
  const ripples = useRef(
    Array.from({ length: RIPPLE_POOL_SIZE }, (_, i) => ({
      id: i,
      x: 0,
      y: 0,
      progress: new Animated.Value(0),
      active: false,
      color: colors.purpleLight,
    }))
  ).current;

  const [activeRippleIds, setActiveRippleIds] = useState(new Set());
  const nextRippleIndex = useRef(0);
  const lastRippleTime = useRef({ time: 0, x: 0, y: 0 });

  // Background energy surge value (swells when interacting with buttons or touching)
  const surgeAnim = useRef(new Animated.Value(0)).current;

  // Ambient breathing aura animation
  const auraBreathe = useRef(new Animated.Value(0)).current;

  // Floating particles animations
  const particleAnims = useRef(
    AMBIENT_PARTICLES.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Idle gentle breathing for the central aura
    const breatheAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(auraBreathe, {
          toValue: 1,
          duration: 3200,
          easing: EASE_SINE,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(auraBreathe, {
          toValue: 0,
          duration: 3200,
          easing: EASE_SINE,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    );
    breatheAnim.start();

    // Idle floating sway for particles
    const particleLoops = particleAnims.map((val, i) => {
      const cfg = AMBIENT_PARTICLES[i];
      return Animated.sequence([
        Animated.delay(cfg.delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(val, {
              toValue: 1,
              duration: cfg.speed / 2,
              easing: EASE_SINE,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
            Animated.timing(val, {
              toValue: 0,
              duration: cfg.speed / 2,
              easing: EASE_SINE,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
          ])
        ),
      ]);
    });
    particleLoops.forEach((l) => l.start());

    return () => {
      breatheAnim.stop();
      particleLoops.forEach((l) => l.stop());
    };
  }, [auraBreathe, particleAnims]);

  // Surge energy pulse across the background (called on button press or touch)
  const triggerSurge = useCallback(
    (intensity = 1) => {
      surgeAnim.setValue(intensity);
      Animated.spring(surgeAnim, {
        toValue: 0,
        friction: 6,
        tension: 90,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    },
    [surgeAnim]
  );

  // Spawns an acoustic shockwave ripple at given (x, y) coordinates
  const triggerRipple = useCallback(
    (rawX, rawY, customColor) => {
      if (rawX == null || rawY == null) return;

      const now = Date.now();
      // Deduplicate rapid double triggers within 60ms and 40px radius
      if (
        now - lastRippleTime.current.time < 60 &&
        Math.hypot(rawX - lastRippleTime.current.x, rawY - lastRippleTime.current.y) < 40
      ) {
        return;
      }
      lastRippleTime.current = { time: now, x: rawX, y: rawY };

      // Adjust for container offset if layout was captured
      const localX = rawX - (containerLayout.x || 0);
      const localY = rawY - (containerLayout.y || 0);

      const slot = ripples[nextRippleIndex.current];
      nextRippleIndex.current = (nextRippleIndex.current + 1) % RIPPLE_POOL_SIZE;

      slot.x = localX;
      slot.y = localY;
      slot.color = customColor || rippleColor || colors.purpleLight;
      slot.active = true;
      slot.progress.setValue(0);

      setActiveRippleIds((prev) => new Set(prev).add(slot.id));

      Animated.timing(slot.progress, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (finished) {
          slot.active = false;
          setActiveRippleIds((prev) => {
            const next = new Set(prev);
            next.delete(slot.id);
            return next;
          });
        }
      });

      // Also trigger a gentle background surge
      triggerSurge(0.75);
    },
    [colors.purpleLight, containerLayout.x, containerLayout.y, rippleColor, ripples, triggerSurge]
  );

  const handleLayout = (e) => {
    containerRef.current?.measure?.((_x, _y, _w, _h, pageX, pageY) => {
      setContainerLayout({ x: pageX || 0, y: pageY || 0 });
    });
  };

  const handleTouchStart = (e) => {
    const touch = e.nativeEvent?.touches?.[0] || e.nativeEvent;
    if (touch && touch.pageX != null) {
      triggerRipple(touch.pageX, touch.pageY);
    }
  };

  const handlePointerDown = (e) => {
    if (Platform.OS === "web" && e.nativeEvent) {
      triggerRipple(e.nativeEvent.pageX, e.nativeEvent.pageY);
    }
  };

  return (
    <BackgroundInteractionContext.Provider value={{ triggerRipple, triggerSurge }}>
      <View
        ref={containerRef}
        style={[styles.container, style]}
        onLayout={handleLayout}
        onTouchStart={handleTouchStart}
        onPointerDown={handlePointerDown}
      >
        {/* Living Background Animation Layers */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* 1. Dynamic Breathing Aura with Surge Boost */}
          <Animated.View
            style={[
              styles.auraGlow,
              {
                backgroundColor: colors.glow || colors.purpleLight,
                opacity: Animated.add(
                  auraBreathe.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.12, 0.22],
                  }),
                  surgeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.28],
                  })
                ),
                transform: [
                  {
                    scale: Animated.add(
                      auraBreathe.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1.05],
                      }),
                      surgeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.16],
                      })
                    ),
                  },
                ],
              },
            ]}
          />

          {/* 2. Floating Ambient Particles */}
          {AMBIENT_PARTICLES.map((p, i) => {
            const val = particleAnims[i];
            const translateY = val.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -16],
            });
            const opacity = Animated.add(
              val.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.15, 0.42, 0.15],
              }),
              surgeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.35],
              })
            );
            const scale = Animated.add(
              val.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.9, 1.12, 0.9],
              }),
              surgeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.2],
              })
            );

            return (
              <Animated.Text
                key={p.id}
                style={[
                  styles.particle,
                  {
                    left: p.x,
                    top: p.y,
                    fontSize: p.size,
                    color: colors.purpleLight,
                    opacity,
                    transform: [{ translateY }, { scale }],
                  },
                ]}
              >
                {p.glyph}
              </Animated.Text>
            );
          })}

          {/* 3. Interactive Touch Ripples */}
          {ripples.map((r) => {
            if (!activeRippleIds.has(r.id)) return null;
            const size = 150;
            return (
              <React.Fragment key={r.id}>
                {/* Primary shockwave ring */}
                <Animated.View
                  style={[
                    styles.rippleRing,
                    {
                      left: r.x - size / 2,
                      top: r.y - size / 2,
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      borderColor: r.color,
                      opacity: r.progress.interpolate({
                        inputRange: [0, 0.2, 1],
                        outputRange: [0.65, 0.45, 0],
                      }),
                      transform: [
                        {
                          scale: r.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.25, 2.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                {/* Inner soft glow ring */}
                <Animated.View
                  style={[
                    styles.rippleGlow,
                    {
                      left: r.x - size / 2,
                      top: r.y - size / 2,
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      backgroundColor: r.color,
                      opacity: r.progress.interpolate({
                        inputRange: [0, 0.3, 1],
                        outputRange: [0.35, 0.15, 0],
                      }),
                      transform: [
                        {
                          scale: r.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.15, 1.4],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </React.Fragment>
            );
          })}
        </View>

        {/* Foreground Screen Content */}
        {children}
      </View>
    </BackgroundInteractionContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  auraGlow: {
    position: "absolute",
    alignSelf: "center",
    top: "16%",
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  particle: {
    position: "absolute",
    fontWeight: "800",
  },
  rippleRing: {
    position: "absolute",
    borderWidth: 2,
  },
  rippleGlow: {
    position: "absolute",
  },
});
