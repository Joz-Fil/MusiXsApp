import { getDatabase } from "./database";

// Activity kinds recorded in chord_history. The CHECK constraint on the
// table matches these exact strings.
export type ChordActivityType = "BUILD_CHORD" | "GUESS_CHORD";

export const ACTIVITY_TYPES = {
  BUILD: "BUILD_CHORD",
  GUESS: "GUESS_CHORD",
} as const satisfies Record<string, ChordActivityType>;

export interface ChordHistoryRecord {
  id: number;
  activityType: ChordActivityType;
  chordName: string;
  /** true when the attempt succeeded (standard chord built / guess correct) */
  isSuccess: boolean;
  /** raw JSON/text snapshot of the attempt, exactly as it was stored */
  attemptsDetails: string | null;
  createdAt: string;
}

/** Optional context for an attempt; objects are stored as JSON text. */
export type ChordActivityDetails = Record<string, unknown> | string;

interface ChordHistoryRow {
  id: number;
  activity_type: string;
  chord_name: string;
  is_success: number;
  attempts_details: string | null;
  created_at: string;
}

const VALID_ACTIVITY_TYPES: readonly ChordActivityType[] = ["BUILD_CHORD", "GUESS_CHORD"];

function serializeDetails(details?: ChordActivityDetails | null): string | null {
  if (details === undefined || details === null) return null;
  if (typeof details === "string") return details;
  try {
    return JSON.stringify(details);
  } catch (error) {
    console.warn("Chord history: details could not be serialized:", error);
    return null;
  }
}

/**
 * Records one chord attempt (build or guess). Never rejects and never throws:
 * history logging must not be able to disrupt the core UI flow, so failures
 * are swallowed after a console warning.
 */
export async function logChordActivity(
  activityType: ChordActivityType,
  chordName: string,
  isSuccess: boolean,
  details?: ChordActivityDetails | null
): Promise<void> {
  try {
    if (!VALID_ACTIVITY_TYPES.includes(activityType)) {
      throw new Error(`Unknown chord activity type: ${String(activityType)}`);
    }
    if (!chordName) throw new Error("Chord history requires a chord name.");

    const database = await getDatabase();
    await database.runAsync(
      "INSERT INTO chord_history (activity_type, chord_name, is_success, attempts_details) VALUES (?, ?, ?, ?)",
      activityType,
      chordName,
      isSuccess ? 1 : 0,
      serializeDetails(details)
    );
  } catch (error) {
    console.warn("Chord history log failed:", error);
  }
}

/**
 * Fetches past attempts, newest first. `created_at` has one-second
 * resolution, so `id DESC` breaks ties within the same second.
 * Throws on database failure — the caller decides how to surface it.
 */
export async function getChordHistory(limit = 50, offset = 0): Promise<ChordHistoryRecord[]> {
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit) || 50));
  const safeOffset = Math.max(0, Math.floor(offset) || 0);
  const database = await getDatabase();
  const rows = await database.getAllAsync<ChordHistoryRow>(
    `SELECT id, activity_type, chord_name, is_success, attempts_details, created_at
		 FROM chord_history
		 ORDER BY created_at DESC, id DESC
		 LIMIT ? OFFSET ?`,
    safeLimit,
    safeOffset
  );
  return rows.map((row) => ({
    id: row.id,
    activityType: row.activity_type as ChordActivityType,
    chordName: row.chord_name,
    isSuccess: row.is_success === 1,
    attemptsDetails: row.attempts_details,
    createdAt: row.created_at,
  }));
}

/** Deletes every history record. Throws on database failure. */
export async function clearChordHistory(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM chord_history");
}
