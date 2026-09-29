// The menu music: a 30-second, seamlessly loopable, upbeat lofi groove,
// generated in code so no bundled audio file is needed. Everything is
// deterministic (seeded), which is what makes the seam wrap perfectly: the
// loop is bit-identical on every pass.
//
// Layers, all continuous across the loop point:
//   - warm 7th-chord pad, one chord per bar (with secondary dominants and a
//     borrowed iv for colour), window envelopes that wrap the seam
//   - bouncy root/fifth bass on every beat
//   - driving eighth-note arpeggio climbing through the chord tones
//   - groove: kick on beats 1 & 3, noise clap on 2 & 4, offbeat hats
//   - sparse pentatonic melody plucks and quiet vinyl crackle (seeded)

import { encodeWavBase64 } from "../utils/musicTheory";

export const MUSIC_SAMPLE_RATE = 16000; // deliberately lo-fi bandwidth
export const LOOP_SECONDS = 30;
const LOOP_BPM = 96; // 12 bars of 4 beats at 96 BPM = exactly 30 seconds
const BEAT_SECONDS = 60 / LOOP_BPM;
const BAR_SECONDS = 4 * BEAT_SECONDS;
const EIGHTH_SECONDS = BEAT_SECONDS / 2;
const PAD_FADE_SECONDS = 0.35; // cross-tail so neighbouring chords overlap
const MUSIC_TARGET_PEAK = 0.5;

const NOTE_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Supports the accidental colour notes ("G#", "Ab", ...) the progression uses.
function noteFreq(name, octave) {
  let semitone = NOTE_SEMITONES[name[0]];
  if (name.includes("#")) semitone += 1;
  else if (name.includes("b")) semitone -= 1;
  return 440 * Math.pow(2, (semitone - 9 + (octave - 4) * 12) / 12);
}

// 12 bars: the secondary dominants (E7 -> vi, A7 -> ii, D7 -> V) keep it
// moving, the Bm7 detour adds colour, and the borrowed Fm6 "money chord"
// pulls the final G7 back to the opening Cmaj7 across the loop seam.
const LOFI_CHORDS = [
  [{ n: "C", o: 4 }, { n: "E", o: 4 }, { n: "G", o: 4 }, { n: "B", o: 4 }],   // Cmaj7
  [{ n: "E", o: 3 }, { n: "G#", o: 3 }, { n: "B", o: 3 }, { n: "D", o: 4 }],  // E7
  [{ n: "A", o: 3 }, { n: "C", o: 4 }, { n: "E", o: 4 }, { n: "G", o: 4 }],   // Am7
  [{ n: "D", o: 3 }, { n: "F#", o: 3 }, { n: "A", o: 3 }, { n: "C", o: 4 }],  // D7
  [{ n: "D", o: 3 }, { n: "F", o: 3 }, { n: "A", o: 3 }, { n: "C", o: 4 }],   // Dm7
  [{ n: "G", o: 2 }, { n: "B", o: 3 }, { n: "D", o: 4 }, { n: "F", o: 4 }],   // G7
  [{ n: "C", o: 4 }, { n: "E", o: 4 }, { n: "G", o: 4 }, { n: "B", o: 4 }],   // Cmaj7
  [{ n: "A", o: 3 }, { n: "C#", o: 4 }, { n: "E", o: 4 }, { n: "G", o: 4 }],  // A7
  [{ n: "D", o: 3 }, { n: "F", o: 3 }, { n: "A", o: 3 }, { n: "C", o: 4 }],   // Dm7
  [{ n: "B", o: 3 }, { n: "D", o: 4 }, { n: "F#", o: 4 }, { n: "A", o: 4 }],  // Bm7
  [{ n: "F", o: 3 }, { n: "Ab", o: 3 }, { n: "C", o: 4 }, { n: "D", o: 4 }],  // Fm6
  [{ n: "G", o: 2 }, { n: "B", o: 3 }, { n: "D", o: 4 }, { n: "F", o: 4 }],   // G7
];

// Pentatonic pool for the sparse melody plucks.
const MELODY_POOL = [
  { n: "C", o: 6 }, { n: "A", o: 5 }, { n: "G", o: 5 },
  { n: "E", o: 5 }, { n: "D", o: 5 }, { n: "G", o: 6 },
];

// Tiny seeded PRNG: melody placement and vinyl crackle must come out
// identically on every generation pass for the loop to stay seamless.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Renders the whole 30-second groove as 16-bit PCM. Every event uses wrapped
// sample indices, so anything sounding near the loop point continues into the
// loop's beginning — that is what removes the click at the seam.
export function buildLoopPcm() {
  const totalSamples = Math.floor(MUSIC_SAMPLE_RATE * LOOP_SECONDS);
  const buffer = new Float32Array(totalSamples);
  const write = (index, value) => {
    buffer[((index % totalSamples) + totalSamples) % totalSamples] += value;
  };

  // Warm pad: one chord per bar, raised-cosine window that wraps the seam.
  const padWindowSeconds = BAR_SECONDS + 2 * PAD_FADE_SECONDS;
  LOFI_CHORDS.forEach((chord, bar) => {
    const startSample = Math.round((bar * BAR_SECONDS - PAD_FADE_SECONDS) * MUSIC_SAMPLE_RATE);
    const windowSamples = Math.round(padWindowSeconds * MUSIC_SAMPLE_RATE);
    for (let j = 0; j < windowSamples; j++) {
      const i = startSample + j;
      const local = j / MUSIC_SAMPLE_RATE;
      const envelope = Math.sin((Math.PI * local) / padWindowSeconds) ** 2;
      // slow tape wobble on the pitch, phase-locked to the chord window
      const wow = 1 + 0.0012 * Math.sin(2 * Math.PI * (local / padWindowSeconds) * 2 + bar);
      for (const { n, o } of chord) {
        const f = noteFreq(n, o) * wow;
        write(i, Math.sin(2 * Math.PI * f * local) * envelope * 0.38);
        write(i, Math.sin(2 * Math.PI * f * 1.004 * local) * envelope * 0.18);
        write(i, Math.sin(2 * Math.PI * f * 2 * local) * envelope * 0.07);
      }
    }
  });

  // Bouncy bass: root and fifth alternating on every beat, punchy decay.
  LOFI_CHORDS.forEach((chord, bar) => {
    for (let beat = 0; beat < 4; beat++) {
      const note = beat % 2 === 0 ? chord[0] : chord[2];
      const startSample = Math.round((bar * BAR_SECONDS + beat * BEAT_SECONDS) * MUSIC_SAMPLE_RATE);
      const durationSamples = Math.floor(BEAT_SECONDS * 0.85 * MUSIC_SAMPLE_RATE);
      const f = noteFreq(note.n, Math.max(2, note.o - 1));
      for (let j = 0; j < durationSamples; j++) {
        const local = j / MUSIC_SAMPLE_RATE;
        const envelope = Math.min(1, local / 0.006) * Math.exp(-local * 3.4);
        write(startSample + j, Math.sin(2 * Math.PI * f * local) * envelope * 0.34);
      }
    }
  });

  // Driving arpeggio: eighth notes through the chord tones (1-3-2-4 shape),
  // the second half of every bar an octave up for lift.
  const ARP_ORDER = [0, 2, 1, 3];
  LOFI_CHORDS.forEach((chord, bar) => {
    for (let step = 0; step < 8; step++) {
      const tone = chord[ARP_ORDER[step % 4]];
      const lift = step >= 4 ? 2 : 1;
      const startSample = Math.round((bar * BAR_SECONDS + step * EIGHTH_SECONDS) * MUSIC_SAMPLE_RATE);
      const durationSamples = Math.floor(0.26 * MUSIC_SAMPLE_RATE);
      const f = noteFreq(tone.n, tone.o) * lift;
      for (let j = 0; j < durationSamples; j++) {
        const local = j / MUSIC_SAMPLE_RATE;
        const envelope = Math.min(1, local / 0.004) * Math.exp(-local * 9);
        write(
          startSample + j,
          (Math.sin(2 * Math.PI * f * local) + 0.3 * Math.sin(4 * Math.PI * f * local)) * envelope * 0.2
        );
      }
    }
  });

  // Groove: kick on beats 1 & 3, clap on 2 & 4, hat on every offbeat eighth.
  const rngHat = mulberry32(0x68617431); // "hat1"
  LOFI_CHORDS.forEach((_chord, bar) => {
    for (let beat = 0; beat < 4; beat++) {
      const beatStart = Math.round((bar * BAR_SECONDS + beat * BEAT_SECONDS) * MUSIC_SAMPLE_RATE);
      if (beat % 2 === 0) {
        // kick: short pitch-dropping thump
        let phase = 0;
        const durationSamples = Math.floor(0.2 * MUSIC_SAMPLE_RATE);
        for (let j = 0; j < durationSamples; j++) {
          const local = j / MUSIC_SAMPLE_RATE;
          const f = 42 + 95 * Math.exp(-local * 26);
          phase += (2 * Math.PI * f) / MUSIC_SAMPLE_RATE;
          write(beatStart + j, Math.sin(phase) * Math.exp(-local * 16) * 0.42);
        }
      } else {
        // clap: short noise burst
        const durationSamples = Math.floor(0.13 * MUSIC_SAMPLE_RATE);
        for (let j = 0; j < durationSamples; j++) {
          const local = j / MUSIC_SAMPLE_RATE;
          write(beatStart + j, (rngHat() * 2 - 1) * Math.exp(-local * 26) * 0.12);
        }
      }
      // offbeat hat tick keeps the eighth-note drive going
      const hatStart = Math.round((bar * BAR_SECONDS + (beat + 0.5) * BEAT_SECONDS) * MUSIC_SAMPLE_RATE);
      const hatSamples = Math.floor(0.02 * MUSIC_SAMPLE_RATE);
      for (let j = 0; j < hatSamples; j++) {
        write(hatStart + j, (rngHat() * 2 - 1) * Math.exp((-j / MUSIC_SAMPLE_RATE) * 160) * 0.05);
      }
    }
  });

  // Sparse melody plucks floating over the groove.
  const rngMelody = mulberry32(0x4d555331); // "MUS1"
  LOFI_CHORDS.forEach((_chord, bar) => {
    const plucks = rngMelody() < 0.25 ? 1 : 2;
    for (let p = 0; p < plucks; p++) {
      const note = MELODY_POOL[Math.floor(rngMelody() * MELODY_POOL.length)];
      const startSample = Math.round((bar * BAR_SECONDS + rngMelody() * (BAR_SECONDS - 1)) * MUSIC_SAMPLE_RATE);
      const durationSamples = Math.floor(1.1 * MUSIC_SAMPLE_RATE);
      const f = noteFreq(note.n, note.o);
      for (let j = 0; j < durationSamples; j++) {
        const local = j / MUSIC_SAMPLE_RATE;
        const envelope = Math.min(1, local / 0.005) * Math.exp(-local * 3.4);
        write(startSample + j, Math.sin(2 * Math.PI * f * local) * envelope * 0.14);
      }
    }
  });

  // Vinyl crackle: quiet, deterministic ticks.
  const rngCrackle = mulberry32(0x63726163); // "crac"
  const ticks = Math.floor(LOOP_SECONDS * 4);
  for (let t = 0; t < ticks; t++) {
    const startSample = Math.floor(rngCrackle() * totalSamples);
    const tickSamples = 2 + Math.floor(rngCrackle() * 5);
    const amplitude = 0.012 + rngCrackle() * 0.025;
    for (let j = 0; j < tickSamples; j++) {
      write(startSample + j, (rngCrackle() * 2 - 1) * amplitude);
    }
  }

  // Normalize to a comfortable background level.
  let peak = 0;
  for (let i = 0; i < totalSamples; i++) {
    const abs = Math.abs(buffer[i]);
    if (abs > peak) peak = abs;
  }
  const scale = peak > 0 ? MUSIC_TARGET_PEAK / peak : 0;
  const pcm = new Int16Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    pcm[i] = Math.round(buffer[i] * scale * 32767);
  }
  return pcm;
}

let cachedUri = null;

export function getMenuMusicUri() {
  if (!cachedUri) {
    cachedUri = `data:audio/wav;base64,${encodeWavBase64(buildLoopPcm(), MUSIC_SAMPLE_RATE)}`;
  }
  return cachedUri;
}

// Warms the loop up ahead of time — called while the intro plays so the menu
// never pays the synthesis cost on arrival.
export function primeMenuMusic() {
  try {
    getMenuMusicUri();
  } catch (err) {
    // surfaced when playback is attempted
  }
}
