import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const releaseGate = read(".github/workflows/clientsurge-release-gate.yml");
const base44AutoPublish = read(".github/workflows/base44-auto-publish.yml");
const deployPublisher = read("scripts/base44/publish-deploy-endpoint.mjs");
const packageJson = read("package.json");

test("Area 12 release gate persists a commit-specific proof artifact", () => {
  assert.match(releaseGate, /name: ClientSurge Release Gate/);
  assert.match(releaseGate, /RELEASE_GATE_PROOF_PATH: tmp\/release-gate-proof\.json/);
  assert.match(releaseGate, /Write release gate proof artifact/);
  assert.match(releaseGate, /clientsurge-release-gate-proof-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
  assert.match(releaseGate, /clientsurge-cloudflare-route-diagnosis-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
  assert.match(releaseGate, /actions\/upload-artifact@v4/);
  assert.match(releaseGate, /downstream_workflow: 'Base44 Auto Publish'/);
  assert.match(releaseGate, /GITHUB_SHA/);
});

test("Area 12 Base44 auto-publish persists publish and release-chain artifacts", () => {
  assert.match(base44AutoPublish, /name: Base44 Auto Publish/);
  assert.match(base44AutoPublish, /workflow_run:/);
  assert.match(base44AutoPublish, /ClientSurge Release Gate/);
  assert.match(base44AutoPublish, /BASE44_PUBLISH_PROOF_PATH: tmp\/base44-publish-proof\.json/);
  assert.match(base44AutoPublish, /RELEASE_CHAIN_PROOF_PATH: tmp\/release-chain-proof\.json/);
  assert.match(base44AutoPublish, /Write release chain proof preflight/);
  assert.match(base44AutoPublish, /--output "\$BASE44_PUBLISH_PROOF_PATH"/);
  assert.match(base44AutoPublish, /base44-release-proof-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
  assert.match(base44AutoPublish, /actions\/upload-artifact@v4/);
});

test("Area 12 Base44 publish script can write durable JSON proof", () => {
  assert.match(deployPublisher, /--output/);
  assert.match(deployPublisher, /writeJsonIfRequested/);
  assert.match(deployPublisher, /outputPath/);
  assert.match(deployPublisher, /GITHUB_RUN_ID/);
  assert.match(deployPublisher, /GITHUB_RUN_ATTEMPT/);
  assert.match(deployPublisher, /GITHUB_WORKFLOW/);
  assert.match(deployPublisher, /verification: verification \?/);
  assert.match(deployPublisher, /beforeSignal/);
  assert.match(deployPublisher, /afterSignal/);
});

test("Area 12 release chain still blocks publish behind build and route checks", () => {
  assert.match(releaseGate, /npm run build/);
  assert.match(releaseGate, /npm run test:release-gate:node/);
  assert.match(releaseGate, /node scripts\/product-signup-route-smoke\.mjs/);
  assert.match(releaseGate, /npm run cloudflare:security:dry-run/);
  assert.match(releaseGate, /npm run cloudflare:security:diagnose-route -- --json/);
  assert.match(releaseGate, /cloudflare_route_diagnosis/);
  assert.match(releaseGate, /launch policy still requires production-security verification to pass/);
  assert.match(base44AutoPublish, /npm run build/);
  assert.match(base44AutoPublish, /Verify live product signup route/);
  assert.match(base44AutoPublish, /Verify live checkout function creates Stripe session/);
  assert.match(base44AutoPublish, /BASE44_AUTH_JSON: \$\{\{ secrets\.BASE44_AUTH_JSON \|\| secrets\.BASE_44_AUTH_JSON \}\}/);
  assert.match(packageJson, /"github:wait-main-ci": "pwsh -File scripts\/github\/wait-for-main-ci\.ps1"/);
});

test("Area 12 proof distinguishes GitHub merge from Base44 live verification", () => {
  assert.match(base44AutoPublish, /Release proof artifact/);
  assert.match(base44AutoPublish, /Publish proof JSON/);
  assert.match(base44AutoPublish, /CLIENTSURGE_VERIFY_URL/);
  assert.match(base44AutoPublish, /CLIENTSURGE_EXPECT_STRIPE_MODE: live/);
  assert.match(deployPublisher, /timeout_waiting_for_signal_change/);
  assert.match(deployPublisher, /signal_changed/);
});
