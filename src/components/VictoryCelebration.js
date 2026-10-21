import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { USE_NATIVE_DRIVER } from "./anim";

const CONFETTI_COLORS = [
  "#48bb78", // Emerald green
  "#38b2ac", // Teal
  "#b49cee", // MusiXs purple
  "#ffd166", // Warm gold
  "#f43f5e", // Rose pink
  "#60a5fa", // Sky blue
  "#fbbf24", // Amber
];

const GLYPHS = ["★", "✦", "✨", "♪", "♫", "♬"];

// Generates an array of randomized confetti & musical particles
function createParticles(count = 24) {
  return Array.from({ length: count }, (_, i) => {
    const isGlyph = i % 3 === 0;
    const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.4;
    const distance = 80 + Math.random() * 110;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance - 25; // bias slightly upwards
    const spin = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360);
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const size = isGlyph ? 14 + Math.random() * 10 : 8 + Math.random() * 8;
    const glyph = GLYPHS[i % GLYPHS.length];
    const isCircle = i % 4 === 1;

    return {
      id: i,
      isGlyph,
      glyph,
      targetX,
      targetY,
      spin,
      color,
      size,
      isCircle,
    };
  });
}

/**
 * High-energy victory celebration animation triggered when the user correctly
 * guesses a chord:
 * 1. Multi-tier sonic shockwave rings expanding outward.
 * 2. Radial explosive confetti & musical sparkle burst with physics.
 * 3. Bouncy celebratory achievement badge ("PERFECT EAR!", "ON FIRE!", etc.).
 */
export default function VictoryCelebration({
  colors,
  streak = 0,
  firstTry = false,
  chordName = "",
}) {
  const particles = useRef(createParticles(26)).current;
  const animProgress = useRef(new Animated.Value(0)).current;
  const shockwave = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.2)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Shockwaves expanding rapidly
    Animated.timing(shockwave, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

    // 2. Confetti & particles explosive burst
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 1300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

    // 3. Celebratory badge spring punch
    Animated.parallel([
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [animProgress, shockwave, badgeOpacity, badgeScale]);

  // Determine dynamic celebratory praise
  let praise = "✨ CHORD SOLVED!";
  let badgeColor = colors.green;
  if (streak >= 3) {
    praise = `🔥 ${streak} IN A ROW!`;
    badgeColor = "#f59e0b"; // Golden fire
  } else if (firstTry) {
    praise = "🎯 PERFECT EAR!";
    badgeColor = colors.green;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      {/* Expanding sonic shockwaves */}
      <Animated.View
        style={[
          styles.shockwave,
          {
            borderColor: colors.green,
            opacity: shockwave.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [0.8, 0.4, 0],
            }),
            transform: [
              {
                scale: shockwave.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 2.3],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.shockwave,
          {
            borderColor: colors.purpleLight,
            opacity: shockwave.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.6, 0.3, 0],
            }),
            transform: [
              {
                scale: shockwave.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1.8],
                }),
              },
            ],
          },
        ]}
      />

      {/* Confetti and musical star explosion */}
      {particles.map((p) => {
        const translateX = animProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.targetX],
        });
        const translateY = animProgress.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, p.targetY, p.targetY + 45], // slight gravity drop
        });
        const rotate = animProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", `${p.spin}deg`],
        });
        const opacity = animProgress.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 0.9, 0],
        });
        const scale = animProgress.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0.3, 1.2, 0.6],
        });

        if (p.isGlyph) {
          return (
            <Animated.Text
              key={p.id}
              style={[
                styles.particleGlyph,
                {
                  color: p.color,
                  fontSize: p.size,
                  opacity,
                  transform: [{ translateX }, { translateY }, { rotate }, { scale }],
                },
              ]}
            >
              {p.glyph}
            </Animated.Text>
          );
        }

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.confettiPiece,
              {
                backgroundColor: p.color,
                width: p.size,
                height: p.isCircle ? p.size : p.size * 0.6,
                borderRadius: p.isCircle ? p.size / 2 : 2,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }, { scale }],
              },
            ]}
          />
        );
      })}

      {/* Celebratory badge banner */}
      <Animated.View
        style={[
          styles.badgeWrapper,
          {
            opacity: badgeOpacity,
            transform: [{ scale: badgeScale }],
          },
        ]}
      >
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.surface,
              borderColor: badgeColor,
              shadowColor: badgeColor,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: badgeColor }]}>{praise}</Text>
          {chordName ? (
            <Text style={[styles.badgeChord, { color: colors.text }]}>{chordName}</Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  shockwave: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2.5,
  },
  particleGlyph: {
    position: "absolute",
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  confettiPiece: {
    position: "absolute",
  },
  badgeWrapper: {
    position: "absolute",
    top: -16,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  badgeChord: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.85,
  },
});
