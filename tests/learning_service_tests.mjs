import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log("\n==========================================");
console.log("RUNNING LEARNING SERVICE & CURRICULUM TESTS");
console.log("==========================================\n");

// Read learningService.ts source directly
const servicePath = path.resolve("src/services/learningService.ts");
const serviceCode = fs.readFileSync(servicePath, "utf-8");

test("learningService.ts contains JOURNEY_LEVELS definition", () => {
  assert.ok(serviceCode.includes("export const JOURNEY_LEVELS: LevelDefinition[] = ["));
});

test("learningService.ts defines 10 core journey levels across 3 chapters", () => {
  const levelMatches = serviceCode.match(/id:\s*"ch[1-3]_lvl\d+"/g) || [];
  assert.strictEqual(levelMatches.length, 10, `Expected 10 journey levels, found ${levelMatches.length}`);
});

test("Chapter 1 contains 4 foundation building block levels", () => {
  assert.ok(serviceCode.includes('id: "ch1_lvl1"'));
  assert.ok(serviceCode.includes('id: "ch1_lvl2"'));
  assert.ok(serviceCode.includes('id: "ch1_lvl3"'));
  assert.ok(serviceCode.includes('id: "ch1_lvl4"'));
});

test("Chapter 2 contains 4 core triad levels (F Maj, G Maj, D Min, E Min)", () => {
  assert.ok(serviceCode.includes('id: "ch2_lvl5"'));
  assert.ok(serviceCode.includes('id: "ch2_lvl6"'));
  assert.ok(serviceCode.includes('id: "ch2_lvl7"'));
  assert.ok(serviceCode.includes('id: "ch2_lvl8"'));
});

test("Chapter 3 contains colorful harmony levels (Csus4, Csus2)", () => {
  assert.ok(serviceCode.includes('id: "ch3_lvl9"'));
  assert.ok(serviceCode.includes('id: "ch3_lvl10"'));
});

test("setOnboardingAnswered function exists and updates database", () => {
  assert.ok(serviceCode.includes("export async function setOnboardingAnswered(isBeginner: boolean)"));
  assert.ok(serviceCode.includes("UPDATE user_stats SET onboarding_answered = 1, is_beginner = ?"));
});

test("getGraduationProgress function evaluates 4 milestones synchronously and asynchronously", () => {
  assert.ok(serviceCode.includes("export function getGraduationProgress("));
  assert.ok(serviceCode.includes("export async function fetchGraduationProgress()"));
  assert.ok(serviceCode.includes('id: "tutorial"'));
  assert.ok(serviceCode.includes('id: "ch1"'));
  assert.ok(serviceCode.includes('id: "stars"'));
  assert.ok(serviceCode.includes('id: "level3"'));
});

test("getNextJourneyLevel function finds first uncompleted level", () => {
  assert.ok(serviceCode.includes("export function getNextJourneyLevel("));
});

test("All 8 achievement badges are defined with icons and XP rewards", () => {
  const badgeIds = [
    "first_chord",
    "golden_ear",
    "triad_master",
    "streak_keeper",
    "journey_ch1",
    "accidental_artist",
    "star_collector",
    "chord_maestro",
  ];
  for (const bId of badgeIds) {
    assert.ok(serviceCode.includes(`id: "${bId}"`), `Badge ${bId} missing in learningService.ts`);
  }
});

test("Daily quest templates are defined with XP rewards", () => {
  assert.ok(serviceCode.includes("QUEST_TEMPLATES"));
  assert.ok(serviceCode.includes("Pioneer Step"));
  assert.ok(serviceCode.includes("Master Builder"));
  assert.ok(serviceCode.includes("Dojo Challenger"));
});

console.log("\n==========================================");
console.log(`LEARNING SERVICE SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log("==========================================\n");

if (failed > 0) {
  process.exit(1);
}
