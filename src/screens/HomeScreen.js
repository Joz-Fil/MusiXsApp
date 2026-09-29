import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import TouchButton from "../components/TouchButton";
import FadeSlide from "../components/FadeSlide";
import { GlowRings, SpectrumBars } from "../components/AmbientGlow";
import { useAudio } from "../audio/AudioContext";

const OPTIONS = [
  { key: "build", label: "Build a Chord" },
  { key: "guess", label: "Guess the Chord" },
  { key: "learn", label: "Learn a Chord" },
];

export default function HomeScreen({ onNavigate }) {
  const { colors } = useAppTheme();
  const { isMusicBlocked } = useAudio();
  const [needsSoundUnlock, setNeedsSoundUnlock] = useState(false);

  // Music is started once by App when the intro hands over; here we only
  // surface the "tap to enable sound" hint when web autoplay is blocking it.
  useEffect(() => {
    let blockedPolls = 0;
    const timer = setInterval(() => {
      blockedPolls = isMusicBlocked() ? blockedPolls + 1 : 0;
      setNeedsSoundUnlock(blockedPolls >= 3);
    }, 600);
    return () => clearInterval(timer);
  }, [isMusicBlocked]);

  return (
    <ScreenWrapper>
      <GlowRings color={colors.glow} size={340} style={styles.rings} />
      <View style={styles.header}>
        <FadeSlide direction="down">
          <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
        </FadeSlide>
        <FadeSlide delay={140}>
          <SpectrumBars color={colors.purple} style={styles.spectrum} />
        </FadeSlide>
      </View>

      <View style={styles.list}>
        {OPTIONS.map((opt, i) => (
          <FadeSlide key={opt.key} delay={220 + i * 90}>
            <TouchButton
              style={[
                styles.optionButton,
                {
                  backgroundColor: colors.glass,
                  borderColor: colors.glassBorder,
                  shadowColor: colors.purple,
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                },
              ]}
              onPress={() => onNavigate(opt.key)}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>{opt.label}</Text>
            </TouchButton>
          </FadeSlide>
        ))}
      </View>

      {needsSoundUnlock && (
        <FadeSlide direction="down" delay={100}>
          <Text style={[styles.soundHint, { color: colors.textMuted }]}>
            🔇 Tap anywhere to enable sound
          </Text>
        </FadeSlide>
      )}
      <BottomNav active="home" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  rings: {
    position: "absolute",
    top: "22%",
    alignSelf: "center",
  },
  header: { alignItems: "center", marginTop: 26, marginBottom: 30 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: 1, textAlign: "center", marginBottom: 12 },
  spectrum: { width: 150 },
  list: { gap: 14 },
  optionButton: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  optionText: { fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },
  soundHint: { fontSize: 12, marginTop: 18, textAlign: "center" },
});
