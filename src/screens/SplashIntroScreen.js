import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAppTheme } from "../theme";
import { GlowRings, SpectrumBars } from "../components/AmbientGlow";
import NoteBurst from "../components/NoteBurst";
import { EASE_SINE, USE_NATIVE_DRIVER } from "../components/anim";
import { TAGLINE } from "../audio/appAudio";
import { useAudio } from "../audio/AudioContext";

const EXIT_MS = 650;

// Ambient floating particles drifting smoothly in the background
const AMBIENT_PARTICLES = [
  { id: 1, glyph: "✦", x: "12%", y: "18%", size: 14, speed: 2800, delay: 0 },
  { id: 2, glyph: "♪", x: "82%", y: "15%", size: 18, speed: 3400, delay: 400 },
  { id: 3, glyph: "✧", x: "24%", y: "42%", size: 12, speed: 3000, delay: 700 },
  { id: 4, glyph: "♫", x: "86%", y: "48%", size: 16, speed: 2600, delay: 200 },
  { id: 5, glyph: "•", x: "15%", y: "65%", size: 8, speed: 3200, delay: 500 },
  { id: 6, glyph: "♬", x: "75%", y: "72%", size: 17, speed: 3100, delay: 900 },
  { id: 7, glyph: "✨", x: "30%", y: "82%", size: 14, speed: 2900, delay: 300 },
  { id: 8, glyph: "✦", x: "68%", y: "28%", size: 13, speed: 3300, delay: 600 },
];

function AmbientFloaters({ color }) {
  const anims = useRef(AMBIENT_PARTICLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = anims.map((val, i) => {
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
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [anims]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {AMBIENT_PARTICLES.map((p, i) => {
        const val = anims[i];
        const translateY = val.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -18],
        });
        const opacity = val.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.18, 0.55, 0.18],
        });
        const scale = val.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.9, 1.15, 0.9],
        });

        return (
          <Animated.Text
            key={p.id}
            style={[
              styles.floater,
              {
                left: p.x,
                top: p.y,
                fontSize: p.size,
                color,
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
          >
            {p.glyph}
          </Animated.Text>
        );
      })}
    </View>
  );
}

// Opening animation:
// - Ambient cosmic musical dust floats in the background
// - Logo rises inside breathing glow rings with an expanding ripple wave
// - Dual audio spectrum visualizers pulse rhythmically beneath the logo
// - MusiXs title and tagline glide up with celebratory sparkle burst
// - Tap anywhere to skip smoothly
export default function SplashIntroScreen({ onDone }) {
  const { colors } = useAppTheme();
  const { speakTagline } = useAudio();
  const finishedRef = useRef(false);
  const animationRef = useRef(null);
  const [nameShown, setNameShown] = useState(0);

  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRipple = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameSlide = useRef(new Animated.Value(18)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const tagSlide = useRef(new Animated.Value(12)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const skipPulse = useRef(new Animated.Value(0.4)).current;

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onDone();
  };

  useEffect(() => {
    // Breathing pulse for the skip hint
    Animated.loop(
      Animated.sequence([
        Animated.timing(skipPulse, {
          toValue: 0.85,
          duration: 1200,
          easing: EASE_SINE,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(skipPulse, {
          toValue: 0.4,
          duration: 1200,
          easing: EASE_SINE,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start();

    // Main entrance sequence
    animationRef.current = Animated.sequence([
      // 1. Logo emergence with spring punch and acoustic shockwave
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(logoRipple, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      // 2. App title reveal
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(nameSlide, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.delay(250),
      // 3. Tagline presentation
      Animated.parallel([
        Animated.timing(tagOpacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(tagSlide, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.delay(1600),
      // 4. Smooth exit transition
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);

    animationRef.current.start(({ finished }) => {
      if (finished) finish();
    });

    // Voiceover narrates the tagline; note burst fires alongside the title
    const narrateTimer = setTimeout(() => speakTagline(), 1500);
    const burstTimer = setTimeout(() => setNameShown((n) => n + 1), 750);

    return () => {
      clearTimeout(narrateTimer);
      clearTimeout(burstTimer);
      if (animationRef.current) animationRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkip = () => {
    if (finishedRef.current) return;
    if (animationRef.current) animationRef.current.stop();
    Animated.timing(exitOpacity, {
      toValue: 0,
      duration: 240,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(({ finished }) => {
      if (finished) finish();
    });
  };

  return (
    <Pressable style={styles.fill} onPress={handleSkip} accessibilityLabel="Skip intro">
      <Animated.View
        style={[styles.fill, styles.center, { backgroundColor: colors.bg, opacity: exitOpacity }]}
      >
        {/* Background ambient floating particles */}
        <AmbientFloaters color={colors.purpleLight} />

        {/* Hero Logo Area with multi-layer acoustic visual effects */}
        <View style={styles.logoArea}>
          <GlowRings color={colors.glow} size={280} ringCount={3} opacity={0.28} style={StyleSheet.absoluteFill} />

          {/* Dynamic logo arrival shockwave ring */}
          <Animated.View
            style={[
              styles.logoShockwave,
              {
                borderColor: colors.purpleLight,
                opacity: logoRipple.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0.8, 0.4, 0],
                }),
                transform: [
                  {
                    scale: logoRipple.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1.8],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* Musical fountain burst */}
          <NoteBurst trigger={nameShown} count={10} color={colors.purpleLight} rise={130} spread={120} />

          {/* App Icon with glowing backdrop aura */}
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
                shadowColor: colors.purpleLight,
              },
            ]}
          >
            <Animated.Image
              source={require("../assets/musixs-icon.png")}
              style={styles.icon}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Soundwave equalizer visualizer bars */}
          <View style={styles.spectrumWrap}>
            <SpectrumBars color={colors.purpleLight} count={11} height={22} opacity={0.5} />
          </View>
        </View>

        {/* Title & Tagline with refined typography */}
        <Animated.View
          style={[
            styles.titleContainer,
            { opacity: nameOpacity, transform: [{ translateY: nameSlide }] },
          ]}
        >
          <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
          <View style={[styles.titleAccent, { backgroundColor: colors.purple }]} />
        </Animated.View>

        <Animated.Text
          style={[
            styles.tagline,
            { color: colors.textMuted, opacity: tagOpacity, transform: [{ translateY: tagSlide }] },
          ]}
        >
          “{TAGLINE}”
        </Animated.Text>

        {/* Interactive skip hint */}
        <Animated.View style={[styles.skipHint, { opacity: skipPulse }]}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            Tap anywhere to skip •
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  logoArea: {
    alignItems: "center",
    justifyContent: "center",
    width: 280,
    height: 280,
    marginBottom: 14,
    position: "relative",
  },
  iconWrapper: {
    width: 124,
    height: 124,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 124,
    height: 124,
    borderRadius: 30,
  },
  logoShockwave: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  spectrumWrap: {
    position: "absolute",
    bottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  titleAccent: {
    width: 38,
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    opacity: 0.8,
  },
  tagline: {
    fontSize: 15,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  floater: {
    position: "absolute",
    fontWeight: "700",
  },
  skipHint: {
    position: "absolute",
    bottom: 42,
  },
  skipText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
