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
      <Text style={[styles.title, { color: colors.purpleLight }]}>Settings</Text>

      <View style={[styles.row, { backgroundColor: colors.surface2 }]}>
        <Text style={[styles.label, { color: colors.text }]}>Sound</Text>
        <Switch
          value={soundOn}
          onValueChange={setSoundOn}
          trackColor={{ false: colors.textMuted, true: colors.purple }}
        />
      </View>

      <View style={[styles.row, { backgroundColor: colors.surface2 }]}>
        <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
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
  title: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 24 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  label: { fontSize: 15, fontWeight: "600" },
});
