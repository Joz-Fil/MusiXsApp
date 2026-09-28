import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";

const OPTIONS = [
  { key: "build", label: "Build a Chord", detail: "Create a new sound", icon: "♫", number: "01" },
  { key: "guess", label: "Guess the Chord", detail: "Test your ear", icon: "◖♪", number: "02" },
  { key: "learn", label: "Learn a Chord", detail: "Explore each note", icon: "◉", number: "03" },
];

export default function HomeScreen({ onNavigate }) {
  const { colors } = useAppTheme();
  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.purpleLight }]}>MUSIXS / PLAYROOM</Text>
        <Text style={[styles.title, { color: colors.text }]}>Choose your session</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Make a little music.</Text>
      </View>
      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.optionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => onNavigate(opt.key)}
              accessibilityRole="button"
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.optionIconText, { color: colors.purpleLight }]}>{opt.icon}</Text>
              </View>
              <View style={styles.optionCopy}>
                <Text style={[styles.optionNumber, { color: colors.purpleLight }]}>{opt.number}</Text>
                <Text style={[styles.optionText, { color: colors.text }]}>{opt.label}</Text>
                <Text style={[styles.optionDetail, { color: colors.textMuted }]}>{opt.detail}</Text>
              </View>
              <Text style={[styles.optionArrow, { color: colors.textMuted }]}>↗</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <BottomNav active="home" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 8, marginBottom: 26 },
  kicker: { fontSize: 10, fontWeight: "800", marginBottom: 10 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 14 },
  list: { gap: 12 },
  optionButton: {
    minHeight: 92,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  optionIcon: { width: 50, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  optionIconText: { fontSize: 22, fontWeight: "700" },
  optionCopy: { flex: 1, marginLeft: 14 },
  optionNumber: { fontSize: 10, fontWeight: "800", marginBottom: 3 },
  optionText: { fontSize: 16, fontWeight: "700", marginBottom: 3 },
  optionDetail: { fontSize: 12 },
  optionArrow: { fontSize: 18, paddingHorizontal: 4 },
});
