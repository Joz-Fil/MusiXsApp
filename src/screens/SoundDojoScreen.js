import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import TouchButton from "../components/TouchButton";
import FadeSlide from "../components/FadeSlide";
import VictoryCelebration from "../components/VictoryCelebration";
import { useAudio } from "../audio/AudioContext";
import {
  getDojoSession,
  updateDojoSession,
  resetDojoSession,
} from "../services/sessionStore";
import {
  addXP,
  unlockBadge,
  incrementQuestProgress,
} from "../services/learningService";

const MODES = [
  { id: "high_low", name: "High vs Low", icon: "📈", desc: "Which note sounds higher?" },
  { id: "happy_sad", name: "Happy vs Sad", icon: "☀️", desc: "Is the chord Major or Minor?" },
  { id: "missing", name: "Missing Note", icon: "🧩", desc: "Find the note in the middle" },
];

const NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const TRIADS = [
  { name: "C Major", type: "major", root: "C", third: "E", fifth: "G", notes: ["C", "E", "G"] },
  { name: "A Minor", type: "minor", root: "A", third: "C", fifth: "E", notes: ["A", "C", "E"] },
  { name: "F Major", type: "major", root: "F", third: "A", fifth: "C", notes: ["F", "A", "C"] },
  { name: "G Major", type: "major", root: "G", third: "B", fifth: "D", notes: ["G", "B", "D"] },
  { name: "D Minor", type: "minor", root: "D", third: "F", fifth: "A", notes: ["D", "F", "A"] },
  { name: "E Minor", type: "minor", root: "E", third: "G", fifth: "B", notes: ["E", "G", "B"] },
];

export default function SoundDojoScreen({ onBack, onNavigate }) {
  const { colors } = useAppTheme();
  const { playChord } = useAudio();
  const savedSession = getDojoSession();
  const [selectedMode, setSelectedMode] = useState(savedSession.selectedMode);
  const [currentRound, setCurrentRound] = useState(savedSession.currentRound);
  const [score, setScore] = useState(savedSession.score);
  const [streak, setStreak] = useState(savedSession.streak);
  const [feedback, setFeedback] = useState(savedSession.feedback);
  const isFirstMountRef = useRef(true);

  const leave = (go) => {
    updateDojoSession({
      selectedMode,
      currentRound,
      score,
      streak,
      feedback,
    });
    go();
  };

  const handleBack = () => leave(onBack);
  const handleNavigate = (key) => leave(() => onNavigate(key));

  const handleResetDojo = () => {
    resetDojoSession();
    setScore(0);
    setStreak(0);
    setFeedback(null);
    generateRound(selectedMode);
  }; // null | { correct: boolean, message: string }
  const [celebrating, setCelebrating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const dojoSequenceTimerRef = useRef(null);
  const playCooldownTimerRef = useRef(null);

  const clearDojoAudio = () => {
    if (dojoSequenceTimerRef.current) {
      clearTimeout(dojoSequenceTimerRef.current);
      dojoSequenceTimerRef.current = null;
    }
    if (playCooldownTimerRef.current) {
      clearTimeout(playCooldownTimerRef.current);
      playCooldownTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearDojoAudio();
    };
  }, []);

  const generateRound = (modeId = selectedMode) => {
    setFeedback(null);
    clearDojoAudio();
    setIsPlayingAudio(true);

    if (modeId === "high_low") {
      const idx1 = Math.floor(Math.random() * (NOTES.length - 1));
      let idx2 = Math.floor(Math.random() * NOTES.length);
      while (idx2 === idx1) idx2 = Math.floor(Math.random() * NOTES.length);

      const note1 = NOTES[idx1];
      const note2 = NOTES[idx2];
      const correctChoice = idx2 > idx1 ? 2 : 1;

      const newRoundHL = { mode: "high_low", note1, note2, correctChoice };
      setCurrentRound(newRoundHL);
      updateDojoSession({ currentRound: newRoundHL, feedback: null, selectedMode: modeId });

      // Play Note 1, then Note 2
      playChord([note1]);
      dojoSequenceTimerRef.current = setTimeout(() => {
        playChord([note2]);
        dojoSequenceTimerRef.current = null;
      }, 650);
      playCooldownTimerRef.current = setTimeout(() => {
        setIsPlayingAudio(false);
        playCooldownTimerRef.current = null;
      }, 1400);
    } else if (modeId === "happy_sad") {
      const triad = TRIADS[Math.floor(Math.random() * TRIADS.length)];
      const newRoundHS = { mode: "happy_sad", triad, correctChoice: triad.type };
      setCurrentRound(newRoundHS);
      updateDojoSession({ currentRound: newRoundHS, feedback: null, selectedMode: modeId });
      playChord(triad.notes);
      playCooldownTimerRef.current = setTimeout(() => {
        setIsPlayingAudio(false);
        playCooldownTimerRef.current = null;
      }, 850);
    } else if (modeId === "missing") {
      const triad = TRIADS[Math.floor(Math.random() * TRIADS.length)];
      // Wrong options
      const wrong = NOTES.filter((n) => n !== triad.third && n !== triad.root && n !== triad.fifth)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      const choices = [triad.third, ...wrong].sort(() => 0.5 - Math.random());

      const newRoundM = { mode: "missing", triad, choices, correctChoice: triad.third };
      setCurrentRound(newRoundM);
      updateDojoSession({ currentRound: newRoundM, feedback: null, selectedMode: modeId });
      playChord(triad.notes);
      playCooldownTimerRef.current = setTimeout(() => {
        setIsPlayingAudio(false);
        playCooldownTimerRef.current = null;
      }, 850);
    }
  };

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      if (savedSession.currentRound) {
        return;
      }
    }
    generateRound(selectedMode);
  }, [selectedMode]);

  const handleReplay = () => {
    if (!currentRound || isPlayingAudio) return;
    clearDojoAudio();
    setIsPlayingAudio(true);
    if (currentRound.mode === "high_low") {
      playChord([currentRound.note1]);
      dojoSequenceTimerRef.current = setTimeout(() => {
        playChord([currentRound.note2]);
        dojoSequenceTimerRef.current = null;
      }, 650);
      playCooldownTimerRef.current = setTimeout(() => {
        setIsPlayingAudio(false);
        playCooldownTimerRef.current = null;
      }, 1400);
    } else if (currentRound.triad) {
      playChord(currentRound.triad.notes);
      playCooldownTimerRef.current = setTimeout(() => {
        setIsPlayingAudio(false);
        playCooldownTimerRef.current = null;
      }, 850);
    }
  };

  const handleAnswer = async (userChoice) => {
    if (!currentRound || feedback || isPlayingAudio) return;

    const isCorrect = userChoice === currentRound.correctChoice;
    const newStreak = isCorrect ? streak + 1 : 0;
    const newScore = isCorrect ? score + 10 : score;
    setStreak(newStreak);

    let nextFeedback = null;
    if (isCorrect) {
      setScore(newScore);
      await addXP(15);
      await incrementQuestProgress("sound_dojo", 1);

      if (newStreak >= 5) {
        setCelebrating(true);
        await unlockBadge("golden_ear");
      }

      nextFeedback = {
        correct: true,
        message: "Spot on! That's correct! ⭐",
      };
      setFeedback(nextFeedback);
    } else {
      nextFeedback = {
        correct: false,
        message:
          currentRound.mode === "happy_sad"
            ? `That was ${currentRound.triad.name} (${currentRound.triad.type === "major" ? "Happy/Major ☀️" : "Sad/Minor 🌧️"})`
            : "Listen closely to the pitch and try the next one!",
      };
      setFeedback(nextFeedback);
    }

    updateDojoSession({ score: newScore, streak: newStreak, feedback: nextFeedback });

    // Auto next round
    setTimeout(() => {
      generateRound();
    }, 1400);
  };

  return (
    <ScreenWrapper scroll>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <TouchButton style={styles.backHit} onPress={handleBack}>
          <Text style={[styles.backBtn, { color: colors.purpleLight }]}>← Home</Text>
        </TouchButton>
        {(score > 0 || streak > 0) && (
          <TouchButton
            style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border }}
            onPress={handleResetDojo}
            accessibilityLabel="Reset workout session"
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted }}>New Workout ↺</Text>
          </TouchButton>
        )}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.purpleLight }]}>Sound Dojo 🥋</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Train your ear with fun, fast-paced mini games
        </Text>
      </View>

      {/* Mode Selector Tabs */}
      <View style={styles.modeTabs}>
        {MODES.map((m) => {
          const isActive = selectedMode === m.id;
          return (
            <TouchButton
              key={m.id}
              style={[
                styles.modeTab,
                {
                  backgroundColor: isActive ? colors.purple : colors.glass,
                  borderColor: isActive ? colors.purpleLight : colors.border,
                },
              ]}
              onPress={() => setSelectedMode(m.id)}
            >
              <Text style={styles.modeIcon}>{m.icon}</Text>
              <Text
                style={[
                  styles.modeName,
                  { color: isActive ? "#ffffff" : colors.text },
                ]}
              >
                {m.name}
              </Text>
            </TouchButton>
          );
        })}
      </View>

      {/* Score & Streak Bar */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
        <Text style={[styles.statItem, { color: colors.text }]}>Score: {score}</Text>
        <Text style={[styles.statItem, { color: streak >= 3 ? "#ff9800" : colors.purpleLight }]}>
          {streak > 0 ? `🔥 ${streak}x Streak` : "Start a streak!"}
        </Text>
      </View>

      {/* Game Card */}
      <FadeSlide key={`${selectedMode}-${score}-${streak}`} delay={50}>
        <View style={[styles.gameCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          {celebrating && (
            <VictoryCelebration
              active={true}
              count={30}
              showBadge={false}
              colors={colors}
              onComplete={() => setCelebrating(false)}
            />
          )}

          <Text style={[styles.promptTitle, { color: colors.text }]}>
            {selectedMode === "high_low" && "Which note sounded higher?"}
            {selectedMode === "happy_sad" && "How did this chord feel?"}
            {selectedMode === "missing" && `Find the missing note for ${currentRound?.triad?.name}!`}
          </Text>

          {/* Replay Sound Button */}
          <TouchButton
            style={[styles.replayBtn, { backgroundColor: colors.surface2, borderColor: colors.purple }]}
            disabled={isPlayingAudio}
            onPress={handleReplay}
          >
            <Text style={[styles.replayText, { color: colors.purpleLight }]}>
              {isPlayingAudio ? "🎧 Playing sound..." : "🔊 Listen Again"}
            </Text>
          </TouchButton>

          {/* Feedback banner */}
          {feedback && (
            <View
              style={[
                styles.feedbackBox,
                {
                  backgroundColor: feedback.correct ? "rgba(76, 175, 80, 0.2)" : "rgba(244, 67, 54, 0.2)",
                  borderColor: feedback.correct ? colors.green : colors.red,
                },
              ]}
            >
              <Text style={[styles.feedbackText, { color: feedback.correct ? colors.green : colors.red }]}>
                {feedback.message}
              </Text>
            </View>
          )}

          {/* Answer Buttons */}
          <View style={styles.choicesArea}>
            {selectedMode === "high_low" && (
              <View style={styles.choiceRow}>
                <TouchButton
                  style={[styles.choiceBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                  onPress={() => handleAnswer(1)}
                  disabled={!!feedback || isPlayingAudio}
                >
                  <Text style={[styles.choiceEmoji, { color: colors.text }]}>1️⃣</Text>
                  <Text style={[styles.choiceLabel, { color: colors.text }]}>First Note</Text>
                </TouchButton>
                <TouchButton
                  style={[styles.choiceBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                  onPress={() => handleAnswer(2)}
                  disabled={!!feedback || isPlayingAudio}
                >
                  <Text style={[styles.choiceEmoji, { color: colors.text }]}>2️⃣</Text>
                  <Text style={[styles.choiceLabel, { color: colors.text }]}>Second Note</Text>
                </TouchButton>
              </View>
            )}

            {selectedMode === "happy_sad" && (
              <View style={styles.choiceRow}>
                <TouchButton
                  style={[styles.choiceBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                  onPress={() => handleAnswer("major")}
                  disabled={!!feedback || isPlayingAudio}
                >
                  <Text style={styles.choiceEmoji}>☀️</Text>
                  <Text style={[styles.choiceLabel, { color: colors.text }]}>Happy (Major)</Text>
                </TouchButton>
                <TouchButton
                  style={[styles.choiceBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                  onPress={() => handleAnswer("minor")}
                  disabled={!!feedback || isPlayingAudio}
                >
                  <Text style={styles.choiceEmoji}>🌧️</Text>
                  <Text style={[styles.choiceLabel, { color: colors.text }]}>Sad (Minor)</Text>
                </TouchButton>
              </View>
            )}

            {selectedMode === "missing" && currentRound?.choices && (
              <View style={styles.missingChoicesRow}>
                <View style={[styles.missingHintBox, { backgroundColor: colors.surface2 }]}>
                  <Text style={[styles.missingHintText, { color: colors.purpleLight }]}>
                    {currentRound.triad.root} · [ ? ] · {currentRound.triad.fifth}
                  </Text>
                </View>
                <View style={styles.noteChoices}>
                  {currentRound.choices.map((note) => (
                    <TouchButton
                      key={note}
                      style={[styles.noteChoiceBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                      onPress={() => handleAnswer(note)}
                      disabled={!!feedback || isPlayingAudio}
                    >
                      <Text style={[styles.noteChoiceText, { color: colors.text }]}>{note}</Text>
                    </TouchButton>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </FadeSlide>

      <BottomNav active="dojo" onNavigate={handleNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backHit: { alignSelf: "flex-start", padding: 4, marginBottom: 8 },
  backBtn: { fontSize: 18 },
  header: { marginBottom: 16, gap: 4 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: 0.5 },
  subtitle: { fontSize: 13 },
  modeTabs: { flexDirection: "row", gap: 8, marginBottom: 14 },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  modeIcon: { fontSize: 18 },
  modeName: { fontSize: 11, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  statItem: { fontSize: 14, fontWeight: "800" },
  gameCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    gap: 16,
  },
  promptTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  replayBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  replayText: { fontSize: 14, fontWeight: "700" },
  feedbackBox: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  feedbackText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  choicesArea: { width: "100%", marginTop: 8 },
  choiceRow: { flexDirection: "row", gap: 12 },
  choiceBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  choiceEmoji: { fontSize: 32 },
  choiceLabel: { fontSize: 14, fontWeight: "700" },
  missingChoicesRow: { width: "100%", gap: 14, alignItems: "center" },
  missingHintBox: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  missingHintText: { fontSize: 20, fontWeight: "800", letterSpacing: 2 },
  noteChoices: { flexDirection: "row", gap: 14 },
  noteChoiceBtn: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  noteChoiceText: { fontSize: 22, fontWeight: "800" },
});
