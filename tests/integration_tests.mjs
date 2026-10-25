import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

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
console.log("RUNNING MUSIXS INTEGRATION & SCREEN TESTS");
console.log("==========================================\n");

function read(relPath) {
  return fs.readFileSync(path.resolve(relPath), "utf-8");
}

test("App.js registers all top-level routes including journey and dojo", () => {
  const code = read("App.js");
  assert.ok(code.includes('key === "journey"'));
  assert.ok(code.includes('key === "dojo"'));
  assert.ok(code.includes('key === "home"'));
  assert.ok(code.includes('key === "build"'));
  assert.ok(code.includes('key === "settings"'));
  assert.ok(code.includes('key === "history"'));
  assert.ok(code.includes('key === "profile"'));
});

test("BottomNav.js includes all 5 tabs and safe-area elevation", () => {
  const code = read("src/components/BottomNav.js");
  assert.ok(code.includes('{ key: "home"'));
  assert.ok(code.includes('{ key: "journey"'));
  assert.ok(code.includes('{ key: "history"'));
  assert.ok(code.includes('{ key: "profile"'));
  assert.ok(code.includes('{ key: "settings"'));
  assert.ok(code.includes("ProfileIcon"));
  assert.ok(code.includes("Math.max(insets.bottom + 18, 34)"));
});

test("BeginnerPromptModal.js offers Beginner and Experienced paths", () => {
  const code = read("src/components/BeginnerPromptModal.js");
  assert.ok(code.includes("Are you a beginner to learning chords?"));
  assert.ok(code.includes("Yes, I'm a beginner"));
  assert.ok(code.includes("No, I already know chords"));
  assert.ok(code.includes("onChooseBeginner"));
  assert.ok(code.includes("onChooseExperienced"));
});

test("InteractiveTutorial.js includes chord theory, app showthrough, and road to intermediate", () => {
  const code = read("src/components/InteractiveTutorial.js");
  assert.ok(code.includes("1. Pitch & Scale Steps"));
  assert.ok(code.includes("2. The Power 5th"));
  assert.ok(code.includes("3. Happy 3rd vs Sad 3rd"));
  assert.ok(code.includes("4. The Maestro's Journey"));
  assert.ok(code.includes("5. Smart Builder & Sound Dojo"));
  assert.ok(code.includes("6. Daily Hub & Streaks"));
  assert.ok(code.includes("7. Path to Intermediate"));
  assert.ok(code.includes("markTutorialComplete"));
  assert.ok(code.includes("+100 XP Earned ⭐"));
});

test("DailyModal.js lists features in strict order of priority", () => {
  const code = read("src/components/DailyModal.js");
  const p1 = code.indexOf("#1 PRIORITY");
  const p2 = code.indexOf("#2 PRIORITY");
  const p3 = code.indexOf("#3 PRIORITY");
  const p4 = code.indexOf("#4 PRIORITY");
  const p5 = code.indexOf("#5 PRIORITY");

  assert.ok(p1 !== -1, "Priority 1 missing");
  assert.ok(p2 !== -1, "Priority 2 missing");
  assert.ok(p3 !== -1, "Priority 3 missing");
  assert.ok(p4 !== -1, "Priority 4 missing");
  assert.ok(p5 !== -1, "Priority 5 missing");

  assert.ok(p1 < p2, "Priority 1 must appear before Priority 2");
  assert.ok(p2 < p3, "Priority 2 must appear before Priority 3");
  assert.ok(p3 < p4, "Priority 3 must appear before Priority 4");
  assert.ok(p4 < p5, "Priority 4 must appear before Priority 5");
});

test("SettingsScreen.js includes notes audio volume slider with real-time preview", () => {
  const code = read("src/screens/SettingsScreen.js");
  assert.ok(code.includes("noteVolume"));
  assert.ok(code.includes("setNoteVolume"));
  assert.ok(code.includes("playChord([\"C\", \"E\", \"G\"])"));
  assert.ok(code.includes("Notes Audio · Chord Synth"));
});

test("ProfileScreen.js renders Road to Intermediate graduation milestones", () => {
  const code = read("src/screens/Profile/ProfileScreen.js");
  assert.ok(code.includes("getGraduationProgress"));
  assert.ok(code.includes("ROAD TO INTERMEDIATE"));
  assert.ok(code.includes("Graduation Milestones"));
});

test("HomeScreen.js prompts beginner modal on first open and connects Daily Hub & Tutorial", () => {
  const code = read("src/screens/HomeScreen.js");
  assert.ok(code.includes("BeginnerPromptModal"));
  assert.ok(code.includes("beginnerPromptVisible"));
  assert.ok(code.includes("handleChooseBeginner"));
  assert.ok(code.includes("handleChooseExperienced"));
  assert.ok(code.includes("DailyModal"));
  assert.ok(code.includes("InteractiveTutorial"));
});

test("appAudio.js contains safe spam buffers and debounced volume ducking", () => {
  const code = read("src/audio/appAudio.js");
  assert.ok(code.includes("MIN_REPEAT_SPAM_BUFFER_MS"));
  assert.ok(code.includes("resumeDebounceTimer"));
  assert.ok(code.includes("player.pause()"));
  assert.ok(code.includes("activeChordPromise"));
});

test("UI screens implement cooldown buffers on audio buttons", () => {
  const guessCode = read("src/screens/GuessChordScreen.js");
  assert.ok(guessCode.includes("isAuditioning"));
  assert.ok(guessCode.includes("auditionTimerRef"));
  assert.ok(guessCode.includes("submitLockRef"));

  const dojoCode = read("src/screens/SoundDojoScreen.js");
  assert.ok(dojoCode.includes("isPlayingAudio"));
  assert.ok(dojoCode.includes("dojoSequenceTimerRef"));
  assert.ok(dojoCode.includes("clearDojoAudio"));

  const buildCode = read("src/screens/BuildChordScreen.js");
  assert.ok(buildCode.includes("isPlayingChord"));
  assert.ok(buildCode.includes("handlePlaySelected"));

  const journeyCode = read("src/screens/JourneyScreen.js");
  assert.ok(journeyCode.includes("isPlayingAudio"));
  assert.ok(journeyCode.includes("submitLockRef"));
});

console.log("\n==========================================");
console.log(`INTEGRATION TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log("==========================================\n");

if (failed > 0) {
  process.exit(1);
}
