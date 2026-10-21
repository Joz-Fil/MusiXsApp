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

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Ensures the `email`, `display_name`, `avatar`, and `password_resets` schema exist.
 */
export async function ensureUserSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await database.execAsync("ALTER TABLE users ADD COLUMN email TEXT COLLATE NOCASE;");
  } catch {}
  try {
    await database.execAsync("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);");
  } catch {}
  try {
    await database.execAsync("ALTER TABLE users ADD COLUMN display_name TEXT;");
  } catch {}
  try {
    await database.execAsync("ALTER TABLE users ADD COLUMN avatar TEXT;");
  } catch {}
  try {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS password_resets (
        email TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
        code TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);
  } catch {}
}

export const ensureEmailColumn = ensureUserSchema;

/**
 * Resets local users and sessions, completely resolving any corrupt legacy data or duplicate conflicts.
 */
export async function resetLocalUsers(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync("PRAGMA foreign_keys = OFF;");
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
    PRAGMA foreign_keys = ON;
  `);
}

// Opens the local database once and makes sure every table exists before it
// is handed out.
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("musixs.db")
      .then(async (database) => {
        await database.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
        await database.execAsync(`
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
					CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
						ON users (email);
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
					CREATE TABLE IF NOT EXISTS password_resets (
						email TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
						code TEXT NOT NULL,
						expires_at INTEGER NOT NULL
					);
				`);

        await ensureUserSchema(database);
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
  try {
    return await database.getFirstAsync<AppUser>(
      "SELECT id, username, email, display_name AS displayName, avatar, created_at AS createdAt FROM users WHERE id = ?",
      id
    );
  } catch (e: any) {
    await ensureUserSchema(database);
    return await database.getFirstAsync<AppUser>(
      "SELECT id, username, email, display_name AS displayName, avatar, created_at AS createdAt FROM users WHERE id = ?",
      id
    );
  }
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

export async function registerUser({ username, email, displayName, avatar, password }: RegisterCredentials): Promise<AppUser> {
  const cleanUsername = username.trim();
  const cleanEmail = email ? email.trim().toLowerCase() : null;

  if (!cleanUsername || !password) throw new Error("Enter a username and password.");

  const database = await getDatabase();
  await ensureUserSchema(database);

  const existingUser = await database.getFirstAsync<{ id: number }>(
    "SELECT id FROM users WHERE username = ? COLLATE NOCASE",
    cleanUsername
  );
  if (existingUser) throw new Error("That username is already in use. Please log in or choose a different username.");

  if (cleanEmail) {
    const existingEmail = await database.getFirstAsync<{ id: number }>(
      "SELECT id FROM users WHERE email = ? COLLATE NOCASE",
      cleanEmail
    );
    if (existingEmail) throw new Error("That email is already registered. Please log in instead.");
  }

  const salt = Crypto.randomUUID();
  const passwordHash = await hashPassword(password, salt);
  const userDisplayName = displayName?.trim() || cleanUsername;
  const userAvatar = avatar || "🎵";

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
    return (await getUserById(database, result.lastInsertRowId)) as AppUser;
  } catch (error: any) {
    const duplicate = await database.getFirstAsync<{ id: number }>(
      "SELECT id FROM users WHERE username = ? COLLATE NOCASE",
      cleanUsername
    );
    if (duplicate) throw new Error("That username is already in use.");
    throw error;
  }
}

export async function loginUser(credentials: LoginCredentials): Promise<AppUser | null> {
  const target = (credentials.identifier || credentials.username || "").trim();
  if (!target || !credentials.password) return null;

  const database = await getDatabase();
  await ensureUserSchema(database);

  let user: UserRow | null = null;
  try {
    user = await database.getFirstAsync<UserRow>(
      "SELECT id, username, email, display_name, avatar, password_salt, password_hash FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE",
      target,
      target
    );
  } catch {
    await ensureUserSchema(database);
    user = await database.getFirstAsync<UserRow>(
      "SELECT id, username, email, display_name, avatar, password_salt, password_hash FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE",
      target,
      target
    );
  }

  if (!user) return null;
  const passwordHash = await hashPassword(credentials.password, user.password_salt);
  if (passwordHash !== user.password_hash) return null;
  return getUserById(database, user.id);
}

export async function updateUserProfile(
  userId: number,
  updates: { displayName?: string; avatar?: string; username?: string }
): Promise<AppUser> {
  const database = await getDatabase();
  await ensureUserSchema(database);

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
    await database.runAsync(
      "UPDATE users SET username = ? WHERE id = ?",
      cleanUsername,
      userId
    );
  }

  if (updates.displayName !== undefined) {
    await database.runAsync(
      "UPDATE users SET display_name = ? WHERE id = ?",
      updates.displayName.trim(),
      userId
    );
  }

  if (updates.avatar !== undefined) {
    await database.runAsync(
      "UPDATE users SET avatar = ? WHERE id = ?",
      updates.avatar,
      userId
    );
  }

  const updated = await getUserById(database, userId);
  if (!updated) throw new Error("User not found after update.");
  return updated;
}

export async function createPasswordResetCode(email: string): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();
  const database = await getDatabase();
  await ensureUserSchema(database);

  const user = await database.getFirstAsync<{ id: number }>(
    "SELECT id FROM users WHERE email = ? COLLATE NOCASE",
    cleanEmail
  );
  if (!user) {
    throw new Error("No account found with this Gmail/email address.");
  }

  // Generate 6-digit verification code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  await database.runAsync(
    "INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at",
    cleanEmail,
    code,
    expiresAt
  );

  return code;
}

export async function resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  const database = await getDatabase();
  await ensureUserSchema(database);

  const resetRecord = await database.getFirstAsync<{ code: string; expires_at: number }>(
    "SELECT code, expires_at FROM password_resets WHERE email = ? COLLATE NOCASE",
    cleanEmail
  );

  if (!resetRecord) {
    throw new Error("No password reset requested for this email.");
  }

  if (Date.now() > resetRecord.expires_at) {
    await database.runAsync("DELETE FROM password_resets WHERE email = ? COLLATE NOCASE", cleanEmail);
    throw new Error("Verification code has expired. Please request a new code.");
  }

  if (resetRecord.code !== cleanCode) {
    throw new Error("Invalid verification code. Please check your Gmail / email.");
  }

  const salt = Crypto.randomUUID();
  const passwordHash = await hashPassword(newPassword, salt);

  await database.runAsync(
    "UPDATE users SET password_salt = ?, password_hash = ? WHERE email = ? COLLATE NOCASE",
    salt,
    passwordHash,
    cleanEmail
  );

  await database.runAsync("DELETE FROM password_resets WHERE email = ? COLLATE NOCASE", cleanEmail);
  return true;
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
  try {
    return await database.getFirstAsync<AppUser>(
      `SELECT users.id, users.username, users.email, users.display_name AS displayName, users.avatar, users.created_at AS createdAt
		   FROM app_session JOIN users ON users.id = app_session.user_id
		   WHERE app_session.id = 1`
    );
  } catch {
    await ensureUserSchema(database);
    return await database.getFirstAsync<AppUser>(
      `SELECT users.id, users.username, users.email, users.display_name AS displayName, users.avatar, users.created_at AS createdAt
		   FROM app_session JOIN users ON users.id = app_session.user_id
		   WHERE app_session.id = 1`
    );
  }
}

export async function clearCurrentUser(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM app_session WHERE id = 1");
}
