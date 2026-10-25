import React, { useState, useRef } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme";
import TouchButton from "./TouchButton";
import VictoryCelebration from "./VictoryCelebration";
import { useAudio } from "../audio/AudioContext";
import { markTutorialComplete } from "../services/learningService";
import {
  getTutorialSession,
  updateTutorialSession,
  resetTutorialSession,
} from "../services/sessionStore";

const TUTORIAL_STEPS = [
  {
    step: 1,
    category: "HANDS-ON SOUND 🎶",
    title: "1. Pitch & Scale Steps",
    subtitle: "Pitches climb higher step by step",
    body: "Every musical sound has a pitch. Tap C, D, and E below to feel and hear the notes rise in pitch.",
    type: "tap_notes",
    notesToTap: ["C", "D", "E"],
    buttonLabel: "Next: The Anchor →",
  },
  {
    step: 2,
    category: "CHORD ANCHOR ⚡",
    title: "2. The Power 5th",
    subtitle: "The strong, open foundation",
    body: "When C (1) and G (5) play together, they create the 'Fifth'—a solid, hollow interval that anchors rock, cinema, and pop songs.",
    type: "single_chord",
    chordPreview: ["C", "G"],
    chordName: "C Power 5th (C - G)",
    mood: "Bold, Solid & Open ⚡",
    buttonLabel: "Next: The Feeling →",
  },
  {
    step: 3,
    category: "EMOTION BY TOUCH ☀️🌧️",
    title: "3. Happy 3rd vs Sad 3rd",
    subtitle: "The middle note controls the feeling",
    body: "Between C and G sits the emotional switch:\n• E creates C Major: bright, joyful, triumphant ☀️\n• E♭ creates C Minor: soulful, moody, reflective 🌧️\nTap both chords below to feel the difference!",
    type: "dual_chord",
    majorChord: {
      name: "C Major Triad",
      notes: ["C", "E", "G"],
      mood: "Bright & Triumphant ☀️",
    },
    minorChord: {
      name: "C Minor Triad",
      notes: ["C", "E♭", "G"],
      mood: "Soulful & Melancholic 🌧️",
    },
    buttonLabel: "Next: App Tour (The Journey) →",
  },
  {
    step: 4,
    category: "APP SHOWTHROUGH 🗺️",
    title: "4. The Maestro's Journey",
    subtitle: "Your step-by-step learning roadmap",
    body: "Never wonder what to practice next. The Journey guides you chapter by chapter with hands-on challenges on the 12-note grid.",
    type: "info_journey",
    highlights: [
      { icon: "01", title: "Chapter 1: Building Blocks", desc: "Root notes, fifths, major & minor triads" },
      { icon: "02", title: "Chapter 2: Core Triads", desc: "Subdominant (F) and Dominant (G) tension" },
      { icon: "03", title: "Chapter 3: Colorful Harmonies", desc: "Suspended 4ths, diminished & augmented" },
    ],
    buttonLabel: "Next: Smart Builder & Dojo →",
  },
  {
    step: 5,
    category: "APP SHOWTHROUGH 🛠️🥋",
    title: "5. Smart Builder & Sound Dojo",
    subtitle: "Touch sandbox & ear training gym",
    body: "Explore chords freely with real-time assistance and hone your ear with fast mini-games:",
    type: "info_tools",
    highlights: [
      {
        icon: "🛠️",
        title: "Smart Builder",
        desc: "Tap any notes on the grid. Smart Guide detects chord formulas, roots, and mood tags in real time.",
      },
      {
        icon: "🥋",
        title: "Sound Dojo",
        desc: "Train your ears with 3 mini-games: High vs Low Pitch, Happy vs Sad Mood, and Mystery Missing Note.",
      },
    ],
    buttonLabel: "Next: Daily Habit →",
  },
  {
    step: 6,
    category: "APP SHOWTHROUGH 📅",
    title: "6. Daily Hub & Streaks",
    subtitle: "Daily consistency builds great ears",
    body: "Every day you open MusiXs, the Daily Hub organizes your musical practice strictly by priority:\n\n1. Priority #1: Your next unplayed Journey lesson\n2. Priority #2: Chord of the Day audio & formula\n3. Priority #3: Sound Dojo ear workout\n4. Priority #4: Path to Intermediate graduation checklist",
    type: "info_daily",
    buttonLabel: "Next: Road to Intermediate 🚀",
  },
  {
    step: 7,
    category: "YOUR NEXT LEVEL 🚀",
    title: "7. Path to Intermediate",
    subtitle: "What you need to reach Intermediate level",
    body: "You start as a Note Novice (Beginner). To graduate to Intermediate, complete these 4 milestone objectives:",
    type: "milestones",
    milestones: [
      { icon: "✓", title: "Interactive Chord Tour", desc: "Complete this walkthrough (Unlocks now!)" },
      { icon: "🗺️", title: "Master Chapter 1", desc: "Pass all 4 Building Block levels in The Journey" },
      { icon: "⭐", title: "Collect 10 Journey Stars", desc: "Earn stars by building chords with accuracy" },
      { icon: "📈", title: "Reach Level 3 (250 XP)", desc: "Advance from Note Novice to Triad Apprentice" },
    ],
    rewardCallout: "Graduating unlocks Intermediate chord inversions, suspended chords, and advanced ear challenges!",
    buttonLabel: "Finish & Claim 100 XP 🎓",
  },
];

export default function InteractiveTutorial({
  visible,
  onClose,
  onComplete,
  onNavigateToJourney,
}) {
  const { colors } = useAppTheme();
  const { playChord } = useAudio();
  const savedSession = getTutorialSession();
  const [currentStepIndex, setCurrentStepIndex] = useState(savedSession.currentStepIndex);
  const [tappedNotes, setTappedNotes] = useState(savedSession.tappedNotes);
  const [completed, setCompleted] = useState(false);

  const lastNoteTapRef = useRef(0);
  const lastChordPlayRef = useRef(0);
  const nextLockRef = useRef(false);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  const handleNoteTap = (note) => {
    const now = Date.now();
    if (now - lastNoteTapRef.current >= 150) {
      lastNoteTapRef.current = now;
      playChord([note]);
    }
    if (!tappedNotes.includes(note)) {
      const nextNotes = [...tappedNotes, note];
      setTappedNotes(nextNotes);
      updateTutorialSession({ tappedNotes: nextNotes });
    }
  };

  const handlePlayChord = (notes) => {
    const now = Date.now();
    if (now - lastChordPlayRef.current < 450) return;
    lastChordPlayRef.current = now;
    playChord(notes);
  };

  const handleNext = async () => {
    if (nextLockRef.current) return;
    nextLockRef.current = true;
    setTimeout(() => {
      nextLockRef.current = false;
    }, 350);
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      updateTutorialSession({ currentStepIndex: nextIdx });
    } else {
      // Completed all steps!
      setCompleted(true);
      try {
        await markTutorialComplete();
      } catch (err) {
        console.warn("Error marking tutorial complete:", err);
      }
      if (onComplete) {
        try {
          onComplete();
        } catch (err) {
          console.warn("Error in tutorial onComplete:", err);
        }
      }
    }
  };

  const handleDone = () => {
    setCompleted(false);
    setCurrentStepIndex(0);
    setTappedNotes([]);
    resetTutorialSession();
    onClose();
  };

  const handleGoToJourney = () => {
    handleDone();
    if (onNavigateToJourney) {
      onNavigateToJourney();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {completed ? (
            <ScrollView contentContainerStyle={styles.contentCol} showsVerticalScrollIndicator={false}>
              <VictoryCelebration active={true} count={35} showBadge={false} colors={colors} />
              <View style={[styles.bigBadgeCircle, { backgroundColor: colors.purple }]}>
                <Text style={styles.badgeIcon}>🎓</Text>
              </View>
              <Text style={[styles.title, { color: colors.purpleLight, textAlign: "center" }]}>
                Tutorial & Tour Completed!
              </Text>
              <Text style={[styles.bodyText, { color: colors.text, textAlign: "center" }]}>
                You unlocked the <Text style={{ fontWeight: "800", color: colors.purpleLight }}>First Chord Built</Text> badge and completed Milestone #1 toward Intermediate!
              </Text>

              <View style={[styles.rewardPill, { backgroundColor: colors.surface2, borderColor: colors.purpleLight }]}>
                <Text style={[styles.rewardText, { color: colors.purpleLight }]}>
                  +100 XP Earned ⭐
                </Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.summaryTitle, { color: colors.purpleLight }]}>
                  Your Next Objective:
                </Text>
                <Text style={[styles.summaryBody, { color: colors.text }]}>
                  Head over to <Text style={{ fontWeight: "700" }}>The Journey</Text> to start Level 1 (The Root Note) and collect your first stars on the path to Intermediate.
                </Text>
              </View>

              <View style={styles.completionActions}>
                <TouchButton
                  style={[styles.primaryButton, { backgroundColor: colors.purple }]}
                  onPress={handleGoToJourney}
                >
                  <Text style={styles.primaryButtonText}>Start The Journey 🗺️</Text>
                </TouchButton>
                <TouchButton
                  style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surface2 }]}
                  onPress={handleDone}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.textMuted }]}>
                    Explore Home ⌂
                  </Text>
                </TouchButton>
              </View>
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.contentCol} showsVerticalScrollIndicator={false}>
              {/* Header indicator */}
              <View style={styles.headerRow}>
                <View style={styles.categoryPill}>
                  <Text style={[styles.categoryText, { color: colors.purpleLight }]}>
                    {currentStep.category}
                  </Text>
                </View>
                <View style={styles.headerRight}>
                  <Text style={[styles.stepIndicator, { color: colors.textMuted }]}>
                    {currentStep.step} / {TUTORIAL_STEPS.length}
                  </Text>
                  <TouchButton onPress={onClose} style={styles.closeHit}>
                    <Text style={[styles.closeText, { color: colors.textMuted }]}>✕</Text>
                  </TouchButton>
                </View>
              </View>

              {/* Title & Subtitle */}
              <Text style={[styles.title, { color: colors.text }]}>{currentStep.title}</Text>
              <Text style={[styles.subtitle, { color: colors.purpleLight }]}>{currentStep.subtitle}</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>{currentStep.body}</Text>

              {/* Step 1: Note tap practice */}
              {currentStep.type === "tap_notes" && (
                <View style={styles.interactiveArea}>
                  <Text style={[styles.promptLabel, { color: colors.textMuted }]}>
                    Tap each key to play the pitch:
                  </Text>
                  <View style={styles.noteRow}>
                    {currentStep.notesToTap.map((note) => {
                      const isTapped = tappedNotes.includes(note);
                      return (
                        <TouchButton
                          key={note}
                          style={[
                            styles.noteKey,
                            {
                              backgroundColor: isTapped ? colors.purple : colors.surface2,
                              borderColor: isTapped ? colors.purpleLight : colors.border,
                            },
                          ]}
                          onPress={() => handleNoteTap(note)}
                        >
                          <Text
                            style={[
                              styles.noteKeyText,
                              { color: isTapped ? "#ffffff" : colors.text },
                            ]}
                          >
                            {note}
                          </Text>
                        </TouchButton>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Step 2: Single chord preview (Power 5th) */}
              {currentStep.type === "single_chord" && (
                <View style={[styles.chordBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                  <Text style={[styles.chordBoxTitle, { color: colors.purpleLight }]}>
                    {currentStep.chordName}
                  </Text>
                  <Text style={[styles.moodTag, { color: colors.text }]}>{currentStep.mood}</Text>
                  <TouchButton
                    style={[styles.playChordBtn, { backgroundColor: colors.purple }]}
                    onPress={() => handlePlayChord(currentStep.chordPreview)}
                  >
                    <Text style={styles.playChordBtnText}>▶ Play Power 5th</Text>
                  </TouchButton>
                </View>
              )}

              {/* Step 3: Dual chord comparison (Major vs Minor 3rd) */}
              {currentStep.type === "dual_chord" && (
                <View style={styles.dualChordContainer}>
                  <View style={[styles.chordBoxMini, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                    <Text style={[styles.chordBoxTitle, { color: colors.purpleLight }]}>
                      {currentStep.majorChord.name}
                    </Text>
                    <Text style={[styles.notesInline, { color: colors.textMuted }]}>
                      {currentStep.majorChord.notes.join(" - ")}
                    </Text>
                    <Text style={[styles.moodTag, { color: colors.text }]}>
                      {currentStep.majorChord.mood}
                    </Text>
                    <TouchButton
                      style={[styles.playChordBtn, { backgroundColor: colors.purple }]}
                      onPress={() => handlePlayChord(currentStep.majorChord.notes)}
                    >
                      <Text style={styles.playChordBtnText}>▶ Play Major ☀️</Text>
                    </TouchButton>
                  </View>

                  <View style={[styles.chordBoxMini, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                    <Text style={[styles.chordBoxTitle, { color: colors.purpleLight }]}>
                      {currentStep.minorChord.name}
                    </Text>
                    <Text style={[styles.notesInline, { color: colors.textMuted }]}>
                      {currentStep.minorChord.notes.join(" - ")}
                    </Text>
                    <Text style={[styles.moodTag, { color: colors.text }]}>
                      {currentStep.minorChord.mood}
                    </Text>
                    <TouchButton
                      style={[styles.playChordBtn, { backgroundColor: colors.purple }]}
                      onPress={() => handlePlayChord(currentStep.minorChord.notes)}
                    >
                      <Text style={styles.playChordBtnText}>▶ Play Minor 🌧️</Text>
                    </TouchButton>
                  </View>
                </View>
              )}

              {/* Steps 4 & 5: Feature highlights */}
              {(currentStep.type === "info_journey" || currentStep.type === "info_tools") && (
                <View style={styles.highlightsList}>
                  {currentStep.highlights.map((h, i) => (
                    <View
                      key={i}
                      style={[
                        styles.highlightItem,
                        { backgroundColor: colors.surface2, borderColor: colors.border },
                      ]}
                    >
                      <View style={[styles.highlightIconBox, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.highlightIconText, { color: colors.purpleLight }]}>
                          {h.icon}
                        </Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.highlightTitle, { color: colors.text }]}>
                          {h.title}
                        </Text>
                        <Text style={[styles.highlightDesc, { color: colors.textMuted }]}>
                          {h.desc}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Step 6: Daily Hub priorities preview */}
              {currentStep.type === "info_daily" && (
                <View style={[styles.dailyPriorityBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                  <View style={styles.priorityRow}>
                    <View style={[styles.priorityPill, { backgroundColor: colors.purple }]}>
                      <Text style={styles.priorityPillText}>#1</Text>
                    </View>
                    <Text style={[styles.priorityName, { color: colors.text }]}>
                      Continue Journey (Next lesson)
                    </Text>
                  </View>
                  <View style={styles.priorityRow}>
                    <View style={[styles.priorityPill, { backgroundColor: colors.purple }]}>
                      <Text style={styles.priorityPillText}>#2</Text>
                    </View>
                    <Text style={[styles.priorityName, { color: colors.text }]}>
                      Chord of the Day + Audio
                    </Text>
                  </View>
                  <View style={styles.priorityRow}>
                    <View style={[styles.priorityPill, { backgroundColor: colors.purple }]}>
                      <Text style={styles.priorityPillText}>#3</Text>
                    </View>
                    <Text style={[styles.priorityName, { color: colors.text }]}>
                      Sound Dojo Ear Training
                    </Text>
                  </View>
                  <View style={styles.priorityRow}>
                    <View style={[styles.priorityPill, { backgroundColor: colors.purple }]}>
                      <Text style={styles.priorityPillText}>#4</Text>
                    </View>
                    <Text style={[styles.priorityName, { color: colors.text }]}>
                      Intermediate Graduation Checklist
                    </Text>
                  </View>
                </View>
              )}

              {/* Step 7: Intermediate Milestones */}
              {currentStep.type === "milestones" && (
                <View style={styles.milestonesList}>
                  {currentStep.milestones.map((m, i) => (
                    <View
                      key={i}
                      style={[
                        styles.milestoneItem,
                        {
                          backgroundColor: colors.surface2,
                          borderColor: i === 0 ? colors.purpleLight : colors.border,
                        },
                      ]}
                    >
                      <View style={[styles.milestoneIconCircle, { backgroundColor: i === 0 ? colors.purple : colors.surface }]}>
                        <Text style={[styles.milestoneIcon, { color: i === 0 ? "#ffffff" : colors.text }]}>
                          {m.icon}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.milestoneTitle, { color: colors.text }]}>
                          {m.title}
                        </Text>
                        <Text style={[styles.milestoneDesc, { color: colors.textMuted }]}>
                          {m.desc}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <View style={[styles.calloutBox, { backgroundColor: colors.surface2, borderColor: colors.purpleLight }]}>
                    <Text style={[styles.calloutText, { color: colors.purpleLight }]}>
                      ⚡ {currentStep.rewardCallout}
                    </Text>
                  </View>
                </View>
              )}

              {/* Advance action button */}
              <TouchButton
                style={[styles.primaryButton, { backgroundColor: colors.purple, marginTop: 10 }]}
                onPress={handleNext}
              >
                <Text style={styles.primaryButtonText}>{currentStep.buttonLabel}</Text>
              </TouchButton>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "88%",
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  contentCol: {
    gap: 12,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: "700",
  },
  closeHit: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    fontWeight: "700",
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: -4,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  interactiveArea: {
    gap: 10,
    marginTop: 4,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  noteRow: {
    flexDirection: "row",
    gap: 12,
  },
  noteKey: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  noteKeyText: {
    fontSize: 20,
    fontWeight: "800",
  },
  chordBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  chordBoxMini: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  dualChordContainer: {
    flexDirection: "row",
    gap: 10,
  },
  chordBoxTitle: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  notesInline: {
    fontSize: 12,
    fontWeight: "700",
  },
  moodTag: {
    fontSize: 12,
    fontWeight: "600",
  },
  playChordBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
    width: "100%",
  },
  playChordBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  highlightsList: {
    gap: 10,
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  highlightIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightIconText: {
    fontSize: 14,
    fontWeight: "800",
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  highlightDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  dailyPriorityBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priorityPill: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityPillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  priorityName: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  milestonesList: {
    gap: 8,
  },
  milestoneItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  milestoneIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneIcon: {
    fontSize: 14,
    fontWeight: "800",
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  milestoneDesc: {
    fontSize: 11,
  },
  calloutBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
  },
  calloutText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  completionActions: {
    gap: 10,
    marginTop: 6,
    width: "100%",
  },
  bigBadgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  badgeIcon: {
    fontSize: 36,
  },
  rewardPill: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: "800",
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  summaryBody: {
    fontSize: 12,
    lineHeight: 17,
  },
});
