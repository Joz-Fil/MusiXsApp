import React, { createContext, useContext } from "react";
import * as appAudio from "./appAudio";
import * as chordSequence from "./chordSequence";

// All actual audio state lives in the appAudio singleton (the native players
// are module-scoped objects); this provider exposes its control functions to
// the React tree so screens never import the singleton directly.
const AudioContext = createContext(null);

const CONTROLS = {
  // chord playback (ducks the background music while a sample plays)
  playChord: appAudio.playChord,
  duckBackgroundMusic: appAudio.duckBackgroundMusic,
  // linear chord progressions with the shared 0.5s gap between chords
  playChordSequence: chordSequence.playChordSequence,
  stopChordSequence: chordSequence.stopChordSequence,
  // menu music (generated 30s lofi loop)
  startMenuMusic: appAudio.startMenuMusic,
  stopMenuMusic: appAudio.stopMenuMusic,
  pauseMenuMusic: appAudio.pauseMenuMusic,
  primeMenuMusic: appAudio.primeMenuMusic,
  isMusicBlocked: appAudio.isMusicBlocked,
  getMusicVolume: appAudio.getMusicVolume,
  setMusicVolume: appAudio.setMusicVolume,
  // narration + autoplay unlock
  speakTagline: appAudio.speakTagline,
  markAudioUnlocked: appAudio.markAudioUnlocked,
};

export function AudioProvider({ children }) {
  // CONTROLS is module-stable, so the provider value never changes identity.
  return <AudioContext.Provider value={CONTROLS}>{children}</AudioContext.Provider>;
}

// Hook every screen uses to reach the global audio controls:
// playChord, duckBackgroundMusic, startMenuMusic, pauseMenuMusic, ...
export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error("useAudio must be used inside an AudioProvider");
  }
  return ctx;
}
