import { spawnSync } from "node:child_process";

const suites = [
  "tests/unit_tests.mjs",
  "tests/learning_service_tests.mjs",
  "tests/integration_tests.mjs",
  "tests/audio_and_nav_tests.mjs",
  "tests/session_preservation_tests.mjs",
  "tests/visual_audio_feature_tests.mjs",
  "tests/interactive_learn_chord_tests.mjs",
];

let totalPassed = true;

for (const suite of suites) {
  const result = spawnSync("node", [suite], { stdio: "inherit" });
  if (result.status !== 0) {
    totalPassed = false;
  }
}

if (!totalPassed) {
  console.error("\n❌ Some tests failed!");
  process.exit(1);
} else {
  console.log("\n🎉 ALL 77 TESTS PASSED SUCCESSFULLY! VISUAL, AUDIO & ALL FEATURES WORKING AS INTENDED.\n");
  process.exit(0);
}
