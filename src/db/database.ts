import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";

export interface AppUser {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  createdAt: string;
}

export interface RegisterCredentials {
  username: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  password: string;
}

export interface LoginCredentials {
  username?: string;
  identifier?: string;
  password: string;
}

interface UserRow {
  id: number;
  username: string;
  email?: string;
  display_name?: string;
  avatar?: string;
  password_salt: string;
  password_hash: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Connection management
// ---------------------------------------------------------------------------

const DATABASE_NAME = "musixs.db";

/**
 * `useNewConnection: true` is the actual fix for
 * "Call to function 'NativeDatabase.execAsync' has been rejected →
 *  java.lang.NullPointerException".
 *
 * Without it, expo-sqlite on Android hands back a *cached* native connection
 * for the same file name. When the previous JS handle is released (Fast
 * Refresh, a JS reload, garbage collection) that native connection is torn
 * down but stays in the cache, so the next open receives a dead handle and the
 * very first execAsync crashes with a NullPointerException — forever, until
 * the app process is killed. A brand new connection never has that problem.
 */
const OPEN_OPTIONS: SQLite.SQLiteOpenOptions = { useNewConnection: true };

/** How many times one database operation is attempted before giving up. */
const MAX_ATTEMPTS = 3;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let activeDatabase: SQLite.SQLiteDatabase | null = null;

/**
 * Thrown when the on-device database stays unreachable after every recovery
 * attempt. Its message is safe to show to the user; the original native error
 * is kept on `cause` for logging.
 */
export class DatabaseUnavailableError extends Error {
  cause?: unknown;

  constructor(cause?: unknown) {
    super(
      "We couldn't reach the app's local storage. Please try again — if this keeps happening, fully close and reopen MusiXs."
    );
    this.name = "DatabaseUnavailableError";
    this.cause = cause;
  }
}

function errorText(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  const parts: string[] = [];
  const anyError = error as { message?: unknown; code?: unknown; cause?: unknown };
  if (anyError.message) parts.push(String(anyError.message));
  if (anyError.code) parts.push(String(anyError.code));
  if (anyError.cause && anyError.cause !== error) parts.push(errorText(anyError.cause));
  return parts.length ? parts.join(" | ") : String(error);
}

/**
 * The native connection itself is broken (dead handle, closed, misused).
 * Recovery: throw the connection away and open a fresh one.
 *
 * Normal SQL errors (UNIQUE / FOREIGN KEY / syntax) are deliberately NOT
 * matched — those are real errors and retrying would not help.
 */
const BROKEN_CONNECTION_PATTERN =
  /NullPointerException|IllegalStateException|AccessClosedResource|closed resource|database is closed|database not open|not an open database|has been closed|already closed|SQLITE_MISUSE|library routine called out of sequence|bad parameter or other API misuse|unable to open database|disk I\/O error|Native(Database|Statement)\b.*(null|released|destroyed)/i;

/** The database is temporarily busy. Recovery: wait a moment and retry. */
const BUSY_PATTERN = /database is locked|SQLITE_BUSY|database table is locked|SQLITE_LOCKED/i;

export function isBrokenConnectionError(error: unknown): boolean {
  return BROKEN_CONNECTION_PATTERN.test(errorText(error));
}

export function isBusyDatabaseError(error: unknown): boolean {
  return BUSY_PATTERN.test(errorText(error));
}

/** True for any database error that the automatic retry logic handles. */
export function isRecoverableDatabaseError(error: unknown): boolean {
  return isBrokenConnectionError(error) || isBusyDatabaseError(error);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const BASE_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY NOT NULL,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    email TEXT COLLATE NOCASE,
    display_name TEXT,
    avatar TEXT,
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
  CREATE TABLE IF NOT EXISTS user_progress (
    level_id TEXT PRIMARY KEY NOT NULL,
    stars INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    xp INTEGER NOT NULL DEFAULT 0,
    streak_count INTEGER NOT NULL DEFAULT 1,
    last_active_date TEXT,
    tutorial_completed INTEGER NOT NULL DEFAULT 0,
    onboarding_answered INTEGER NOT NULL DEFAULT 0,
    is_beginner INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS user_badges (
    badge_id TEXT PRIMARY KEY NOT NULL,
    unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS daily_quests (
    quest_id TEXT NOT NULL,
    quest_date TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    target INTEGER NOT NULL DEFAULT 1,
    completed INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (quest_id, quest_date)
  );
  CREATE TABLE IF NOT EXISTS password_resets (
    email TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
`;

/**
 * Brings an older `users` table up to date (adds `email`, `display_name`,
 * `avatar`) and makes sure the email index exists.
 *
 * Columns are checked with PRAGMA table_info instead of "ALTER TABLE and
 * swallow every error", so a real failure (like a dead connection) is no
 * longer hidden here and then resurfacing as a confusing error later.
 */
async function migrateUserSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await database.getAllAsync<{ name: string }>("PRAGMA table_info(users)");
  const existing = new Set(columns.map((column) => column.name));

  if (!existing.has("email")) {
    await database.execAsync("ALTER TABLE users ADD COLUMN email TEXT COLLATE NOCASE;");
  }
  if (!existing.has("display_name")) {
    await database.execAsync("ALTER TABLE users ADD COLUMN display_name TEXT;");
  }
  if (!existing.has("avatar")) {
    await database.execAsync("ALTER TABLE users ADD COLUMN avatar TEXT;");
  }

  // Created after the email column is guaranteed to exist. (Previously this
  // ran inside the main schema script, which made start-up fail outright on a
  // database created before the email column was added.)
  try {
    await database.execAsync("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);");
  } catch (error) {
    if (isBrokenConnectionError(error)) throw error;
    // Legacy data with duplicate emails: the app still works without the
    // index because registration checks for duplicates itself.
    console.warn("[db] Could not create the unique email index:", error);
  }
  try {
    const statCols = await database.getAllAsync<{ name: string }>("PRAGMA table_info(user_stats)");
    const statColSet = new Set(statCols.map((c) => c.name));
    if (!statColSet.has("onboarding_answered")) {
      await database.execAsync("ALTER TABLE user_stats ADD COLUMN onboarding_answered INTEGER NOT NULL DEFAULT 0;");
    }
    if (!statColSet.has("is_beginner")) {
      await database.execAsync("ALTER TABLE user_stats ADD COLUMN is_beginner INTEGER NOT NULL DEFAULT 1;");
    }
  } catch (_) {
    // user_stats might not exist yet; BASE_SCHEMA_SQL creates it
  }
}

async function openAndPrepareDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME, OPEN_OPTIONS);
  try {
    // Wait up to 5s instead of failing immediately if another connection
    // (e.g. one left over from a Fast Refresh) holds a lock.
    await database.execAsync("PRAGMA busy_timeout = 5000;");
    try {
      await database.execAsync("PRAGMA journal_mode = WAL;");
    } catch (error) {
      if (isBrokenConnectionError(error)) throw error;
      // WAL is only a performance setting; the default journal works too.
      console.warn("[db] Could not enable WAL mode, continuing with default journal:", error);
    }
    await database.execAsync("PRAGMA foreign_keys = ON;");
    await database.execAsync(BASE_SCHEMA_SQL);
    await migrateUserSchema(database);
    return database;
  } catch (error) {
    // Never leak a half-initialised connection.
    try {
      await database.closeAsync();
    } catch {}
    throw error;
  }
}

/**
 * Returns the shared, fully initialised database connection, opening it on
 * first use. Prefer `withDatabase`, which also recovers from broken
 * connections.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    const opening = openAndPrepareDatabase();
    databasePromise = opening;
    opening.then(
      (database) => {
        if (databasePromise === opening) activeDatabase = database;
      },
      () => {
        // Allow the next call to try again from scratch.
        if (databasePromise === opening) databasePromise = null;
      }
    );
  }
  return databasePromise;
}

/**
 * Drops the cached connection so the next `getDatabase()` opens a new one.
 * Only clears the cache if it still points at the broken connection, so a
 * healthy connection opened meanwhile by another caller is left alone.
 */
async function discardConnection(database: SQLite.SQLiteDatabase | null): Promise<void> {
  if (database === null || activeDatabase === database) {
    databasePromise = null;
    activeDatabase = null;
  }
  if (database) {
    try {
      await database.closeAsync();
    } catch {
      // Expected: a broken connection usually can't be closed cleanly either.
    }
  }
}

/** Closes the connection and forces the next operation to reopen it. */
export async function resetDatabaseConnection(): Promise<void> {
  const current = activeDatabase;
  databasePromise = null;
  activeDatabase = null;
  if (current) {
    try {
      await current.closeAsync();
    } catch {}
  }
}

/**
 * Runs `task` against the database with automatic recovery:
 *  - broken / closed native connection (incl. the NullPointerException) →
 *    discard it, open a fresh connection and retry;
 *  - database busy/locked → wait briefly and retry;
 *  - anything else (constraint errors, app validation errors) → rethrown as is.
 *
 * If every attempt fails, a `DatabaseUnavailableError` with a readable message
 * is thrown instead of the raw native error.
 *
 * `task` may run more than once, so keep each task to a single logical step.
 */
export async function withDatabase<T>(
  label: string,
  task: (database: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let database: SQLite.SQLiteDatabase | null = null;
    try {
      database = await getDatabase();
      return await task(database);
    } catch (error) {
      lastError = error;
      const broken = isBrokenConnectionError(error);
      const busy = !broken && isBusyDatabaseError(error);
      if (!broken && !busy) throw error;

      console.warn(
        `[db] ${label} failed (attempt ${attempt}/${MAX_ATTEMPTS}); ${broken ? "reopening connection" : "database busy, retrying"}:`,
        errorText(error)
      );
      if (broken) await discardConnection(database);
      if (attempt < MAX_ATTEMPTS) await wait(150 * attempt);
    }
  }

  throw new DatabaseUnavailableError(lastError);
}

// ---------------------------------------------------------------------------
// Schema helpers kept for backwards compatibility
// ---------------------------------------------------------------------------

/**
 * Ensures the `email`, `display_name`, `avatar` columns and the
 * `password_resets` table exist. This now runs automatically whenever the
 * database is opened, so callers no longer need to invoke it.
 */
export async function ensureUserSchema(database?: SQLite.SQLiteDatabase): Promise<void> {
  if (database) {
    await database.execAsync(BASE_SCHEMA_SQL);
    await migrateUserSchema(database);
    return;
  }
  await withDatabase("ensureUserSchema", async (db) => {
    await db.execAsync(BASE_SCHEMA_SQL);
    await migrateUserSchema(db);
  });
}

export const ensureEmailColumn = ensureUserSchema;

/**
 * Resets local users and sessions, completely resolving any corrupt legacy data or duplicate conflicts.
 */
export async function resetLocalUsers(): Promise<void> {
  await withDatabase("resetLocalUsers", async (database) => {
    await database.execAsync("PRAGMA foreign_keys = OFF;");
    try {
      await database.execAsync(`
        DROP TABLE IF EXISTS app_session;
        DROP TABLE IF EXISTS users;
        DROP TABLE IF EXISTS password_resets;
        CREATE TABLE users (
          id INTEGER PRIMARY KEY NOT NULL,
          username TEXT NOT NULL COLLATE NOCASE UNIQUE,
          email TEXT COLLATE NOCASE,
          display_name TEXT,
          avatar TEXT,
          password_salt TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
        CREATE TABLE app_session (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE password_resets (
          email TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
          code TEXT NOT NULL,
          expires_at INTEGER NOT NULL
        );
      `);
    } finally {
      await database.execAsync("PRAGMA foreign_keys = ON;");
    }
  });
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const SELECT_APP_USER =
  "SELECT id, username, email, display_name AS displayName, avatar, created_at AS createdAt FROM users";

function getUserById(id: number): Promise<AppUser | null> {
  return withDatabase("getUserById", (database) =>
    database.getFirstAsync<AppUser>(`${SELECT_APP_USER} WHERE id = ?`, id)
  );
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

function isUniqueViolation(error: unknown): boolean {
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT/i.test(errorText(error));
}

export async function registerUser({ username, email, displayName, avatar, password }: RegisterCredentials): Promise<AppUser> {
  const cleanUsername = username.trim();
  const cleanEmail = email ? email.trim().toLowerCase() : null;

  if (!cleanUsername || !password) throw new Error("Enter a username and password.");

  // Hash before touching the database so a retry never re-hashes.
  const salt = Crypto.randomUUID();
  const passwordHash = await hashPassword(password, salt);
  const userDisplayName = displayName?.trim() || cleanUsername;
  const userAvatar = avatar || "🎵";

  const newUserId = await withDatabase("registerUser", async (database) => {
    const existingUser = await database.getFirstAsync<{ id: number; password_hash: string }>(
      "SELECT id, password_hash FROM users WHERE username = ? COLLATE NOCASE",
      cleanUsername
    );
    if (existingUser) {
      // An earlier attempt of this same call already inserted the row and the
      // connection broke right afterwards: treat it as success, not a duplicate.
      if (existingUser.password_hash === passwordHash) return existingUser.id;
      throw new Error("That username is already in use. Please log in or choose a different username.");
    }

    if (cleanEmail) {
      const existingEmail = await database.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ? COLLATE NOCASE",
        cleanEmail
      );
      if (existingEmail) throw new Error("That email is already registered. Please log in instead.");
    }

    try {
      const result = await database.runAsync(
        "INSERT INTO users (username, email, display_name, avatar, password_salt, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
        cleanUsername,
        cleanEmail,
        userDisplayName,
        userAvatar,
        salt,
        passwordHash
      );
      return result.lastInsertRowId;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new Error("That username or email is already in use. Please log in instead.");
      }
      throw error;
    }
  });

  const user = await getUserById(newUserId);
  if (!user) throw new Error("Your account was created, but it couldn't be loaded. Please log in.");
  return user;
}

export async function loginUser(credentials: LoginCredentials): Promise<AppUser | null> {
  const target = (credentials.identifier || credentials.username || "").trim();
  if (!target || !credentials.password) return null;

  const user = await withDatabase("loginUser", (database) =>
    database.getFirstAsync<UserRow>(
      "SELECT id, username, email, display_name, avatar, password_salt, password_hash FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE",
      target,
      target
    )
  );

  if (!user) return null;
  const passwordHash = await hashPassword(credentials.password, user.password_salt);
  if (passwordHash !== user.password_hash) return null;
  return getUserById(user.id);
}

export async function updateUserProfile(
  userId: number,
  updates: { displayName?: string; avatar?: string; username?: string }
): Promise<AppUser> {
  await withDatabase("updateUserProfile", async (database) => {
    if (updates.username && updates.username.trim()) {
      const cleanUsername = updates.username.trim();
      const existing = await database.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?",
        cleanUsername,
        userId
      );
      if (existing) {
        throw new Error("That username is already taken by another account.");
      }
      await database.runAsync("UPDATE users SET username = ? WHERE id = ?", cleanUsername, userId);
    }

    if (updates.displayName !== undefined) {
      await database.runAsync(
        "UPDATE users SET display_name = ? WHERE id = ?",
        updates.displayName.trim(),
        userId
      );
    }

    if (updates.avatar !== undefined) {
      await database.runAsync("UPDATE users SET avatar = ? WHERE id = ?", updates.avatar, userId);
    }
  });

  const updated = await getUserById(userId);
  if (!updated) throw new Error("User not found after update.");
  return updated;
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function createPasswordResetCode(email: string): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();

  // Generate 6-digit verification code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  await withDatabase("createPasswordResetCode", async (database) => {
    const user = await database.getFirstAsync<{ id: number }>(
      "SELECT id FROM users WHERE email = ? COLLATE NOCASE",
      cleanEmail
    );
    if (!user) {
      throw new Error("No account found with this Gmail/email address.");
    }

    await database.runAsync(
      "INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at",
      cleanEmail,
      code,
      expiresAt
    );
  });

  return code;
}

export async function resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  const resetRecord = await withDatabase("resetPasswordWithCode:lookup", (database) =>
    database.getFirstAsync<{ code: string; expires_at: number }>(
      "SELECT code, expires_at FROM password_resets WHERE email = ? COLLATE NOCASE",
      cleanEmail
    )
  );

  if (!resetRecord) {
    throw new Error("No password reset requested for this email.");
  }

  if (Date.now() > resetRecord.expires_at) {
    await withDatabase("resetPasswordWithCode:expire", (database) =>
      database.runAsync("DELETE FROM password_resets WHERE email = ? COLLATE NOCASE", cleanEmail)
    );
    throw new Error("Verification code has expired. Please request a new code.");
  }

  if (resetRecord.code !== cleanCode) {
    throw new Error("Invalid verification code. Please check your Gmail / email.");
  }

  const salt = Crypto.randomUUID();
  const passwordHash = await hashPassword(newPassword, salt);

  await withDatabase("resetPasswordWithCode:update", async (database) => {
    await database.withTransactionAsync(async () => {
      await database.runAsync(
        "UPDATE users SET password_salt = ?, password_hash = ? WHERE email = ? COLLATE NOCASE",
        salt,
        passwordHash,
        cleanEmail
      );
      await database.runAsync("DELETE FROM password_resets WHERE email = ? COLLATE NOCASE", cleanEmail);
    });
  });
  return true;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export async function saveCurrentUser(userId: number): Promise<void> {
  await withDatabase("saveCurrentUser", (database) =>
    database.runAsync(
      "INSERT INTO app_session (id, user_id) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id",
      userId
    )
  );
}

export async function getCurrentUser(): Promise<AppUser | null> {
  return withDatabase("getCurrentUser", (database) =>
    database.getFirstAsync<AppUser>(
      `SELECT users.id, users.username, users.email, users.display_name AS displayName, users.avatar, users.created_at AS createdAt
       FROM app_session JOIN users ON users.id = app_session.user_id
       WHERE app_session.id = 1`
    )
  );
}

export async function clearCurrentUser(): Promise<void> {
  await withDatabase("clearCurrentUser", (database) =>
    database.runAsync("DELETE FROM app_session WHERE id = 1")
  );
}
