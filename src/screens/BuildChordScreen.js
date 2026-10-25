import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View , Platform} from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import TouchButton from "../components/TouchButton";
import FadeSlide from "../components/FadeSlide";
import NoteGrid from "../components/NoteGrid";
import NoteBurst from "../components/NoteBurst";
import ChipsFlow from "../components/ChipsFlow";
import { identifyChord } from "../utils/musicTheory";
import { useAudio } from "../audio/AudioContext";
import { logChordActivity, ACTIVITY_TYPES } from "../db/historyDatabaseService";
import { BuildChordIcon } from "../components/ChordIcons";
import { addXP, incrementQuestProgress, unlockBadge } from "../services/learningService";
import {
  getBuildChordSession,
  updateBuildChordSession,
  resetBuildChordSession,
} from "../services/sessionStore";

// How many chords one build session covers; 1 keeps the original flow.
const COUNT_OPTIONS = [1, 2, 3, 4, 5];

const ROOT_SUGGESTIONS = {
  C: [{ name: "C Major ☀️", notes: ["C", "E", "G"], companion: ["E", "G"] }, { name: "C Minor 🌧️", notes: ["C", "D#", "G"], companion: ["D#", "G"] }, { name: "Csus4 ⏳", notes: ["C", "F", "G"], companion: ["F", "G"] }],
  D: [{ name: "D Major ☀️", notes: ["D", "F#", "A"], companion: ["F#", "A"] }, { name: "D Minor 🌧️", notes: ["D", "F", "A"], companion: ["F", "A"] }, { name: "Dsus4 ⏳", notes: ["D", "G", "A"], companion: ["G", "A"] }],
  E: [{ name: "E Major ☀️", notes: ["E", "G#", "B"], companion: ["G#", "B"] }, { name: "E Minor 🌧️", notes: ["E", "G", "B"], companion: ["G", "B"] }, { name: "Esus4 ⏳", notes: ["E", "A", "B"], companion: ["A", "B"] }],
  F: [{ name: "F Major ☀️", notes: ["F", "A", "C"], companion: ["A", "C"] }, { name: "F Minor 🌧️", notes: ["F", "G#", "C"], companion: ["G#", "C"] }, { name: "Fsus4 ⏳", notes: ["F", "A#", "C"], companion: ["A#", "C"] }],
  G: [{ name: "G Major ☀️", notes: ["G", "B", "D"], companion: ["B", "D"] }, { name: "G Minor 🌧️", notes: ["G", "A#", "D"], companion: ["A#", "D"] }, { name: "Gsus4 ⏳", notes: ["G", "C", "D"], companion: ["C", "D"] }],
  A: [{ name: "A Major ☀️", notes: ["A", "C#", "E"], companion: ["C#", "E"] }, { name: "A Minor 🌧️", notes: ["A", "C", "E"], companion: ["C", "E"] }, { name: "Asus4 ⏳", notes: ["A", "D", "E"], companion: ["D", "E"] }],
  B: [{ name: "B Major ☀️", notes: ["B", "D#", "F#"], companion: ["D#", "F#"] }, { name: "B Minor 🌧️", notes: ["B", "D", "F#"], companion: ["D", "F#"] }, { name: "Bsus4 ⏳", notes: ["B", "E", "F#"], companion: ["E", "F#"] }],
};

function getChordMetadata(chordName) {
  if (!chordName || chordName.includes("(no standard match)")) {
    return null;
  }
  if (chordName.includes("Major")) {
    return { mood: "☀️ Bright & Triumphant", formula: "1 (Root) · 3 (Major 3rd) · 5 (5th)" };
  }
  if (chordName.includes("Minor")) {
    return { mood: "🌧️ Moody & Emotional", formula: "1 (Root) · ♭3 (Minor 3rd) · 5 (5th)" };
  }
  if (chordName.includes("Sus4")) {
    return { mood: "⏳ Suspenseful & Unresolved", formula: "1 (Root) · 4 (4th) · 5 (5th)" };
  }
  if (chordName.includes("Sus2")) {
    return { mood: "🎐 Ethereal & Floating", formula: "1 (Root) · 2 (2nd) · 5 (5th)" };
  }
  if (chordName.includes("Diminished")) {
    return { mood: "⚡ Tense & Mysterious", formula: "1 (Root) · ♭3 (Minor 3rd) · ♭5 (Dim 5th)" };
  }
  if (chordName.includes("Augmented")) {
    return { mood: "🌌 Dreamy & Otherworldly", formula: "1 (Root) · 3 (Major 3rd) · #5 (Aug 5th)" };
  }
  return { mood: "🎵 Harmonious", formula: "Standard Triad" };
}

export default function BuildChordScreen({ onBack, onBuilt, onNavigate }) {
  const { colors } = useAppTheme();
  const { playChord, playChordSequence, stopChordSequence } = useAudio();
  const savedSession = getBuildChordSession();
  const [count, setCount] = useState(savedSession.count);
  const [builtChords, setBuiltChords] = useState(savedSession.builtChords);
  const [selected, setSelected] = useState(savedSession.selected);
  const [smartGuide, setSmartGuide] = useState(savedSession.smartGuide);
  const [phase, setPhase] = useState(savedSession.phase === "playing" ? "building" : savedSession.phase);
  const [playingIndex, setPlayingIndex] = useState(-1); // chord currently sounding
  const aliveRef = useRef(true);
  const busyRef = useRef(false);

  const [isPlayingChord, setIsPlayingChord] = useState(false);
  const playChordTimerRef = useRef(null);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (playChordTimerRef.current) clearTimeout(playChordTimerRef.current);
    };
  }, []);

  const handlePlaySelected = () => {
    if (selected.length === 0 || phase === "playing" || isPlayingChord) return;
    setIsPlayingChord(true);
    playChord(selected);
    if (playChordTimerRef.current) clearTimeout(playChordTimerRef.current);
    playChordTimerRef.current = setTimeout(() => {
      setIsPlayingChord(false);
      playChordTimerRef.current = null;
    }, 700);
  };

  const handleStart = () => {
    setBuiltChords([]);
    setSelected([]);
    setPhase("building");
    updateBuildChordSession({ count, builtChords: [], selected: [], phase: "building" });
  };

  const handleStartOver = () => {
    resetBuildChordSession();
    setCount(1);
    setBuiltChords([]);
    setSelected([]);
    setPhase("setup");
  };

  const handleChooseCount = (n) => {
    setCount(n);
    updateBuildChordSession({ count: n });
  };

  const leave = (go) => {
    updateBuildChordSession({
      count,
      builtChords,
      selected,
      smartGuide,
      phase: phase === "playing" ? "building" : phase,
    });
    stopChordSequence();
    go();
  };

  const handleBack = () => leave(onBack);
  const handleNavigate = (key) => leave(() => onNavigate(key));

  const toggleNote = (note) => {
    if (phase !== "building") return;
    setSelected((prev) => {
      const next = prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note];
      updateBuildChordSession({ selected: next });
      return next;
    });
  };

  const handleEnter = async () => {
    if (busyRef.current || phase !== "building" || selected.length < 2) return;
    const chordName = identifyChord(selected);
    const chord = { notes: [...selected], chordName };
    const allChords = [...builtChords, chord];

    const isRecognized = !chord.chordName.includes("(no standard match)");

    logChordActivity(
      ACTIVITY_TYPES.BUILD,
      chord.chordName,
      isRecognized,
      { notes: chord.notes, index: allChords.length, total: count }
    );

    if (isRecognized) {
      await addXP(20);
      await incrementQuestProgress("build_chords", 1);
      // Check accidental badge
      if (selected.some((n) => n.includes("#") || n.includes("♭"))) {
        await unlockBadge("accidental_artist");
      }
      if (allChords.length >= 4) {
        await unlockBadge("progression_pro");
      }
    }

    if (allChords.length < count) {
      setBuiltChords(allChords);
      setSelected([]);
      updateBuildChordSession({ builtChords: allChords, selected: [], phase: "building" });
      return;
    }

    // Session complete: perform the whole progression back in order
    busyRef.current = true;
    setSelected([]);
    setBuiltChords(allChords);
    setPlayingIndex(0);
    setPhase("playing");

    const completed = await playChordSequence(allChords, {
      onChord: setPlayingIndex,
      isCancelled: () => !aliveRef.current,
    });

    busyRef.current = false;
    setPlayingIndex(-1);
    if (!aliveRef.current) return;
    if (!completed) {
      setPhase("building");
      return;
    }
    resetBuildChordSession();
    onBuilt({ chords: allChords, ...chord });
  };

  if (phase === "setup") {
    return (
      <ScreenWrapper scroll>
        <TouchButton style={styles.backBtnHit} onPress={handleBack} accessibilityLabel="Back to home">
          <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
        </TouchButton>
        <View style={styles.iconHero}>
          <BuildChordIcon size={56} colors={colors} />
        </View>
        <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Build a Chord</Text>

        <FadeSlide delay={80}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>How many chords?</Text>
        </FadeSlide>
        <View style={styles.row}>
          {COUNT_OPTIONS.map((n, i) => (
            <FadeSlide key={n} delay={140 + i * 60} style={styles.fadeFlex}>
              <TouchButton
                style={[
                  styles.countChip,
                  {
                    backgroundColor: count === n ? colors.purple : colors.glass,
                    borderColor: count === n ? colors.purple : colors.glassBorder,
                    borderWidth: 1,...Platform.select({ ios: { shadowColor: colors.purple, shadowOpacity: count === n ? 0.7 : 0, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 0 } }),
                  },
                ]}
                pulseKey={count === n ? `count-${n}` : undefined}
                onPress={() => handleChooseCount(n)}
              >
                <Text style={[styles.countText, { color: count === n ? "#ffffff" : colors.text }]}>{n}</Text>
              </TouchButton>
            </FadeSlide>
          ))}
        </View>
        <FadeSlide key={`hint-${count}`} delay={60} distance={8}>
          <Text style={[styles.countHint, { color: colors.textMuted }]}>
            You will build {count} chord{count > 1 ? "s" : ""} in a row
          </Text>
        </FadeSlide>

        <FadeSlide delay={420}>
          <TouchButton
            style={[
              styles.enterButton,
              {
                backgroundColor: colors.purple,...Platform.select({ ios: { shadowColor: colors.purple, shadowOpacity: 0.7, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 0 } }),
              },
            ]}
            onPress={handleStart}
          >
            <Text style={styles.enterText}>Start Building</Text>
          </TouchButton>
        </FadeSlide>

        <BottomNav active="home" onNavigate={handleNavigate} />
      </ScreenWrapper>
    );
  }

  const playing = phase === "playing";
  const activeRoot = selected.length === 1 ? selected[0].charAt(0) : null;
  const currentSuggestions = activeRoot && ROOT_SUGGESTIONS[activeRoot] ? ROOT_SUGGESTIONS[activeRoot] : [];
  const suggestedKeys = smartGuide && activeRoot && currentSuggestions.length > 0
    ? [...new Set(currentSuggestions.flatMap((s) => s.companion))]
    : [];

  const currentChordName = selected.length >= 2 ? identifyChord(selected) : null;
  const chordMeta = currentChordName ? getChordMetadata(currentChordName) : null;

  return (
    <ScreenWrapper scroll>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <TouchButton style={styles.backBtnHit} onPress={handleBack} accessibilityLabel="Back to home">
          <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
        </TouchButton>
        <TouchButton
          style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border }}
          onPress={handleStartOver}
          accessibilityLabel="Start over with a new chord progression"
        >
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted }}>New Session ↺</Text>
        </TouchButton>
      </View>

      <View style={styles.progressArea}>
        <FadeSlide key={`progress-${builtChords.length}`} delay={40} distance={8}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressText, { color: playing ? colors.purpleLight : colors.textMuted }]}>
              {playing
                ? `▶ Playing back ${playingIndex + 1} of ${count}`
                : `Chord ${builtChords.length + 1} of ${count}`}
            </Text>
            {!playing && (
              <View style={styles.headerControls}>
                <TouchButton
                  style={[
                    styles.guideToggleBtn,
                    {
                      backgroundColor: smartGuide ? colors.purple : colors.surface2,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    const next = !smartGuide;
                    setSmartGuide(next);
                    updateBuildChordSession({ smartGuide: next });
                  }}
                >
                  <Text style={[styles.guideToggleText, { color: smartGuide ? "#ffffff" : colors.textMuted }]}>
                    💡 Guide {smartGuide ? "ON" : "OFF"}
                  </Text>
                </TouchButton>
                <TouchButton
                  style={styles.changeHit}
                  onPress={() => {
                    setPhase("setup");
                    updateBuildChordSession({ phase: "setup" });
                  }}
                >
                  <Text style={[styles.changeLink, { color: colors.purpleLight }]}>Change count</Text>
                </TouchButton>
              </View>
            )}
          </View>
        </FadeSlide>
        <NoteBurst trigger={builtChords.length} count={7} color={colors.purpleLight} rise={90} spread={150} />
      </View>

      {builtChords.length > 0 && (
        <ChipsFlow
          items={builtChords}
          keyOf={(c, i) => i}
          style={styles.builtList}
          renderItem={(c) => {
            const isSounding = builtChords.indexOf(c) === playingIndex;
            return (
              <View
                style={[
                  styles.builtChip,
                  {
                    backgroundColor: isSounding ? colors.purple : colors.glass,
                    borderColor: isSounding ? colors.purple : colors.glassBorder,...Platform.select({ ios: { shadowColor: colors.purple, shadowOpacity: isSounding ? 0.8 : 0, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 0 } }),
                  },
                ]}
              >
                <Text style={[styles.builtChipText, { color: isSounding ? "white" : colors.green }]}>
                  {isSounding ? "▶" : "✓"} {c.chordName}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* Selected Notes Bar */}
      <View style={[styles.selectedBar, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
        {selected.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {playing ? "Playing your chords…" : "Tap notes below to build"}
          </Text>
        ) : (
          <ChipsFlow
            key={selected.join(",")}
            items={selected}
            keyOf={(note) => note}
            gap={8}
            renderItem={(n) => (
              <View style={[styles.selectedDot, { backgroundColor: colors.purple }]}>
                <Text style={styles.selectedDotText}>{n}</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Smart Assistant Feedback: Chord Metadata or Suggestions */}
      {chordMeta && (
        <FadeSlide delay={40}>
          <View style={[styles.smartAssistantCard, { backgroundColor: colors.surface2, borderColor: colors.purple }]}>
            <View style={styles.smartRow}>
              <Text style={[styles.smartChordName, { color: colors.purpleLight }]}>{currentChordName}</Text>
              <Text style={[styles.smartMood, { color: colors.text }]}>{chordMeta.mood}</Text>
            </View>
            <Text style={[styles.smartFormula, { color: colors.textMuted }]}>{chordMeta.formula}</Text>
          </View>
        </FadeSlide>
      )}

      {/* Smart Suggestions for 1-note selection */}
      {smartGuide && selected.length === 1 && currentSuggestions.length > 0 && (
        <FadeSlide delay={50}>
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.suggestionsKicker, { color: colors.purpleLight }]}>
              💡 TAP A COMPANION CHORD TO COMPLETE:
            </Text>
            <View style={styles.suggestionChipsRow}>
              {currentSuggestions.map((sug) => (
                <TouchButton
                  key={sug.name}
                  style={[styles.sugChip, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                  onPress={() => {
                    const nextNotes = [...sug.notes];
                    setSelected(nextNotes);
                    updateBuildChordSession({ selected: nextNotes });
                  }}
                >
                  <Text style={[styles.sugChipText, { color: colors.text }]}>{sug.name}</Text>
                </TouchButton>
              ))}
            </View>
          </View>
        </FadeSlide>
      )}

      <NoteGrid
        selected={selected}
        suggestedNotes={suggestedKeys}
        onToggle={toggleNote}
        colors={colors}
        disabled={playing}
      />

      <View style={styles.row}>
        <TouchButton
          style={[styles.actionButton, { flex: 1, backgroundColor: colors.surface2, opacity: playing ? 0.5 : 1 }]}
          disabled={playing}
          onPress={() => {
            setSelected([]);
            updateBuildChordSession({ selected: [] });
          }}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>Clear All</Text>
        </TouchButton>
        <TouchButton
          style={[
            styles.actionButton,
            { flex: 1, backgroundColor: colors.surface2, opacity: selected.length && !playing ? 1 : 0.5 },
          ]}
          disabled={selected.length === 0 || playing || isPlayingChord}
          onPress={handlePlaySelected}
        >
          <Text style={[styles.actionText, { color: isPlayingChord ? colors.purpleLight : colors.text }]}>
            {isPlayingChord ? "Playing..." : "Play"}
          </Text>
        </TouchButton>
      </View>

      <TouchButton
        style={[
          styles.enterButton,
          {
            backgroundColor: colors.purple,
            opacity: selected.length >= 2 && !playing ? 1 : 0.5,...Platform.select({ ios: { shadowColor: colors.purple, shadowOpacity: selected.length >= 2 && !playing ? 0.7 : 0, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 0 } }),
          },
        ]}
        disabled={selected.length < 2 || playing}
        pulseKey={selected.length >= 2 && !playing ? "valid" : undefined}
        onPress={handleEnter}
      >
        <Text style={styles.enterText}>
          {builtChords.length + 1 < count ? "Next Chord" : "Enter"}
        </Text>
      </TouchButton>

      <BottomNav active="home" onNavigate={handleNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: { fontSize: 18, marginBottom: 4 },
  backBtnHit: { alignSelf: "flex-start", padding: 4 },
  iconHero: { alignItems: "center", marginBottom: 12, marginTop: 4 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 13, marginBottom: 12, marginTop: 4 },
  sectionLabel: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  fadeFlex: { flex: 1 },
  countChip: {
    flex: 1,
    aspectRatio: 1.4,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontSize: 18, fontWeight: "800" },
  countHint: { fontSize: 12, marginBottom: 8, textAlign: "center" },
  progressArea: { position: "relative" },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: { fontSize: 13, fontWeight: "600" },
  headerControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  guideToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  guideToggleText: { fontSize: 10, fontWeight: "800" },
  changeHit: { paddingVertical: 4, paddingHorizontal: 6 },
  changeLink: { fontSize: 12, fontWeight: "600" },
  builtList: { marginBottom: 10 },
  builtChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  builtChipText: { fontSize: 11, fontWeight: "700" },
  selectedBar: {
    borderRadius: 14,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    padding: 8,
    borderWidth: 1,
  },
  selectedDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8b7cf6",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  selectedDotText: { color: "white", fontSize: 13, fontWeight: "700" },
  smartAssistantCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    gap: 4,
  },
  smartRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smartChordName: { fontSize: 14, fontWeight: "800" },
  smartMood: { fontSize: 12, fontWeight: "600" },
  smartFormula: { fontSize: 11, fontWeight: "500" },
  suggestionsContainer: { marginBottom: 10, gap: 6 },
  suggestionsKicker: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  suggestionChipsRow: { flexDirection: "row", gap: 8 },
  sugChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  sugChipText: { fontSize: 11, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  actionButton: { borderRadius: 12, padding: 12, alignItems: "center" },
  actionText: { fontWeight: "600" },
  enterButton: { borderRadius: 12, padding: 12, alignItems: "center", marginTop: 2 },
  enterText: { color: "white", fontWeight: "700" },
});
