import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import worker, {
  applySecurityHeaders,
  isSensitivePath,
  SECURITY_TXT,
} from "../cloudflare/clientsurge-security-edge-worker.mjs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Cloudflare security edge worker identifies sensitive app routes", () => {
  for (const path of ["/admin", "/admin/leads", "/onboarding", "/setup/preview/security-check", "/motion-lab", "/client-portal"]) {
    assert.equal(isSensitivePath(path), true, `${path} should be sensitive`);
  }

  for (const path of ["/", "/store", "/book", "/contact", "/roofing"]) {
    assert.equal(isSensitivePath(path), false, `${path} should stay public`);
  }
});

test("Cloudflare security edge worker applies required public and sensitive headers", () => {
  const publicHeaders = applySecurityHeaders(new Headers(), "/");
  assert.ok(publicHeaders.get("content-security-policy")?.includes("default-src"));
  assert.ok(publicHeaders.get("content-security-policy")?.includes("base-uri"));
  assert.ok(publicHeaders.get("content-security-policy")?.includes("object-src"));
  assert.match(
    publicHeaders.get("content-security-policy") || "",
    /frame-ancestors[^;]*https:\/\/base44\.app[^;]*https:\/\/\*\.base44\.app[^;]*https:\/\/base44\.com[^;]*https:\/\/\*\.base44\.com/
  );
  assert.ok(publicHeaders.get("permissions-policy"));
  assert.ok(publicHeaders.get("cross-origin-opener-policy"));

  const sensitiveHeaders = applySecurityHeaders(new Headers(), "/client-portal");
  assert.match(sensitiveHeaders.get("x-robots-tag") || "", /noindex/);
  assert.match(sensitiveHeaders.get("cache-control") || "", /no-store/);
});

test("Cloudflare security edge worker serves canonical security.txt at the edge", async () => {
  const response = await worker.fetch(new Request("https://clientsurgesystems.com/.well-known/security.txt"));
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/plain/);
  assert.match(body, /https:\/\/clientsurgesystems\.com\/\.well-known\/security\.txt/);
  assert.equal(body, SECURITY_TXT);
});

test("Cloudflare security edge worker redirects alternate host to canonical", async () => {
  const response = await worker.fetch(new Request("https://www.clientsurgesystems.com/store"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://clientsurgesystems.com/store");
});

test("Cloudflare security release and monitor scripts keep auth and verification guarded", () => {
  const packageJson = read("package.json");
  const release = read("scripts/cloudflare/deploy-security-edge.ps1");
  const monitor = read("scripts/cloudflare/monitor-security-edge.ps1");
  const installer = read("scripts/cloudflare/install-security-edge-monitor-task.ps1");

  assert.match(packageJson, /"cloudflare:security:release": "pwsh -File scripts\/cloudflare\/deploy-security-edge\.ps1"/);
  assert.match(packageJson, /"cloudflare:security:monitor": "pwsh -File scripts\/cloudflare\/monitor-security-edge\.ps1"/);
  assert.match(packageJson, /"cloudflare:security:install-monitor": "pwsh -File scripts\/cloudflare\/install-security-edge-monitor-task\.ps1"/);

  assert.match(release, /npx wrangler whoami/);
  assert.match(release, /npm run verify:production-security/);
  assert.match(release, /wrangler deploy --config \$ConfigPath --dry-run/);

  assert.match(monitor, /npm run verify:production-security/);
  assert.match(monitor, /npx wrangler whoami/);
  assert.match(monitor, /auth_required/);
  assert.match(monitor, /route_bypassed/);
  assert.match(monitor, /Test-RouteBypassFailure/);
  assert.match(monitor, /npm run cloudflare:security:release/);
  assert.match(monitor, /latest-security-edge-status\.json/);

  assert.match(installer, /New-ScheduledTaskTrigger/);
  assert.match(installer, /monitor-security-edge\.ps1/);
  assert.match(installer, /MultipleInstances IgnoreNew/);
});
