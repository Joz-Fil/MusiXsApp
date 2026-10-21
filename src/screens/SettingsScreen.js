import React, { useState } from "react";
import { View, Text, Switch, StyleSheet, Platform } from "react-native";
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

  const isLight = mode === "light";

  return (
    <ScreenWrapper>
      <TouchButton style={styles.backHit} onPress={onBack} accessibilityLabel="Back to home">
        <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
      </TouchButton>
      <Text style={[styles.title, { color: colors.purpleLight }]}>Settings</Text>

      {/* Audio Settings */}
      <FadeSlide delay={80}>
        <View style={[styles.row, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, styles.labelInline, { color: colors.text }]}>
              Menu Music · Lofi Groove
            </Text>
            <Text style={[styles.percent, { color: colors.purpleLight }]}>
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
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.purple}
            accessibilityLabel="Menu music volume"
          />
        </View>
      </FadeSlide>

      {/* Appearance / Light Mode Setting */}
      <FadeSlide delay={160}>
        <View style={[styles.row, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <View style={styles.appearanceHeader}>
            <View style={styles.appearanceInfo}>
              <Text style={[styles.label, { color: colors.text, marginBottom: 2 }]}>
                {isLight ? "☀️ Light Mode" : "🌙 Dark Mode"}
              </Text>
              <Text style={[styles.appearanceSub, { color: colors.textMuted }]}>
                {isLight ? "Bright theme with high contrast" : "Cyber-lounge dark theme"}
              </Text>
            </View>
            <Switch
              value={mode === "dark"}
              onValueChange={toggleMode}
              trackColor={{ false: colors.border, true: colors.purple }}
              thumbColor={mode === "dark" ? colors.purpleLight : colors.purple}
              accessibilityLabel="Toggle Dark and Light Mode"
            />
          </View>

          {/* Quick theme selectors */}
          <View style={styles.themeSelectorRow}>
            <TouchButton
              style={[
                styles.themeOptionChip,
                {
                  backgroundColor: isLight ? colors.surface2 : "transparent",
                  borderColor: isLight ? colors.purple : colors.border,
                },
              ]}
              onPress={() => {
                if (mode !== "light") toggleMode();
              }}
              accessibilityLabel="Select Light Mode"
            >
              <Text
                style={[
                  styles.themeOptionText,
                  { color: isLight ? colors.purpleLight : colors.textMuted },
                ]}
              >
                ☀️ Light Mode {isLight ? "✓" : ""}
              </Text>
            </TouchButton>

            <TouchButton
              style={[
                styles.themeOptionChip,
                {
                  backgroundColor: !isLight ? colors.surface2 : "transparent",
                  borderColor: !isLight ? colors.purple : colors.border,
                },
              ]}
              onPress={() => {
                if (mode !== "dark") toggleMode();
              }}
              accessibilityLabel="Select Dark Mode"
            >
              <Text
                style={[
                  styles.themeOptionText,
                  { color: !isLight ? colors.purpleLight : colors.textMuted },
                ]}
              >
                🌙 Dark Mode {!isLight ? "✓" : ""}
              </Text>
            </TouchButton>
          </View>
        </View>
      </FadeSlide>

      {/* About Box */}
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
  title: { fontSize: 28, fontWeight: "800", marginBottom: 24 },
  row: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  label: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  labelInline: { marginBottom: 0 },
  percent: { fontSize: 13, fontWeight: "700" },
  slider: { width: "100%", height: 40 },
  appearanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appearanceInfo: {
    flex: 1,
    paddingRight: 12,
  },
  appearanceSub: {
    fontSize: 12,
    fontWeight: "500",
  },
  themeSelectorRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  themeOptionChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  aboutBox: { gap: 6 },
  aboutText: { fontSize: 12, lineHeight: 18 },
});
