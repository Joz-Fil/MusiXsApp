import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";

const OPTIONS = [
  { key: "build", label: "Build a Chord" },
  { key: "guess", label: "Guess the Chord" },
  { key: "learn", label: "Learn a Chord" },
];

export default function HomeScreen({ onNavigate }) {
  return (
    <ScreenWrapper>
      <Text style={styles.title}>MusiXs</Text>
      <View style={styles.list}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={styles.optionButton}
            onPress={() => onNavigate(opt.key)}
          >
            <Text style={styles.optionText}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <BottomNav active="home" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.purpleLight,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 20,
  },
  list: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    padding: 16,
  },
  optionText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});
