import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  identifyChord,
  CHORD_PATTERNS,
  sameNotes,
} from "../src/utils/musicTheory.js";
import {
  CHORD_LIBRARY,
  TIER_METADATA,
  findChordByNotes,
  findChordForJourneyLevel,
  getRelatedChords,
} from "../src/utils/chordLibrary.js";

test("4.1 7th Chords and Power 5th identification in musicTheory.js", () => {
  // Test Major 7th
  const cMaj7 = identifyChord(["C", "E", "G", "B"]);
  assert.strictEqual(cMaj7, "C Major 7th", "Must identify C Major 7th correctly");

  // Test Dominant 7th (with flat B♭)
  const c7 = identifyChord(["C", "E", "G", "B♭"]);
  assert.strictEqual(c7, "C Dominant 7th", "Must identify C Dominant 7th with flat correctly");

  // Test Minor 7th
  const aMin7 = identifyChord(["A", "C", "E", "G"]);
  assert.strictEqual(aMin7, "A Minor 7th", "Must identify A Minor 7th correctly");

  // Test Power 5th
  const cPower = identifyChord(["C", "G"]);
  assert.strictEqual(cPower, "C Power 5th", "Must identify C Power 5th correctly");

  // Verify patterns are registered
  const patternNames = CHORD_PATTERNS.map((p) => p.name);
  assert.ok(patternNames.includes("Major 7th"), "CHORD_PATTERNS must include Major 7th");
  assert.ok(patternNames.includes("Dominant 7th"), "CHORD_PATTERNS must include Dominant 7th");
  assert.ok(patternNames.includes("Minor 7th"), "CHORD_PATTERNS must include Minor 7th");
  assert.ok(patternNames.includes("Power 5th"), "CHORD_PATTERNS must include Power 5th");
});

test("4.2 Progressive 3-Tier Curriculum Structure in chordLibrary.js", () => {
  // Check 3 tier metadata definitions
  assert.ok(TIER_METADATA.foundations, "Must define foundations tier");
  assert.ok(TIER_METADATA.intermediate, "Must define intermediate tier");
  assert.ok(TIER_METADATA.advanced, "Must define advanced tier");

  // Check chords categorized in each tier
  const foundations = CHORD_LIBRARY.filter((c) => c.tier === "foundations");
  const intermediate = CHORD_LIBRARY.filter((c) => c.tier === "intermediate");
  const advanced = CHORD_LIBRARY.filter((c) => c.tier === "advanced");

  assert.ok(foundations.length >= 10, "Foundations tier must contain basic roots, 5ths, and triads");
  assert.ok(intermediate.length >= 8, "Intermediate tier must contain sus, dim, and aug chords");
  assert.ok(advanced.length >= 6, "Advanced tier must contain 7th harmonies");

  // Verify all chords have mood, concept, formula, degrees and notes
  for (const chord of CHORD_LIBRARY) {
    assert.ok(chord.root, `Chord must have root: ${JSON.stringify(chord)}`);
    assert.ok(chord.type, `Chord must have type: ${JSON.stringify(chord)}`);
    assert.ok(chord.formula, `Chord must have formula: ${chord.root} ${chord.type}`);
    assert.ok(chord.mood, `Chord must have emotional mood tag: ${chord.root} ${chord.type}`);
    assert.ok(chord.concept, `Chord must have concept explanation: ${chord.root} ${chord.type}`);
    assert.ok(Array.isArray(chord.notes) && chord.notes.length >= 2, `Chord must have valid notes: ${chord.root} ${chord.type}`);
    assert.ok(Array.isArray(chord.degrees) && chord.degrees.length === chord.notes.length, `Chord degrees must match note count: ${chord.root} ${chord.type}`);
  }
});

test("4.3 Bidirectional integration between Learn a Chord and Journey levels", () => {
  // Test finding chord for Journey levels
  const lvl2Chord = findChordForJourneyLevel("ch1_lvl2");
  assert.ok(lvl2Chord, "Must find chord for ch1_lvl2 (Power 5th)");
  assert.strictEqual(lvl2Chord.type, "Power (5th)");

  const lvl3Chord = findChordForJourneyLevel("ch1_lvl3");
  assert.ok(lvl3Chord, "Must find chord for ch1_lvl3 (C Major Triad)");
  assert.strictEqual(lvl3Chord.root, "C");
  assert.strictEqual(lvl3Chord.type, "Major");

  const lvl4Chord = findChordForJourneyLevel("ch1_lvl4");
  assert.ok(lvl4Chord, "Must find chord for ch1_lvl4 (A Minor Triad)");
  assert.strictEqual(lvl4Chord.root, "A");
  assert.strictEqual(lvl4Chord.type, "Minor");

  const lvl9Chord = findChordForJourneyLevel("ch3_lvl9");
  assert.ok(lvl9Chord, "Must find chord for ch3_lvl9 (Csus4)");
  assert.strictEqual(lvl9Chord.type, "Sus4");

  const lvl10Chord = findChordForJourneyLevel("ch3_lvl10");
  assert.ok(lvl10Chord, "Must find chord for ch3_lvl10 (Csus2)");
  assert.strictEqual(lvl10Chord.type, "Sus2");

  // Test findChordByNotes
  const foundByNotes = findChordByNotes(["C", "E", "G"]);
  assert.ok(foundByNotes);
  assert.strictEqual(foundByNotes.root, "C");
  assert.strictEqual(foundByNotes.type, "Major");
});

test("4.4 A/B comparison relations and pitch accuracy without accidental stripping", () => {
  // Verify related chords for C
  const cChords = getRelatedChords("C");
  const types = cChords.map((c) => c.type);
  assert.ok(types.includes("Major"), "Must include C Major");
  assert.ok(types.includes("Minor"), "Must include C Minor");
  assert.ok(types.includes("Sus4"), "Must include Csus4");
  assert.ok(types.includes("Sus2"), "Must include Csus2");
  assert.ok(types.includes("Dominant 7th"), "Must include C Dominant 7th");
  assert.ok(types.includes("Major 7th"), "Must include C Major 7th");

  // Verify LearnChordScreen does NOT strip sharps and flats
  const screenCode = fs.readFileSync("src/screens/LearnChordScreen.js", "utf8");
  assert.ok(
    !screenCode.includes(".replace(/[♭#]/g, '')"),
    "LearnChordScreen must NOT strip # or ♭ from playback notes!"
  );
  assert.ok(screenCode.includes("playChord(chord.notes)"), "Must pass raw notes to playChord for full chord");
  assert.ok(screenCode.includes("playChord([note])"), "Must pass raw note to playChord for individual note auditioning");
});

test("4.5 Interactive Arpeggio and Practice Mini-Quiz in LearnChordScreen", () => {
  const screenCode = fs.readFileSync("src/screens/LearnChordScreen.js", "utf8");

  // Arpeggiate / Strum support
  assert.ok(screenCode.includes("handleArpeggiate"), "Must implement handleArpeggiate");
  assert.ok(screenCode.includes("isArpeggiating"), "Must track isArpeggiating state");
  assert.ok(screenCode.includes("activeArpIndex"), "Must track activeArpIndex for visual feedback");
  assert.ok(screenCode.includes("arpeggioTimersRef"), "Must track and clean up arpeggio timers");

  // Practice Mini-Quiz support
  assert.ok(screenCode.includes("practiceMode"), "Must track practiceMode");
  assert.ok(screenCode.includes("practiceSelected"), "Must track practiceSelected keys");
  assert.ok(screenCode.includes("handleTogglePracticeNote"), "Must handle keyboard note tapping");
  assert.ok(screenCode.includes("sameNotes(nextSelected, selectedChord.notes)"), "Must validate notes with sameNotes");
  assert.ok(screenCode.includes("VictoryCelebration"), "Must trigger celebration sparkles on success");
  assert.ok(screenCode.includes("addXP(15)"), "Must award 15 XP on chord mastery");

  // Tier Tabs & Comparison
  assert.ok(screenCode.includes("TIER_METADATA"), "Must render tier metadata tabs");
  assert.ok(screenCode.includes("relatedChords"), "Must render A/B comparison pills");
  assert.ok(screenCode.includes("matchedJourneyLevel"), "Must render Journey lesson bridge card");
});

test("4.6 JourneyScreen connects seamlessly to Learn a Chord", () => {
  const journeyCode = fs.readFileSync("src/screens/JourneyScreen.js", "utf8");

  assert.ok(journeyCode.includes("handleStudyInLearnChord"), "Must implement handleStudyInLearnChord");
  assert.ok(journeyCode.includes("updateLearnChordSession"), "Must update learn chord session on jump");
  assert.ok(journeyCode.includes("studyChordBtn"), "Must provide button to study chord in Learn a Chord");
  assert.ok(journeyCode.includes("learnShortcutCard"), "Must provide map shortcut to Learn a Chord");
});
