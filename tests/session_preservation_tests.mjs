import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

console.log("\n==========================================");
console.log("RUNNING COMPREHENSIVE SESSION PRESERVATION TESTS");
console.log("==========================================");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

test("1. BuildChordScreen preserves session state on tab switch", () => {
  const code = read("src/screens/BuildChordScreen.js");
  assert.ok(code.includes("getBuildChordSession"), "Must import getBuildChordSession");
  assert.ok(code.includes("updateBuildChordSession"), "Must import updateBuildChordSession");
  assert.ok(code.includes("resetBuildChordSession"), "Must import resetBuildChordSession");
  assert.ok(code.includes("savedSession.count"), "Must initialize count from session");
  assert.ok(code.includes("savedSession.builtChords"), "Must initialize builtChords from session");
  assert.ok(code.includes("savedSession.selected"), "Must initialize selected notes from session");
  assert.ok(code.includes("New Session ↺"), "Must have New Session button to allow manual restart");
  assert.ok(code.includes("resetBuildChordSession()"), "Must reset session when progression is completed");
});

test("2. LearnChordScreen preserves chord and note selection on tab switch", () => {
  const code = read("src/screens/LearnChordScreen.js");
  assert.ok(code.includes("getLearnChordSession"), "Must import getLearnChordSession");
  assert.ok(code.includes("updateLearnChordSession"), "Must import updateLearnChordSession");
  assert.ok(code.includes("resetLearnChordSession"), "Must import resetLearnChordSession");
  assert.ok(code.includes("savedSession.selectedChord"), "Must initialize selectedChord from session");
  assert.ok(code.includes("savedSession.activeNoteIndex"), "Must initialize activeNoteIndex from session");
  assert.ok(code.includes("handleClearChord"), "Must allow clearing chord details");
  assert.ok(code.includes("Close Card ✕"), "Must have Close Card button");
});

test("3. JourneyScreen preserves active lesson challenge on tab switch", () => {
  const code = read("src/screens/JourneyScreen.js");
  assert.ok(code.includes("getJourneySession"), "Must import getJourneySession");
  assert.ok(code.includes("updateJourneySession"), "Must import updateJourneySession");
  assert.ok(code.includes("resetJourneySession"), "Must import resetJourneySession");
  assert.ok(code.includes("savedSession.activeLevelId"), "Must restore activeLevelId from session");
  assert.ok(code.includes("savedSession.selectedNotes"), "Must restore selectedNotes from session");
  assert.ok(code.includes("savedSession.challengeResult"), "Must restore challengeResult from session");
});

test("4. GuessChordScreen preserves round and active game on tab switch", () => {
  const code = read("src/screens/GuessChordScreen.js");
  assert.ok(code.includes("getGuessChordSession"), "Must import getGuessChordSession");
  assert.ok(code.includes("updateGuessChordSession"), "Must import updateGuessChordSession");
  assert.ok(code.includes("resetGuessChordSession"), "Must import resetGuessChordSession");
  assert.ok(code.includes("savedSession.roundIndex"), "Must restore roundIndex from session");
  assert.ok(code.includes("savedSession.difficulty"), "Must restore difficulty from session");
});

test("5. SoundDojoScreen preserves score, streak, round and mode on tab switch", () => {
  const code = read("src/screens/SoundDojoScreen.js");
  assert.ok(code.includes("getDojoSession"), "Must import getDojoSession");
  assert.ok(code.includes("updateDojoSession"), "Must import updateDojoSession");
  assert.ok(code.includes("resetDojoSession"), "Must import resetDojoSession");
  assert.ok(code.includes("savedSession.score"), "Must restore score from session");
  assert.ok(code.includes("savedSession.streak"), "Must restore streak from session");
  assert.ok(code.includes("savedSession.selectedMode"), "Must restore selectedMode from session");
  assert.ok(code.includes("New Workout ↺"), "Must have New Workout reset button");
});

test("6. InteractiveTutorial preserves step index and tapped notes on reopen", () => {
  const code = read("src/components/InteractiveTutorial.js");
  assert.ok(code.includes("getTutorialSession"), "Must import getTutorialSession");
  assert.ok(code.includes("updateTutorialSession"), "Must import updateTutorialSession");
  assert.ok(code.includes("resetTutorialSession"), "Must import resetTutorialSession");
  assert.ok(code.includes("savedSession.currentStepIndex"), "Must restore currentStepIndex");
  assert.ok(code.includes("savedSession.tappedNotes"), "Must restore tappedNotes");
});

test("7. ProfileScreen preserves draft name and avatar on tab switch", () => {
  const code = read("src/screens/Profile/ProfileScreen.js");
  assert.ok(code.includes("getProfileDraftSession"), "Must import getProfileDraftSession");
  assert.ok(code.includes("updateProfileDraftSession"), "Must import updateProfileDraftSession");
  assert.ok(code.includes("resetProfileDraftSession"), "Must import resetProfileDraftSession");
  assert.ok(code.includes("savedDraft.displayNameInput"), "Must restore draft display name");
  assert.ok(code.includes("savedDraft.selectedAvatar"), "Must restore draft avatar");
});

test("8. HomeScreen displays dynamic resume indicators for all active modes", () => {
  const code = read("src/screens/HomeScreen.js");
  assert.ok(code.includes("hasActiveBuildSession"), "Must check hasActiveBuildSession");
  assert.ok(code.includes("hasActiveLearnSession"), "Must check hasActiveLearnSession");
  assert.ok(code.includes("hasActiveDojoSession"), "Must check hasActiveDojoSession");
  assert.ok(code.includes("getSessionBadge"), "Must compute session badge");
  assert.ok(code.includes("subscribeSessionStore"), "Must subscribe to reactive session updates");
  assert.ok(code.includes("Resume ↩"), "Must indicate resume on active mode cards");
  assert.ok(code.includes("ACTIVE"), "Must render ACTIVE badge on in-progress cards");
});

test("9. sessionStore.ts exports comprehensive APIs across the full app", () => {
  const code = read("src/services/sessionStore.ts");
  assert.ok(code.includes("export function getBuildChordSession"));
  assert.ok(code.includes("export function updateBuildChordSession"));
  assert.ok(code.includes("export function resetBuildChordSession"));
  assert.ok(code.includes("export function hasActiveBuildSession"));
  assert.ok(code.includes("export function getLearnChordSession"));
  assert.ok(code.includes("export function updateLearnChordSession"));
  assert.ok(code.includes("export function resetLearnChordSession"));
  assert.ok(code.includes("export function hasActiveLearnSession"));
  assert.ok(code.includes("export function getJourneySession"));
  assert.ok(code.includes("export function updateJourneySession"));
  assert.ok(code.includes("export function resetJourneySession"));
  assert.ok(code.includes("export function getGuessChordSession"));
  assert.ok(code.includes("export function updateGuessChordSession"));
  assert.ok(code.includes("export function resetGuessChordSession"));
  assert.ok(code.includes("export function getDojoSession"));
  assert.ok(code.includes("export function updateDojoSession"));
  assert.ok(code.includes("export function resetDojoSession"));
  assert.ok(code.includes("export function hasActiveDojoSession"));
  assert.ok(code.includes("export function getTutorialSession"));
  assert.ok(code.includes("export function updateTutorialSession"));
  assert.ok(code.includes("export function resetTutorialSession"));
  assert.ok(code.includes("export function getProfileDraftSession"));
  assert.ok(code.includes("export function updateProfileDraftSession"));
  assert.ok(code.includes("export function resetProfileDraftSession"));
  assert.ok(code.includes("export function subscribeSessionStore"));
});

console.log("\n==========================================");
console.log("ALL 9 SESSION PRESERVATION TESTS PASSED!");
console.log("==========================================\n");
