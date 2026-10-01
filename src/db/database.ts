import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";

export interface AppUser {
  id: number;
  username: string;
  createdAt: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
}

interface UserRow {
  id: number;
  username: string;
  password_salt: string;
  password_hash: string;
  created_at: string;
}

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Opens the local database once and makes sure every table exists before it
// is handed out. Called at app launch (session restore) and by every data
// access function, so the schema — including chord_history — is always in
// place before the first query runs. "CREATE TABLE IF NOT EXISTS" is the
// migration strategy: existing installs gain missing tables on next launch.
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("musixs.db")
      .then(async (database) => {
        await database.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
        await database.execAsync(`
					CREATE TABLE IF NOT EXISTS users (
						id INTEGER PRIMARY KEY NOT NULL,
						username TEXT NOT NULL COLLATE NOCASE UNIQUE,
						password_salt TEXT NOT NULL,
						password_hash TEXT NOT NULL,
						created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
					);
					CREATE TABLE IF NOT EXISTS app_session (
						id INTEGER PRIMARY KEY CHECK (id = 1),
						user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
					);
					CREATE TABLE IF NOT EXISTS chord_history (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						activity_type TEXT NOT NULL CHECK (activity_type IN ('BUILD_CHORD', 'GUESS_CHORD')),
						chord_name TEXT NOT NULL,
						is_success INTEGER NOT NULL CHECK (is_success IN (0, 1)),
						attempts_details TEXT,
						created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
					);
					CREATE INDEX IF NOT EXISTS idx_chord_history_created_at
						ON chord_history (created_at DESC, id DESC);
				`);
        return database;
      })
      .catch((error) => {
        databasePromise = null;
        throw error;
      });
  }
  return databasePromise;
}

async function getUserById(database: SQLite.SQLiteDatabase, id: number): Promise<AppUser | null> {
  return database.getFirstAsync<AppUser>(
    "SELECT id, username, created_at AS createdAt FROM users WHERE id = ?",
    id
  );
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

export async function registerUser({ username, password }: RegisterCredentials): Promise<AppUser> {
  const cleanUsername = username.trim();
  if (!cleanUsername || !password) throw new Error("Enter a username and password.");

  const database = await getDatabase();
  const existingUser = await database.getFirstAsync<{ id: number }>(
    "SELECT id FROM users WHERE username = ? COLLATE NOCASE",
    cleanUsername
  );
  if (existingUser) throw new Error("That username is already in use.");

  const salt = Crypto.randomUUID();
  const passwordHash = await hashPassword(password, salt);
  try {
    const result = await database.runAsync(
      "INSERT INTO users (username, password_salt, password_hash) VALUES (?, ?, ?)",
      cleanUsername,
      salt,
      passwordHash
    );
    return await getUserById(database, result.lastInsertRowId) as AppUser;
  } catch (error) {
    const duplicate = await database.getFirstAsync<{ id: number }>(
      "SELECT id FROM users WHERE username = ? COLLATE NOCASE",
      cleanUsername
    );
    if (duplicate) throw new Error("That username is already in use.");
    throw error;
  }
}

export async function loginUser(credentials: RegisterCredentials): Promise<AppUser | null> {
  const database = await getDatabase();
  const user = await database.getFirstAsync<UserRow>(
    "SELECT id, username, password_salt, password_hash FROM users WHERE username = ? COLLATE NOCASE",
    credentials.username.trim()
  );
  if (!user) return null;
  const passwordHash = await hashPassword(credentials.password, user.password_salt);
  if (passwordHash !== user.password_hash) return null;
  return getUserById(database, user.id);
}

export async function saveCurrentUser(userId: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "INSERT INTO app_session (id, user_id) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id",
    userId
  );
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const database = await getDatabase();
  return database.getFirstAsync<AppUser>(
    `SELECT users.id, users.username, users.created_at AS createdAt
		 FROM app_session JOIN users ON users.id = app_session.user_id
		 WHERE app_session.id = 1`
  );
}

export async function clearCurrentUser(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM app_session WHERE id = 1");
}
