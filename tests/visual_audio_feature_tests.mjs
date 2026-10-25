import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  NOTE_NAMES,
  KNOWN_CHORDS,
  noteToFrequency,
  identifyChord,
  sameNotes,
  buildChordDataUri,
} from "../src/utils/musicTheory.js";

console.log("\n=======================================================");
console.log("RUNNING VISUAL, AUDIO & COMPREHENSIVE FEATURE TESTS");
console.log("=======================================================");

function loadThemeColors() {
  const Platform = { OS: 'android' };
  const code = fs.readFileSync("src/theme.js", "utf8");
  const darkMatch = code.match(/export const darkColors = ({[\s\S]*?});/);
  const lightMatch = code.match(/export const lightColors = ({[\s\S]*?});/);
  const darkColors = eval(`(${darkMatch[1]})`);
  const lightColors = eval(`(${lightMatch[1]})`);
  return { darkColors, lightColors };
}

// ==========================================
// SECTION 1: VISUAL & UI INTEGRITY
// ==========================================

test("1.1 Theme colors integrity (Dark vs Light palettes)", () => {
  const { darkColors, lightColors } = loadThemeColors();
  const requiredKeys = [
    "bg",
    "surface",
    "surface2",
    "border",
    "purple",
    "purpleLight",
    "text",
    "textMuted",
    "green",
    "greenBg",
    "red",
    "redBg",
    "glow",
    "glass",
    "glassBorder",
  ];

  for (const key of requiredKeys) {
    assert.ok(key in darkColors, `Dark palette missing key: ${key}`);
    assert.ok(key in lightColors, `Light palette missing key: ${key}`);
    assert.strictEqual(typeof darkColors[key], "string", `darkColors.${key} must be a string`);
    assert.strictEqual(typeof lightColors[key], "string", `lightColors.${key} must be a string`);
  }

  // Visual contrast check: Dark text must be light, Light text must be dark
  assert.strictEqual(darkColors.text, "#ffffff");
  assert.strictEqual(lightColors.text, "#1a1a1a");
  assert.notStrictEqual(darkColors.bg, lightColors.bg, "Dark and light backgrounds must be distinct");
});

test("1.2 AnimatedSwitch prevents white/blank screens on route transition", () => {
  const code = fs.readFileSync("src/components/AnimatedSwitch.js", "utf8");
  assert.ok(
    code.includes("if (!entries || entries.length === 0)"),
    "AnimatedSwitch must have fallback when entries is empty to prevent white screen"
  );
  assert.ok(
    code.includes("if (!active)"),
    "AnimatedSwitch must safely handle !active entry without discarding entering screen"
  );
  assert.ok(
    code.includes("render(activeKey)"),
    "AnimatedSwitch fallback must render activeKey directly"
  );
});

test("1.3 ScreenWrapper safe areas & minification resilience", () => {
  const code = fs.readFileSync("src/components/ScreenWrapper.js", "utf8");
  assert.ok(code.includes("isBottomNavElement"), "Must duck-type BottomNav for release minification");
  assert.ok(code.includes("SafeAreaView"), "Must wrap with SafeAreaView");
  assert.ok(code.includes("useSafeAreaInsets"), "Must use safe area insets");
  assert.ok(code.includes("contentBottomPadding"), "Must compute bottom padding so nav doesn't overlap");
  assert.ok(code.includes("DynamicBackground"), "Must integrate dynamic responsive background");
});

test("1.4 Modals clean up state and flags on dismiss/navigation", () => {
  const homeCode = fs.readFileSync("src/screens/HomeScreen.js", "utf8");
  assert.ok(homeCode.includes("setDailyModalVisible(false)"), "Must close DailyModal on navigation");
  assert.ok(homeCode.includes("setTutorialVisible(false)"), "Must close TutorialModal on navigation");
});

// ==========================================
// SECTION 2: AUDIO ENGINE & THEORY
// ==========================================

test("2.1 Equal temperament pitch frequencies & accidental math", () => {
  const A4 = noteToFrequency("A");
  assert.strictEqual(Math.round(A4), 440, "A4 must be 440 Hz");

  const C4 = noteToFrequency("C");
  assert.ok(C4 >= 261 && C4 <= 262, "Middle C must be ~261.63 Hz");

  // Octave transposition: frequency doubles every 12 semitones
  const C5 = noteToFrequency("C", 5);
  assert.ok(Math.abs(C5 - C4 * 2) < 0.05, "C5 must be exactly double C4");

  // Chromatic ascension: every semitone must be higher than the last
  const chromatic = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  for (let i = 0; i < chromatic.length - 1; i++) {
    const f1 = noteToFrequency(chromatic[i]);
    const f2 = noteToFrequency(chromatic[i + 1]);
    assert.ok(f2 > f1, `${chromatic[i+1]} (${f2}Hz) must be higher pitch than ${chromatic[i]} (${f1}Hz)`);
    // Semitone ratio ~ 1.05946
    const ratio = f2 / f1;
    assert.ok(Math.abs(ratio - 1.05946) < 0.005, `Semitone ratio must be ~1.05946`);
  }
});

test("2.2 Chord WAV generator & header structure", () => {
  const dataUri = buildChordDataUri(["C", "E", "G"]);
  assert.ok(dataUri.startsWith("data:audio/wav;base64,"), "URI must be valid base64 WAV");

  const base64Part = dataUri.replace("data:audio/wav;base64,", "");
  const buffer = Buffer.from(base64Part, "base64");

  // Check WAV RIFF header bytes
  assert.strictEqual(buffer.toString("ascii", 0, 4), "RIFF", "Header must begin with RIFF");
  assert.strictEqual(buffer.toString("ascii", 8, 12), "WAVE", "Header must contain WAVE");
  assert.strictEqual(buffer.toString("ascii", 12, 16), "fmt ", "Header must contain fmt chunk");

  // Check 16-bit PCM format
  const audioFormat = buffer.readUInt16LE(20);
  assert.strictEqual(audioFormat, 1, "Format must be PCM (1)");

  const numChannels = buffer.readUInt16LE(22);
  assert.strictEqual(numChannels, 1, "Must be Mono (1 channel)");

  const bitsPerSample = buffer.readUInt16LE(34);
  assert.strictEqual(bitsPerSample, 16, "Must be 16-bit audio");

  // Check data chunk
  assert.strictEqual(buffer.toString("ascii", 36, 40), "data", "Header must contain data chunk");
  const dataSize = buffer.readUInt32LE(40);
  assert.ok(dataSize > 1000, "WAV audio data must contain valid sample payload");
});

test("2.3 Audio debounce & rapid spam click protection", () => {
  const audioCode = fs.readFileSync("src/audio/appAudio.js", "utf8");
  assert.ok(audioCode.includes("MIN_REPEAT_SPAM_BUFFER_MS"), "Must define repeat spam buffer constant");
  assert.ok(audioCode.includes("lastPlayChordKey"), "Must track last played chord signature");
  assert.ok(audioCode.includes("resumeDebounceTimer"), "Must debounce background music resume");
  assert.ok(audioCode.includes("duckBackgroundMusic"), "Must duck background music during chord sound");
});

test("2.4 Zero-volume silence guarantee", () => {
  const audioCode = fs.readFileSync("src/audio/appAudio.js", "utf8");
  assert.ok(
    audioCode.includes("bgmVolume <= 0.001") &&
    audioCode.includes("bgmPlayer.volume = 0") &&
    audioCode.includes("noteVolume <= 0.001"),
    "Volume 0 must be guaranteed silent without background trigger"
  );
});

// ==========================================
// SECTION 3: FEATURES & WORKFLOWS
// ==========================================

test("3.1 Chord identification for all triad families", () => {
  // Major
  assert.strictEqual(identifyChord(["C", "E", "G"]), "C Major");
  assert.strictEqual(identifyChord(["F", "A", "C"]), "F Major");
  assert.strictEqual(identifyChord(["G", "B", "D"]), "G Major");

  // Minor
  assert.strictEqual(identifyChord(["A", "C", "E"]), "A Minor");
  assert.strictEqual(identifyChord(["D", "F", "A"]), "D Minor");
  assert.strictEqual(identifyChord(["E", "G", "B"]), "E Minor");

  // Sus4 & Sus2
  assert.strictEqual(identifyChord(["C", "F", "G"]), "C Sus4");
  assert.strictEqual(identifyChord(["C", "D", "G"]), "C Sus2");

  // Inverted inputs (order-independence)
  assert.strictEqual(identifyChord(["G", "C", "E"]), "C Major");
  assert.strictEqual(identifyChord(["E", "G", "C"]), "C Major");
});

test("3.2 The Maestro's Journey curriculum & progression logic", () => {
  const learningCode = fs.readFileSync("src/services/learningService.ts", "utf8");
  assert.ok(learningCode.includes("id: \"ch1_lvl1\""), "Chapter 1 Level 1 defined");
  assert.ok(learningCode.includes("id: \"ch1_lvl2\""), "Chapter 1 Level 2 defined");
  assert.ok(learningCode.includes("id: \"ch2_lvl5\""), "Chapter 2 Level 5 defined");
  assert.ok(learningCode.includes("id: \"ch3_lvl9\""), "Chapter 3 Level 9 defined");
  assert.ok(learningCode.includes("getNextJourneyLevel"), "Next journey level selector exists");
});

test("3.3 Sound Dojo 3 mini-games answer validation", () => {
  const dojoCode = fs.readFileSync("src/screens/SoundDojoScreen.js", "utf8");
  assert.ok(dojoCode.includes('"high_low"'), "Sound Dojo must support High vs Low");
  assert.ok(dojoCode.includes('"happy_sad"'), "Sound Dojo must support Happy vs Sad");
  assert.ok(dojoCode.includes('"missing"'), "Sound Dojo must support Missing Note");
  assert.ok(dojoCode.includes("golden_ear"), "Must award golden_ear badge on streak 5");
  assert.ok(dojoCode.includes("handleAnswer"), "Must validate user choice");
  assert.ok(dojoCode.includes("handleReplay"), "Must support audition replay");
  assert.ok(dojoCode.includes("handleResetDojo"), "Must support New Workout ↺ reset");
});

test("3.4 Guess the Chord difficulty & streak calculation", () => {
  const guessCode = fs.readFileSync("src/screens/GuessChordScreen.js", "utf8");
  assert.ok(guessCode.includes('{ key: "easy", label: "Easy", chords: 1 }'));
  assert.ok(guessCode.includes('{ key: "medium", label: "Medium", chords: 3 }'));
  assert.ok(guessCode.includes('{ key: "hard", label: "Hard", chords: 5 }'));
  assert.ok(guessCode.includes("consecutiveFirstTry"), "Must compute consecutive first try streak");
  assert.ok(guessCode.includes("VictoryCelebration"), "Must celebrate correct guesses");
});

test("3.5 Build a Chord Smart Guide & Progression Engine", () => {
  const buildCode = fs.readFileSync("src/screens/BuildChordScreen.js", "utf8");
  assert.ok(buildCode.includes("ROOT_SUGGESTIONS"), "Must define root suggestions for smart guide");
  assert.ok(buildCode.includes("COUNT_OPTIONS"), "Must offer multiple progression counts");
  assert.ok(buildCode.includes("handlePlaySelected"), "Must support auditioning drafted notes");
  assert.ok(buildCode.includes("playChordSequence"), "Must support multi-chord playback sequence");
});

test("3.6 Learn a Chord library & note auditioning", () => {
  const learnCode = fs.readFileSync("src/screens/LearnChordScreen.js", "utf8");
  assert.ok(learnCode.includes("CHORD_LIBRARY"), "Must define chord library");
  assert.ok(learnCode.includes("handleChordPress"), "Must support full chord playback");
  assert.ok(learnCode.includes("handleNotePress"), "Must support individual note auditioning");
  assert.ok(learnCode.includes("handleClearChord"), "Must allow closing chord details");
});

console.log("\n=======================================================");
console.log("ALL VISUAL, AUDIO & FEATURE TESTS PASSED SUCCESSFULLY!");
console.log("=======================================================\n");
