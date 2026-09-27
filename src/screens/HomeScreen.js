import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";

const OPTIONS = [
  { key: "build", label: "Build a Chord" },
  { key: "guess", label: "Guess the Chord" },
  { key: "learn", label: "Learn a Chord" },
];

export default function HomeScreen({ onNavigate }) {
  const { colors } = useAppTheme();
  return (
    <ScreenWrapper>
      <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
      <View style={styles.list}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.optionButton, { backgroundColor: colors.surface2 }]}
            onPress={() => onNavigate(opt.key)}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <BottomNav active="home" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 20 },
  list: { gap: 16 },
  optionButton: { borderRadius: 14, padding: 16 },
  optionText: { fontSize: 15, fontWeight: "600" },
});
