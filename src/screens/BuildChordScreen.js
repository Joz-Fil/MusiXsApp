import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import { identifyChord, playNotes } from "../utils/musicTheory";

const GRID = [
  ["A", "B", "C", "D"],
  ["E", "F", "G"],
];

export default function BuildChordScreen({ onBack, onBuilt, onNavigate }) {
  const { colors } = useAppTheme();
  const [selected, setSelected] = useState([]);

  const toggleNote = (note) => {
    setSelected((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  };

  const handleEnter = () => {
    if (selected.length < 2) return;
    onBuilt({ notes: selected, chordName: identifyChord(selected) });
  };

  return (
    <ScreenWrapper>
      <TouchableOpacity onPress={onBack}>
        <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Build a Chord</Text>

      <View style={[styles.selectedBar, { backgroundColor: colors.surface }]}>
        {selected.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Tap notes below</Text>
        ) : (
          selected.map((n) => (
            <View key={n} style={[styles.selectedDot, { backgroundColor: colors.purple }]}>
              <Text style={styles.selectedDotText}>{n}</Text>
            </View>
          ))
        )}
      </View>

      {GRID.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((note) => (
            <TouchableOpacity
              key={note}
              style={[
                styles.noteButton,
                { backgroundColor: selected.includes(note) ? colors.purple : colors.surface2 },
              ]}
              onPress={() => toggleNote(note)}
            >
              <Text style={styles.noteText}>{note}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.actionButton, { flex: 1, backgroundColor: colors.surface2 }]}
          onPress={() => setSelected([])}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>← Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { flex: 1, backgroundColor: colors.surface2, opacity: selected.length ? 1 : 0.5 },
          ]}
          disabled={selected.length === 0}
          onPress={() => playNotes(selected)}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>Play</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.enterButton,
          { backgroundColor: colors.purple, opacity: selected.length >= 2 ? 1 : 0.5 },
        ]}
        disabled={selected.length < 2}
        onPress={handleEnter}
      >
        <Text style={styles.enterText}>Enter</Text>
      </TouchableOpacity>

      <BottomNav active="home" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: { fontSize: 18, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 13, marginBottom: 12, marginTop: 4 },
  selectedBar: {
    borderRadius: 12,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    padding: 8,
  },
  selectedDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDotText: { color: "white", fontSize: 13, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  noteButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  noteText: { color: "white", fontSize: 14, fontWeight: "700" },
  actionButton: { borderRadius: 10, padding: 12, alignItems: "center" },
  actionText: { fontWeight: "600" },
  enterButton: { borderRadius: 10, padding: 12, alignItems: "center", marginTop: 2 },
  enterText: { color: "white", fontWeight: "700" },
});
