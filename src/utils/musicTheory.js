import { createAudioPlayer } from "expo-audio";

// Chord detection logic is plain JS and identical to the web version -
// nothing here depends on the browser.

export const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const CHORD_PATTERNS = [
  { name: "Major", intervals: [0, 4, 7] },
  { name: "Minor", intervals: [0, 3, 7] },
  { name: "Diminished", intervals: [0, 3, 6] },
  { name: "Augmented", intervals: [0, 4, 8] },
  { name: "Sus2", intervals: [0, 2, 7] },
  { name: "Sus4", intervals: [0, 5, 7] },
];

export function noteToFrequency(note, octave = 4) {
  const A4 = 440;
  const semitoneFromC = SEMITONES[note];
  const semitoneFromA4 = semitoneFromC - 9 + (octave - 4) * 12;
  return A4 * Math.pow(2, semitoneFromA4 / 12);
}

export function identifyChord(notes) {
  if (!notes || notes.length < 2) return null;
  const unique = [...new Set(notes)];
  const semitoneOf = (n) => SEMITONES[n];

  for (const root of unique) {
    const relative = unique
      .map((n) => (semitoneOf(n) - semitoneOf(root) + 12) % 12)
      .sort((a, b) => a - b);
    for (const pattern of CHORD_PATTERNS) {
      if (arraysMatch(relative, pattern.intervals)) {
        return `${root} ${pattern.name}`;
      }
    }
  }
  return `${unique.join(" + ")} (no standard match)`;
}

function arraysMatch(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// ---------- Audio playback ----------
// React Native has no Web Audio API / oscillators, so instead we generate
// a short WAV file in memory (raw PCM sine waves summed together) and play
// it back with expo-av. No sound files or extra assets needed.

const SAMPLE_RATE = 22050;
const DURATION_SECONDS = 1.1;

function buildChordWavBase64(notes) {
  const numSamples = Math.floor(SAMPLE_RATE * DURATION_SECONDS);
  const pcm = new Int16Array(numSamples);
  const freqs = notes.map((n) => noteToFrequency(n));

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // simple fade in/out envelope so notes don't click at the edges
    const fadeIn = Math.min(1, t / 0.02);
    const fadeOut = Math.min(1, (DURATION_SECONDS - t) / 0.25);
    const envelope = Math.min(fadeIn, fadeOut);

    let sample = 0;
    for (const f of freqs) {
      sample += Math.sin(2 * Math.PI * f * t);
    }
    sample = (sample / freqs.length) * envelope * 0.3; // keep headroom
    pcm[i] = Math.max(-1, Math.min(1, sample)) * 32767;
  }

  const wavBytes = pcmToWavBytes(pcm, SAMPLE_RATE);
  return bytesToBase64(wavBytes);
}

function pcmToWavBytes(pcm, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i++, offset += 2) {
    view.setInt16(offset, pcm[i], true);
  }

  return new Uint8Array(buffer);
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64(bytes) {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    result += BASE64_CHARS[b1 >> 2];
    result += BASE64_CHARS[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < bytes.length ? BASE64_CHARS[((b2 & 15) << 2) | (b3 >> 6)] : "=";
    result += i + 2 < bytes.length ? BASE64_CHARS[b3 & 63] : "=";
  }
  return result;
}

// Plays the given notes together as a chord.
export function playNotes(notes) {
  if (!notes || notes.length === 0) return;
  try {
    const base64 = buildChordWavBase64(notes);
    const uri = `data:audio/wav;base64,${base64}`;
    const player = createAudioPlayer({ uri });
    player.play();

    // Release the player a little after the clip ends - no native status
    // listener needed for a one-shot sound this short.
    setTimeout(() => {
      player.remove();
    }, (DURATION_SECONDS + 0.3) * 1000);
  } catch (err) {
    console.warn("Playback failed:", err);
  }
}