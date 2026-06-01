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
  assert.match(publisher, /69dc4a79656fdba136d413d3/);
  assert.match(publisher, /69f959e2bc665e019e19840c/);
  assert.match(publisher, /--show-browser/);
  assert.match(packageJson, /"base44:publish-api": "node scripts\/base44\/publish-deploy-endpoint\.mjs --app-id 69dc4a79656fdba136d413d3 --verify-url https:\/\/clientsurgesystems\.com"/);
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
  assert.match(watcher, /Run this watcher from a clean \$TargetBranch mirror/);
  assert.match(watcher, /git merge --ff-only origin\/\$TargetBranch/);
  assert.match(watcher, /publish-deploy-endpoint\.mjs/);
  assert.match(packageJson, /"base44:watch-main-publish": "pwsh -File scripts\/base44\/watch-main-publish\.ps1"/);
});
