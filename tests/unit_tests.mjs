import assert from "node:assert/strict";
import { noteToFrequency, identifyChord, sameNotes, KNOWN_CHORDS } from "../src/utils/musicTheory.js";

// Helper test runner
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log("\n==========================================");
console.log("RUNNING MUSIXS AUTOMATED TEST SUITE");
console.log("==========================================\n");

console.log("--- 1. Music Theory & Sound Generation ---");

test("A4 standard pitch frequency is exactly 440 Hz", () => {
  const freq = noteToFrequency("A", 4);
  assert.strictEqual(Math.round(freq), 440);
});

test("Middle C (C4) frequency is approximately 261.63 Hz", () => {
  const freq = noteToFrequency("C", 4);
  assert.strictEqual(Math.round(freq * 100) / 100, 261.63);
});

test("Octave scaling: C5 frequency is double C4", () => {
  const c4 = noteToFrequency("C", 4);
  const c5 = noteToFrequency("C", 5);
  assert.strictEqual(Math.round(c5), Math.round(c4 * 2));
});

test("Accidentals: C#4 is higher than C4 and lower than D4", () => {
  const c4 = noteToFrequency("C", 4);
  const csharp4 = noteToFrequency("C#", 4);
  const d4 = noteToFrequency("D", 4);
  assert.ok(csharp4 > c4, "C#4 should be higher than C4");
  assert.ok(csharp4 < d4, "C#4 should be lower than D4");
});

test("identifyChord correctly identifies C Major Triad", () => {
  const chord = identifyChord(["C", "E", "G"]);
  assert.strictEqual(chord, "C Major");
});

test("identifyChord correctly identifies C Minor Triad (C - D# - G)", () => {
  const chord = identifyChord(["C", "D#", "G"]);
  assert.strictEqual(chord, "C Minor");
});

test("identifyChord correctly identifies D Minor Triad", () => {
  const chord = identifyChord(["D", "F", "A"]);
  assert.strictEqual(chord, "D Minor");
});

test("identifyChord correctly identifies G Major Triad", () => {
  const chord = identifyChord(["G", "B", "D"]);
  assert.strictEqual(chord, "G Major");
});

test("identifyChord correctly identifies Sus4 chord", () => {
  const chord = identifyChord(["C", "F", "G"]);
  assert.strictEqual(chord, "C Sus4");
});

test("identifyChord correctly identifies Sus2 chord", () => {
  const chord = identifyChord(["C", "D", "G"]);
  assert.strictEqual(chord, "C Sus2");
});

test("identifyChord handles inverted input order (E, G, C still detects C Major)", () => {
  const chord = identifyChord(["E", "G", "C"]);
  assert.strictEqual(chord, "C Major");
});

test("sameNotes correctly compares note arrays irrespective of order", () => {
  assert.ok(sameNotes(["C", "E", "G"], ["G", "C", "E"]));
  assert.strictEqual(sameNotes(["C", "E", "G"], ["C", "D", "G"]), false);
});

test("KNOWN_CHORDS contains standard triads used for quizzing", () => {
  assert.ok(KNOWN_CHORDS.length >= 6);
  for (const kc of KNOWN_CHORDS) {
    assert.ok(kc.name);
    assert.strictEqual(kc.notes.length, 3);
  }
});

console.log("\n--- 2. Gamification, Levels & Progress Logic ---");

// Level calculator logic replication for unit testing
const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, maxXp: 99, title: "Note Novice" },
  { level: 2, minXp: 100, maxXp: 249, title: "Pitch Explorer" },
  { level: 3, minXp: 250, maxXp: 499, title: "Triad Apprentice" },
  { level: 4, minXp: 500, maxXp: 899, title: "Harmony Scout" },
  { level: 5, minXp: 900, maxXp: 1399, title: "Chord Crafter" },
  { level: 6, minXp: 1400, maxXp: 1999, title: "Key Master" },
  { level: 7, minXp: 2000, maxXp: 2999, title: "Voicing Virtuoso" },
  { level: 8, minXp: 3000, maxXp: 4999, title: "Ear Maestro" },
  { level: 9, minXp: 5000, maxXp: 7999, title: "Harmonic Sage" },
  { level: 10, minXp: 8000, maxXp: 999999, title: "Grand Maestro" },
];

function calculateLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const t = LEVEL_THRESHOLDS[i];
    if (xp >= t.minXp) {
      const nextThreshold = LEVEL_THRESHOLDS[i + 1];
      const nextLevelXp = nextThreshold ? nextThreshold.minXp : t.maxXp;
      const range = nextLevelXp - t.minXp;
      const progressInLevel = xp - t.minXp;
      const progressPercent = Math.min(100, Math.max(0, Math.round((progressInLevel / range) * 100)));
      return {
        level: t.level,
        title: t.title,
        nextLevelXp,
        currentLevelBaseXp: t.minXp,
        progressPercent,
      };
    }
  }
  return { level: 1, title: "Note Novice", nextLevelXp: 100, currentLevelBaseXp: 0, progressPercent: 0 };
}

test("calculateLevel: 0 XP is Level 1 Note Novice (0% progress)", () => {
  const l = calculateLevel(0);
  assert.strictEqual(l.level, 1);
  assert.strictEqual(l.title, "Note Novice");
  assert.strictEqual(l.progressPercent, 0);
});

test("calculateLevel: 100 XP is Level 2 Pitch Explorer", () => {
  const l = calculateLevel(100);
  assert.strictEqual(l.level, 2);
  assert.strictEqual(l.title, "Pitch Explorer");
});

test("calculateLevel: 250 XP advances to Level 3 Triad Apprentice (Graduation requirement)", () => {
  const l = calculateLevel(250);
  assert.strictEqual(l.level, 3);
  assert.strictEqual(l.title, "Triad Apprentice");
});

test("calculateLevel: 600 XP is Level 4 Harmony Scout with correct percentage", () => {
  const l = calculateLevel(600);
  assert.strictEqual(l.level, 4);
  assert.strictEqual(l.title, "Harmony Scout");
  assert.ok(l.progressPercent > 0 && l.progressPercent < 100);
});

console.log("\n--- 3. Graduation to Intermediate Evaluation ---");

function getGraduationProgress(stats, progressMap) {
  const ch1LevelIds = ["ch1_lvl1", "ch1_lvl2", "ch1_lvl3", "ch1_lvl4"];
  const ch1CompletedCount = ch1LevelIds.filter((id) => (progressMap[id]?.stars || 0) > 0).length;
  const ch1Done = ch1CompletedCount === ch1LevelIds.length;

  const totalStars = Object.values(progressMap).reduce((sum, curr) => sum + (curr?.stars || 0), 0);
  const starsDone = totalStars >= 10;

  const levelDone = (stats?.level || 1) >= 3;
  const tutorialDone = !!stats?.tutorialCompleted;

  const tasks = [
    { id: "tutorial", done: tutorialDone },
    { id: "ch1", done: ch1Done },
    { id: "stars", done: starsDone },
    { id: "level3", done: levelDone },
  ];

  const completedCount = tasks.filter((t) => t.done).length;
  const isGraduated = completedCount === tasks.length;
  const percent = Math.round((completedCount / tasks.length) * 100);

  return { tasks, completedCount, totalCount: tasks.length, percent, isGraduated };
}

test("getGraduationProgress: Fresh beginner starts at 0% and not graduated", () => {
  const prog = getGraduationProgress({ level: 1, tutorialCompleted: false }, {});
  assert.strictEqual(prog.completedCount, 0);
  assert.strictEqual(prog.percent, 0);
  assert.strictEqual(prog.isGraduated, false);
});

test("getGraduationProgress: Completing tutorial gives 25% progress", () => {
  const prog = getGraduationProgress({ level: 1, tutorialCompleted: true }, {});
  assert.strictEqual(prog.completedCount, 1);
  assert.strictEqual(prog.percent, 25);
  assert.strictEqual(prog.isGraduated, false);
});

test("getGraduationProgress: Partial progress (Tutorial + 2 Ch1 levels + 5 stars)", () => {
  const progressMap = {
    ch1_lvl1: { stars: 3 },
    ch1_lvl2: { stars: 2 },
  };
  const prog = getGraduationProgress({ level: 2, tutorialCompleted: true }, progressMap);
  assert.strictEqual(prog.completedCount, 1); // Only tutorial done
  assert.strictEqual(prog.isGraduated, false);
});

test("getGraduationProgress: All 4 milestones fulfilled graduates to Intermediate", () => {
  const progressMap = {
    ch1_lvl1: { stars: 3 },
    ch1_lvl2: { stars: 3 },
    ch1_lvl3: { stars: 3 },
    ch1_lvl4: { stars: 3 },
  };
  const prog = getGraduationProgress({ level: 3, tutorialCompleted: true }, progressMap);
  assert.strictEqual(prog.completedCount, 4);
  assert.strictEqual(prog.percent, 100);
  assert.strictEqual(prog.isGraduated, true);
});

console.log("\n--- 4. Next Journey Level Selector ---");

const MOCK_JOURNEY_LEVELS = [
  { id: "ch1_lvl1", title: "The Root Note", levelNumber: 1 },
  { id: "ch1_lvl2", title: "The Power 5th", levelNumber: 2 },
  { id: "ch1_lvl3", title: "The Happy Triad", levelNumber: 3 },
  { id: "ch1_lvl4", title: "The Sad Switch", levelNumber: 4 },
];

function getNextJourneyLevel(progressMap) {
  for (const lvl of MOCK_JOURNEY_LEVELS) {
    if (!progressMap[lvl.id] || progressMap[lvl.id].stars === 0) {
      return lvl;
    }
  }
  return MOCK_JOURNEY_LEVELS[MOCK_JOURNEY_LEVELS.length - 1];
}

test("getNextJourneyLevel returns Lesson 1 when user has no stars", () => {
  const next = getNextJourneyLevel({});
  assert.strictEqual(next.id, "ch1_lvl1");
  assert.strictEqual(next.levelNumber, 1);
});

test("getNextJourneyLevel advances to Lesson 3 when Lessons 1 and 2 are beaten", () => {
  const next = getNextJourneyLevel({
    ch1_lvl1: { stars: 3 },
    ch1_lvl2: { stars: 2 },
  });
  assert.strictEqual(next.id, "ch1_lvl3");
  assert.strictEqual(next.levelNumber, 3);
});

console.log("\n==========================================");
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log("==========================================\n");

if (failed > 0) {
  process.exit(1);
}
