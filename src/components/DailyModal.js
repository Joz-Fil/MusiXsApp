import React, { useEffect, useState, useRef } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme";
import TouchButton from "./TouchButton";
import { useAudio } from "../audio/AudioContext";
import {
  getTodayChord,
  getLevelProgress,
  getNextJourneyLevel,
  getGraduationProgress,
} from "../services/learningService";

export default function DailyModal({
  visible,
  onClose,
  stats,
  quests = [],
  onBuildChordPress,
  onNavigateToJourney,
  onNavigateToDojo,
}) {
  const { colors } = useAppTheme();
  const { playChord } = useAudio();
  const [journeyProgress, setJourneyProgress] = useState({});

  const todayChord = getTodayChord();

  useEffect(() => {
    if (visible) {
      getLevelProgress()
        .then(setJourneyProgress)
        .catch(() => {});
    }
  }, [visible]);

  const nextLevel = getNextJourneyLevel(journeyProgress);
  const gradProgress = getGraduationProgress(stats || {}, journeyProgress);

  const [isPlayingToday, setIsPlayingToday] = useState(false);
  const playTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, []);

  const handlePlayTodayChord = () => {
    if (isPlayingToday) return;
    setIsPlayingToday(true);
    playChord(todayChord.notes);
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    playTimerRef.current = setTimeout(() => {
      setIsPlayingToday(false);
      playTimerRef.current = null;
    }, 800);
  };

  const handleGoToJourney = () => {
    onClose();
    if (onNavigateToJourney) onNavigateToJourney();
  };

  const handleGoToDojo = () => {
    onClose();
    if (onNavigateToDojo) onNavigateToDojo();
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={[styles.streakText, { color: colors.purpleLight }]}>
                {stats?.streakCount || 1} Day Streak
              </Text>
            </View>
            <View style={styles.hubTitleWrap}>
              <Text style={[styles.hubTitle, { color: colors.text }]}>Daily Hub</Text>
            </View>
            <TouchButton onPress={onClose} style={styles.closeHit}>
              <Text style={[styles.closeText, { color: colors.textMuted }]}>✕</Text>
            </TouchButton>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* PRIORITY 1: Continue Your Journey */}
            <View
              style={[
                styles.priorityCard,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.purpleLight,
                },
              ]}
            >
              <View style={styles.priorityHeaderRow}>
                <View style={[styles.priorityPill, { backgroundColor: colors.purple }]}>
                  <Text style={styles.priorityPillText}>#1 PRIORITY</Text>
                </View>
                <Text style={[styles.priorityCategory, { color: colors.purpleLight }]}>
                  THE JOURNEY
                </Text>
              </View>

              {nextLevel ? (
                <View style={styles.journeyDetails}>
                  <Text style={[styles.journeyNextTitle, { color: colors.text }]}>
                    Lesson {nextLevel.levelNumber}: {nextLevel.title}
                  </Text>
                  <Text style={[styles.journeyChapterSub, { color: colors.purpleLight }]}>
                    {nextLevel.chapterTitle} · {nextLevel.subtitle}
                  </Text>
                  <Text style={[styles.journeyConcept, { color: colors.textMuted }]}>
                    {nextLevel.concept}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.journeyConcept, { color: colors.text }]}>
                  You have completed all current journey lessons! Keep replaying to earn 3 stars.
                </Text>
              )}

              <TouchButton
                style={[styles.primaryActionBtn, { backgroundColor: colors.purple }]}
                onPress={handleGoToJourney}
              >
                <Text style={styles.primaryActionBtnText}>
                  Continue Your Journey 🗺️ →
                </Text>
              </TouchButton>
            </View>

            {/* PRIORITY 2: Chord of the Day */}
            <View
              style={[
                styles.priorityCard,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.priorityHeaderRow}>
                <View style={[styles.priorityPill, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[styles.priorityPillText, { color: colors.text }]}>#2 PRIORITY</Text>
                </View>
                <Text style={[styles.moodTag, { color: colors.text }]}>{todayChord.mood}</Text>
              </View>

              <Text style={[styles.chordTitle, { color: colors.text }]}>{todayChord.name}</Text>
              <Text style={[styles.notesList, { color: colors.purpleLight }]}>
                Notes: {todayChord.notes.join(" · ")} ({todayChord.formula})
              </Text>
              <Text style={[styles.trivia, { color: colors.textMuted }]}>{todayChord.trivia}</Text>

              <View style={styles.actionRow}>
                <TouchButton
                  style={[styles.playBtn, { backgroundColor: colors.purple }]}
                  disabled={isPlayingToday}
                  onPress={handlePlayTodayChord}
                >
                  <Text style={styles.playBtnText}>{isPlayingToday ? "🎵 Playing..." : "▶ Hear Chord"}</Text>
                </TouchButton>
                {onBuildChordPress && (
                  <TouchButton
                    style={[styles.buildBtn, { borderColor: colors.purpleLight }]}
                    onPress={() => {
                      onClose();
                      onBuildChordPress(todayChord);
                    }}
                  >
                    <Text style={[styles.buildBtnText, { color: colors.purpleLight }]}>
                      Practice in Builder 🛠️
                    </Text>
                  </TouchButton>
                )}
              </View>
            </View>

            {/* PRIORITY 3: Sound Dojo Ear Training */}
            <View
              style={[
                styles.priorityCard,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.priorityHeaderRow}>
                <View style={[styles.priorityPill, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[styles.priorityPillText, { color: colors.text }]}>#3 PRIORITY</Text>
                </View>
                <Text style={[styles.priorityCategory, { color: colors.purpleLight }]}>
                  EAR TRAINING
                </Text>
              </View>

              <Text style={[styles.dojoTitle, { color: colors.text }]}>
                Sound Dojo Workout 🥋
              </Text>
              <Text style={[styles.dojoDesc, { color: colors.textMuted }]}>
                Train your musical ear with 3 fast mini-games: Pitch Dojo (High vs Low), Mood Dojo (Major vs Minor), and Missing Note.
              </Text>

              <TouchButton
                style={[styles.secondaryActionBtn, { borderColor: colors.purple, backgroundColor: colors.surface }]}
                onPress={handleGoToDojo}
              >
                <Text style={[styles.secondaryActionBtnText, { color: colors.purpleLight }]}>
                  Enter Sound Dojo 🥋 →
                </Text>
              </TouchButton>
            </View>

            {/* PRIORITY 4: Path to Intermediate (Graduation Checklist) */}
            <View
              style={[
                styles.priorityCard,
                {
                  backgroundColor: colors.surface2,
                  borderColor: gradProgress.isGraduated ? colors.green : colors.border,
                },
              ]}
            >
              <View style={styles.priorityHeaderRow}>
                <View style={[styles.priorityPill, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[styles.priorityPillText, { color: colors.text }]}>#4 PRIORITY</Text>
                </View>
                <Text style={[styles.priorityCategory, { color: gradProgress.isGraduated ? colors.green : colors.purpleLight }]}>
                  {gradProgress.isGraduated ? "INTERMEDIATE ACHIEVED 🎓" : "GRADUATION GOALS 🚀"}
                </Text>
              </View>

              <View style={styles.gradTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gradTitle, { color: colors.text }]}>
                    Path to Intermediate Level
                  </Text>
                  <Text style={[styles.gradSub, { color: colors.textMuted }]}>
                    {gradProgress.completedCount} of {gradProgress.totalCount} milestones completed ({gradProgress.percent}%)
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${gradProgress.percent}%`,
                      backgroundColor: gradProgress.isGraduated ? colors.green : colors.purple,
                    },
                  ]}
                />
              </View>

              {/* 4 Graduation Tasks */}
              <View style={styles.taskList}>
                {gradProgress.tasks.map((task) => (
                  <View key={task.id} style={styles.taskItem}>
                    <Text style={[styles.taskCheck, { color: task.done ? colors.green : colors.textMuted }]}>
                      {task.done ? "✓" : "○"}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.taskTitle,
                          {
                            color: task.done ? colors.text : colors.textMuted,
                            textDecorationLine: task.done ? "line-through" : "none",
                          },
                        ]}
                      >
                        {task.title}
                      </Text>
                      <Text style={[styles.taskDesc, { color: colors.textMuted }]}>
                        {task.desc} ({task.current}/{task.target})
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <Text style={[styles.gradRewardNote, { color: colors.purpleLight }]}>
                Graduating unlocks intermediate chord inversions & advanced ear workouts!
              </Text>
            </View>

            {/* PRIORITY 5: Today's Quests */}
            {quests.length > 0 && (
              <View
                style={[
                  styles.priorityCard,
                  {
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.priorityHeaderRow}>
                  <View style={[styles.priorityPill, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                    <Text style={[styles.priorityPillText, { color: colors.text }]}>#5 PRIORITY</Text>
                  </View>
                  <Text style={[styles.priorityCategory, { color: colors.purpleLight }]}>
                    DAILY QUESTS
                  </Text>
                </View>

                <View style={styles.questList}>
                  {quests.map((q) => {
                    const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
                    return (
                      <View
                        key={q.id}
                        style={[
                          styles.questItem,
                          {
                            backgroundColor: colors.surface,
                            borderColor: q.completed ? colors.green : colors.border,
                          },
                        ]}
                      >
                        <View style={styles.questInfo}>
                          <Text style={[styles.questTitle, { color: colors.text }]}>
                            {q.completed ? "✓ " : "○ "} {q.title}
                          </Text>
                          <Text style={[styles.questDesc, { color: colors.textMuted }]}>
                            {q.description}
                          </Text>
                          <View style={[styles.progressBarTrack, { backgroundColor: colors.border, marginTop: 4 }]}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${pct}%`,
                                  backgroundColor: q.completed ? colors.green : colors.purple,
                                },
                              ]}
                            />
                          </View>
                        </View>
                        <View style={styles.questReward}>
                          <Text
                            style={[
                              styles.xpText,
                              { color: q.completed ? colors.green : colors.purpleLight },
                            ]}
                          >
                            +{q.xpReward} XP
                          </Text>
                          <Text style={[styles.progressRatio, { color: colors.textMuted }]}>
                            {q.progress}/{q.target}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
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
    maxHeight: "90%",
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  streakIcon: {
    fontSize: 18,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "800",
  },
  hubTitleWrap: {
    alignItems: "center",
  },
  hubTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  closeHit: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 10,
  },
  priorityCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
  },
  priorityHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityPillText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  priorityCategory: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  journeyDetails: {
    gap: 4,
  },
  journeyNextTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  journeyChapterSub: {
    fontSize: 12,
    fontWeight: "700",
  },
  journeyConcept: {
    fontSize: 12,
    lineHeight: 17,
  },
  primaryActionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryActionBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  chordTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  notesList: {
    fontSize: 13,
    fontWeight: "700",
  },
  trivia: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  playBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  buildBtn: {
    flex: 1.2,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buildBtnText: {
    fontWeight: "700",
    fontSize: 12,
  },
  moodTag: {
    fontSize: 11,
    fontWeight: "700",
  },
  dojoTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  dojoDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  secondaryActionBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  gradTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  gradTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  gradSub: {
    fontSize: 11,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  taskList: {
    gap: 8,
    marginTop: 4,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  taskCheck: {
    fontSize: 14,
    fontWeight: "800",
    width: 16,
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  taskDesc: {
    fontSize: 11,
  },
  gradRewardNote: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    lineHeight: 16,
  },
  questList: {
    gap: 8,
  },
  questItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  questInfo: {
    flex: 1,
    paddingRight: 8,
  },
  questTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  questDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  questReward: {
    alignItems: "flex-end",
  },
  xpText: {
    fontSize: 12,
    fontWeight: "800",
  },
  progressRatio: {
    fontSize: 10,
    marginTop: 2,
  },
});
