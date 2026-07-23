import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  PRODUCTION_APP_ID,
  PRODUCTION_CONFIRMATION,
  assertDeploymentTarget,
} from "../scripts/release/deploy-base44-exact-artifact.mjs";
import {
  buildReleaseManifest,
  normalizeSha,
} from "../scripts/release/write-release-manifest.mjs";

const repoRoot = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("release manifest preserves the exact full Git commit", () => {
  const sha = "0123456789abcdef0123456789abcdef01234567";
  const manifest = buildReleaseManifest({
    sha,
    repository: "stellaragencyai/clientsurge-systems",
    appId: "69e17d7645190f8faabf6d6a",
    environment: "staging",
    generatedAt: "2026-07-12T00:00:00.000Z",
  });

  assert.equal(manifest.sha, sha);
  assert.equal(manifest.short_sha, sha.slice(0, 12));
  assert.equal(manifest.base44_app_id, "69e17d7645190f8faabf6d6a");
  assert.equal(manifest.environment, "staging");
  assert.equal(manifest.artifact_type, "vite-dist");
});

test("release manifest rejects abbreviated or malformed SHAs", () => {
  assert.throws(() => normalizeSha("abc123"), /40-character Git SHA/);
  assert.throws(() => normalizeSha("z".repeat(40)), /40-character Git SHA/);
});

test("exact-artifact deployer refuses production without both explicit gates", () => {
  assert.throws(
    () => assertDeploymentTarget({
      appId: PRODUCTION_APP_ID,
      environment: "production",
      allowProduction: false,
      confirmProduction: "",
    }),
    /Production deployment is disabled/,
  );

  assert.throws(
    () => assertDeploymentTarget({
      appId: PRODUCTION_APP_ID,
      environment: "production",
      allowProduction: true,
      confirmProduction: "WRONG",
    }),
    new RegExp(PRODUCTION_CONFIRMATION),
  );

  assert.deepEqual(
    assertDeploymentTarget({
      appId: PRODUCTION_APP_ID,
      environment: "production",
      allowProduction: true,
      confirmProduction: PRODUCTION_CONFIRMATION,
    }),
    { isProduction: true },
  );
});

test("staging targets do not require a production override", () => {
  assert.deepEqual(
    assertDeploymentTarget({
      appId: "69e17d7645190f8faabf6d6a",
      environment: "staging",
      allowProduction: false,
      confirmProduction: "",
    }),
    { isProduction: false },
  );
});

test("staging workflow is manual, locked, and refuses the production app", () => {
  const workflow = read(".github/workflows/base44-exact-artifact-staging-proof.yml");

  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /push:\s*\n\s*branches:/);
  assert.match(workflow, /group: base44-exact-artifact-staging-proof/);
  assert.match(workflow, /69dc4a79656fdba136d413d3/);
  assert.match(workflow, /This workflow is staging-only and refuses the production app ID/);
  assert.match(workflow, /deploy-base44-exact-artifact\.mjs/);
});

test("deployer uses official Base44 site deploy and exact SHA verification", () => {
  const deployer = read("scripts/release/deploy-base44-exact-artifact.mjs");
  const verifier = read("scripts/release/verify-live-release.mjs");

  assert.match(deployer, /base44@latest/);
  assert.match(deployer, /"site", "deploy", "-y", "--app-id"/);
  assert.match(deployer, /dist\/release\.json/);
  assert.match(deployer, /waitForExactRelease/);
  assert.match(verifier, /timeout_waiting_for_exact_release_sha/);
  assert.match(verifier, /liveSha === normalizedSha/);
});
