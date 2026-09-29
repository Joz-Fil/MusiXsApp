import React, { useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import TouchButton from "../components/TouchButton";
import FadeSlide from "../components/FadeSlide";
import { useAudio } from "../audio/AudioContext";

export default function SettingsScreen({ onBack, onNavigate }) {
  const { colors, mode, toggleMode } = useAppTheme();
  const { getMusicVolume, setMusicVolume } = useAudio();
  const [volume, setVolume] = useState(getMusicVolume);

  const handleVolume = (value) => {
    setVolume(value);
    setMusicVolume(value);
  };

  return (
    <ScreenWrapper>
      <TouchButton style={styles.backHit} onPress={onBack} accessibilityLabel="Back to home">
        <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
      </TouchButton>
      <Text style={[styles.title, { color: colors.purpleLight }]}>Settings</Text>

      <FadeSlide delay={80}>
        <View style={[styles.row, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, styles.labelInline, { color: colors.text }]}>
              Menu Music · Lofi Groove
            </Text>
            <Text style={[styles.percent, { color: colors.textMuted }]}>
              {Math.round(volume * 100)}%
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={handleVolume}
            minimumTrackTintColor={colors.purple}
            maximumTrackTintColor={colors.glassBorder}
            thumbTintColor={colors.purpleLight}
            accessibilityLabel="Menu music volume"
          />
        </View>
      </FadeSlide>

      <FadeSlide delay={160}>
        <View style={[styles.row, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Dark Mode</Text>
          <Switch
            value={mode === "dark"}
            onValueChange={toggleMode}
            trackColor={{ false: colors.textMuted, true: colors.purple }}
          />
        </View>
      </FadeSlide>

      <FadeSlide delay={240}>
        <View style={[styles.row, styles.aboutBox, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <Text style={[styles.label, { color: colors.text }]}>About</Text>
          <Text style={[styles.aboutText, { color: colors.textMuted }]}>
            MusiXs · v1.0.0 — Learn music theory by touch, not textbook.
          </Text>
          <Text style={[styles.aboutText, { color: colors.textMuted }]}>
            Music: upbeat 30-second lofi groove, generated in-app. Original
            work — no third-party credit required.
          </Text>
          <Text style={[styles.aboutText, { color: colors.textMuted }]}>
            Narration generated using Free Text to Speech Online - TTSMaker
          </Text>
        </View>
      </FadeSlide>

      <BottomNav active="settings" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backHit: { alignSelf: "flex-start", padding: 4 },
  backBtn: { fontSize: 18, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 24 },
  row: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 12 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  labelInline: { marginBottom: 0 },
  percent: { fontSize: 12, fontWeight: "700" },
  slider: { width: "100%", height: 40 },
  aboutBox: { gap: 6 },
  aboutText: { fontSize: 12, lineHeight: 18 },
});