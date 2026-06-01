import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import worker, {
  applySecurityHeaders,
  EDGE_HEALTH_HEADER,
  EDGE_HEALTH_PATH,
  isSensitivePath,
  SECURITY_TXT,
} from "../cloudflare/clientsurge-security-edge-worker.mjs";
import {
  evaluateEdgeHealthProbe,
  isCloudflareAnycastAddress,
} from "../scripts/verify-production-security.mjs";
import {
  diagnoseRouteBypass,
  formatRouteBypassDiagnosis,
} from "../scripts/cloudflare/diagnose-route-bypass.mjs";

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

test("Cloudflare security edge worker serves a Worker-only health probe", async () => {
  const response = await worker.fetch(new Request(`https://clientsurgesystems.com${EDGE_HEALTH_PATH}`));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get(EDGE_HEALTH_HEADER), "active");
  assert.equal(body.ok, true);
  assert.equal(body.edge, "clientsurge-security-edge");
});

test("production security verifier checks the Worker-only edge probe", () => {
  const pass = evaluateEdgeHealthProbe({
    target: `https://clientsurgesystems.com${EDGE_HEALTH_PATH}`,
    status: 200,
    headers: { [EDGE_HEALTH_HEADER]: "active" },
  });
  assert.equal(pass.status, "pass");

  const fail = evaluateEdgeHealthProbe({
    target: `https://clientsurgesystems.com${EDGE_HEALTH_PATH}`,
    status: 200,
    headers: { "content-type": "text/html" },
  });
  assert.equal(fail.status, "fail");
});

test("Cloudflare security release and monitor scripts keep auth and verification guarded", () => {
  const packageJson = read("package.json");
  const release = read("scripts/cloudflare/deploy-security-edge.ps1");
  const monitor = read("scripts/cloudflare/monitor-security-edge.ps1");
  const installer = read("scripts/cloudflare/install-security-edge-monitor-task.ps1");

  assert.match(packageJson, /"cloudflare:security:release": "pwsh -File scripts\/cloudflare\/deploy-security-edge\.ps1"/);
  assert.match(packageJson, /"cloudflare:security:monitor": "pwsh -File scripts\/cloudflare\/monitor-security-edge\.ps1"/);
  assert.match(packageJson, /"cloudflare:security:install-monitor": "pwsh -File scripts\/cloudflare\/install-security-edge-monitor-task\.ps1"/);
  assert.match(packageJson, /"cloudflare:security:diagnose-route": "node scripts\/cloudflare\/diagnose-route-bypass\.mjs"/);

  assert.match(release, /npx wrangler whoami/);
  assert.match(release, /npm run verify:production-security/);
  assert.match(release, /wrangler deploy --config \$ConfigPath --dry-run/);

  assert.match(monitor, /npm run verify:production-security/);
  assert.match(monitor, /npx wrangler whoami/);
  assert.match(monitor, /auth_required/);
  assert.match(monitor, /route_bypassed/);
  assert.match(monitor, /orange-to-orange/);
  assert.match(monitor, /edge-probe:worker/);
  assert.match(monitor, /Test-RouteBypassFailure/);
  assert.match(monitor, /npm run cloudflare:security:release/);
  assert.match(monitor, /npm run cloudflare:security:diagnose-route -- --json/);
  assert.match(monitor, /route_diagnosis/);
  assert.match(monitor, /latest-security-edge-status\.json/);

  assert.match(installer, /New-ScheduledTaskTrigger/);
  assert.match(installer, /monitor-security-edge\.ps1/);
  assert.match(installer, /MultipleInstances IgnoreNew/);
});

test("production security verifier recognizes Cloudflare anycast DNS evidence", () => {
  assert.equal(isCloudflareAnycastAddress("104.21.24.127"), true);
  assert.equal(isCloudflareAnycastAddress("172.67.218.204"), true);
  assert.equal(isCloudflareAnycastAddress("2606:4700:3032::ac43:dacc"), true);
  assert.equal(isCloudflareAnycastAddress("203.0.113.10"), false);
});

test("Cloudflare route-bypass diagnostic identifies missing DNS/custom-hostname permissions without exposing tokens", async () => {
  const calls = [];
  const report = await diagnoseRouteBypass({
    configPath: new URL("./fixtures/wrangler-oauth.toml", import.meta.url),
    fetchImpl: async (url) => {
      calls.push(url);
      const path = new URL(url).pathname;
      if (path === "/client/v4/zones") {
        return Response.json({ success: true, result: [{ id: "zone-123", name: "clientsurgesystems.com" }] });
      }
      if (path === "/client/v4/zones/zone-123/workers/routes") {
        return Response.json({
          success: true,
          result: [
            { id: "route-1", pattern: "clientsurgesystems.com/*", script: "clientsurge-security-edge" },
            { id: "route-2", pattern: "www.clientsurgesystems.com/*", script: "clientsurge-security-edge" },
          ],
        });
      }
      return Response.json(
        { success: false, errors: [{ code: 10000, message: "Authentication error" }] },
        { status: 403 }
      );
    },
  });

  assert.equal(report.ok, false);
  assert.equal(report.wrangler.has_oauth_token, true);
  assert.equal(report.wrangler.oauth_token, undefined);
  assert.deepEqual(report.routes.map((route) => route.matches_worker), [true, true]);
  assert.equal(report.probes.dns_records.ok, false);
  assert.equal(report.probes.custom_hostnames.ok, false);
  assert.equal(report.probes.rulesets.ok, false);
  assert.equal(report.next_action.status, "needs_cloudflare_dns_custom_hostname_ruleset_access");
  assert.match(report.next_action.message, /DNS\/custom-hostname\/ruleset read access/);
  assert.ok(calls.some((url) => String(url).includes("/workers/routes")));

  const formatted = formatRouteBypassDiagnosis(report);
  assert.match(formatted, /Cloudflare route-bypass diagnosis/);
  assert.match(formatted, /clientsurgesystems\.com\/\*: clientsurge-security-edge \(ok\)/);
  assert.match(formatted, /dns_records: denied/);
  assert.doesNotMatch(formatted, /test-token/);
});
