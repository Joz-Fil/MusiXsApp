import * as Speech from "expo-speech";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { buildChordDataUri, CHORD_DURATION_SECONDS } from "../utils/musicTheory";
import { getMenuMusicUri, primeMenuMusic } from "./lofiLoop";

export const TAGLINE = "Learn music theory by touch, not textbook.";

// The menu loop dips to this while a chord sample plays, so the chord's
// tones stay clearly audible above it.
const MUSIC_DUCK_VOLUME = 0.04;
const DUCK_FADE_MS = 200;
const RESUME_FADE_MS = 450;

const MUSIC_VOLUME_DEFAULT = 0.35;

// The menu music itself lives in ./lofiLoop — an upbeat 30-second lofi
// groove generated in code. Its primeMenuMusic is re-exported here so the
// AudioContext reaches every audio control through this one surface.
export { primeMenuMusic };

let bgmPlayer = null;
let bgmVolume = MUSIC_VOLUME_DEFAULT;
let bgmWanted = false; // startMenuMusic has been called; music plays continuously
let duckCount = 0; // overlapping chord sounds each hold one duck
let volumeFadeTimer = null;

async function ensureAudioMode() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    });
  } catch (err) {
    console.warn("Audio mode setup failed:", err);
  }
}

function playBgm() {
  try {
    if (!bgmPlayer) {
      bgmPlayer = createAudioPlayer({ uri: getMenuMusicUri() });
      bgmPlayer.loop = true;
      bgmPlayer.volume = bgmVolume;
    }
    bgmPlayer.play();
  } catch (err) {
    console.warn("Menu music failed:", err);
  }
}

// Narration: a bundled voice recording (assets/tts-audio.mp3) plays the
// tagline. The device TTS voice below is kept only as a fallback for the
// unlikely case the recording can't play.
const NARRATION_SOURCE = require("../../assets/tts-audio.mp3");
let narrationPlayer = null;

function getNarrationPlayer() {
  if (!narrationPlayer) {
    narrationPlayer = createAudioPlayer(NARRATION_SOURCE);
    narrationPlayer.volume = 1.0;
  }
  return narrationPlayer;
}

export async function speakTagline() {
  try {
    const player = getNarrationPlayer();
    try {
      await player.seekTo(0); // restart cleanly if the intro is ever replayed
    } catch (err) {
      // not seekable yet — a fresh player starts at 0 anyway
    }
    player.play();
  } catch (err) {
    console.warn("Narration audio failed; falling back to speech:", err);
    await speakTaglineWithTTS();
  }
}

// Fallback voiceover: prefers a female English system voice (explicit gender
// flag first, then known female names/keywords across iOS, Android and web),
// and falls back to a slightly raised pitch when the device has no matching
// voice. Speech.stop() first so a re-trigger can never overlap itself.
const FEMALE_VOICE_KEYWORDS = [
  "samantha", "karen", "moira", "fiona", "victoria",
  "tessa", "ava", "allison", "susan", "zoe", "zira",
  "hazel", "serena", "female",
];

const speakTaglineWithTTS = async () => {
  try {
    const availableVoices = await Speech.getAvailableVoicesAsync();

    // 1. Filter for English voices
    const englishVoices = availableVoices.filter(
      (v) => v.language && v.language.toLowerCase().startsWith("en")
    );

    // 2. Find a matching female voice
    const femaleVoice = englishVoices.find((voice) => {
      // Check explicit gender property if provided by platform/web
      if (voice.gender && String(voice.gender).toLowerCase() === "female") {
        return true;
      }
      const nameLower = (voice.name || "").toLowerCase();
      const idLower = (voice.identifier || "").toLowerCase();

      // Check against known female names and keywords
      return FEMALE_VOICE_KEYWORDS.some(
        (keyword) => nameLower.includes(keyword) || idLower.includes(keyword)
      );
    });

    // 3. Configure playback options
    const options = {
      rate: 0.9,
      pitch: femaleVoice ? 1.0 : 1.15, // raised pitch as fallback if no female voice matched
    };

    if (femaleVoice) {
      options.voice = femaleVoice.identifier;
    }

    Speech.stop();
    Speech.speak(TAGLINE, options);
  } catch (error) {
    // Fallback if voice lookup fails
    Speech.speak(TAGLINE, { rate: 0.9, pitch: 1.15 });
  }
};

// Smoothly ramp the music volume. Volume is a plain property on the player,
// so the fade is a small JS ramp stepping only the volume value.
function fadeVolumeTo(target, durationMs) {
  if (volumeFadeTimer) {
    clearInterval(volumeFadeTimer);
    volumeFadeTimer = null;
  }
  if (!bgmPlayer) return;
  const from = bgmPlayer.volume;
  if (Math.abs(target - from) < 0.01) {
    bgmPlayer.volume = target;
    return;
  }
  const startedAt = Date.now();
  volumeFadeTimer = setInterval(() => {
    if (!bgmPlayer) {
      clearInterval(volumeFadeTimer);
      volumeFadeTimer = null;
      return;
    }
    const t = Math.min(1, (Date.now() - startedAt) / durationMs);
    bgmPlayer.volume = from + (target - from) * t;
    if (t >= 1) {
      clearInterval(volumeFadeTimer);
      volumeFadeTimer = null;
    }
  }, 30);
}

// Duck (true) or release (false) the background music. Ref-counted so
// overlapping chord sounds resume only after the last one finishes.
export function duckBackgroundMusic(isDucked) {
  duckCount = isDucked ? duckCount + 1 : Math.max(0, duckCount - 1);
  if (!bgmPlayer) return;
  fadeVolumeTo(
    duckCount > 0 ? MUSIC_DUCK_VOLUME : bgmVolume,
    duckCount > 0 ? DUCK_FADE_MS : RESUME_FADE_MS
  );
}

// Reference to the settle() of the chord currently sounding, if any. Stored
// rather than the player itself so cutting a chord short always runs the same
// single cleanup path (duck released, player removed, promise resolved).
let activeChord = null;

// Cuts off the chord currently sounding. Used by playChord (so two samples can
// never overlap) and by stopChordSequence (so leaving a screen mid-progression
// does not leave a chord ringing behind it).
export function stopChord() {
  if (activeChord) activeChord();
}

// Plays a synthesized chord sample and ducks the music around it: the
// music dips while the chord sounds and fades back automatically when the
// sample finishes (playback event, with a timer as a safety net). Because
// the release lives here — not in the calling screen — the music still
// resumes cleanly if the user navigates away mid-chord.
//
// Returns a promise that settles once the sample has finished (or failed to
// start). Awaiting it is what lets a progression play strictly one chord at a
// time — see playChordSequence in src/audio/chordSequence.js.
export function playChord(notes) {
  if (!notes || notes.length === 0) return Promise.resolve();

  // Chords never overlap: whatever is still sounding is cut off first.
  stopChord();

  let player;
  try {
    player = createAudioPlayer({ uri: buildChordDataUri(notes) });
  } catch (err) {
    console.warn("Chord playback failed:", err);
    return Promise.resolve();
  }

  duckBackgroundMusic(true);
  return new Promise((resolve) => {
    let settled = false;
    let subscription = null;
    let fallback = null;

    const settle = () => {
      if (settled) return;
      settled = true;
      if (activeChord === settle) activeChord = null;
      if (fallback) clearTimeout(fallback);
      if (subscription && subscription.remove) subscription.remove();
      duckBackgroundMusic(false);
      try {
        player.remove();
      } catch (err) {
        // player already gone; nothing to clean up
      }
      resolve();
    };

    // Primary signal: expo-audio fires didJustFinish when the sample ends.
    subscription = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) settle();
    });
    // Safety net for platforms that never emit the event.
    fallback = setTimeout(settle, (CHORD_DURATION_SECONDS + 0.5) * 1000);

    activeChord = settle;

    try {
      player.play();
    } catch (err) {
      console.warn("Chord playback failed:", err);
      settle();
    }
  });
}

// Call from the first user touch anywhere: retries the music inside the
// gesture when autoplay policies blocked the initial attempt.
export function markAudioUnlocked() {
  if (bgmWanted && bgmPlayer && !bgmPlayer.playing) playBgm();
}

// Music starts once (when the main menu is reached) and then plays
// continuously across every screen — route changes never restart or cut it.
// Interference with chord sounds is handled by ducking, not by pausing.
export function startMenuMusic() {
  ensureAudioMode();
  if (bgmWanted && bgmPlayer && bgmPlayer.playing) return;
  bgmWanted = true;
  playBgm();
}

// Stops the menu music and keeps it stopped (unlike a bare pause, the
// touch-unlock retry won't restart it). The router calls this for the session
// routes (Build a Chord, Guess the Chord and the Chord Result Screen) and the
// screens call it as soon as a session is configured; startMenuMusic() then
// resumes the track from the exact position it was paused at, which only
// happens once the player is back on the main menu.
export function stopMenuMusic() {
  bgmWanted = false;
  if (volumeFadeTimer) {
    clearInterval(volumeFadeTimer);
    volumeFadeTimer = null;
  }
  try {
    if (bgmPlayer) {
      bgmPlayer.pause();
      bgmPlayer.volume = bgmVolume; // avoid resuming stuck at duck level
    }
  } catch (err) {
    console.warn("Menu music stop failed:", err);
  }
}

// Kept for backward compatibility.
export const pauseMenuMusic = stopMenuMusic;

// True while the music should be playing but the platform is blocking it.
export function isMusicBlocked() {
  return bgmWanted && (!bgmPlayer || !bgmPlayer.playing);
}

export function getMusicVolume() {
  return bgmVolume;
}

export function setMusicVolume(volume) {
  bgmVolume = Math.max(0, Math.min(1, volume));
  // While ducked, keep the duck level; the new volume applies on release.
  if (bgmPlayer && duckCount === 0) {
    fadeVolumeTo(bgmVolume, 120);
  }
}