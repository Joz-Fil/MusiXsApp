import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import { playNotes } from "../utils/musicTheory";

export default function ChordResultScreen({ result, onBuildAnother, onNavigate }) {
  return (
    <ScreenWrapper>
      <Text style={styles.title}>MusiXs</Text>
      <Text style={styles.subtitle}>You built a Chord</Text>

      <View style={styles.resultBox}>
        <Text style={styles.resultText}>{result?.chordName || "—"}</Text>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={onBuildAnother}>
          <Text style={styles.secondaryText}>Build another</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, { flex: 1 }]}
          onPress={() => playNotes(result?.notes || [])}
        >
          <Text style={styles.primaryText}>Play</Text>
        </TouchableOpacity>
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
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
    marginTop: 4,
  },
  resultBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  resultText: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: colors.purple,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "white",
    fontWeight: "700",
  },
});
