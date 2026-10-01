import React, { useState, useCallback, useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import TouchButton from "../components/TouchButton";
import FadeSlide from "../components/FadeSlide";
import NoteGrid from "../components/NoteGrid";
import NoteBurst from "../components/NoteBurst";
import ChipsFlow from "../components/ChipsFlow";
import RoundProgress from "../components/RoundProgress";
import { runShake, USE_NATIVE_DRIVER } from "../components/anim";
import { KNOWN_CHORDS, sameNotes } from "../utils/musicTheory";
import { useAudio } from "../audio/AudioContext";
import { logChordActivity, ACTIVITY_TYPES } from "../db/historyDatabaseService";

// Easy keeps the original single-chord round; Medium and Hard run sequences.
const DIFFICULTIES = [
  { key: "easy", label: "Easy", chords: 1 },
  { key: "medium", label: "Medium", chords: 3 },
  { key: "hard", label: "Hard", chords: 5 },
];

function pickRandomChord(excludeName) {
  const pool = excludeName
    ? KNOWN_CHORDS.filter((c) => c.name !== excludeName)
    : KNOWN_CHORDS;
  const options = pool.length ? pool : KNOWN_CHORDS;
  return options[Math.floor(Math.random() * options.length)];
}

function consecutiveFirstTry(results) {
  let streak = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (!results[i].firstTry) break;
    streak++;
  }
  return streak;
}

export default function GuessChordScreen({ onBack, onNavigate }) {
  const { colors } = useAppTheme();
  const { playChord } = useAudio();
  const [difficulty, setDifficulty] = useState("easy");
  const [roundIndex, setRoundIndex] = useState(0);
  const [results, setResults] = useState([]); // { name, firstTry } per finished round
  const [firstTry, setFirstTry] = useState(true);
  const [target, setTarget] = useState(pickRandomChord);
  const [selected, setSelected] = useState([]);
  const [phase, setPhase] = useState("setup"); // "setup" | "guessing" | "correct" | "wrong" | "finished"

  const activeDifficulty = DIFFICULTIES.find((d) => d.key === difficulty);
  const totalRounds = activeDifficulty.chords;
  const score = results.filter((r) => r.firstTry).length;

  // Picking a difficulty commits the player to a session, but the menu music
  // keeps playing — chord samples duck it while they sound (playChord).
  const handleChooseDifficulty = (key) => {
    setDifficulty(key);
  };

  const startRound = (index) => {
    setRoundIndex(index);
    setTarget((prev) => pickRandomChord(prev.name));
    setSelected([]);
    setFirstTry(true);
    setPhase("guessing");
  };

  const handleStart = () => {
    setResults([]);
    startRound(0);
  };

  const toggleNote = (note) => {
    if (phase !== "guessing") return;
    setSelected((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  };

  const handleHear = useCallback(() => playChord(target.notes), [playChord, target]);

  const handleSubmit = () => {
    if (selected.length === 0) return;
    const isCorrect = sameNotes(selected, target.notes);
    if (!isCorrect) setFirstTry(false);
    setPhase(isCorrect ? "correct" : "wrong");
    // History: every submitted guess is recorded, correct or not.
    logChordActivity(
      ACTIVITY_TYPES.GUESS,
      target.name,
      isCorrect,
      { selected: [...selected], round: roundIndex + 1, totalRounds, difficulty }
    );
  };

  const handleAdvance = () => {
    setResults((prev) => [...prev, { name: target.name, firstTry }]);
    if (roundIndex + 1 < totalRounds) {
      startRound(roundIndex + 1);
    } else {
      setPhase("finished");
    }
  };

  const handleTryAgain = () => {
    setSelected([]);
    setPhase("guessing");
  };

  if (phase === "setup") {
    return (
      <ScreenWrapper scroll>
        <TouchButton style={styles.backBtnHit} onPress={onBack} accessibilityLabel="Back to home">
          <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
        </TouchButton>
        <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Guess the Chord</Text>

        <FadeSlide delay={80}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Choose difficulty</Text>
        </FadeSlide>
        <View style={styles.row}>
          {DIFFICULTIES.map((d, i) => (
            <FadeSlide key={d.key} delay={140 + i * 80} style={styles.fadeFlex}>
              <TouchButton
                style={[
                  styles.diffChip,
                  {
                    backgroundColor: difficulty === d.key ? colors.purple : colors.glass,
                    borderColor: difficulty === d.key ? colors.glassBorder : colors.glassBorder,
                    shadowColor: colors.purple,
                    shadowOpacity: difficulty === d.key ? 0.7 : 0,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
                pulseKey={difficulty === d.key ? d.key : undefined}
                onPress={() => handleChooseDifficulty(d.key)}
              >
                <Text style={styles.diffLabel}>{d.label}</Text>
                <Text style={styles.diffSub}>
                  {d.chords} chord{d.chords > 1 ? "s" : ""}
                </Text>
              </TouchButton>
            </FadeSlide>
          ))}
        </View>

        <FadeSlide delay={420}>
          <TouchButton
            style={[styles.enterButton, { backgroundColor: colors.purple }]}
            onPress={handleStart}
          >
            <Text style={styles.enterText}>Start</Text>
          </TouchButton>
        </FadeSlide>

        <BottomNav active="home" onNavigate={onNavigate} />
      </ScreenWrapper>
    );
  }

  if (phase === "guessing") {
    return (
      <ScreenWrapper scroll>
        <TouchButton style={styles.backBtnHit} onPress={onBack} accessibilityLabel="Back to home">
          <Text style={[styles.backBtn, { color: colors.purpleLight }]}>←</Text>
        </TouchButton>
        <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Guess the Chord</Text>
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          Round {roundIndex + 1} of {totalRounds} · {activeDifficulty.label}
        </Text>
        {totalRounds > 1 && (
          <RoundProgress current={roundIndex} total={totalRounds} colors={colors} />
        )}

        <FadeSlide key={`hear-${roundIndex}`} delay={60}>
          <TouchButton
            style={[
              styles.hearButton,
              { backgroundColor: colors.glass, borderColor: colors.glassBorder, borderWidth: 1 },
            ]}
            onPress={handleHear}
          >
            <Text style={[styles.hearText, { color: colors.text }]}>▶ Hear the chord</Text>
          </TouchButton>
        </FadeSlide>

        <FadeSlide key={`grid-${roundIndex}`} delay={140}>
          <NoteGrid selected={selected} onToggle={toggleNote} colors={colors} />
        </FadeSlide>

        <FadeSlide delay={240}>
          <TouchButton
            style={[
              styles.enterButton,
              {
                backgroundColor: colors.purple,
                opacity: selected.length ? 1 : 0.5,
                shadowColor: colors.purple,
                shadowOpacity: selected.length ? 0.7 : 0,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
            disabled={selected.length === 0}
            pulseKey={selected.length ? "ready" : undefined}
            onPress={handleSubmit}
          >
            <Text style={styles.enterText}>Submit Guess</Text>
          </TouchButton>
        </FadeSlide>

        <BottomNav active="home" onNavigate={onNavigate} />
      </ScreenWrapper>
    );
  }

  if (phase === "correct" || phase === "wrong") {
    const isCorrect = phase === "correct";
    const streakNow = consecutiveFirstTry(results) + (isCorrect && firstTry ? 1 : 0);
    return (
      <ScreenWrapper scroll>
        <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Guess the Chord</Text>
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          Round {roundIndex + 1} of {totalRounds} · {activeDifficulty.label}
        </Text>
        {totalRounds > 1 && (
          <RoundProgress current={roundIndex + 1} total={totalRounds} colors={colors} />
        )}

        <View style={styles.burstArea}>
          <FeedbackCard
            isCorrect={isCorrect}
            colors={colors}
            shake={phase === "wrong"}
          >
            <ChipsFlow
              items={selected}
              renderItem={(n) => (
                <View style={styles.feedbackDot}>
                  <Text style={styles.feedbackDotText}>{n}</Text>
                </View>
              )}
            />
          </FeedbackCard>
          {isCorrect && <NoteBurst trigger={1} fireOnMount count={9} color={colors.purpleLight} />}
        </View>

        <FadeSlide delay={120}>
          <Text style={[styles.feedbackLabel, { color: isCorrect ? colors.green : colors.red }]}>
            {isCorrect ? "Correct" : "Wrong"}
          </Text>
        </FadeSlide>
        <FadeSlide delay={180}>
          <Text style={[styles.feedbackSub, { color: colors.textMuted }]}>
            This is a {target.name}
          </Text>
        </FadeSlide>

        {isCorrect && firstTry && <FloatPlusOne color={colors.green} />}

        {streakNow >= 2 && (
          <FadeSlide key={`streak-${streakNow}`} delay={240} direction="down" distance={10}>
            <View style={[styles.streakPill, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <Text style={[styles.streakText, { color: colors.purpleLight }]}>🔥 x{streakNow} streak</Text>
            </View>
          </FadeSlide>
        )}

        <FadeSlide delay={260}>
          <View style={styles.row}>
            <TouchButton
              style={[styles.actionButton, { flex: 1, backgroundColor: colors.surface2 }]}
              onPress={handleHear}
            >
              <Text style={[styles.actionText, { color: colors.text }]}>Hear</Text>
            </TouchButton>
            <TouchButton
              style={[
                styles.actionButton,
                {
                  flex: 1,
                  backgroundColor: colors.purple,
                  shadowColor: colors.purple,
                  shadowOpacity: 0.7,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
              onPress={isCorrect ? handleAdvance : handleTryAgain}
            >
              <Text style={styles.primaryActionText}>
                {isCorrect ? (roundIndex + 1 < totalRounds ? "Next Chord" : "Finish") : "Try Again"}
              </Text>
            </TouchButton>
          </View>
        </FadeSlide>

        <BottomNav active="home" onNavigate={onNavigate} />
      </ScreenWrapper>
    );
  }

  // phase === "finished"
  return (
    <ScreenWrapper scroll>
      <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Session Complete</Text>

      <View style={styles.burstArea}>
        <FadeSlide delay={100}>
          <View
            style={[
              styles.scoreBox,
              {
                backgroundColor: colors.glass,
                borderColor: colors.glassBorder,
                borderWidth: 1,
                shadowColor: colors.purple,
                shadowOpacity: 0.5,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
          >
            <Text style={[styles.scoreText, { color: colors.text }]}>
              {score} / {totalRounds}
            </Text>
            <Text style={[styles.scoreSub, { color: colors.textMuted }]}>
              guessed correctly on the first try
            </Text>
          </View>
        </FadeSlide>
        <NoteBurst trigger={1} fireOnMount count={12} color={colors.purpleLight} rise={170} spread={220} />
      </View>

      {results.map((r, i) => (
        <FadeSlide key={i} delay={220 + i * 80} direction="left">
          <View style={[styles.resultRow, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.resultName, { color: colors.text }]}>
              {i + 1}. {r.name}
            </Text>
            <Text style={[styles.resultFlag, { color: r.firstTry ? colors.green : colors.red }]}>
              {r.firstTry ? "✓ First try" : "Retried"}
            </Text>
          </View>
        </FadeSlide>
      ))}

      <FadeSlide delay={340}>
        <View style={styles.row}>
          <TouchButton
            style={[styles.actionButton, { flex: 1, backgroundColor: colors.surface2 }]}
            onPress={handleStart}
          >
            <Text style={[styles.actionText, { color: colors.text }]}>Play Again</Text>
          </TouchButton>
          <TouchButton
            style={[styles.actionButton, { flex: 1, backgroundColor: colors.purple }]}
            onPress={() => setPhase("setup")}
          >
            <Text style={styles.primaryActionText}>Change Difficulty</Text>
          </TouchButton>
        </View>
      </FadeSlide>

      <BottomNav active="home" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

// Feedback card with a shake wobble on wrong answers.
function FeedbackCard({ isCorrect, colors, shake, children }) {
  const shakeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shake) runShake(shakeValue).start();
  }, [shake, shakeValue]);

  return (
    <View style={styles.feedbackWrap}>
      <Animated.View
        style={[
          styles.feedbackBox,
          { backgroundColor: isCorrect ? colors.greenBg : colors.redBg, transform: [{ translateX: shakeValue }] },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// "+1" that floats up from the score area and fades away.
function FloatPlusOne({ color }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start(({ finished }) => {
      if (finished) setDone(true);
    });
    return () => anim.stop();
  }, [progress]);

  if (done) return null;
  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.floatPlus,
        {
          color,
          opacity: progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -52] }) },
            { scale: progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.7, 1.15, 1] }) },
          ],
        },
      ]}
    >
      +1
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  backBtn: { fontSize: 18, marginBottom: 4 },
  backBtnHit: { alignSelf: "flex-start", padding: 4 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 13, marginBottom: 4, marginTop: 4, textAlign: "center" },
  progressText: { fontSize: 12, fontWeight: "600", marginBottom: 8, textAlign: "center" },
  sectionLabel: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  fadeFlex: { flex: 1 },
  diffChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  diffLabel: { color: "white", fontSize: 14, fontWeight: "800" },
  diffSub: { color: "white", fontSize: 11, marginTop: 2, opacity: 0.85 },
  hearButton: { borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 20 },
  hearText: { fontSize: 15, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10, marginTop: 14, marginBottom: 10 },
  enterButton: { borderRadius: 12, padding: 14, alignItems: "center", marginTop: 8 },
  enterText: { color: "white", fontWeight: "700" },
  burstArea: { position: "relative" },
  feedbackWrap: { position: "relative" },
  feedbackBox: {
    borderRadius: 16,
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
    padding: 12,
  },
  feedbackDot: {
    backgroundColor: "rgba(255,255,255,0.9)",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackDotText: { fontWeight: "800", color: "#1A1A1A" },
  feedbackLabel: { fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 4 },
  feedbackSub: { fontSize: 13, textAlign: "center", marginBottom: 8 },
  streakPill: {
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
  },
  streakText: { fontSize: 12, fontWeight: "800" },
  floatPlus: {
    position: "absolute",
    top: "38%",
    alignSelf: "center",
    fontSize: 22,
    fontWeight: "900",
  },
  scoreBox: {
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  scoreText: { fontSize: 30, fontWeight: "800" },
  scoreSub: { fontSize: 12, marginTop: 4 },
  resultRow: {
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  resultName: { fontSize: 14, fontWeight: "600" },
  resultFlag: { fontSize: 12, fontWeight: "700" },
  actionButton: { borderRadius: 12, padding: 12, alignItems: "center" },
  actionText: { fontWeight: "600" },
  primaryActionText: { color: "white", fontWeight: "700" },
});
