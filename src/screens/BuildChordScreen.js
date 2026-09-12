import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import { identifyChord, playNotes } from "../utils/musicTheory";

const GRID = [
  ["A", "B", "C", "D"],
  ["E", "F", "G"],
];

export default function BuildChordScreen({ onBack, onBuilt, onNavigate }) {
  const [selected, setSelected] = useState([]);

  const toggleNote = (note) => {
    setSelected((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  };

  const handleEnter = () => {
    if (selected.length < 2) return;
    const chordName = identifyChord(selected);
    onBuilt({ notes: selected, chordName });
  };

  return (
    <ScreenWrapper>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backBtn}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>MusiXs</Text>
      <Text style={styles.subtitle}>Build a Chord</Text>

      <View style={styles.selectedBar}>
        {selected.length === 0 ? (
          <Text style={styles.mutedText}>Tap notes below</Text>
        ) : (
          selected.map((n) => (
            <View key={n} style={styles.selectedDot}>
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
                selected.includes(note) && styles.noteButtonActive,
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
          style={[styles.actionButton, { flex: 1 }]}
          onPress={() => setSelected([])}
        >
          <Text style={styles.actionText}>← Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { flex: 1, opacity: selected.length ? 1 : 0.5 }]}
          disabled={selected.length === 0}
          onPress={() => playNotes(selected)}
        >
          <Text style={styles.actionText}>Play</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.enterButton, { opacity: selected.length >= 2 ? 1 : 0.5 }]}
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
  backBtn: {
    color: colors.purpleLight,
    fontSize: 18,
    marginBottom: 4,
  },
  title: {
    color: colors.purpleLight,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
    marginTop: 4,
  },
  selectedBar: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    padding: 8,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  selectedDot: {
    backgroundColor: colors.purple,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDotText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  noteButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  noteButtonActive: {
    backgroundColor: colors.purple,
  },
  noteText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  actionButton: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  actionText: {
    color: "white",
    fontWeight: "600",
  },
  enterButton: {
    backgroundColor: colors.purple,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 2,
  },
  enterText: {
    color: "white",
    fontWeight: "700",
  },
});
