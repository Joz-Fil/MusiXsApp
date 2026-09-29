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
import { GlowRings } from "../components/AmbientGlow";
import NoteBurst from "../components/NoteBurst";
import { USE_NATIVE_DRIVER } from "../components/anim";
import { TAGLINE } from "../audio/appAudio";
import { useAudio } from "../audio/AudioContext";

const EXIT_MS = 650;

// Opening animation: the logo rises inside breathing glow rings, the app name
// and tagline fade up (the voiceover reads the tagline as it appears), then
// everything fades out into the main menu. Tapping anywhere skips.
export default function SplashIntroScreen({ onDone }) {
  const { colors } = useAppTheme();
  const { speakTagline } = useAudio();
  const finishedRef = useRef(false);
  const animationRef = useRef(null);
  const [nameShown, setNameShown] = useState(0);

  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameSlide = useRef(new Animated.Value(14)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const tagSlide = useRef(new Animated.Value(10)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onDone();
  };

  useEffect(() => {
    animationRef.current = Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.parallel([
        Animated.timing(nameOpacity, { toValue: 1, duration: 550, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(nameSlide, {
          toValue: 0,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(tagOpacity, { toValue: 1, duration: 650, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(tagSlide, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.delay(1600),
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

    // The tagline is read aloud as it fades in; notes burst with the name.
    const narrateTimer = setTimeout(() => speakTagline(), 1600);
    const burstTimer = setTimeout(() => setNameShown((n) => n + 1), 1000);

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
      duration: 260,
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
        <View style={styles.logoArea}>
          <GlowRings color={colors.glow} size={260} style={StyleSheet.absoluteFill} />
          <NoteBurst trigger={nameShown} count={6} color={colors.purpleLight} rise={110} spread={90} />
          <Animated.Image
            source={require("../assets/musixs-icon.png")}
            style={[
              styles.icon,
              { opacity: logoOpacity, transform: [{ scale: logoScale }] },
            ]}
            resizeMode="contain"
          />
        </View>
        <Animated.Text
          style={[
            styles.title,
            { color: colors.purpleLight, opacity: nameOpacity, transform: [{ translateY: nameSlide }] },
          ]}
        >
          MusiXs
        </Animated.Text>
        <Animated.Text
          style={[
            styles.tagline,
            { color: colors.textMuted, opacity: tagOpacity, transform: [{ translateY: tagSlide }] },
          ]}
        >
          {TAGLINE}
        </Animated.Text>

        <View style={styles.skipHint}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Tap anywhere to skip</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  logoArea: { alignItems: "center", justifyContent: "center", width: 260, height: 260, marginBottom: 18 },
  icon: { width: 120, height: 120, borderRadius: 28 },
  title: { fontSize: 40, fontWeight: "800", marginBottom: 12 },
  tagline: {
    fontSize: 15,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 36,
  },
  skipHint: { position: "absolute", bottom: 48 },
  skipText: { fontSize: 12 },
});
