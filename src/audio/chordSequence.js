import { playChord, stopChord } from "./appAudio";

// Sequential chord playback, shared by the Build a Chord workspace and the
// Chord Result Screen: a progression is always performed strictly linearly —
//
//   chord 1 --- 0.5s pause --- chord 2 --- 0.5s pause --- chord 3 ...
//
// Every sample is awaited before the next one starts, so no two chords ever
// overlap, and the waiting is plain asynchronous timing, so the UI keeps
// rendering (chips lighting up, rows highlighting) the whole time.

// The pause inserted between two chords of a sequence.
export const CHORD_SEQUENCE_GAP_MS = 500;

// Reusable asynchronous pause. `await delay()` is the standard 0.5s gap
// between chords; pass a value to pause for any other duration.
export function delay(ms = CHORD_SEQUENCE_GAP_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A progression entry is either a built chord ({ notes, chordName }) or a
// bare note array; both shapes are accepted.
function notesOf(entry) {
  if (Array.isArray(entry)) return entry;
  return (entry && entry.notes) || [];
}

// Bumped by every new sequence and by stopChordSequence(); a running loop
// drops out as soon as its own id stops being the current one.
let runId = 0;

// Cancels the progression currently playing, if any. Safe to call at any time
// (leaving a screen, starting a different playback): the loop stops before the
// next chord and the chord still sounding is cut off, so nothing keeps playing
// behind the screen the player moved on to.
export function stopChordSequence() {
  runId += 1;
  stopChord();
}

// Plays `chords` in strict linear order, awaiting each sample and then the
// 0.5s gap before the next chord starts. `onChord(index)` is called as each
// chord begins, so the caller can render the currently sounding chord.
//
// A run ends early when either
//   - `isCancelled()` starts returning true — the caller's own screen went
//     away, which is instance-scoped and can never affect another screen, or
//   - stopChordSequence() is called — an explicit "that playback is over".
// Resolves `true` when the whole progression played out, `false` when it was
// cancelled or there was nothing to play.
export async function playChordSequence(
  chords,
  { onChord, isCancelled, gapMs = CHORD_SEQUENCE_GAP_MS } = {}
) {
  const progression = (chords || []).map(notesOf).filter((notes) => notes.length > 0);
  if (progression.length === 0) return false;

  const cancelled = () => (isCancelled && isCancelled()) || false;
  const id = (runId += 1);

  for (let i = 0; i < progression.length; i++) {
    if (id !== runId || cancelled()) return false;
    if (onChord) onChord(i);

    await playChord(progression[i]); // the chord sounds...
    if (id !== runId || cancelled()) return false;

    if (i < progression.length - 1) await delay(gapMs); // ...then the pause
  }
  return true;
}
