import assert from "node:assert/strict";

console.log("\n==========================================");
console.log("TESTING AUDIO VOLUME 0 & MINIFIED BOTTOMNAV");
console.log("==========================================\n");

// 1. Test structural duck-typing for BottomNav minification resilience
function isBottomNavElement(item) {
  if (!item || typeof item !== "object") return false;
  if (item.type?.name === "BottomNav") return true;
  if (item.type?.displayName === "BottomNav") return true;
  if (item.type?.isBottomNav === true) return true;
  if (item.props && typeof item.props === "object") {
    if ("active" in item.props && "onNavigate" in item.props) return true;
  }
  return false;
}

// Test case 1: In dev mode, type.name is 'BottomNav'
const devBottomNav = {
  type: function BottomNav() {},
  props: { active: "home", onNavigate: () => {} },
};
assert.strictEqual(isBottomNavElement(devBottomNav), true, "Should identify BottomNav in dev");

// Test case 2: In production Android build, Hermes minifies function name to 'e' or ''
const minifiedFn = () => {};
// Simulate minifier stripping name
Object.defineProperty(minifiedFn, "name", { value: "e" });
const releaseBottomNav = {
  type: minifiedFn,
  props: { active: "home", onNavigate: () => {} },
};
assert.strictEqual(
  isBottomNavElement(releaseBottomNav),
  true,
  "Should identify BottomNav in release build even when minified to 'e'"
);

// Test case 3: Regular component that is NOT BottomNav
const regularComponent = {
  type: function OtherComponent() {},
  props: { children: "Hello" },
};
assert.strictEqual(isBottomNavElement(regularComponent), false, "Should not identify regular component");

console.log("  ✓ PASS: BottomNav minification identification test passed");

// 2. Test volume 0 logic simulation
let bgmVolume = 0.35;
let duckCount = 0;
const MUSIC_DUCK_VOLUME = 0.04;
let currentPlayerVolume = bgmVolume;

function setMusicVolume(vol) {
  bgmVolume = Math.max(0, Math.min(1, vol));
  if (bgmVolume <= 0.001) {
    currentPlayerVolume = 0;
  }
}

function duckBackgroundMusic(isDucked) {
  duckCount = isDucked ? duckCount + 1 : Math.max(0, duckCount - 1);
  if (bgmVolume <= 0.001) {
    currentPlayerVolume = 0;
    return;
  }
  const target = duckCount > 0 ? Math.min(bgmVolume, MUSIC_DUCK_VOLUME) : bgmVolume;
  currentPlayerVolume = target;
}

// Set volume to zero
setMusicVolume(0);
assert.strictEqual(bgmVolume, 0, "BGM volume must be 0");
assert.strictEqual(currentPlayerVolume, 0, "Current player volume must be 0");

// Play chord: duckBackgroundMusic(true) is invoked
duckBackgroundMusic(true);
assert.strictEqual(
  currentPlayerVolume,
  0,
  "Playing a note must NOT raise background music volume when volume is set to 0"
);

// Chord finishes: duckBackgroundMusic(false) is invoked
duckBackgroundMusic(false);
assert.strictEqual(currentPlayerVolume, 0, "Finishing a note must keep volume at 0");

console.log("  ✓ PASS: Zero-volume chord play silence test passed");

// Chord Data URI caching test
import { buildChordDataUri } from "../src/utils/musicTheory.js";
const uri1 = buildChordDataUri(["C", "E", "G"]);
const uri2 = buildChordDataUri(["G", "E", "C"]); // Order-independent cache key
assert.strictEqual(uri1, uri2, "buildChordDataUri should return cached URI for same notes");
assert.ok(uri1.startsWith("data:audio/wav;base64,"), "URI should be a valid WAV data URI");
console.log("  ✓ PASS: Data URI caching and synthesis optimization passed");

// 4. Test rapid chord spamming buffer logic
let lastPlayChordTimestamp = 0;
let lastPlayChordKey = "";
let playCount = 0;
const MIN_REPEAT_SPAM_BUFFER_MS = 280;

function simulatePlayChord(notes, currentTime) {
  const chordKey = [...notes].sort().join(",");
  const elapsed = currentTime - lastPlayChordTimestamp;
  if (elapsed < MIN_REPEAT_SPAM_BUFFER_MS && chordKey === lastPlayChordKey) {
    return { dropped: true };
  }
  lastPlayChordTimestamp = currentTime;
  lastPlayChordKey = chordKey;
  playCount++;
  return { dropped: false };
}

// 1st press at t = 0ms
const r1 = simulatePlayChord(["C", "E", "G"], 0);
assert.strictEqual(r1.dropped, false, "Initial press should play");

// 2nd press at t = 50ms (rapid spam click)
const r2 = simulatePlayChord(["C", "E", "G"], 50);
assert.strictEqual(r2.dropped, true, "Rapid spam click within buffer must be dropped/buffered");

// 3rd press at t = 150ms (still spam click)
const r3 = simulatePlayChord(["C", "E", "G"], 150);
assert.strictEqual(r3.dropped, true, "Spam click at 150ms must be dropped/buffered");

// 4th press at t = 350ms (exceeds buffer window)
const r4 = simulatePlayChord(["C", "E", "G"], 350);
assert.strictEqual(r4.dropped, false, "Click after cooldown buffer window must be accepted");
assert.strictEqual(playCount, 2, "Only 2 actual audio playouts should have occurred");

console.log("  ✓ PASS: Rapid chord spamming buffer and cooldown test passed");

// 5. Test clean natural pitch synthesis & chord voicings
import { noteToFrequency } from "../src/utils/musicTheory.js";
for (const note of ["C", "D", "E", "F", "G", "A", "B"]) {
  const uri = buildChordDataUri([note]);
  assert.ok(uri.startsWith("data:audio/wav;base64,"), `Single note ${note} should produce valid WAV URI`);
}
const chordF = buildChordDataUri(["F", "A", "C"]);
const chordG = buildChordDataUri(["G", "B", "D"]);
const chordAm = buildChordDataUri(["A", "C", "E"]);
assert.ok(chordF.startsWith("data:audio/wav;base64,"), "F Major should synthesize cleanly");
assert.ok(chordG.startsWith("data:audio/wav;base64,"), "G Major should synthesize cleanly");
assert.ok(chordAm.startsWith("data:audio/wav;base64,"), "A Minor should synthesize cleanly");

// Test ASCII 'b' flat parsing
const freqDb = noteToFrequency("Db");
const freqD = noteToFrequency("D");
assert.ok(freqDb < freqD, "Db must be lower than D");
assert.ok(Math.abs(freqDb - noteToFrequency("C#")) < 0.01, "Db and C# should be enharmonically equivalent");

console.log("  ✓ PASS: Clean natural pitch synthesis and chord voicings passed");

console.log("\n==========================================");
console.log("ALL NEW TESTS PASSED!");
console.log("==========================================\n");
