import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("\n=======================================================");
console.log("RUNNING ACCOUNT SWITCHING & PROGRESS ISOLATION TESTS");
console.log("=======================================================\n");

const dbCode = fs.readFileSync(path.resolve("src/db/database.ts"), "utf8");
const learningCode = fs.readFileSync(path.resolve("src/services/learningService.ts"), "utf8");
const sessionCode = fs.readFileSync(path.resolve("src/services/sessionStore.ts"), "utf8");
const authCode = fs.readFileSync(path.resolve("src/services/authService.ts"), "utf8");
const journeyCode = fs.readFileSync(path.resolve("src/screens/JourneyScreen.js"), "utf8");

test("1. database.ts user_progress table is keyed per user (user_id, level_id)", () => {
  assert.ok(
    dbCode.includes("PRIMARY KEY (user_id, level_id)"),
    "user_progress should have composite PRIMARY KEY (user_id, level_id)"
  );
  assert.ok(
    dbCode.includes("user_id INTEGER NOT NULL DEFAULT 0"),
    "user_progress should have user_id column"
  );
});

test("2. database.ts user_stats and user_badges are keyed by user_id", () => {
  assert.ok(
    dbCode.includes("user_id INTEGER PRIMARY KEY NOT NULL DEFAULT 0"),
    "user_stats should be keyed by user_id"
  );
  assert.ok(
    dbCode.includes("PRIMARY KEY (user_id, badge_id)"),
    "user_badges should have composite PRIMARY KEY (user_id, badge_id)"
  );
});

test("3. learningService.ts queries user_progress scoped to active user", () => {
  assert.ok(
    learningCode.includes("SELECT level_id, stars, score FROM user_progress WHERE user_id = ?"),
    "getLevelProgress should query WHERE user_id = ?"
  );
  assert.ok(
    learningCode.includes("INSERT INTO user_progress (user_id, level_id, stars, score) VALUES (?, ?, ?, ?)"),
    "saveLevelProgress should insert user_id"
  );
});

test("4. sessionStore.ts exports resetAllSessions and authService calls it on auth changes", () => {
  assert.ok(
    sessionCode.includes("export function resetAllSessions()"),
    "sessionStore.ts should export resetAllSessions"
  );
  assert.ok(
    authCode.includes("resetAllSessions()"),
    "authService.ts should call resetAllSessions"
  );
});

test("5. JourneyScreen.js subscribes to session updates to reload progress on account switch", () => {
  assert.ok(
    journeyCode.includes("subscribeSessionStore"),
    "JourneyScreen should subscribe to sessionStore"
  );
});
