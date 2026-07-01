import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const script = readFileSync(new URL("../scripts/release/prove-production-release.mjs", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("production proof script has expected ClientSurge identity", () => {
  assert.ok(script.includes("https://clientsurgesystems.com"));
  assert.ok(script.includes("69dc4a79656fdba136d413d3"));
  assert.ok(script.includes("stellaragencyai/clientsurge-systems"));
});

test("production proof script checks admin and public routes", () => {
  assert.ok(script.includes('"/admin"'));
  assert.ok(script.includes('"/login"'));
  assert.ok(script.includes('"/contact"'));
  assert.ok(script.includes('"/proof"'));
});

test("package exposes production release proof command", () => {
  assert.equal(packageJson.scripts["proof:production-release"], "node scripts/release/prove-production-release.mjs --write-report");
});

test("production proof self-test exits cleanly", () => {
  const output = execFileSync(process.execPath, ["scripts/release/prove-production-release.mjs", "--self-test", "--expected-sha=test-sha"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });
  const report = JSON.parse(output);
  assert.equal(report.status, "pass");
  assert.equal(report.expected_main_sha, "test-sha");
  assert.equal(report.fail_count, 0);
});
