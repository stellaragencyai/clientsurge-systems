import { spawnSync } from "node:child_process";

// Keep the blocking release gate limited to release-critical tests that are
// expected to stay green on main. The full legacy Node suite still runs in the
// GitHub workflow as a non-blocking audit so stale tests remain visible without
// blocking every Base44 publish.
const RELEASE_GATE_NODE_TESTS = [
  "tests/leadPipeline.test.js",
  "tests/websiteLeadsDashboard.test.js",
  "tests/outboundLeadGuards.test.js",
  "tests/autoArchiveOldLeads.test.js",
];

console.log("Running release-gate Node test shard:");
for (const testFile of RELEASE_GATE_NODE_TESTS) {
  console.log(`- ${testFile}`);
}

const result = spawnSync(process.execPath, ["--test", ...RELEASE_GATE_NODE_TESTS], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

process.exitCode = result.status || 0;
