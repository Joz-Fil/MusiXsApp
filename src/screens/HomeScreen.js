import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useAppTheme } from "../theme";
import ScreenWrapper from "../components/ScreenWrapper";
import BottomNav from "../components/BottomNav";
import TouchButton from "../components/TouchButton";
import FadeSlide from "../components/FadeSlide";
import { GlowRings, SpectrumBars } from "../components/AmbientGlow";
import { useAudio } from "../audio/AudioContext";
import ChordModeIcon from "../components/ChordIcons";
import BeginnerPromptModal from "../components/BeginnerPromptModal";
import InteractiveTutorial from "../components/InteractiveTutorial";
import DailyModal from "../components/DailyModal";
import {
  hasActiveBuildSession,
  getBuildChordSession,
  hasActiveLearnSession,
  getLearnChordSession,
  getJourneySession,
  getGuessChordSession,
  hasActiveDojoSession,
  getDojoSession,
  subscribeSessionStore,
} from "../services/sessionStore";
import {
  JOURNEY_LEVELS,
  getUserStats,
  getDailyQuests,
  getTodayChord,
  setOnboardingAnswered,
  UserStats,
  DailyQuest,
} from "../services/learningService";

const OPTIONS = [
  { key: "journey", label: "The Journey", detail: "Step-by-step quest road", number: "01" },
  { key: "build", label: "Build a Chord", detail: "Create with Smart Guide", number: "02" },
  { key: "dojo", label: "Sound Dojo", detail: "Ear training mini-games", number: "03" },
  { key: "guess", label: "Guess the Chord", detail: "Classic ear test", number: "04" },
  { key: "learn", label: "Learn a Chord", detail: "Explore each note", number: "05" },
];

export default function HomeScreen({ onNavigate }) {
  const { colors } = useAppTheme();
  const [, setSessionTick] = useState(0);

  useEffect(() => {
    return subscribeSessionStore(() => {
      setSessionTick((t) => t + 1);
    });
  }, []);

  const getSessionBadge = (key) => {
    if (key === "build" && hasActiveBuildSession()) {
      const bs = getBuildChordSession();
      if (bs.builtChords.length > 0) {
        return `Chord ${bs.builtChords.length + 1} of ${bs.count} · Resume ↩`;
      }
      if (bs.selected.length > 0) {
        return `Drafting chord (${bs.selected.join(" ")}) · Resume ↩`;
      }
      if (bs.phase === "building") {
        return "Session in progress · Resume ↩";
      }
    }
    if (key === "learn" && hasActiveLearnSession()) {
      const ls = getLearnChordSession();
      if (ls.selectedChord) {
        return `Exploring ${ls.selectedChord.root} ${ls.selectedChord.type} · Resume ↩`;
      }
    }
    if (key === "journey") {
      const js = getJourneySession();
      if (js.activeLevelId) {
        const lvl = JOURNEY_LEVELS.find((l) => l.id === js.activeLevelId);
        return lvl ? `Level ${lvl.levelNumber}: ${lvl.targetName} · Resume ↩` : "Lesson in progress · Resume ↩";
      }
    }
    if (key === "dojo" && hasActiveDojoSession()) {
      const ds = getDojoSession();
      const modeName = ds.selectedMode === "happy_sad" ? "Happy vs Sad" : ds.selectedMode === "high_low" ? "High vs Low" : "Missing Note";
      if (ds.score > 0 || ds.streak > 0) {
        return `${modeName} · ${ds.score} pts (${ds.streak > 0 ? `🔥 ${ds.streak}x` : "streak 0"}) · Resume ↩`;
      }
      return `${modeName} in progress · Resume ↩`;
    }
    if (key === "guess") {
      const gs = getGuessChordSession();
      if (gs.phase === "guessing" || gs.results.length > 0) {
        return `Round ${gs.roundIndex + 1} · Resume ↩`;
      }
    }
    return null;
  };
  const { isMusicBlocked, playChord } = useAudio();
  const [needsSoundUnlock, setNeedsSoundUnlock] = useState(false);
  const [stats, setStats] = useState(null);
  const [quests, setQuests] = useState([]);
  const [beginnerPromptVisible, setBeginnerPromptVisible] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [dailyModalVisible, setDailyModalVisible] = useState(false);

  const todayChord = getTodayChord();

  const loadData = async () => {
    try {
      const s = await getUserStats();
      const q = await getDailyQuests();
      setStats(s);
      setQuests(q);
      if (s && !s.onboardingAnswered) {
        setBeginnerPromptVisible(true);
      }
    } catch (err) {
      console.warn("Failed to load home stats:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sound unlock polling
  useEffect(() => {
    let blockedPolls = 0;
    const timer = setInterval(() => {
      blockedPolls = isMusicBlocked() ? blockedPolls + 1 : 0;
      setNeedsSoundUnlock(blockedPolls >= 3);
    }, 600);
    return () => clearInterval(timer);
  }, [isMusicBlocked]);

  const [isPlayingToday, setIsPlayingToday] = useState(false);
  const playTodayTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (playTodayTimerRef.current) clearTimeout(playTodayTimerRef.current);
    };
  }, []);

  const handlePlayTodayChord = () => {
    if (isPlayingToday) return;
    setIsPlayingToday(true);
    playChord(todayChord.notes);
    if (playTodayTimerRef.current) clearTimeout(playTodayTimerRef.current);
    playTodayTimerRef.current = setTimeout(() => {
      setIsPlayingToday(false);
      playTodayTimerRef.current = null;
    }, 800);
  };

  const handleChooseBeginner = async () => {
    try {
      await setOnboardingAnswered(true);
      setStats((prev) => (prev ? { ...prev, onboardingAnswered: true, isBeginner: true } : prev));
    } catch (err) {
      console.warn("Failed to save beginner choice:", err);
    }
    setBeginnerPromptVisible(false);
    setTutorialVisible(true);
  };

  const handleChooseExperienced = async () => {
    try {
      await setOnboardingAnswered(false);
      setStats((prev) => (prev ? { ...prev, onboardingAnswered: true, isBeginner: false } : prev));
    } catch (err) {
      console.warn("Failed to save experienced choice:", err);
    }
    setBeginnerPromptVisible(false);
  };

  return (
    <ScreenWrapper scroll>
      <GlowRings color={colors.glow} size={340} style={styles.rings} />

      {/* Top Status Bar: Streak, Level, Quests, Tutorial */}
      <View style={styles.topBar}>
        <TouchButton
          style={[styles.topPill, { backgroundColor: colors.surface2, borderColor: colors.border }]}
          onPress={() => setDailyModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Daily streak"
        >
          <Text style={styles.pillEmoji}>🔥</Text>
          <Text style={[styles.pillText, { color: colors.purpleLight }]}>
            {stats?.streakCount || 1}d
          </Text>
        </TouchButton>

        <TouchButton
          style={[styles.topPill, { backgroundColor: colors.surface2, borderColor: colors.border }]}
          onPress={() => onNavigate("profile")}
          accessibilityRole="button"
          accessibilityLabel="Profile level"
        >
          <Text style={styles.pillEmoji}>⭐</Text>
          <Text style={[styles.pillText, { color: colors.purpleLight }]}>
            Lv.{stats?.level || 1}
          </Text>
        </TouchButton>

        <TouchButton
          style={[styles.topPill, styles.dailyBtn, { backgroundColor: colors.purple, borderColor: colors.purple }]}
          onPress={() => setDailyModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open Daily Hub"
        >
          <Text style={styles.dailyBtnText}>Daily 📅</Text>
        </TouchButton>

        <TouchButton
          style={[styles.topPill, { backgroundColor: colors.surface2, borderColor: colors.border }]}
          onPress={() => setTutorialVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open Interactive Guide"
        >
          <Text style={[styles.pillText, { color: colors.purpleLight }]}>Guide 🎓</Text>
        </TouchButton>
      </View>

      <View style={styles.header}>
        <FadeSlide direction="down">
          <Text style={[styles.title, { color: colors.purpleLight }]}>MusiXs</Text>
        </FadeSlide>
        <FadeSlide delay={140}>
          <SpectrumBars color={colors.purple} style={styles.spectrum} />
        </FadeSlide>
      </View>

      {/* New User Welcome Banner if tutorial not completed */}
      {stats && !stats.tutorialCompleted && (
        <FadeSlide delay={160}>
          <TouchButton
            style={[styles.welcomeBanner, { backgroundColor: colors.glass, borderColor: colors.purple }]}
            onPress={() => setTutorialVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="New to Music Theory? Learn your first chord"
          >
            <View style={styles.welcomeBannerLeft}>
              <Text style={styles.welcomeEmoji}>🎓</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.welcomeTitle, { color: colors.purpleLight }]}>
                  New to Music Theory?
                </Text>
                <Text style={[styles.welcomeSub, { color: colors.textMuted }]}>
                  Tap to learn your first chord in 60 seconds (+100 XP)
                </Text>
              </View>
            </View>
            <Text style={[styles.arrowText, { color: colors.purpleLight }]}>→</Text>
          </TouchButton>
        </FadeSlide>
      )}

      {/* Chord of the Day Card */}
      <FadeSlide delay={180}>
        <View style={[styles.chordOfDayCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <View style={styles.chordOfDayTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.codKicker, { color: colors.purpleLight }]}>CHORD OF THE DAY</Text>
              <Text style={[styles.codTitle, { color: colors.text }]}>{todayChord.name}</Text>
              <Text style={[styles.codNotes, { color: colors.textMuted }]}>
                {todayChord.notes.join(" · ")} · {todayChord.mood}
              </Text>
            </View>
            <TouchButton
              style={[styles.codPlayBtn, { backgroundColor: colors.purple }]}
              disabled={isPlayingToday}
              onPress={handlePlayTodayChord}
              accessibilityRole="button"
              accessibilityLabel="Play Chord of the Day"
            >
              <Text style={styles.codPlayText}>{isPlayingToday ? "🎵 Playing..." : "▶ Play"}</Text>
            </TouchButton>
          </View>
        </View>
      </FadeSlide>

      {/* Modes List */}
      <View style={styles.list}>
        {OPTIONS.map((opt, i) => {
          const resumeInfo = getSessionBadge(opt.key);
          return (
            <FadeSlide key={opt.key} delay={220 + i * 80}>
              <TouchButton
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: resumeInfo ? colors.surface2 : colors.glass,
                    borderColor: resumeInfo ? colors.purple : colors.glassBorder,
                    borderWidth: resumeInfo ? 1.5 : 1,
                    ...Platform.select({
                      ios: {
                        shadowColor: colors.purple,
                        shadowOpacity: resumeInfo ? 0.6 : 0.35,
                        shadowRadius: 16,
                        shadowOffset: { width: 0, height: 4 },
                      },
                      android: {
                        elevation: 0,
                      },
                      default: {
                        shadowColor: colors.purple,
                        shadowOpacity: resumeInfo ? 0.6 : 0.35,
                        shadowRadius: 16,
                        shadowOffset: { width: 0, height: 4 },
                      },
                    }),
                  },
                ]}
                onPress={() => onNavigate(opt.key)}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
              >
                <View style={styles.optionContent}>
                  <ChordModeIcon mode={opt.key} size={50} colors={colors} />
                  <View style={styles.optionTextCol}>
                    <View style={styles.optionTitleRow}>
                      <Text style={[styles.optionText, { color: colors.text }]}>{opt.label}</Text>
                      <View
                        style={[
                          styles.numberPill,
                          {
                            backgroundColor: resumeInfo ? colors.purple : colors.surface2,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.numberText,
                            { color: resumeInfo ? "#ffffff" : colors.purpleLight, fontSize: resumeInfo ? 9 : 11 },
                          ]}
                        >
                          {resumeInfo ? "ACTIVE" : opt.number}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.detailText,
                        { color: resumeInfo ? colors.purpleLight : colors.textMuted, fontWeight: resumeInfo ? "700" : "500" },
                      ]}
                    >
                      {resumeInfo || opt.detail}
                    </Text>
                  </View>
                  <Text style={[styles.arrowText, { color: colors.purpleLight }]}>→</Text>
                </View>
              </TouchButton>
            </FadeSlide>
          );
        })}
      </View>

      {needsSoundUnlock && (
        <FadeSlide direction="down" delay={100}>
          <Text style={[styles.soundHint, { color: colors.textMuted }]}>
            🔇 Tap anywhere to enable sound
          </Text>
        </FadeSlide>
      )}

      {/* Beginner Prompt Modal on First Open */}
      <BeginnerPromptModal
        visible={beginnerPromptVisible}
        onChooseBeginner={handleChooseBeginner}
        onChooseExperienced={handleChooseExperienced}
      />

      {/* Interactive Tutorial Modal */}
      <InteractiveTutorial
        visible={tutorialVisible}
        onClose={() => setTutorialVisible(false)}
        onComplete={loadData}
        onNavigateToJourney={() => {
          setTutorialVisible(false);
          onNavigate("journey");
        }}
      />

      {/* Daily Hub Modal */}
      <DailyModal
        visible={dailyModalVisible}
        onClose={() => setDailyModalVisible(false)}
        stats={stats}
        quests={quests}
        onBuildChordPress={(chord) => {
          setDailyModalVisible(false);
          onNavigate("build");
        }}
        onNavigateToJourney={() => {
          setDailyModalVisible(false);
          onNavigate("journey");
        }}
        onNavigateToDojo={() => {
          setDailyModalVisible(false);
          onNavigate("dojo");
        }}
      />

      <BottomNav active="home" onNavigate={onNavigate} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  rings: {
    position: "absolute",
    top: "20%",
    alignSelf: "center",
  },
  topBar: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    width: "100%",
  },
  topPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  pillEmoji: { fontSize: 12 },
  pillText: { fontSize: 11, fontWeight: "700" },
  dailyBtn: { paddingHorizontal: 9 },
  dailyBtnText: { color: "#ffffff", fontSize: 11, fontWeight: "800" },
  header: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 16,
    gap: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 8,
  },
  spectrum: {
    marginTop: 4,
  },
  welcomeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 14,
  },
  welcomeBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  welcomeEmoji: { fontSize: 28 },
  welcomeTitle: { fontSize: 14, fontWeight: "800" },
  welcomeSub: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  chordOfDayCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  chordOfDayTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  codKicker: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  codTitle: { fontSize: 18, fontWeight: "800", marginTop: 2 },
  codNotes: { fontSize: 12, marginTop: 2 },
  codPlayBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  codPlayText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  list: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  optionTextCol: {
    flex: 1,
    gap: 4,
  },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 4,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  numberPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  numberText: {
    fontSize: 10,
    fontWeight: "800",
  },
  detailText: {
    fontSize: 12,
    lineHeight: 16,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: "700",
    paddingLeft: 4,
  },
  soundHint: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
  },
});
