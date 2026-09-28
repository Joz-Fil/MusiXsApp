import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import { playNotes } from "../utils/musicTheory";

export default function ChordResultScreen({ result, onBuildAnother, onNavigate }) {
  const { colors } = useAppTheme();
  return (
    <ScreenWrapper>
      <Text style={[styles.kicker, { color: colors.purpleLight }]}>CHORD / RESULT</Text>
      <Text style={[styles.title, { color: colors.text }]}>Chord created</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>A new shape in sound.</Text>

      <View style={[styles.resultBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.resultLabel, { color: colors.purpleLight }]}>YOUR CHORD</Text>
        <Text style={[styles.resultText, { color: colors.text }]}>
          {result?.chordName || "—"}
        </Text>
        <View style={styles.noteRow}>
          {(result?.notes || []).map((note) => (
            <View key={note} style={[styles.noteChip, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.noteChipText, { color: colors.purpleLight }]}>{note}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.secondaryButton, { flex: 1, backgroundColor: colors.surface2 }]}
          onPress={onBuildAnother}
        >
          <Text style={[styles.secondaryText, { color: colors.text }]}>Build another</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, { flex: 1, backgroundColor: colors.purple }]}
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
  kicker: { fontSize: 10, fontWeight: "800", marginBottom: 6 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "800" },
  subtitle: { fontSize: 13, marginBottom: 18, marginTop: 4 },
  resultBox: { borderRadius: 16, borderWidth: 1, paddingVertical: 30, paddingHorizontal: 16, alignItems: "center", marginBottom: 20 },
  resultLabel: { fontSize: 10, fontWeight: "800", marginBottom: 8 },
  resultText: { fontSize: 34, fontWeight: "800", marginBottom: 18 },
  noteRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  noteChip: { minWidth: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  noteChipText: { fontSize: 14, fontWeight: "800" },
  row: { flexDirection: "row", gap: 10 },
  secondaryButton: { borderRadius: 12, padding: 14, alignItems: "center" },
  secondaryText: { fontWeight: "600", fontSize: 13 },
  primaryButton: { borderRadius: 12, padding: 14, alignItems: "center" },
  primaryText: { color: "white", fontWeight: "700" },
});
