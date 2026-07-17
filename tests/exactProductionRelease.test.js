import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("production release embeds and verifies the exact GitHub SHA", () => {
  const writer = read("scripts/release/write-release-marker.mjs");
  const verifier = read("scripts/release/verify-live-release.mjs");
  const deployer = read("scripts/release/deploy-production-site.mjs");

  assert.match(writer, /public\/release\.json/);
  assert.match(writer, /GITHUB_SHA/);
  assert.match(writer, /69dc4a79656fdba136d413d3/);

  assert.match(verifier, /release\.json\?sha=/);
  assert.match(verifier, /payload\?\.sha === expectedSha/);
  assert.match(verifier, /live_release_sha_did_not_match_before_timeout/);

  assert.match(deployer, /base44@latest/);
  assert.match(deployer, /site", "deploy", "-y"/);
  assert.match(deployer, /verify-live-release\.mjs/);
  assert.match(deployer, /Refusing production release from branch/);
  assert.match(deployer, /Refusing production release from a dirty worktree/);
});

test("one canonical workflow owns automatic production deployment", () => {
  const canonical = read(".github/workflows/clientsurge-production-release.yml");
  const legacyEndpoint = read(".github/workflows/base44-auto-publish.yml");
  const legacyUi = read(".github/workflows/base44-ui-click-publish.yml");

  assert.match(canonical, /name: ClientSurge Production Release/);
  assert.match(canonical, /workflow_run:/);
  assert.match(canonical, /ClientSurge Release Gate/);
  assert.match(canonical, /group: clientsurge-production-release/);
  assert.match(canonical, /deploy-production-site\.mjs/);
  assert.match(canonical, /Install Base44 authentication/);

  assert.doesNotMatch(legacyEndpoint, /workflow_run:/);
  assert.doesNotMatch(legacyUi, /workflow_run:/);
  assert.match(legacyEndpoint, /workflow_dispatch:/);
  assert.match(legacyUi, /workflow_dispatch:/);
});

test("local watcher publishes only clean main commits and records success after proof", () => {
  const watcher = read("scripts/base44/watch-main-exact-release.ps1");
  const installer = read("scripts/sync/install-exact-production-release-task.ps1");

  assert.match(watcher, /git merge --ff-only origin\/\$TargetBranch/);
  assert.match(watcher, /wait-for-main-ci\.ps1/);
  assert.match(watcher, /deploy-production-site\.mjs/);
  assert.match(watcher, /last-exact-release-main\.txt/);
  assert.match(watcher, /Release mirror is dirty/);

  assert.match(installer, /ClientSurge-Exact-Production-Release/);
  assert.match(installer, /New-ScheduledTaskTrigger/);
  assert.match(installer, /MultipleInstances IgnoreNew/);
});
