import { withDatabase } from "../db/database";

export interface LevelDefinition {
  id: string;
  chapter: number;
  chapterTitle: string;
  levelNumber: number;
  title: string;
  subtitle: string;
  concept: string;
  tip: string;
  type: "build" | "sequence" | "ear";
  targetNotes: string[];
  targetName: string;
  formula: string;
  mood: string;
  xpReward: number;
}

export const JOURNEY_LEVELS: LevelDefinition[] = [
  // Chapter 1: The Building Blocks
  {
    id: "ch1_lvl1",
    chapter: 1,
    chapterTitle: "The Building Blocks",
    levelNumber: 1,
    title: "Meet the Natural Anchor",
    subtitle: "C Natural Note",
    concept: "Every musical family has a home base called the Root. In Western music, C is the most foundational anchor.",
    tip: "Select the note C on the keyboard to hear its natural pitch.",
    type: "build",
    targetNotes: ["C"],
    targetName: "C Note",
    formula: "Single Root Note",
    mood: "Grounding & Centered ⚓",
    xpReward: 30,
  },
  {
    id: "ch1_lvl2",
    chapter: 1,
    chapterTitle: "The Building Blocks",
    levelNumber: 2,
    title: "The Power 5th",
    subtitle: "C + G Interval",
    concept: "The distance from C to G spans 5 letter names (C-D-E-F-G). This 'Fifth' provides immense strength and clarity.",
    tip: "Tap C, then tap G. Hear how open and consonant they ring together!",
    type: "build",
    targetNotes: ["C", "G"],
    targetName: "C Power Chord (5th)",
    formula: "Root (C) + Perfect 5th (G)",
    mood: "Bold, Pure & Resonant ⚡",
    xpReward: 40,
  },
  {
    id: "ch1_lvl3",
    chapter: 1,
    chapterTitle: "The Building Blocks",
    levelNumber: 3,
    title: "The Happy Third",
    subtitle: "C Major Triad",
    concept: "Adding E in between C and G creates the Major 3rd. That single note turns an open sound into bright sunshine!",
    tip: "Combine C, E, and G. Notice the upbeat, cheerful personality.",
    type: "build",
    targetNotes: ["C", "E", "G"],
    targetName: "C Major",
    formula: "1 (C) - 3 (E) - 5 (G)",
    mood: "Bright & Triumphant ☀️",
    xpReward: 50,
  },
  {
    id: "ch1_lvl4",
    chapter: 1,
    chapterTitle: "The Building Blocks",
    levelNumber: 4,
    title: "The Emotional Shift",
    subtitle: "A Minor Triad",
    concept: "Minor chords use a Minor 3rd (3 semitones). They convey mystery, sadness, and emotional depth.",
    tip: "Select A, C, and E. Compare its moody flavor to C Major.",
    type: "build",
    targetNotes: ["A", "C", "E"],
    targetName: "A Minor",
    formula: "1 (A) - ♭3 (C) - 5 (E)",
    mood: "Moody & Soulful 🌧️",
    xpReward: 50,
  },

  // Chapter 2: The Core Triads
  {
    id: "ch2_lvl5",
    chapter: 2,
    chapterTitle: "The Core Triads",
    levelNumber: 5,
    title: "The Subdominant Lift",
    subtitle: "F Major Triad",
    concept: "F Major is the 4th degree of C Major. It gives songs a feeling of flying or rising upwards.",
    tip: "Select F, A, and C.",
    type: "build",
    targetNotes: ["F", "A", "C"],
    targetName: "F Major",
    formula: "1 (F) - 3 (A) - 5 (C)",
    mood: "Warm & Uplifting 🌅",
    xpReward: 60,
  },
  {
    id: "ch2_lvl6",
    chapter: 2,
    chapterTitle: "The Core Triads",
    levelNumber: 6,
    title: "The Dominant Pull",
    subtitle: "G Major Triad",
    concept: "G Major is the 5th degree. It creates musical tension that desperately wants to resolve back to C!",
    tip: "Select G, B, and D.",
    type: "build",
    targetNotes: ["G", "B", "D"],
    targetName: "G Major",
    formula: "1 (G) - 3 (B) - 5 (D)",
    mood: "Energetic & Driving 🚀",
    xpReward: 60,
  },
  {
    id: "ch2_lvl7",
    chapter: 2,
    chapterTitle: "The Core Triads",
    levelNumber: 7,
    title: "The Melancholic Step",
    subtitle: "D Minor Triad",
    concept: "D Minor is famously called the saddest chord in classical music, used in film scores and heartbreak ballads.",
    tip: "Select D, F, and A.",
    type: "build",
    targetNotes: ["D", "F", "A"],
    targetName: "D Minor",
    formula: "1 (D) - ♭3 (F) - 5 (A)",
    mood: "Melancholic & Reflective 🍂",
    xpReward: 65,
  },
  {
    id: "ch2_lvl8",
    chapter: 2,
    chapterTitle: "The Core Triads",
    levelNumber: 8,
    title: "The Pop Anthem",
    subtitle: "E Minor Triad",
    concept: "E Minor bridges the gap between G Major and C Major. It creates gentle, floating melancholy.",
    tip: "Select E, G, and B.",
    type: "build",
    targetNotes: ["E", "G", "B"],
    targetName: "E Minor",
    formula: "1 (E) - ♭3 (G) - 5 (B)",
    mood: "Deep & Contemplative 🌌",
    xpReward: 70,
  },

  // Chapter 3: Colorful Harmonies
  {
    id: "ch3_lvl9",
    chapter: 3,
    chapterTitle: "Colorful Harmonies",
    levelNumber: 9,
    title: "Suspended Tension",
    subtitle: "Csus4 Chord",
    concept: "Sus4 replaces the 3rd with the 4th note (F). It leaves listeners hanging by a thread until resolved!",
    tip: "Select C, F, and G.",
    type: "build",
    targetNotes: ["C", "F", "G"],
    targetName: "C Sus4",
    formula: "1 (C) - 4 (F) - 5 (G)",
    mood: "Suspenseful & Unresolved ⏳",
    xpReward: 80,
  },
  {
    id: "ch3_lvl10",
    chapter: 3,
    chapterTitle: "Colorful Harmonies",
    levelNumber: 10,
    title: "Airy Ambience",
    subtitle: "Csus2 Chord",
    concept: "Sus2 replaces the 3rd with the 2nd note (D). It sounds open, modern, and floating like ambient cinema.",
    tip: "Select C, D, and G.",
    type: "build",
    targetNotes: ["C", "D", "G"],
    targetName: "C Sus2",
    formula: "1 (C) - 2 (D) - 5 (G)",
    mood: "Ethereal & Atmospheric 🎐",
    xpReward: 90,
  },
];

export interface BadgeDefinition {
  id: string;
  name: string;
  desc: string;
  icon: string;
  xpReward: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_chord",
    name: "First Chord Built",
    desc: "Completed the interactive music theory tutorial.",
    icon: "🎓",
    xpReward: 100,
  },
  {
    id: "golden_ear",
    name: "Golden Ear",
    desc: "Scored 5 correct ear training answers in a row in Sound Dojo.",
    icon: "👂",
    xpReward: 150,
  },
  {
    id: "triad_master",
    name: "Triad Master",
    desc: "Built 5 different recognized chords.",
    icon: "🎹",
    xpReward: 150,
  },
  {
    id: "streak_keeper",
    name: "Streak Keeper",
    desc: "Kept a 3-day practice streak alive.",
    icon: "🔥",
    xpReward: 200,
  },
  {
    id: "journey_ch1",
    name: "Chapter 1 Pioneer",
    desc: "Completed all levels in Chapter 1: The Building Blocks.",
    icon: "🗺️",
    xpReward: 200,
  },
  {
    id: "accidental_artist",
    name: "Accidental Explorer",
    desc: "Selected a Sharp (#) or Flat (♭) note using the long-press picker.",
    icon: "🎨",
    xpReward: 100,
  },
  {
    id: "star_collector",
    name: "Star Collector",
    desc: "Collected 15 stars across Journey levels.",
    icon: "⭐",
    xpReward: 250,
  },
  {
    id: "chord_maestro",
    name: "Chord Maestro",
    desc: "Completed all chapters in The Maestro's Journey.",
    icon: "👑",
    xpReward: 300,
  },
];

export interface DailyChord {
  name: string;
  notes: string[];
  formula: string;
  mood: string;
  trivia: string;
}

export const ROTATING_DAILY_CHORDS: DailyChord[] = [
  {
    name: "C Major",
    notes: ["C", "E", "G"],
    formula: "1 - 3 - 5",
    mood: "Bright & Triumphant ☀️",
    trivia: "The most famous chord in music history. It uses all natural notes with no sharps or flats!",
  },
  {
    name: "A Minor",
    notes: ["A", "C", "E"],
    formula: "1 - ♭3 - 5",
    mood: "Moody & Soulful 🌧️",
    trivia: "The relative minor of C Major. It shares the exact same notes, but starting on A makes it emotional.",
  },
  {
    name: "F Major",
    notes: ["F", "A", "C"],
    formula: "1 - 3 - 5",
    mood: "Warm & Uplifting 🌅",
    trivia: "Often called the 'heartstring' chord. Gives acoustic ballads their soaring lift.",
  },
  {
    name: "G Major",
    notes: ["G", "B", "D"],
    formula: "1 - 3 - 5",
    mood: "Energetic & Driving 🚀",
    trivia: "The king of resolution. When played after D7 or G, heading to C feels like coming home.",
  },
  {
    name: "D Minor",
    notes: ["D", "F", "A"],
    formula: "1 - ♭3 - 5",
    mood: "Melancholic & Reflective 🍂",
    trivia: "Beethoven and Mozart used D Minor for their most intense, stormy masterpieces.",
  },
  {
    name: "E Minor",
    notes: ["E", "G", "B"],
    formula: "1 - ♭3 - 5",
    mood: "Deep & Contemplative 🌌",
    trivia: "The lowest natural chord on a standard guitar. Popular in atmospheric rock and lo-fi tracks.",
  },
  {
    name: "Csus4",
    notes: ["C", "F", "G"],
    formula: "1 - 4 - 5",
    mood: "Suspenseful & Unresolved ⏳",
    trivia: "Suspended chords replace the 3rd with the 4th, creating tension that yearns to resolve to Major!",
  },
];

export interface UserStats {
  xp: number;
  level: number;
  title: string;
  streakCount: number;
  tutorialCompleted: boolean;
  onboardingAnswered: boolean;
  isBeginner: boolean;
  nextLevelXp: number;
  currentLevelBaseXp: number;
  progressPercent: number;
}

export function calculateLevel(xp: number): {
  level: number;
  title: string;
  currentLevelBaseXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const TIERS = [
    { level: 1, minXp: 0, maxXp: 100, title: "Note Novice 🎵" },
    { level: 2, minXp: 100, maxXp: 250, title: "Pitch Finder 🔍" },
    { level: 3, minXp: 250, maxXp: 500, title: "Triad Apprentice 🎹" },
    { level: 4, minXp: 500, maxXp: 900, title: "Harmony Explorer 🎼" },
    { level: 5, minXp: 900, maxXp: 1500, title: "Progression Crafter 🎶" },
    { level: 6, minXp: 1500, maxXp: 2300, title: "Ear Virtuoso 👂" },
    { level: 7, minXp: 2300, maxXp: 3500, title: "Chord Architect 🏛️" },
    { level: 8, minXp: 3500, maxXp: 5000, title: "Master Maestro 👑" },
  ];

  for (const tier of TIERS) {
    if (xp < tier.maxXp) {
      const range = tier.maxXp - tier.minXp;
      const progress = Math.min(100, Math.max(0, Math.round(((xp - tier.minXp) / range) * 100)));
      return {
        level: tier.level,
        title: tier.title,
        currentLevelBaseXp: tier.minXp,
        nextLevelXp: tier.maxXp,
        progressPercent: progress,
      };
    }
  }

  return {
    level: 8,
    title: "Master Maestro 👑",
    currentLevelBaseXp: 3500,
    nextLevelXp: 5000,
    progressPercent: 100,
  };
}

// ---------------------------------------------------------------------------
// Database Queries
// ---------------------------------------------------------------------------

export async function getUserStats(): Promise<UserStats> {
  return withDatabase("getUserStats", async (db) => {
    let row = await db.getFirstAsync<{
      xp: number;
      streak_count: number;
      last_active_date: string | null;
      tutorial_completed: number;
      onboarding_answered?: number;
      is_beginner?: number;
    }>("SELECT xp, streak_count, last_active_date, tutorial_completed, onboarding_answered, is_beginner FROM user_stats WHERE id = 1");

    const todayStr = new Date().toISOString().split("T")[0];

    if (!row) {
      await db.runAsync(
        "INSERT INTO user_stats (id, xp, streak_count, last_active_date, tutorial_completed, onboarding_answered, is_beginner) VALUES (1, 0, 1, ?, 0, 0, 1)",
        todayStr
      );
      row = { xp: 0, streak_count: 1, last_active_date: todayStr, tutorial_completed: 0, onboarding_answered: 0, is_beginner: 1 };
    } else if (row.last_active_date !== todayStr) {
      // Calculate streak
      let newStreak = row.streak_count;
      if (row.last_active_date) {
        const lastDate = new Date(row.last_active_date);
        const today = new Date(todayStr);
        const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1; // Reset streak if missed day
        }
      }
      await db.runAsync(
        "UPDATE user_stats SET streak_count = ?, last_active_date = ? WHERE id = 1",
        newStreak,
        todayStr
      );
      row.streak_count = newStreak;
      row.last_active_date = todayStr;
    }

    const levelData = calculateLevel(row.xp || 0);

    return {
      xp: row.xp || 0,
      level: levelData.level,
      title: levelData.title,
      streakCount: row.streak_count || 1,
      tutorialCompleted: row.tutorial_completed === 1,
      onboardingAnswered: (row.onboarding_answered ?? 0) === 1,
      isBeginner: (row.is_beginner ?? 1) === 1,
      nextLevelXp: levelData.nextLevelXp,
      currentLevelBaseXp: levelData.currentLevelBaseXp,
      progressPercent: levelData.progressPercent,
    };
  });
}

export async function setOnboardingAnswered(isBeginner: boolean): Promise<void> {
  await withDatabase("setOnboardingAnswered", async (db) => {
    await db.runAsync(
      "UPDATE user_stats SET onboarding_answered = 1, is_beginner = ? WHERE id = 1",
      isBeginner ? 1 : 0
    );
  });
}

export async function addXP(amount: number): Promise<{ newXp: number; leveledUp: boolean; newLevel: number }> {
  return withDatabase("addXP", async (db) => {
    const stats = await db.getFirstAsync<{ xp: number }>("SELECT xp FROM user_stats WHERE id = 1");
    const currentXp = stats?.xp || 0;
    const oldLevel = calculateLevel(currentXp).level;
    const newXp = currentXp + amount;
    const newLevel = calculateLevel(newXp).level;

    await db.runAsync(
      "INSERT INTO user_stats (id, xp) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET xp = ?",
      newXp,
      newXp
    );

    return {
      newXp,
      leveledUp: newLevel > oldLevel,
      newLevel,
    };
  });
}

export async function markTutorialComplete(): Promise<void> {
  await withDatabase("markTutorialComplete", async (db) => {
    await db.runAsync("UPDATE user_stats SET tutorial_completed = 1, onboarding_answered = 1 WHERE id = 1");
  });
  await unlockBadge("first_chord");
  await addXP(100);
}

export async function getLevelProgress(): Promise<Record<string, { stars: number; score: number }>> {
  return withDatabase("getLevelProgress", async (db) => {
    const rows = await db.getAllAsync<{ level_id: string; stars: number; score: number }>(
      "SELECT level_id, stars, score FROM user_progress"
    );
    const map: Record<string, { stars: number; score: number }> = {};
    for (const r of rows) {
      map[r.level_id] = { stars: r.stars, score: r.score };
    }
    return map;
  });
}

export async function saveLevelProgress(
  levelId: string,
  stars: number,
  score: number
): Promise<{ newStars: number; xpEarned: number }> {
  return withDatabase("saveLevelProgress", async (db) => {
    const existing = await db.getFirstAsync<{ stars: number }>(
      "SELECT stars FROM user_progress WHERE level_id = ?",
      levelId
    );
    const prevStars = existing?.stars || 0;
    const bestStars = Math.max(prevStars, stars);

    await db.runAsync(
      "INSERT INTO user_progress (level_id, stars, score) VALUES (?, ?, ?) ON CONFLICT(level_id) DO UPDATE SET stars = ?, score = MAX(score, ?)",
      levelId,
      bestStars,
      score,
      bestStars,
      score
    );

    // Give XP only for new stars earned or completion
    const starDelta = Math.max(0, stars - prevStars);
    const xpEarned = starDelta * 30 + (prevStars === 0 ? 50 : 15);
    await addXP(xpEarned);

    // Check Chapter 1 completion badge
    const ch1Levels = JOURNEY_LEVELS.filter((l) => l.chapter === 1).map((l) => l.id);
    const ch1Finished = await db.getAllAsync<{ level_id: string }>(
      `SELECT level_id FROM user_progress WHERE level_id IN (${ch1Levels.map(() => "?").join(",")}) AND stars > 0`,
      ...ch1Levels
    );
    if (ch1Finished.length === ch1Levels.length) {
      await unlockBadge("journey_ch1");
    }

    // Check Star Collector badge (15 stars)
    const totalStars = await db.getFirstAsync<{ total: number }>(
      "SELECT SUM(stars) as total FROM user_progress"
    );
    if ((totalStars?.total || 0) >= 15) {
      await unlockBadge("star_collector");
    }

    return { newStars: bestStars, xpEarned };
  });
}

export async function getBadges(): Promise<
  (BadgeDefinition & { unlocked: boolean; unlockedAt: string | null })[]
> {
  return withDatabase("getBadges", async (db) => {
    const rows = await db.getAllAsync<{ badge_id: string; unlocked_at: string }>(
      "SELECT badge_id, unlocked_at FROM user_badges"
    );
    const unlockedMap = new Map(rows.map((r) => [r.badge_id, r.unlocked_at]));

    return BADGE_DEFINITIONS.map((b) => ({
      ...b,
      unlocked: unlockedMap.has(b.id),
      unlockedAt: unlockedMap.get(b.id) || null,
    }));
  });
}

export async function unlockBadge(badgeId: string): Promise<boolean> {
  return withDatabase("unlockBadge", async (db) => {
    const existing = await db.getFirstAsync<{ badge_id: string }>(
      "SELECT badge_id FROM user_badges WHERE badge_id = ?",
      badgeId
    );
    if (existing) return false;

    await db.runAsync("INSERT INTO user_badges (badge_id) VALUES (?)", badgeId);
    const badgeDef = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
    if (badgeDef) {
      await addXP(badgeDef.xpReward);
    }
    return true;
  });
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  xpReward: number;
}

export async function getDailyQuests(): Promise<DailyQuest[]> {
  const todayStr = new Date().toISOString().split("T")[0];
  const QUEST_TEMPLATES = [
    { id: "journey_step", title: "Pioneer Step", description: "Earn stars in any Journey Level", target: 1, xpReward: 60 },
    { id: "build_chords", title: "Master Builder", description: "Build 2 recognized chords in Build a Chord", target: 2, xpReward: 50 },
    { id: "sound_dojo", title: "Dojo Challenger", description: "Play 3 rounds in Sound Dojo", target: 3, xpReward: 50 },
  ];

  return withDatabase("getDailyQuests", async (db) => {
    const results: DailyQuest[] = [];
    for (const q of QUEST_TEMPLATES) {
      let row = await db.getFirstAsync<{ progress: number; completed: number }>(
        "SELECT progress, completed FROM daily_quests WHERE quest_id = ? AND quest_date = ?",
        q.id,
        todayStr
      );

      if (!row) {
        await db.runAsync(
          "INSERT INTO daily_quests (quest_id, quest_date, progress, target, completed) VALUES (?, ?, 0, ?, 0)",
          q.id,
          todayStr,
          q.target
        );
        row = { progress: 0, completed: 0 };
      }

      results.push({
        id: q.id,
        title: q.title,
        description: q.description,
        progress: Math.min(q.target, row.progress),
        target: q.target,
        completed: row.completed === 1 || row.progress >= q.target,
        xpReward: q.xpReward,
      });
    }
    return results;
  });
}

export async function incrementQuestProgress(questId: string, amount = 1): Promise<boolean> {
  const todayStr = new Date().toISOString().split("T")[0];
  return withDatabase("incrementQuestProgress", async (db) => {
    const row = await db.getFirstAsync<{ progress: number; target: number; completed: number }>(
      "SELECT progress, target, completed FROM daily_quests WHERE quest_id = ? AND quest_date = ?",
      questId,
      todayStr
    );
    if (!row || row.completed === 1) return false;

    const newProgress = row.progress + amount;
    const isCompleted = newProgress >= row.target ? 1 : 0;

    await db.runAsync(
      "UPDATE daily_quests SET progress = ?, completed = ? WHERE quest_id = ? AND quest_date = ?",
      newProgress,
      isCompleted,
      questId,
      todayStr
    );

    if (isCompleted && !row.completed) {
      await addXP(50);
      return true;
    }
    return false;
  });
}

export function getTodayChord(): DailyChord {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = Math.abs(dayOfYear % ROTATING_DAILY_CHORDS.length);
  return ROTATING_DAILY_CHORDS[index];
}

// ---------------------------------------------------------------------------
// Beginner to Intermediate Graduation Milestone
// ---------------------------------------------------------------------------

export interface GraduationProgress {
  tasks: Array<{
    id: string;
    title: string;
    desc: string;
    done: boolean;
    current: number;
    target: number;
  }>;
  completedCount: number;
  totalCount: number;
  percent: number;
  isGraduated: boolean;
}

export function getGraduationProgress(
  stats?: Partial<UserStats> | null,
  progressMap?: Record<string, { stars: number }> | null
): GraduationProgress {
  const safeStats = stats || {};
  const safeMap = progressMap || {};

  // Task 1: Complete Chapter 1 of The Journey (4 levels)
  const ch1Levels = JOURNEY_LEVELS.filter((l) => l.chapter === 1);
  const ch1CompletedCount = ch1Levels.filter((l) => (safeMap[l.id]?.stars || 0) > 0).length;
  const ch1Done = ch1CompletedCount === ch1Levels.length;

  // Task 2: Earn at least 10 stars in Journey
  const totalStars = Object.values(safeMap).reduce((sum, curr) => sum + (curr?.stars || 0), 0);
  const starsDone = totalStars >= 10;

  // Task 3: Reach Level 3 (Triad Apprentice - 250 XP)
  const levelDone = (safeStats.level || 1) >= 3;

  // Task 4: Complete First Chord Tutorial
  const tutorialDone = !!safeStats.tutorialCompleted;

  const tasks = [
    {
      id: "tutorial",
      title: "Interactive Chord Tour",
      desc: "Complete the guided beginner walkthrough",
      done: tutorialDone,
      current: tutorialDone ? 1 : 0,
      target: 1,
    },
    {
      id: "ch1",
      title: "Complete Chapter 1",
      desc: "Master all 4 Building Block levels",
      done: ch1Done,
      current: ch1CompletedCount,
      target: 4,
    },
    {
      id: "stars",
      title: "Collect 10 Journey Stars",
      desc: "Earn stars by playing levels accurately",
      done: starsDone,
      current: Math.min(10, totalStars),
      target: 10,
    },
    {
      id: "level3",
      title: "Reach Level 3 (250 XP)",
      desc: "Advance from Note Novice to Triad Apprentice",
      done: levelDone,
      current: Math.min(250, safeStats.xp || 0),
      target: 250,
    },
  ];

  const completedCount = tasks.filter((t) => t.done).length;
  const isGraduated = completedCount === tasks.length;
  const percent = Math.round((completedCount / tasks.length) * 100);

  return {
    tasks,
    completedCount,
    totalCount: tasks.length,
    percent,
    isGraduated,
  };
}

export async function fetchGraduationProgress(): Promise<GraduationProgress> {
  const stats = await getUserStats();
  const progressMap = await getLevelProgress();
  return getGraduationProgress(stats, progressMap);
}

export function getNextJourneyLevel(progressMap: Record<string, { stars: number }>): LevelDefinition | null {
  for (const lvl of JOURNEY_LEVELS) {
    if (!progressMap[lvl.id] || progressMap[lvl.id].stars === 0) {
      return lvl;
    }
  }
  return JOURNEY_LEVELS[JOURNEY_LEVELS.length - 1];
}
