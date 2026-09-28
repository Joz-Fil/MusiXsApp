import React, { useState } from "react";
import { View, Text, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";

export default function SettingsScreen({ onBack, onNavigate }) {
  const { colors, mode, toggleMode } = useAppTheme();
  const [soundOn, setSoundOn] = useState(true);

  return (
    <ScreenWrapper>
      <TouchableOpacity onPress={onBack}>
        <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.kicker, { color: colors.purpleLight }]}>PREFERENCES</Text>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PLAYBACK</Text>
      <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.label, { color: colors.text }]}>Sound</Text>
          <Text style={[styles.detail, { color: colors.textMuted }]}>Chord playback</Text>
        </View>
        <Switch
          value={soundOn}
          onValueChange={setSoundOn}
          trackColor={{ false: colors.textMuted, true: colors.purple }}
        />
      </View>

      <Text style={[styles.sectionLabel, styles.appearanceLabel, { color: colors.textMuted }]}>APPEARANCE</Text>
      <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.label, { color: colors.text }]}>Dark mode</Text>
          <Text style={[styles.detail, { color: colors.textMuted }]}>
            {mode === "dark" ? "On" : "Off"}
          </Text>
        </View>
        <Switch
          value={mode === "dark"}
          onValueChange={toggleMode}
          trackColor={{ false: colors.textMuted, true: colors.purple }}
        />
      </View>

      <BottomNav active="settings" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: { fontSize: 18, marginBottom: 4 },
  kicker: { fontSize: 10, fontWeight: "800", marginBottom: 6 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 26 },
  sectionLabel: { fontSize: 10, fontWeight: "800", marginBottom: 8 },
  appearanceLabel: { marginTop: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  label: { fontSize: 15, fontWeight: "600" },
  detail: { fontSize: 12, marginTop: 4 },
});
