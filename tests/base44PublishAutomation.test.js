import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("backend publish helper gates Base44 UI publish behind checks", () => {
  const helper = read("scripts/base44/publish-backend-changes.ps1");
  const packageJson = read("package.json");

  assert.match(helper, /base44\/\(functions\|entities\|automations\|agents\)/);
  assert.match(helper, /npm run build/);
  assert.match(helper, /node --test tests\/adminLoginFlow\.test\.js tests\/base44FunctionsCheck\.test\.js/);
  assert.match(helper, /base44 dashboard open/);
  assert.match(helper, /-AutoClickPublish/);
  assert.match(helper, /git rev-parse --abbrev-ref --symbolic-full-name '@\{u\}'/);
  assert.match(helper, /git diff --name-only "\$upstream\.\.HEAD"/);
  assert.doesNotMatch(helper, /HEAD~1\.\.HEAD/);

  assert.match(packageJson, /"base44:publish-backend": "pwsh -File scripts\/base44\/publish-backend-changes\.ps1"/);
});

test("Base44 publish clicker requires an explicit publish flag", () => {
  const clicker = read("scripts/base44/publish-ui-clicker.mjs");

  assert.match(clicker, /Refusing to click Publish without --yes/);
  assert.match(clicker, /fileURLToPath/);
  assert.match(clicker, /--dry-run/);
  assert.match(clicker, /launchPersistentContext/);
  assert.match(clicker, /getByRole\("button", \{ name: "Publish", exact: true \}\)/);
  assert.match(clicker, /https:\/\/app\.base44\.com\/apps\/\$\{appId\}\/editor\/workspace\/overview/);
});

test("Base44 deploy endpoint publisher targets the production app with authenticated cookies", () => {
  const publisher = read("scripts/base44/publish-deploy-endpoint.mjs");
  const packageJson = read("package.json");

  assert.match(publisher, /\/api\/apps\/\$\{appId\}\/deploy/);
  assert.match(publisher, /fileURLToPath/);
  assert.match(publisher, /credentials: "include"/);
  assert.match(publisher, /--summary/);
  assert.match(publisher, /buildSummary/);
  assert.match(publisher, /69dc4a79656fdba136d413d3/);
  assert.match(publisher, /69f959e2bc665e019e19840c/);
  assert.match(publisher, /--show-browser/);
  assert.match(packageJson, /"base44:publish-api": "node scripts\/base44\/publish-deploy-endpoint\.mjs --app-id 69dc4a79656fdba136d413d3 --verify-url https:\/\/clientsurgesystems\.com"/);
});

test("Base44 app access and multi-app publish helpers keep production required", () => {
  const access = read("scripts/base44/check-app-access.mjs");
  const publishAll = read("scripts/base44/publish-all-apps.mjs");
  const packageJson = read("package.json");

  assert.match(access, /\.base44\/auth\/auth\.json/);
  assert.match(access, /api\/apps\/\$\{args\.appId\}/);
  assert.match(access, /api\/apps\/platform\/\$\{args\.appId\}\/published-url/);
  assert.match(access, /--json/);
  assert.match(access, /69dc4a79656fdba136d413d3/);

  assert.match(publishAll, /role: "production"/);
  assert.match(publishAll, /appId: "69dc4a79656fdba136d413d3"/);
  assert.match(publishAll, /required: true/);
  assert.match(publishAll, /appId: "69f959e2bc665e019e19840c"/);
  assert.match(publishAll, /appId: "6a15f1424f4856ba4e9ed90b"/);
  assert.match(publishAll, /publish-deploy-endpoint\.mjs/);
  assert.match(publishAll, /"--summary"/);
  assert.match(publishAll, /--staging-only/);
  assert.match(publishAll, /last-published-all\.json/);
  assert.match(publishAll, /sourceSha/);
  assert.match(packageJson, /"base44:check-app": "node scripts\/base44\/check-app-access\.mjs --app-id 69dc4a79656fdba136d413d3 --verify-url https:\/\/clientsurgesystems\.com"/);
  assert.match(packageJson, /"base44:publish-all": "node scripts\/base44\/publish-all-apps\.mjs"/);
});

test("Base44 auto sync watcher commits pushes and optionally publishes filtered changes", () => {
  const watcher = read("scripts/base44/watch-sync-publish.ps1");
  const packageJson = read("package.json");

  assert.match(watcher, /\[string\]\$TargetBranch = 'main'/);
  assert.match(watcher, /New-Object System\.IO\.FileSystemWatcher/);
  assert.match(watcher, /\[switch\]\$DryRun/);
  assert.match(watcher, /Dry run complete\. No files staged, committed, pushed, or published\./);
  assert.match(watcher, /git add --/);
  assert.match(watcher, /npm run build/);
  assert.match(watcher, /git commit -m/);
  assert.match(watcher, /git push origin/);
  assert.match(watcher, /publish-ui-clicker\.mjs --yes/);
  assert.match(watcher, /\^\\.env/);
  assert.match(watcher, /\^base44\/\\.app\\.jsonc\$/);
  assert.match(packageJson, /"base44:auto-sync": "pwsh -File scripts\/base44\/watch-sync-publish\.ps1"/);
});

test("main publish watcher preserves build test and production-app guardrails", () => {
  const watcher = read("scripts/base44/watch-main-publish.ps1");
  const packageJson = read("package.json");

  assert.match(watcher, /\[string\]\$TargetBranch = 'main'/);
  assert.match(watcher, /69dc4a79656fdba136d413d3/);
  assert.match(watcher, /npm run build/);
  assert.match(watcher, /npm run test:node/);
  assert.match(watcher, /npm run test:deno/);
  assert.match(watcher, /npm run smoke:public-routes/);
  assert.match(watcher, /npm run verify:production-security/);
  assert.match(watcher, /\[ValidateSet\('Primary', 'Failover', 'MirrorOnly'\)\]/);
  assert.match(watcher, /FailoverDelayMinutes/);
  assert.match(watcher, /SkipGitHubChecks/);
  assert.match(watcher, /SkipStagingMirrors/);
  assert.match(watcher, /wait-for-main-ci\.ps1/);
  assert.match(watcher, /publish-all-apps\.mjs --staging-only/);
  assert.match(watcher, /check-app-access\.mjs/);
  assert.match(watcher, /Run this watcher from a clean \$TargetBranch mirror/);
  assert.match(watcher, /git merge --ff-only origin\/\$TargetBranch/);
  assert.match(watcher, /publish-deploy-endpoint\.mjs --app-id \$AppId --verify-url \$VerifyUrl --summary/);
  assert.match(packageJson, /"base44:watch-main-publish": "pwsh -File scripts\/base44\/watch-main-publish\.ps1"/);
});

test("GitHub release gate verifies main before automatic publish", () => {
  const workflow = read(".github/workflows/clientsurge-release-gate.yml");
  const waiter = read("scripts/github/wait-for-main-ci.ps1");
  const packageJson = read("package.json");

  assert.match(workflow, /name: ClientSurge Release Gate/);
  assert.match(workflow, /branches:\s*\n\s*- main/);
  assert.match(workflow, /apt-get install -y ripgrep/);
  assert.match(workflow, /cp \.env\.example \.env\.local/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm run test:node/);
  assert.match(workflow, /npm run test:deno/);
  assert.match(workflow, /npm run smoke:public-routes/);

  assert.match(waiter, /gh run list/);
  assert.match(waiter, /clientsurge-release-gate\.yml/);
  assert.match(waiter, /--commit \$Sha/);
  assert.match(waiter, /conclusion -eq 'success'/);
  assert.match(packageJson, /"github:wait-main-ci": "pwsh -File scripts\/github\/wait-for-main-ci\.ps1"/);
});

test("mirror scheduler supports bootstrap plus primary and failover publisher roles", () => {
  const installer = read("scripts/sync/install-base44-sync-task.ps1");
  const updater = read("scripts/sync/update-base44-sync-mirror.ps1");
  const bootstrap = read("scripts/sync/bootstrap-base44-machine.ps1");
  const repair = read("scripts/sync/repair-base44-automation.ps1");
  const doctor = read("scripts/sync/doctor-base44-machine.ps1");
  const packageJson = read("package.json");

  assert.match(installer, /\[ValidateSet\('Primary', 'Failover', 'MirrorOnly'\)\]/);
  assert.match(installer, /PublisherRole/);
  assert.match(installer, /FailoverDelayMinutes/);
  assert.match(installer, /SkipPublishTests/);
  assert.match(installer, /SkipGitHubChecks/);

  assert.match(updater, /watch-main-publish\.ps1/);
  assert.match(updater, /'-PublisherRole'/);
  assert.match(updater, /'-FailoverDelayMinutes'/);
  assert.match(updater, /'-SkipTests'/);
  assert.match(updater, /'-SkipGitHubChecks'/);

  assert.match(bootstrap, /ensure-base44-sync-mirror\.ps1/);
  assert.match(bootstrap, /check-app-access\.mjs/);
  assert.match(bootstrap, /install-base44-sync-task\.ps1/);
  assert.match(bootstrap, /69dc4a79656fdba136d413d3/);

  assert.match(repair, /ClientSurge-Base44-SyncMirror/);
  assert.match(repair, /ClientSurge-Cloudflare-Security-Edge/);
  assert.match(repair, /install-base44-sync-task\.ps1/);
  assert.match(repair, /install-security-edge-monitor-task\.ps1/);
  assert.match(repair, /automation-repair-latest\.json/);
  assert.match(repair, /npm @\('run', 'sync:status'\)/);

  assert.match(doctor, /ClientSurge Machine Doctor/);
  assert.match(doctor, /machine-doctor-latest\.json/);
  assert.match(doctor, /acceptableOverlapResults/);
  assert.match(doctor, /Test-TaskResultHealthy/);
  assert.match(doctor, /base44 @\('whoami'\)/);
  assert.match(doctor, /gh @\('auth', 'status'\)/);
  assert.match(doctor, /npx @\('wrangler', 'whoami'\)/);
  assert.match(doctor, /npm @\('run', 'sync:status', '--', '--json'\)/);
  assert.match(doctor, /ExpectedPublisherRole/);
  assert.match(packageJson, /"sync:bootstrap-machine": "pwsh -File scripts\/sync\/bootstrap-base44-machine\.ps1"/);
  assert.match(packageJson, /"sync:doctor": "pwsh -File scripts\/sync\/doctor-base44-machine\.ps1"/);
  assert.match(packageJson, /"sync:repair-automation": "pwsh -File scripts\/sync\/repair-base44-automation\.ps1"/);
});

test("sync status audit covers GitHub mirror Base44 tasks and Cloudflare readiness", () => {
  const status = read("scripts/sync/audit-sync-status.mjs");
  const packageJson = read("package.json");

  assert.match(status, /ClientSurge Sync Status/);
  assert.match(status, /ClientSurge-Base44-SyncMirror/);
  assert.match(status, /ClientSurge-Cloudflare-Security-Edge/);
  assert.match(status, /getGitHubReleaseGate/);
  assert.match(status, /clientsurge-release-gate\.yml/);
  assert.match(status, /GitHub release gate has not passed for origin\/main/);
  assert.match(status, /last-published-all\.json/);
  assert.match(status, /Base44 multi-app publish state does not match origin\/main/);
  assert.match(status, /Staging donor live signal does not contain donor app ID/);
  assert.match(status, /isTaskOverlapResult/);
  assert.match(status, /overlapping\/running tick/);
  assert.match(status, /check-app-access\.mjs/);
  assert.match(status, /last-published-main\.txt/);
  assert.match(status, /npx", \["wrangler", "whoami"\]/);
  assert.match(status, /Cloudflare edge release is waiting on Wrangler authentication/);
  assert.match(status, /hasDonorAppId/);
  assert.match(packageJson, /"sync:status": "node scripts\/sync\/audit-sync-status\.mjs"/);
});
