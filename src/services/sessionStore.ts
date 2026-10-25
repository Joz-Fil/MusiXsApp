// Persistent session state for in-progress chord building, learning, sound dojo workouts,
// journey challenges, tutorial steps, and profile drafts.
// Preserves state when switching tabs or navigating away so the user never loses progress.

export interface BuildChordSession {
  count: number;
  builtChords: Array<{ notes: string[]; chordName: string }>;
  selected: string[];
  smartGuide: boolean;
  phase: "setup" | "building" | "playing";
}

export interface LearnChordSession {
  selectedChord: {
    root: string;
    type: string;
    notes: string[];
    formula: string;
    mood?: string;
    concept?: string;
    description?: string;
    tier?: string;
    journeyLevelId?: string;
  } | null;
  activeNoteIndex: number | null;
  selectedTier?: "foundations" | "intermediate" | "advanced";
  practiceMode?: boolean;
  practiceSelected?: string[];
}

export interface JourneySession {
  activeLevelId: string | null;
  selectedNotes: string[];
  challengeResult?: { success: boolean; stars: number; xp: number; message: string } | null;
}

export interface GuessChordSession {
  difficulty: string;
  phase: "setup" | "guessing" | "correct" | "wrong" | "finished";
  roundIndex: number;
  target: { name: string; notes: string[] } | null;
  selected: string[];
  results: Array<{ name: string; firstTry: boolean }>;
  firstTry: boolean;
}

export interface DojoSession {
  selectedMode: "high_low" | "happy_sad" | "missing";
  currentRound: any | null;
  score: number;
  streak: number;
  feedback: { correct: boolean; message: string } | null;
}

export interface TutorialSession {
  currentStepIndex: number;
  tappedNotes: string[];
}

export interface ProfileDraftSession {
  editModalVisible: boolean;
  selectedAvatar: string | null;
  displayNameInput: string | null;
  selectedBadge: any | null;
}

const DEFAULT_BUILD_SESSION: BuildChordSession = {
  count: 1,
  builtChords: [],
  selected: [],
  smartGuide: true,
  phase: "setup",
};

const DEFAULT_LEARN_SESSION: LearnChordSession = {
  selectedChord: null,
  activeNoteIndex: null,
  selectedTier: "foundations",
  practiceMode: false,
  practiceSelected: [],
};

const DEFAULT_JOURNEY_SESSION: JourneySession = {
  activeLevelId: null,
  selectedNotes: [],
  challengeResult: null,
};

const DEFAULT_GUESS_SESSION: GuessChordSession = {
  difficulty: "easy",
  phase: "setup",
  roundIndex: 0,
  target: null,
  selected: [],
  results: [],
  firstTry: true,
};

const DEFAULT_DOJO_SESSION: DojoSession = {
  selectedMode: "happy_sad",
  currentRound: null,
  score: 0,
  streak: 0,
  feedback: null,
};

const DEFAULT_TUTORIAL_SESSION: TutorialSession = {
  currentStepIndex: 0,
  tappedNotes: [],
};

const DEFAULT_PROFILE_DRAFT_SESSION: ProfileDraftSession = {
  editModalVisible: false,
  selectedAvatar: null,
  displayNameInput: null,
  selectedBadge: null,
};

let currentBuildSession: BuildChordSession = { ...DEFAULT_BUILD_SESSION };
let currentLearnSession: LearnChordSession = { ...DEFAULT_LEARN_SESSION };
let currentJourneySession: JourneySession = { ...DEFAULT_JOURNEY_SESSION };
let currentGuessSession: GuessChordSession = { ...DEFAULT_GUESS_SESSION };
let currentDojoSession: DojoSession = { ...DEFAULT_DOJO_SESSION };
let currentTutorialSession: TutorialSession = { ...DEFAULT_TUTORIAL_SESSION };
let currentProfileDraftSession: ProfileDraftSession = { ...DEFAULT_PROFILE_DRAFT_SESSION };

// Listeners for reactive updates across the app
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (_) {}
  }
}

export function subscribeSessionStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ================= BUILD CHORD =================
export function getBuildChordSession(): BuildChordSession {
  return {
    ...currentBuildSession,
    builtChords: [...currentBuildSession.builtChords],
    selected: [...currentBuildSession.selected],
  };
}

export function updateBuildChordSession(updates: Partial<BuildChordSession>): void {
  currentBuildSession = {
    ...currentBuildSession,
    ...updates,
    builtChords: updates.builtChords !== undefined ? [...updates.builtChords] : currentBuildSession.builtChords,
    selected: updates.selected !== undefined ? [...updates.selected] : currentBuildSession.selected,
  };
  notifyListeners();
}

export function resetBuildChordSession(): void {
  currentBuildSession = { ...DEFAULT_BUILD_SESSION, builtChords: [], selected: [] };
  notifyListeners();
}

export function hasActiveBuildSession(): boolean {
  return (
    currentBuildSession.phase === "building" ||
    currentBuildSession.builtChords.length > 0 ||
    currentBuildSession.selected.length > 0
  );
}

// ================= LEARN CHORD =================
export function getLearnChordSession(): LearnChordSession {
  return {
    ...currentLearnSession,
    selectedChord: currentLearnSession.selectedChord ? { ...currentLearnSession.selectedChord } : null,
    practiceSelected: currentLearnSession.practiceSelected ? [...currentLearnSession.practiceSelected] : [],
  };
}

export function updateLearnChordSession(updates: Partial<LearnChordSession>): void {
  currentLearnSession = {
    ...currentLearnSession,
    ...updates,
  };
  notifyListeners();
}

export function resetLearnChordSession(): void {
  currentLearnSession = { ...DEFAULT_LEARN_SESSION };
  notifyListeners();
}

export function hasActiveLearnSession(): boolean {
  return currentLearnSession.selectedChord !== null;
}

// ================= JOURNEY =================
export function getJourneySession(): JourneySession {
  return {
    ...currentJourneySession,
    selectedNotes: [...currentJourneySession.selectedNotes],
  };
}

export function updateJourneySession(updates: Partial<JourneySession>): void {
  currentJourneySession = {
    ...currentJourneySession,
    ...updates,
    selectedNotes: updates.selectedNotes !== undefined ? [...updates.selectedNotes] : currentJourneySession.selectedNotes,
  };
  notifyListeners();
}

export function resetJourneySession(): void {
  currentJourneySession = { ...DEFAULT_JOURNEY_SESSION, selectedNotes: [] };
  notifyListeners();
}

export function hasActiveJourneySession(): boolean {
  return currentJourneySession.activeLevelId !== null || currentJourneySession.selectedNotes.length > 0;
}

// ================= GUESS CHORD =================
export function getGuessChordSession(): GuessChordSession {
  return {
    ...currentGuessSession,
    selected: [...currentGuessSession.selected],
    results: [...currentGuessSession.results],
  };
}

export function updateGuessChordSession(updates: Partial<GuessChordSession>): void {
  currentGuessSession = {
    ...currentGuessSession,
    ...updates,
    selected: updates.selected !== undefined ? [...updates.selected] : currentGuessSession.selected,
    results: updates.results !== undefined ? [...updates.results] : currentGuessSession.results,
  };
  notifyListeners();
}

export function resetGuessChordSession(): void {
  currentGuessSession = { ...DEFAULT_GUESS_SESSION, selected: [], results: [] };
  notifyListeners();
}

export function hasActiveGuessSession(): boolean {
  return (
    currentGuessSession.phase === "guessing" ||
    currentGuessSession.results.length > 0 ||
    currentGuessSession.selected.length > 0
  );
}

// ================= SOUND DOJO =================
export function getDojoSession(): DojoSession {
  return {
    ...currentDojoSession,
    currentRound: currentDojoSession.currentRound ? { ...currentDojoSession.currentRound } : null,
  };
}

export function updateDojoSession(updates: Partial<DojoSession>): void {
  currentDojoSession = {
    ...currentDojoSession,
    ...updates,
  };
  notifyListeners();
}

export function resetDojoSession(): void {
  currentDojoSession = { ...DEFAULT_DOJO_SESSION };
  notifyListeners();
}

export function hasActiveDojoSession(): boolean {
  return currentDojoSession.score > 0 || currentDojoSession.streak > 0 || currentDojoSession.currentRound !== null;
}

// ================= INTERACTIVE TUTORIAL =================
export function getTutorialSession(): TutorialSession {
  return {
    ...currentTutorialSession,
    tappedNotes: [...currentTutorialSession.tappedNotes],
  };
}

export function updateTutorialSession(updates: Partial<TutorialSession>): void {
  currentTutorialSession = {
    ...currentTutorialSession,
    ...updates,
    tappedNotes: updates.tappedNotes !== undefined ? [...updates.tappedNotes] : currentTutorialSession.tappedNotes,
  };
  notifyListeners();
}

export function resetTutorialSession(): void {
  currentTutorialSession = { ...DEFAULT_TUTORIAL_SESSION, tappedNotes: [] };
  notifyListeners();
}

// ================= PROFILE DRAFT =================
export function getProfileDraftSession(): ProfileDraftSession {
  return {
    ...currentProfileDraftSession,
  };
}

export function updateProfileDraftSession(updates: Partial<ProfileDraftSession>): void {
  currentProfileDraftSession = {
    ...currentProfileDraftSession,
    ...updates,
  };
  notifyListeners();
}

export function resetProfileDraftSession(): void {
  currentProfileDraftSession = { ...DEFAULT_PROFILE_DRAFT_SESSION };
  notifyListeners();
}
