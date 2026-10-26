import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import TouchButton from "../components/TouchButton";
import FadeSlide from "../components/FadeSlide";
import NoteGrid from "../components/NoteGrid";
import VictoryCelebration from "../components/VictoryCelebration";
import { useAudio } from "../audio/AudioContext";
import {
  JOURNEY_LEVELS,
  LevelDefinition,
  getLevelProgress,
  saveLevelProgress,
  incrementQuestProgress,
} from "../services/learningService";
import {
  getJourneySession,
  updateJourneySession,
  resetJourneySession,
  updateLearnChordSession,
  subscribeSessionStore,
} from "../services/sessionStore";
import {
  findChordForJourneyLevel,
  findChordByNotes,
} from "../utils/chordLibrary";

export default function JourneyScreen({ onBack, onNavigate }) {
  const { colors } = useAppTheme();
  const { playChord } = useAudio();
  const [progress, setProgress] = useState({});
  const savedSession = getJourneySession();
  const initialLevel = savedSession.activeLevelId
    ? JOURNEY_LEVELS.find((l) => l.id === savedSession.activeLevelId) || null
    : null;
  const [activeLevel, setActiveLevel] = useState(initialLevel);
  const [selectedNotes, setSelectedNotes] = useState(savedSession.selectedNotes || []);

  const leave = (go) => {
    updateJourneySession({
      activeLevelId: activeLevel ? activeLevel.id : null,
      selectedNotes,
      challengeResult,
    });
    go();
  };

  const handleBack = () => leave(onBack);
  const handleNavigate = (key) => leave(() => onNavigate(key));
  const [challengeResult, setChallengeResult] = useState(savedSession.challengeResult || null); // null | { success: boolean, stars: number, xp: number, message: string }
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioTimerRef = useRef(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    return () => {
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    };
  }, []);

  const loadProgress = async () => {
    try {
      const p = await getLevelProgress();
      setProgress(p);
    } catch (err) {
      console.warn("Failed to load journey progress:", err);
    }
  };

  useEffect(() => {
    loadProgress();
    const unsub = subscribeSessionStore(() => {
      loadProgress();
      const js = getJourneySession();
      if (!js.activeLevelId) {
        setActiveLevel(null);
        setSelectedNotes([]);
        setChallengeResult(null);
      }
    });
    return unsub;
  }, []);

  const totalStars = Object.values(progress || {}).reduce((acc, curr) => acc + (curr?.stars || 0), 0);

  const isLevelUnlocked = (index) => {
    if (index <= 0) return true;
    const prevLevel = JOURNEY_LEVELS[index - 1];
    if (!prevLevel) return true;
    return ((progress && progress[prevLevel.id]?.stars) || 0) > 0;
  };

  const handleStartLevel = (level) => {
    setActiveLevel(level);
    setSelectedNotes([]);
    setChallengeResult(null);
    updateJourneySession({ activeLevelId: level.id, selectedNotes: [] });
  };

  const handleToggleNote = (note) => {
    setSelectedNotes((prev) => {
      const next = prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note];
      updateJourneySession({ selectedNotes: next });
      return next;
    });
  };

  const handlePlaySelected = () => {
    if (selectedNotes.length === 0 || isPlayingAudio) return;
    setIsPlayingAudio(true);
    playChord(selectedNotes);
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    audioTimerRef.current = setTimeout(() => {
      setIsPlayingAudio(false);
      audioTimerRef.current = null;
    }, 750);
  };

  const handleSubmit = async () => {
    if (!activeLevel || submitLockRef.current) return;
    submitLockRef.current = true;
    setTimeout(() => {
      submitLockRef.current = false;
    }, 600);

    // Check matching notes (order-independent)
    const target = [...activeLevel.targetNotes].sort();
    const current = [...selectedNotes].sort();
    const isCorrect =
      target.length === current.length && target.every((v, i) => v === current[i]);

    if (isCorrect) {
      playChord(activeLevel.targetNotes);
      const stars = 3;
      const res = await saveLevelProgress(activeLevel.id, stars, 100);
      await incrementQuestProgress("journey_step", 1);
      await loadProgress();

      const successRes = {
        success: true,
        stars,
        xp: res.xpEarned,
        message: `Outstanding! You mastered ${activeLevel.targetName}!`,
      };
      setChallengeResult(successRes);
      updateJourneySession({ challengeResult: successRes });
    } else {
      const failRes = {
        success: false,
        stars: 0,
        xp: 0,
        message: `Not quite. Tip: ${activeLevel.tip}`,
      };
      setChallengeResult(failRes);
      updateJourneySession({ challengeResult: failRes });
    }
  };

  const handleStudyInLearnChord = () => {
    if (activeLevel) {
      const matched =
        findChordForJourneyLevel(activeLevel.id) ||
        findChordByNotes(activeLevel.targetNotes);
      if (matched) {
        updateLearnChordSession({
          selectedChord: matched,
          activeNoteIndex: null,
          selectedTier: matched.tier || "foundations",
          practiceMode: false,
          practiceSelected: [],
        });
      }
    }
    leave(() => onNavigate("learn"));
  };

  const handleBackToMap = () => {
    setActiveLevel(null);
    setSelectedNotes([]);
    setChallengeResult(null);
    resetJourneySession();
  };

  const handleNextLevel = () => {
    const currentIndex = JOURNEY_LEVELS.findIndex((l) => l.id === activeLevel?.id);
    if (currentIndex >= 0 && currentIndex < JOURNEY_LEVELS.length - 1) {
      handleStartLevel(JOURNEY_LEVELS[currentIndex + 1]);
    } else {
      handleBackToMap();
    }
  };

  const handlePrevLevel = () => {
    const currentIndex = JOURNEY_LEVELS.findIndex((l) => l.id === activeLevel?.id);
    if (currentIndex > 0) {
      handleStartLevel(JOURNEY_LEVELS[currentIndex - 1]);
    }
  };

  // Group levels by Chapter
  const chapters = [1, 2, 3].map((ch) => ({
    chapter: ch,
    title: JOURNEY_LEVELS.find((l) => l.chapter === ch)?.chapterTitle || `Chapter ${ch}`,
    levels: JOURNEY_LEVELS.filter((l) => l.chapter === ch),
  }));

  // CHALLENGE ACTIVE VIEW
  if (activeLevel) {
    return (
      <ScreenWrapper scroll>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <TouchButton style={styles.backHit} onPress={handleBackToMap}>
            <Text style={[styles.backBtn, { color: colors.purpleLight }]}>← Map</Text>
          </TouchButton>
          {JOURNEY_LEVELS.findIndex((l) => l.id === activeLevel?.id) > 0 && (
            <TouchButton
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border }}
              onPress={handlePrevLevel}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.purpleLight }}>← Previous Level</Text>
            </TouchButton>
          )}
        </View>

        <View style={styles.challengeHeader}>
          <Text style={[styles.levelKicker, { color: colors.purpleLight }]}>
            LEVEL {activeLevel.levelNumber} · {activeLevel.chapterTitle.toUpperCase()}
          </Text>
          <Text style={[styles.levelTitle, { color: colors.text }]}>{activeLevel.title}</Text>
          <Text style={[styles.targetName, { color: colors.purpleLight }]}>
            Goal: {activeLevel.targetName}
          </Text>
        </View>

        {/* Concept Card */}
        <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <Text style={[styles.conceptTitle, { color: colors.text }]}>Concept</Text>
          <Text style={[styles.conceptText, { color: colors.textMuted }]}>{activeLevel.concept}</Text>
          <View style={[styles.tipBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Text style={[styles.tipText, { color: colors.purpleLight }]}>💡 {activeLevel.tip}</Text>
          </View>

          <TouchButton
            style={[styles.studyChordBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
            onPress={handleStudyInLearnChord}
            accessibilityLabel="Study chord breakdown in Learn a Chord"
          >
            <Text style={[styles.studyChordText, { color: colors.purpleLight }]}>
              📖 Study Chord Breakdown in Learn a Chord →
            </Text>
          </TouchButton>
        </View>

        {/* Result Feedback or Interactive Workspace */}
        {challengeResult?.success ? (
          <View style={[styles.successCard, { backgroundColor: colors.surface, borderColor: colors.green }]}>
            <VictoryCelebration active={true} count={25} showBadge={false} colors={colors} />
            <Text style={styles.starsRow}>⭐⭐⭐</Text>
            <Text style={[styles.successTitle, { color: colors.green }]}>Level Passed!</Text>
            <Text style={[styles.successDesc, { color: colors.text }]}>{challengeResult.message}</Text>
            <Text style={[styles.xpEarned, { color: colors.purpleLight }]}>+{challengeResult.xp} XP ⭐</Text>
            <View style={styles.actionRow}>
              <TouchButton
                style={[styles.primaryBtn, { backgroundColor: colors.purple }]}
                onPress={handleNextLevel}
              >
                <Text style={styles.primaryBtnText}>Next Level →</Text>
              </TouchButton>
              <TouchButton
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={handleBackToMap}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.textMuted }]}>Journey Map</Text>
              </TouchButton>
            </View>
          </View>
        ) : (
          <View style={styles.workspace}>
            {challengeResult?.success === false ? (
              <View style={[styles.hintCard, { backgroundColor: colors.surface2, borderColor: colors.red }]}>
                <Text style={[styles.hintText, { color: colors.red }]}>{challengeResult.message}</Text>
              </View>
            ) : null}

            {/* Selected Notes Bar */}
            <View style={[styles.selectedBar, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Text style={[styles.selectedLabel, { color: colors.textMuted }]}>
                Selected: {selectedNotes.length === 0 ? "(None yet - tap below)" : selectedNotes.join(" · ")}
              </Text>
              {selectedNotes.length > 0 && (
                <TouchButton style={styles.miniPlayBtn} disabled={isPlayingAudio} onPress={handlePlaySelected}>
                  <Text style={[styles.miniPlayText, { color: colors.purpleLight }]}>{isPlayingAudio ? "🎵 Playing..." : "▶ Hear"}</Text>
                </TouchButton>
              )}
            </View>

            <NoteGrid
              selected={selectedNotes}
              suggestedNotes={activeLevel.targetNotes}
              onToggle={handleToggleNote}
              colors={colors}
            />

            <View style={styles.buttonRow}>
              <TouchButton
                style={[styles.clearBtn, { backgroundColor: colors.surface2 }]}
                onPress={() => {
                  setSelectedNotes([]);
                  updateJourneySession({ selectedNotes: [] });
                }}
              >
                <Text style={[styles.clearBtnText, { color: colors.textMuted }]}>Clear</Text>
              </TouchButton>
              <TouchButton
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: colors.purple,
                    opacity: selectedNotes.length > 0 ? 1 : 0.5,
                  },
                ]}
                disabled={selectedNotes.length === 0}
                onPress={handleSubmit}
              >
                <Text style={styles.submitBtnText}>Submit Answer ✓</Text>
              </TouchButton>
            </View>
          </View>
        )}

        <BottomNav active="journey" onNavigate={handleNavigate} />
      </ScreenWrapper>
    );
  }

  // MAIN JOURNEY MAP VIEW
  return (
    <ScreenWrapper scroll>
      <TouchButton style={styles.backHit} onPress={handleBack}>
        <Text style={[styles.backBtn, { color: colors.purpleLight }]}>← Home</Text>
      </TouchButton>

      {/* Header */}
      <View style={styles.mapHeader}>
        <FadeSlide direction="down">
          <Text style={[styles.title, { color: colors.purpleLight }]}>The Maestro's Journey</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Master chords step by step from zero to harmony
          </Text>
        </FadeSlide>
        <View style={[styles.starBadge, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Text style={styles.starIcon}>⭐</Text>
          <Text style={[styles.starCount, { color: colors.purpleLight }]}>
            {totalStars} / {JOURNEY_LEVELS.length * 3} Stars
          </Text>
        </View>
      </View>

      {/* Learn a Chord Fast Shortcut */}
      <View style={[styles.learnShortcutCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.learnShortcutTitle, { color: colors.text }]}>
            📖 Need to review chord voicings?
          </Text>
          <Text style={[styles.learnShortcutDesc, { color: colors.textMuted }]}>
            Explore roots, intervals, and arpeggios in Learn a Chord.
          </Text>
        </View>
        <TouchButton
          style={[styles.learnShortcutBtn, { backgroundColor: colors.purple }]}
          onPress={() => leave(() => onNavigate("learn"))}
        >
          <Text style={styles.learnShortcutBtnText}>Study →</Text>
        </TouchButton>
      </View>

      {/* Chapters */}
      {chapters.map((ch, chIdx) => (
        <FadeSlide key={ch.chapter} delay={80 + chIdx * 60}>
          <View style={[styles.chapterCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <View style={styles.chapterHeader}>
              <Text style={[styles.chapterNumber, { color: colors.purpleLight }]}>
                CHAPTER {ch.chapter}
              </Text>
              <Text style={[styles.chapterTitle, { color: colors.text }]}>{ch.title}</Text>
            </View>

            <View style={styles.levelList}>
              {ch.levels.map((lvl) => {
                const lvlIndex = JOURNEY_LEVELS.findIndex((l) => l.id === lvl.id);
                const unlocked = isLevelUnlocked(lvlIndex);
                const lvlStars = progress[lvl.id]?.stars || 0;

                return (
                  <TouchButton
                    key={lvl.id}
                    style={[
                      styles.levelCard,
                      {
                        backgroundColor: unlocked ? colors.surface : colors.surface2,
                        borderColor: lvlStars > 0 ? colors.purple : colors.border,
                        opacity: unlocked ? 1 : 0.6,
                      },
                    ]}
                    disabled={!unlocked}
                    onPress={() => handleStartLevel(lvl)}
                  >
                    <View style={styles.levelLeft}>
                      <View
                        style={[
                          styles.levelNumberCircle,
                          {
                            backgroundColor: lvlStars > 0 ? colors.purple : colors.surface2,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.lvlNumText, { color: lvlStars > 0 ? "#ffffff" : colors.text }]}>
                          {unlocked ? lvl.levelNumber : "🔒"}
                        </Text>
                      </View>
                      <View style={styles.levelInfo}>
                        <Text style={[styles.levelCardTitle, { color: colors.text }]}>{lvl.title}</Text>
                        <Text style={[styles.levelCardSub, { color: colors.textMuted }]}>
                          {lvl.targetName} · {lvl.formula}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.levelRight}>
                      <Text style={styles.levelStars}>
                        {lvlStars > 0 ? "★".repeat(lvlStars) : unlocked ? "Play ▶" : "Locked"}
                      </Text>
                    </View>
                  </TouchButton>
                );
              })}
            </View>
          </View>
        </FadeSlide>
      ))}

      <BottomNav active="journey" onNavigate={handleNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backHit: { alignSelf: "flex-start", padding: 4, marginBottom: 8 },
  backBtn: { fontSize: 18 },
  mapHeader: { marginBottom: 20, gap: 10 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: 0.5 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  starBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  starIcon: { fontSize: 16 },
  starCount: { fontSize: 13, fontWeight: "800" },
  chapterCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  chapterHeader: { gap: 2 },
  chapterNumber: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  chapterTitle: { fontSize: 18, fontWeight: "800" },
  levelList: { gap: 10 },
  levelCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  levelLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  levelNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lvlNumText: { fontSize: 14, fontWeight: "800" },
  levelInfo: { flex: 1, gap: 2 },
  levelCardTitle: { fontSize: 14, fontWeight: "700" },
  levelCardSub: { fontSize: 11 },
  levelRight: { paddingLeft: 8 },
  levelStars: { fontSize: 14, color: "#fbc02d", fontWeight: "800" },
  challengeHeader: { gap: 4, marginBottom: 14 },
  levelKicker: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  levelTitle: { fontSize: 22, fontWeight: "800" },
  targetName: { fontSize: 15, fontWeight: "700" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8, marginBottom: 16 },
  conceptTitle: { fontSize: 15, fontWeight: "800" },
  conceptText: { fontSize: 13, lineHeight: 19 },
  tipBox: { borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 4 },
  tipText: { fontSize: 12, fontWeight: "600", lineHeight: 18 },
  workspace: { gap: 14 },
  selectedBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  selectedLabel: { fontSize: 13, fontWeight: "600" },
  miniPlayBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  miniPlayText: { fontSize: 13, fontWeight: "800" },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  clearBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  clearBtnText: { fontSize: 14, fontWeight: "700" },
  submitBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  submitBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  successCard: { borderRadius: 18, borderWidth: 1.5, padding: 22, alignItems: "center", gap: 10 },
  starsRow: { fontSize: 32 },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successDesc: { fontSize: 14, textAlign: "center" },
  xpEarned: { fontSize: 15, fontWeight: "800" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 10, width: "100%" },
  primaryBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  secondaryBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  secondaryBtnText: { fontSize: 14, fontWeight: "700" },
  hintCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  hintText: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  studyChordBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 4,
  },
  studyChordText: { fontSize: 12, fontWeight: "700" },
  learnShortcutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  learnShortcutTitle: { fontSize: 12, fontWeight: "800", marginBottom: 2 },
  learnShortcutDesc: { fontSize: 11, lineHeight: 15 },
  learnShortcutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  learnShortcutBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
});
