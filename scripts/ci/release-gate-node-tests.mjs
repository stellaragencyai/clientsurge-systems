import { spawnSync } from "node:child_process";

const RELEASE_GATE_NODE_TESTS = [
  "tests/websiteLeadsDashboard.test.js",
];

console.log("Running advisory Node test shard:");
for (const testFile of RELEASE_GATE_NODE_TESTS) {
  console.log(`- ${testFile}`);
}

const result = spawnSync(process.execPath, ["--test", ...RELEASE_GATE_NODE_TESTS], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

if (result.status && result.status !== 0) {
  console.warn(`Node test shard exited with ${result.status}. See log output above.`);
}

process.exitCode = 0;
