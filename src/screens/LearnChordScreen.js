import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import TouchButton from "../components/TouchButton";
import { NOTE_NAMES } from "../utils/musicTheory";
import { useAudio } from "../audio/AudioContext";

// Comprehensive chord library with formulas
const CHORD_LIBRARY = [
  // Major Chords
  { root: "C", type: "Major", notes: ["C", "E", "G"], formula: "1-3-5" },
  { root: "D", type: "Major", notes: ["D", "F#", "A"], formula: "1-3-5" },
  { root: "E", type: "Major", notes: ["E", "G#", "B"], formula: "1-3-5" },
  { root: "F", type: "Major", notes: ["F", "A", "C"], formula: "1-3-5" },
  { root: "G", type: "Major", notes: ["G", "B", "D"], formula: "1-3-5" },
  { root: "A", type: "Major", notes: ["A", "C#", "E"], formula: "1-3-5" },
  { root: "B", type: "Major", notes: ["B", "D#", "F#"], formula: "1-3-5" },

  // Minor Chords
  { root: "C", type: "Minor", notes: ["C", "E♭", "G"], formula: "1-♭3-5" },
  { root: "D", type: "Minor", notes: ["D", "F", "A"], formula: "1-♭3-5" },
  { root: "E", type: "Minor", notes: ["E", "G", "B"], formula: "1-♭3-5" },
  { root: "F", type: "Minor", notes: ["F", "A♭", "C"], formula: "1-♭3-5" },
  { root: "G", type: "Minor", notes: ["G", "B♭", "D"], formula: "1-♭3-5" },
  { root: "A", type: "Minor", notes: ["A", "C", "E"], formula: "1-♭3-5" },
  { root: "B", type: "Minor", notes: ["B", "D", "F#"], formula: "1-♭3-5" },

  // Diminished Chords
  { root: "C", type: "Diminished", notes: ["C", "E♭", "G♭"], formula: "1-♭3-♭5" },
  { root: "D", type: "Diminished", notes: ["D", "F", "A♭"], formula: "1-♭3-♭5" },
  { root: "E", type: "Diminished", notes: ["E", "G", "B♭"], formula: "1-♭3-♭5" },

  // Augmented Chords
  { root: "C", type: "Augmented", notes: ["C", "E", "G#"], formula: "1-3-#5" },
  { root: "D", type: "Augmented", notes: ["D", "F#", "A#"], formula: "1-3-#5" },
  { root: "E", type: "Augmented", notes: ["E", "G#", "B#"], formula: "1-3-#5" },

  // Sus2 Chords
  { root: "C", type: "Sus2", notes: ["C", "D", "G"], formula: "1-2-5" },
  { root: "D", type: "Sus2", notes: ["D", "E", "A"], formula: "1-2-5" },
  { root: "G", type: "Sus2", notes: ["G", "A", "D"], formula: "1-2-5" },

  // Sus4 Chords
  { root: "C", type: "Sus4", notes: ["C", "F", "G"], formula: "1-4-5" },
  { root: "D", type: "Sus4", notes: ["D", "G", "A"], formula: "1-4-5" },
  { root: "G", type: "Sus4", notes: ["G", "C", "D"], formula: "1-4-5" },
];

export default function LearnChordScreen({ onBack, onNavigate }) {
  const { colors } = useAppTheme();
  const { playChord } = useAudio();
  const [selectedChord, setSelectedChord] = useState(null);
  const [activeNoteIndex, setActiveNoteIndex] = useState(null);

  const handleChordPress = (chord) => {
    setSelectedChord(chord);
    setActiveNoteIndex(null);
    // Convert display notes (with sharps/flats symbols) to playable notes
    const playableNotes = chord.notes.map(n => n.replace(/[♭#]/g, ''));
    playChord(playableNotes.filter(n => NOTE_NAMES.includes(n)));
  };

  const handleNotePress = (note, index) => {
    setActiveNoteIndex(index);
    // Remove sharp/flat symbols for playback
    const playableNote = note.replace(/[♭#]/g, '');
    if (NOTE_NAMES.includes(playableNote)) {
      playChord([playableNote]);
    }
  };

  // Group chords by type
  const chordTypes = [...new Set(CHORD_LIBRARY.map(c => c.type))];

  return (
    <ScreenWrapper scroll>
      <TouchableOpacity onPress={onBack}>
        <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Learn a chord</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Tap a chord to hear it, then tap individual notes
      </Text>

      {selectedChord && (
        <View style={[styles.chordDetail, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.chordName, { color: colors.text }]}>
            {selectedChord.root} {selectedChord.type}
          </Text>
          <Text style={[styles.formula, { color: colors.textMuted }]}>
            Formula: {selectedChord.formula}
          </Text>

          <View style={styles.notesContainer}>
            <Text style={[styles.notesLabel, { color: colors.textMuted }]}>Notes:</Text>
            <View style={styles.notesList}>
              {selectedChord.notes.map((note, idx) => (
                <TouchButton
                  key={idx}
                  style={[
                    styles.noteChip,
                    {
                      backgroundColor: activeNoteIndex === idx ? colors.purple : colors.surface2,
                      shadowColor: colors.purple,
                      shadowOpacity: activeNoteIndex === idx ? 0.6 : 0,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: activeNoteIndex === idx ? 3 : 0,
                    },
                  ]}
                  pressScale={0.9}
                  onPress={() => handleNotePress(note, idx)}
                >
                  <Text style={[styles.noteChipText, { color: colors.text }]}>{note}</Text>
                  <Text style={[styles.notePosition, { color: colors.textMuted }]}>
                    {idx + 1}
                  </Text>
                </TouchButton>
              ))}
            </View>
          </View>

          <TouchButton
            style={[styles.playFullButton, { backgroundColor: colors.purple }]}
            pressScale={0.95}
            onPress={() => handleChordPress(selectedChord)}
          >
            <Text style={styles.playFullText}>▶ Play Full Chord</Text>
          </TouchButton>
        </View>
      )}

      <View style={styles.librarySection}>
        {chordTypes.map((type) => (
          <View key={type} style={styles.typeSection}>
            <Text style={[styles.typeHeader, { color: colors.purpleLight }]}>
              {type} Chords
            </Text>
            <View style={styles.chordGrid}>
              {CHORD_LIBRARY.filter(c => c.type === type).map((chord, idx) => (
                <TouchButton
                  key={`${chord.root}-${chord.type}-${idx}`}
                  style={[
                    styles.chordButton,
                    {
                      backgroundColor:
                        selectedChord?.root === chord.root && selectedChord?.type === chord.type
                          ? colors.purple
                          : colors.surface2,
                      borderColor: colors.border,
                    },
                  ]}
                  pressScale={0.92}
                  onPress={() => handleChordPress(chord)}
                >
                  <Text style={[styles.chordButtonText, { color: colors.text }]}>
                    {chord.root}
                  </Text>
                  <Text style={[styles.chordTypeText, { color: colors.textMuted }]}>
                    {chord.type === "Major" ? "maj" :
                     chord.type === "Minor" ? "min" :
                     chord.type === "Diminished" ? "dim" :
                     chord.type === "Augmented" ? "aug" :
                     chord.type.toLowerCase()}
                  </Text>
                </TouchButton>
              ))}
            </View>
          </View>
        ))}
      </View>

      <BottomNav active="home" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: { fontSize: 18, marginBottom: 4 },
  kicker: { fontSize: 10, fontWeight: "800", marginBottom: 6 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "800" },
  subtitle: { fontSize: 13, marginBottom: 16, marginTop: 4 },

  chordDetail: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  chordName: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  formula: {
    fontSize: 13,
    marginBottom: 16,
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  notesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  noteChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 70,
    alignItems: "center",
  },
  noteChipText: {
    fontSize: 18,
    fontWeight: "700",
  },
  notePosition: {
    fontSize: 10,
    marginTop: 2,
  },
  playFullButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  playFullText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },

  librarySection: {
    marginBottom: 24,
  },
  typeSection: {
    marginBottom: 24,
  },
  typeHeader: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  chordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chordButton: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  chordButtonText: {
    fontSize: 18,
    fontWeight: "800",
  },
  chordTypeText: {
    fontSize: 10,
    marginTop: 2,
  },
});
