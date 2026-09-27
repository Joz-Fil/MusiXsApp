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
      <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>You built a Chord</Text>

      <View style={[styles.resultBox, { backgroundColor: colors.surface }]}>
        <Text style={[styles.resultText, { color: colors.text }]}>
          {result?.chordName || "—"}
        </Text>
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
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 13, marginBottom: 16, marginTop: 4 },
  resultBox: { borderRadius: 14, paddingVertical: 30, paddingHorizontal: 16, alignItems: "center", marginBottom: 20 },
  resultText: { fontSize: 22, fontWeight: "800" },
  row: { flexDirection: "row", gap: 10 },
  secondaryButton: { borderRadius: 10, padding: 12, alignItems: "center" },
  secondaryText: { fontWeight: "600", fontSize: 13 },
  primaryButton: { borderRadius: 10, padding: 12, alignItems: "center" },
  primaryText: { color: "white", fontWeight: "700" },
});
