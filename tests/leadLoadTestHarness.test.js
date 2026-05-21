import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const script = readFileSync("scripts/load-test-lead-submissions.mjs", "utf8");

test("lead submission load test has a safe loopback self-test mode", () => {
  assert.equal(
    packageJson.scripts["verify:lead-load"],
    "node scripts/load-test-lead-submissions.mjs --self-test"
  );
  assert.match(script, /createServer/);
  assert.match(script, /CLIENTSURGE_LOAD_TEST_SELF_TEST/);
  assert.match(script, /process\.argv\.includes\("--self-test"\)/);
  assert.match(script, /127\.0\.0\.1/);
  assert.match(script, /self_test: selfTest/);
});

test("lead submission load test still refuses production-looking targets", () => {
  assert.match(script, /Refusing to load test a production-looking URL/);
  assert.match(script, /\.\*staging\.\*/);
  assert.match(script, /localhost\|127\\.0\\.0\\.1/);
});
