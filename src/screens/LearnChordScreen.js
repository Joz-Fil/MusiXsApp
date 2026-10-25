import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import TouchButton from "../components/TouchButton";
import NoteGrid from "../components/NoteGrid";
import VictoryCelebration from "../components/VictoryCelebration";
import { NOTE_NAMES, sameNotes } from "../utils/musicTheory";
import { useAudio } from "../audio/AudioContext";
import { LearnChordIcon } from "../components/ChordIcons";
import {
  getLearnChordSession,
  updateLearnChordSession,
  resetLearnChordSession,
  updateJourneySession,
} from "../services/sessionStore";
import {
  CHORD_LIBRARY,
  TIER_METADATA,
  getRelatedChords,
} from "../utils/chordLibrary";
import {
  JOURNEY_LEVELS,
  addXP,
  incrementQuestProgress,
} from "../services/learningService";

export { CHORD_LIBRARY };

export default function LearnChordScreen({ onBack, onNavigate }) {
  const { colors } = useAppTheme();
  const { playChord } = useAudio();
  const savedSession = getLearnChordSession();

  const [selectedChord, setSelectedChord] = useState(savedSession.selectedChord);
  const [activeNoteIndex, setActiveNoteIndex] = useState(savedSession.activeNoteIndex);
  const [selectedTier, setSelectedTier] = useState(
    savedSession.selectedTier || (savedSession.selectedChord?.tier || "foundations")
  );

  // Interactive Arpeggiate / Strum state
  const [isArpeggiating, setIsArpeggiating] = useState(false);
  const [activeArpIndex, setActiveArpIndex] = useState(null);
  const arpeggioTimersRef = useRef([]);

  // Interactive Mini Practice Mode state
  const [practiceMode, setPracticeMode] = useState(savedSession.practiceMode || false);
  const [practiceSelected, setPracticeSelected] = useState(
    savedSession.practiceSelected || []
  );
  const [practiceSuccess, setPracticeSuccess] = useState(false);
  const [showPracticeHint, setShowPracticeHint] = useState(false);

  const lastPressTimeRef = useRef(0);

  // Clean up any pending arpeggio timeouts on unmount
  useEffect(() => {
    return () => {
      arpeggioTimersRef.current.forEach(clearTimeout);
      arpeggioTimersRef.current = [];
    };
  }, []);

  const leave = (go) => {
    arpeggioTimersRef.current.forEach(clearTimeout);
    arpeggioTimersRef.current = [];
    updateLearnChordSession({
      selectedChord,
      activeNoteIndex,
      selectedTier,
      practiceMode,
      practiceSelected,
    });
    go();
  };

  const handleBack = () => leave(onBack);
  const handleNavigate = (key) => leave(() => onNavigate(key));

  const clearArpeggio = () => {
    arpeggioTimersRef.current.forEach(clearTimeout);
    arpeggioTimersRef.current = [];
    setIsArpeggiating(false);
    setActiveArpIndex(null);
  };

  const handleChordPress = (chord) => {
    clearArpeggio();
    setSelectedChord(chord);
    setActiveNoteIndex(null);
    setPracticeSuccess(false);
    setShowPracticeHint(false);

    updateLearnChordSession({
      selectedChord: chord,
      activeNoteIndex: null,
      selectedTier: chord.tier || selectedTier,
    });

    const now = Date.now();
    if (now - lastPressTimeRef.current < 180) return;
    lastPressTimeRef.current = now;

    // Play all notes of the chord with accidentals intact
    playChord(chord.notes);
  };

  const handleNotePress = (note, index) => {
    clearArpeggio();
    setActiveNoteIndex(index);
    updateLearnChordSession({ activeNoteIndex: index });

    const now = Date.now();
    if (now - lastPressTimeRef.current < 150) return;
    lastPressTimeRef.current = now;

    // Play individual note with accurate pitch & accidentals
    playChord([note]);
  };

  // Interactive Arpeggiate / Strum: plays notes sequentially then the full chord
  const handleArpeggiate = () => {
    if (!selectedChord || isArpeggiating) return;
    clearArpeggio();
    setIsArpeggiating(true);
    setActiveNoteIndex(null);

    const notes = selectedChord.notes;
    const intervalMs = 260;

    notes.forEach((note, idx) => {
      const timer = setTimeout(() => {
        setActiveArpIndex(idx);
        playChord([note]);
      }, idx * intervalMs);
      arpeggioTimersRef.current.push(timer);
    });

    // Sound full chord after strumming all notes
    const fullTimer = setTimeout(() => {
      setActiveArpIndex(null);
      playChord(notes);
    }, notes.length * intervalMs);
    arpeggioTimersRef.current.push(fullTimer);

    // End arpeggiation mode after ringing
    const finishTimer = setTimeout(() => {
      setIsArpeggiating(false);
    }, notes.length * intervalMs + 600);
    arpeggioTimersRef.current.push(finishTimer);
  };

  const handleTogglePracticeMode = () => {
    const nextMode = !practiceMode;
    setPracticeMode(nextMode);
    setPracticeSuccess(false);
    updateLearnChordSession({ practiceMode: nextMode });
  };

  const handleTogglePracticeNote = (note) => {
    if (!selectedChord) return;
    const nextSelected = practiceSelected.includes(note)
      ? practiceSelected.filter((n) => n !== note)
      : [...practiceSelected, note];

    setPracticeSelected(nextSelected);
    updateLearnChordSession({ practiceSelected: nextSelected });

    // Check if the user successfully formed this chord
    if (sameNotes(nextSelected, selectedChord.notes)) {
      setPracticeSuccess(true);
      playChord(selectedChord.notes);
      addXP(15).catch(() => {});
      incrementQuestProgress("build_chords", 1).catch(() => {});
    } else {
      setPracticeSuccess(false);
    }
  };

  const handleClearPractice = () => {
    setPracticeSelected([]);
    setPracticeSuccess(false);
    setShowPracticeHint(false);
    updateLearnChordSession({ practiceSelected: [] });
  };

  const handleClearChord = () => {
    clearArpeggio();
    setSelectedChord(null);
    setActiveNoteIndex(null);
    setPracticeMode(false);
    setPracticeSelected([]);
    setPracticeSuccess(false);
    resetLearnChordSession();
  };

  const handleTierChange = (tier) => {
    clearArpeggio();
    setSelectedTier(tier);
    updateLearnChordSession({ selectedTier: tier });
  };

  const handleJumpToJourney = (levelId) => {
    clearArpeggio();
    updateJourneySession({
      activeLevelId: levelId,
      selectedNotes: [],
      challengeResult: null,
    });
    handleNavigate("journey");
  };

  // Group chords in the selected tier by chord type
  const tierChords = CHORD_LIBRARY.filter((c) => c.tier === selectedTier);
  const chordTypesInTier = [...new Set(tierChords.map((c) => c.type))];
  const relatedChords = selectedChord ? getRelatedChords(selectedChord.root) : [];

  // Matching journey level for this chord if any
  const matchedJourneyLevel = selectedChord?.journeyLevelId
    ? JOURNEY_LEVELS.find((l) => l.id === selectedChord.journeyLevelId)
    : null;

  const currentTierMeta = TIER_METADATA[selectedTier] || TIER_METADATA.foundations;

  return (
    <ScreenWrapper scroll>
      {/* Top Navigation Row */}
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={handleBack}
          accessibilityLabel="Back to home"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
        </TouchableOpacity>

        {selectedChord && (
          <TouchButton
            style={[styles.closeCardBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
            onPress={handleClearChord}
            accessibilityLabel="Close chord details"
          >
            <Text style={[styles.closeCardText, { color: colors.textMuted }]}>Close Card ✕</Text>
          </TouchButton>
        )}
      </View>

      {/* Screen Header */}
      <View style={styles.iconHero}>
        <LearnChordIcon size={52} colors={colors} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Learn a Chord</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Interactive chord lab: hear voicing layers, arpeggiate notes, and practice on keys.
      </Text>

      {/* Tier Tabs (Foundations / Intermediate / Complex Harmonies) */}
      <View style={[styles.tierTabContainer, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
        {Object.values(TIER_METADATA).map((tier) => {
          const isActive = selectedTier === tier.id;
          return (
            <TouchableOpacity
              key={tier.id}
              style={[
                styles.tierTab,
                isActive && [styles.tierTabActive, { backgroundColor: colors.purple }],
              ]}
              onPress={() => handleTierChange(tier.id)}
            >
              <Text style={styles.tierTabIcon}>{tier.icon}</Text>
              <Text
                style={[
                  styles.tierTabLabel,
                  { color: isActive ? "#ffffff" : colors.textMuted },
                  isActive && { fontWeight: "800" },
                ]}
              >
                {tier.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tier Overview Pill */}
      <View style={[styles.tierInfoCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
        <Text style={[styles.tierInfoTitle, { color: colors.purpleLight }]}>
          {currentTierMeta.icon} {currentTierMeta.title}: {currentTierMeta.subtitle}
        </Text>
        <Text style={[styles.tierInfoDesc, { color: colors.textMuted }]}>
          {currentTierMeta.description}
        </Text>
      </View>

      {/* SELECTED CHORD DETAIL CARD */}
      {selectedChord && (
        <View style={[styles.chordDetail, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header Row */}
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameBadgeRow}>
                <Text style={[styles.chordName, { color: colors.text }]}>
                  {selectedChord.root} {selectedChord.type}
                </Text>
                {selectedChord.mood ? (
                  <View style={[styles.moodBadge, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                    <Text style={[styles.moodBadgeText, { color: colors.purpleLight }]}>
                      {selectedChord.mood}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.formulaText, { color: colors.textMuted }]}>
                Formula: <Text style={{ color: colors.text, fontWeight: "700" }}>{selectedChord.formula}</Text>
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClearChord}
              style={[styles.dismissHit, { backgroundColor: colors.surface2 }]}
              accessibilityLabel="Dismiss chord card"
            >
              <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "700" }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Music Theory Concept & Mood Explanation */}
          {selectedChord.concept && (
            <View style={[styles.conceptBox, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <Text style={[styles.conceptLabel, { color: colors.purpleLight }]}>💡 Music Theory Insight</Text>
              <Text style={[styles.conceptBody, { color: colors.text }]}>
                {selectedChord.concept}
              </Text>
            </View>
          )}

          {/* Instant A/B Comparison Switch */}
          {relatedChords.length > 1 && (
            <View style={styles.compareSection}>
              <Text style={[styles.compareLabel, { color: colors.textMuted }]}>
                Compare with other {selectedChord.root} chords:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compareRow}>
                {relatedChords.map((rc, rIdx) => {
                  const isCurrent = rc.type === selectedChord.type;
                  return (
                    <TouchableOpacity
                      key={`${rc.root}-${rc.type}-${rIdx}`}
                      style={[
                        styles.comparePill,
                        {
                          backgroundColor: isCurrent ? colors.purple : colors.surface2,
                          borderColor: isCurrent ? colors.purple : colors.border,
                        },
                      ]}
                      onPress={() => handleChordPress(rc)}
                    >
                      <Text
                        style={[
                          styles.comparePillText,
                          { color: isCurrent ? "#ffffff" : colors.text },
                        ]}
                      >
                        {rc.root} {rc.type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Interactive Note Voicing Chips */}
          <View style={styles.notesContainer}>
            <Text style={[styles.notesLabel, { color: colors.textMuted }]}>
              Voicing Notes (tap to audition):
            </Text>
            <View style={styles.notesList}>
              {selectedChord.notes.map((note, idx) => {
                const isActive = activeNoteIndex === idx || activeArpIndex === idx;
                const degreeName = selectedChord.degrees?.[idx] || `Tone ${idx + 1}`;
                return (
                  <TouchButton
                    key={`${note}-${idx}`}
                    style={[
                      styles.noteChip,
                      {
                        backgroundColor: isActive ? colors.purple : colors.surface2,
                        borderColor: isActive ? colors.purpleLight : colors.border,
                        shadowColor: colors.purple,
                        shadowOpacity: isActive ? 0.7 : 0,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 0,
                      },
                    ]}
                    pressScale={0.92}
                    onPress={() => handleNotePress(note, idx)}
                  >
                    <Text
                      style={[
                        styles.noteChipText,
                        { color: isActive ? "#ffffff" : colors.text },
                      ]}
                    >
                      {note}
                    </Text>
                    <Text
                      style={[
                        styles.noteDegreeText,
                        {
                          color: isActive
                            ? "rgba(255,255,255,0.9)"
                            : colors.textMuted,
                        },
                      ]}
                    >
                      {degreeName}
                    </Text>
                  </TouchButton>
                );
              })}
            </View>
          </View>

          {/* Action Buttons: Play Full, Arpeggiate, Practice */}
          <View style={styles.actionButtonBar}>
            <TouchButton
              style={[styles.primaryActionBtn, { backgroundColor: colors.purple }]}
              pressScale={0.95}
              onPress={() => handleChordPress(selectedChord)}
            >
              <Text style={styles.actionBtnText}>▶ Play Chord</Text>
            </TouchButton>

            <TouchButton
              style={[
                styles.secondaryActionBtn,
                {
                  backgroundColor: isArpeggiating ? colors.purpleLight : colors.surface2,
                  borderColor: colors.border,
                },
              ]}
              pressScale={0.95}
              onPress={handleArpeggiate}
              disabled={isArpeggiating}
            >
              <Text
                style={[
                  styles.secondaryActionText,
                  { color: isArpeggiating ? "#ffffff" : colors.text },
                ]}
              >
                {isArpeggiating ? "🎶 Strumming..." : "🎶 Arpeggiate"}
              </Text>
            </TouchButton>

            <TouchButton
              style={[
                styles.practiceToggleBtn,
                {
                  backgroundColor: practiceMode ? colors.purpleLight : colors.surface2,
                  borderColor: colors.border,
                },
              ]}
              pressScale={0.95}
              onPress={handleTogglePracticeMode}
            >
              <Text
                style={[
                  styles.practiceToggleText,
                  { color: practiceMode ? "#ffffff" : colors.purpleLight },
                ]}
              >
                {practiceMode ? "✕ Practice" : "🎯 Practice"}
              </Text>
            </TouchButton>
          </View>

          {/* INTERACTIVE MINI PRACTICE SECTION */}
          {practiceMode && (
            <View style={[styles.practiceSection, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              {practiceSuccess && (
                <VictoryCelebration active={true} count={24} showBadge={false} colors={colors} />
              )}

              <View style={styles.practiceHeader}>
                <Text style={[styles.practiceTitle, { color: colors.text }]}>
                  🎯 Mini-Quiz: Build {selectedChord.root} {selectedChord.type}
                </Text>
                <Text style={[styles.practicePrompt, { color: colors.textMuted }]}>
                  Tap the keyboard keys that create this chord ({selectedChord.notes.join(" · ")})
                </Text>
              </View>

              {practiceSuccess ? (
                <View style={[styles.practiceSuccessBanner, { backgroundColor: colors.surface2, borderColor: colors.green }]}>
                  <Text style={[styles.practiceSuccessTitle, { color: colors.green }]}>
                    🎉 Perfect Match! +15 XP ⭐
                  </Text>
                  <Text style={[styles.practiceSuccessSub, { color: colors.text }]}>
                    You successfully played {selectedChord.root} {selectedChord.type} on the keyboard!
                  </Text>
                </View>
              ) : null}

              <View style={[styles.practiceSelectedRow, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.practiceSelectedLabel, { color: colors.textMuted }]}>
                  Your Notes: {practiceSelected.length > 0 ? practiceSelected.join(" · ") : "(None selected)"}
                </Text>
                {practiceSelected.length > 0 && (
                  <TouchableOpacity onPress={handleClearPractice} style={styles.clearMiniHit}>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>Clear ↺</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Note Keyboard */}
              <NoteGrid
                selected={practiceSelected}
                suggestedNotes={showPracticeHint ? selectedChord.notes : []}
                onToggle={handleTogglePracticeNote}
                colors={colors}
              />

              <View style={styles.practiceControls}>
                <TouchButton
                  style={[styles.hintBtn, { borderColor: colors.border }]}
                  onPress={() => setShowPracticeHint(!showPracticeHint)}
                >
                  <Text style={[styles.hintBtnText, { color: colors.purpleLight }]}>
                    {showPracticeHint ? "Hide Hint" : "💡 Show Hint"}
                  </Text>
                </TouchButton>
              </View>
            </View>
          )}

          {/* THE MAESTRO'S JOURNEY INTEGRATION CARD */}
          <View style={[styles.journeyBridgeCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <View style={styles.journeyBridgeHeader}>
              <Text style={[styles.journeyBridgeKicker, { color: colors.purpleLight }]}>
                THE MAESTRO'S JOURNEY
              </Text>
              {matchedJourneyLevel ? (
                <Text style={[styles.journeyBridgeTitle, { color: colors.text }]}>
                  Featured in Level {matchedJourneyLevel.levelNumber}: {matchedJourneyLevel.title}
                </Text>
              ) : (
                <Text style={[styles.journeyBridgeTitle, { color: colors.text }]}>
                  Test Your Skills in The Maestro's Journey
                </Text>
              )}
            </View>

            <Text style={[styles.journeyBridgeDesc, { color: colors.textMuted }]}>
              {matchedJourneyLevel
                ? `Put ${selectedChord.root} ${selectedChord.type} to the test in Chapter ${matchedJourneyLevel.chapter} to earn stars and level up your musician tier.`
                : "Explore step-by-step challenges, earn achievement badges, and master ear training."}
            </Text>

            <TouchButton
              style={[styles.journeyActionBtn, { backgroundColor: colors.purple }]}
              pressScale={0.95}
              onPress={() =>
                matchedJourneyLevel
                  ? handleJumpToJourney(matchedJourneyLevel.id)
                  : handleNavigate("journey")
              }
            >
              <Text style={styles.journeyActionText}>
                {matchedJourneyLevel
                  ? `🚀 Practice in Journey (Lesson ${matchedJourneyLevel.levelNumber}) →`
                  : "🚀 Explore Journey Map →"}
              </Text>
            </TouchButton>
          </View>
        </View>
      )}

      {/* CHORD LIBRARY GRID BY TYPE */}
      <View style={styles.librarySection}>
        {chordTypesInTier.map((type) => {
          const chords = tierChords.filter((c) => c.type === type);
          return (
            <View key={type} style={styles.typeSection}>
              <View style={styles.typeHeaderRow}>
                <Text style={[styles.typeHeader, { color: colors.purpleLight }]}>
                  {type} Chords
                </Text>
                <Text style={[styles.typeCountBadge, { color: colors.textMuted }]}>
                  {chords.length} chords
                </Text>
              </View>

              <View style={styles.chordGrid}>
                {chords.map((chord, idx) => {
                  const isSelected =
                    selectedChord?.root === chord.root &&
                    selectedChord?.type === chord.type;
                  return (
                    <TouchButton
                      key={`${chord.root}-${chord.type}-${idx}`}
                      style={[
                        styles.chordButton,
                        {
                          backgroundColor: isSelected ? colors.purple : colors.surface2,
                          borderColor: isSelected ? colors.purpleLight : colors.border,
                        },
                      ]}
                      pressScale={0.92}
                      onPress={() => handleChordPress(chord)}
                    >
                      <Text
                        style={[
                          styles.chordButtonText,
                          { color: isSelected ? "#ffffff" : colors.text },
                        ]}
                      >
                        {chord.root}
                      </Text>
                      <Text
                        style={[
                          styles.chordTypeText,
                          {
                            color: isSelected
                              ? "rgba(255,255,255,0.9)"
                              : colors.textMuted,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {chord.type.replace("Dominant ", "Dom ").replace("Power (5th)", "5th")}
                      </Text>
                    </TouchButton>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      <BottomNav active="home" onNavigate={handleNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  backBtn: { fontSize: 20, fontWeight: "700" },
  closeCardBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  closeCardText: { fontSize: 11, fontWeight: "700" },
  iconHero: { alignSelf: "flex-start", marginBottom: 10, marginTop: 4 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "800" },
  subtitle: { fontSize: 13, marginBottom: 14, marginTop: 4, lineHeight: 18 },

  tierTabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  tierTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  tierTabActive: {
    elevation: 0,
  },
  tierTabIcon: { fontSize: 12 },
  tierTabLabel: { fontSize: 11, fontWeight: "600" },

  tierInfoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 18,
  },
  tierInfoTitle: { fontSize: 12, fontWeight: "800", marginBottom: 4 },
  tierInfoDesc: { fontSize: 12, lineHeight: 16 },

  chordDetail: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  chordName: { fontSize: 22, fontWeight: "800" },
  moodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  moodBadgeText: { fontSize: 10, fontWeight: "700" },
  formulaText: { fontSize: 12 },
  dismissHit: {
    padding: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  conceptBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  conceptLabel: { fontSize: 11, fontWeight: "800", marginBottom: 4 },
  conceptBody: { fontSize: 12, lineHeight: 17 },

  compareSection: {
    marginBottom: 14,
  },
  compareLabel: { fontSize: 11, fontWeight: "700", marginBottom: 6 },
  compareRow: { flexDirection: "row", gap: 6 },
  comparePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  comparePillText: { fontSize: 11, fontWeight: "700" },

  notesContainer: { marginBottom: 14 },
  notesLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  notesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  noteChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 64,
    alignItems: "center",
  },
  noteChipText: { fontSize: 17, fontWeight: "800" },
  noteDegreeText: { fontSize: 9, marginTop: 2, fontWeight: "600" },

  actionButtonBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  primaryActionBtn: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: { color: "white", fontSize: 13, fontWeight: "700" },
  secondaryActionBtn: {
    flex: 1.1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: { fontSize: 12, fontWeight: "700" },
  practiceToggleBtn: {
    flex: 0.9,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  practiceToggleText: { fontSize: 12, fontWeight: "700" },

  practiceSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  practiceHeader: { marginBottom: 10 },
  practiceTitle: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  practicePrompt: { fontSize: 11, lineHeight: 15 },
  practiceSuccessBanner: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  practiceSuccessTitle: { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  practiceSuccessSub: { fontSize: 11, textAlign: "center" },
  practiceSelectedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  practiceSelectedLabel: { fontSize: 11, fontWeight: "600" },
  clearMiniHit: { padding: 4 },
  practiceControls: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  hintBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  hintBtnText: { fontSize: 11, fontWeight: "700" },

  journeyBridgeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 2,
  },
  journeyBridgeHeader: { marginBottom: 6 },
  journeyBridgeKicker: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  journeyBridgeTitle: { fontSize: 13, fontWeight: "800", marginTop: 2 },
  journeyBridgeDesc: { fontSize: 11, lineHeight: 16, marginBottom: 10 },
  journeyActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  journeyActionText: { color: "white", fontSize: 12, fontWeight: "700" },

  librarySection: { marginBottom: 24 },
  typeSection: { marginBottom: 20 },
  typeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  typeHeader: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  typeCountBadge: { fontSize: 10, fontWeight: "600" },
  chordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chordButton: {
    width: "22.5%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  chordButtonText: { fontSize: 18, fontWeight: "800" },
  chordTypeText: { fontSize: 9, marginTop: 2, textAlign: "center" },
});
