import { spawnSync } from "node:child_process";

const RELEASE_GATE_NODE_TESTS = [
  "tests/base44PublishAutomation.test.js",
  "tests/adminLoginFlow.test.js",
  "tests/base44FunctionsCheck.test.js",
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
