import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import { playNotes, NOTE_NAMES } from "../utils/musicTheory";

export default function LearnChordScreen({ onBack, onNavigate }) {
  const { colors } = useAppTheme();
  const [activeNote, setActiveNote] = useState(null);

  const handlePress = (note) => {
    setActiveNote(note);
    playNotes([note]);
  };

  return (
    <ScreenWrapper>
      <TouchableOpacity onPress={onBack}>
        <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Learn a Chord</Text>

      <View style={[styles.display, { backgroundColor: colors.surface }]}>
        <Text style={[styles.displayText, { color: colors.text }]}>
          {activeNote ? `Note: ${activeNote}` : "Tap a note to hear it"}
        </Text>
      </View>

      <View style={styles.grid}>
        {NOTE_NAMES.map((note) => (
          <TouchableOpacity
            key={note}
            style={[
              styles.noteButton,
              { backgroundColor: activeNote === note ? colors.purple : colors.surface2 },
            ]}
            onPress={() => handlePress(note)}
          >
            <Text style={styles.noteText}>{note}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <BottomNav active="home" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: { fontSize: 18, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 13, marginBottom: 16, marginTop: 4, textAlign: "center" },
  display: {
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  displayText: { fontSize: 16, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  noteButton: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  noteText: { color: "white", fontSize: 14, fontWeight: "700" },
});
