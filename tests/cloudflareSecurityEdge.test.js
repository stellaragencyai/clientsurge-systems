import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import worker, {
  applySecurityHeaders,
  EDGE_HEALTH_HEADER,
  EDGE_HEALTH_PATH,
  isSensitivePath,
  originRequestFor,
  SENSITIVE_HEADERS,
  SECURITY_TXT,
} from "../cloudflare/clientsurge-security-edge-worker.mjs";
import {
  evaluateEdgeHealthProbe,
  isCloudflareAnycastAddress,
  TRANSFORM_FALLBACK_HEADER,
} from "../scripts/verify-production-security.mjs";
import {
  diagnoseRouteBypass,
  formatRouteBypassDiagnosis,
} from "../scripts/cloudflare/diagnose-route-bypass.mjs";
import {
  buildSecurityHeaderRules,
  TRANSFORM_HEADER,
} from "../scripts/cloudflare/upsert-security-header-transform.mjs";

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

test("Cloudflare security edge worker proxies application traffic to the Base44 origin host", () => {
  const originRequest = originRequestFor(new Request("https://clientsurgesystems.com/store?plan=starter"));
  const originUrl = new URL(originRequest.url);

  assert.equal(originUrl.hostname, "grinning-apex-flow-growth.base44.app");
  assert.equal(originUrl.pathname, "/store");
  assert.equal(originUrl.search, "?plan=starter");
});

test("production security verifier checks the Cloudflare security layer probe", () => {
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

test("production security verifier accepts Cloudflare transform fallback when Worker route is bypassed", () => {
  const pass = evaluateEdgeHealthProbe({
    target: `https://clientsurgesystems.com${EDGE_HEALTH_PATH}`,
    status: 200,
    headers: { [TRANSFORM_FALLBACK_HEADER]: "active" },
  });
  assert.equal(pass.status, "pass");
  assert.match(pass.message, /transform fallback is active/);
});

test("Cloudflare transform fallback rule mirrors Worker security headers", () => {
  const [globalRule, sensitiveRule] = buildSecurityHeaderRules("clientsurgesystems.com");

  assert.equal(globalRule.action, "rewrite");
  assert.equal(globalRule.action_parameters.headers[TRANSFORM_HEADER].value, "active");
  assert.equal(
    globalRule.action_parameters.headers["Content-Security-Policy"].value,
    applySecurityHeaders(new Headers(), "/").get("content-security-policy")
  );
  assert.equal(
    globalRule.action_parameters.headers["Permissions-Policy"].value,
    applySecurityHeaders(new Headers(), "/").get("permissions-policy")
  );
  assert.match(globalRule.expression, /clientsurgesystems\.com/);

  assert.equal(sensitiveRule.action, "rewrite");
  assert.match(sensitiveRule.expression, /\/client-portal/);
  assert.equal(sensitiveRule.action_parameters.headers["X-Robots-Tag"].value, SENSITIVE_HEADERS["X-Robots-Tag"]);
  assert.equal(sensitiveRule.action_parameters.headers["Cache-Control"].value, SENSITIVE_HEADERS["Cache-Control"]);
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
  assert.match(monitor, /edge-probe:worker|edge-probe:security-layer/);
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
  assert.match(report.next_action.message, /cannot inspect dns-records, custom-hostnames, rulesets/);
  assert.deepEqual(report.next_action.denied_probes, ["dns-records", "custom-hostnames", "rulesets"]);
  assert.ok(calls.some((url) => String(url).includes("/workers/routes")));

  const formatted = formatRouteBypassDiagnosis(report);
  assert.match(formatted, /Cloudflare route-bypass diagnosis/);
  assert.match(formatted, /clientsurgesystems\.com\/\*: clientsurge-security-edge \(ok\)/);
  assert.match(formatted, /dns_records: denied/);
  assert.doesNotMatch(formatted, /test-token/);
});

test("Cloudflare route-bypass diagnostic falls back across env and Wrangler token sources per endpoint", async () => {
  const previous = process.env.CLOUDFLARE_API_TOKEN;
  process.env.CLOUDFLARE_API_TOKEN = "env-token";
  try {
    const report = await diagnoseRouteBypass({
      configPath: new URL("./fixtures/wrangler-oauth.toml", import.meta.url),
      fetchImpl: async (url, options = {}) => {
        const auth = options.headers?.authorization || "";
        const path = new URL(url).pathname;
        if (path === "/client/v4/zones") {
          return Response.json({ success: true, result: [{ id: "zone-123", name: "clientsurgesystems.com" }] });
        }
        if (path === "/client/v4/zones/zone-123/workers/routes" && auth.includes("env-token")) {
          return Response.json(
            { success: false, errors: [{ code: 10000, message: "Authentication error" }] },
            { status: 403 }
          );
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
        if (path === "/client/v4/zones/zone-123/rulesets" && auth.includes("env-token")) {
          return Response.json({ success: true, result: [] });
        }
        return Response.json(
          { success: false, errors: [{ code: 10000, message: "Authentication error" }] },
          { status: 403 }
        );
      },
    });

    assert.equal(report.probes.zone.token_source, "env");
    assert.equal(report.probes.worker_routes.token_source, "wrangler_oauth");
    assert.deepEqual(report.probes.worker_routes.attempted_sources, ["env", "wrangler_oauth"]);
    assert.equal(report.probes.rulesets.token_source, "env");
    assert.deepEqual(report.next_action.denied_probes, ["dns-records", "custom-hostnames"]);
    assert.deepEqual(report.next_action.readable_probes, ["rulesets"]);
    assert.doesNotMatch(JSON.stringify(report), /env-token|test-token/);
  } finally {
    if (previous === undefined) delete process.env.CLOUDFLARE_API_TOKEN;
    else process.env.CLOUDFLARE_API_TOKEN = previous;
  }
});

test("Cloudflare route-bypass diagnostic surfaces concrete DNS custom-hostname and ruleset candidates when readable", async () => {
  const report = await diagnoseRouteBypass({
    configPath: new URL("./fixtures/wrangler-oauth.toml", import.meta.url),
    fetchImpl: async (url) => {
      const requestUrl = new URL(url);
      const path = requestUrl.pathname;
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
      if (path === "/client/v4/zones/zone-123/dns_records") {
        return Response.json({
          success: true,
          result: [
            {
              id: "dns-1",
              type: "CNAME",
              name: "clientsurgesystems.com",
              content: "client-surge.base44.app",
              proxied: true,
              ttl: 1,
            },
            {
              id: "dns-2",
              type: "TXT",
              name: "_verification.clientsurgesystems.com",
              content: "safe-to-ignore",
              proxied: false,
            },
          ],
        });
      }
      if (path === "/client/v4/zones/zone-123/custom_hostnames") {
        return Response.json({
          success: true,
          result: [
            {
              id: "host-1",
              hostname: "clientsurgesystems.com",
              status: "active",
              ssl: { status: "active" },
              custom_origin_server: "client-surge.base44.app",
            },
          ],
        });
      }
      if (path === "/client/v4/zones/zone-123/rulesets") {
        return Response.json({
          success: true,
          result: [
            {
              id: "ruleset-1",
              name: "redirects",
              phase: "http_request_dynamic_redirect",
              rules: [
                {
                  id: "rule-1",
                  description: "www canonical redirect for clientsurgesystems.com",
                  action: "redirect",
                  expression: '(http.host eq "www.clientsurgesystems.com")',
                  enabled: true,
                },
              ],
            },
          ],
        });
      }
      return Response.json({ success: true, result: [] });
    },
  });

  assert.equal(report.ok, true);
  assert.equal(report.next_action.status, "inspect_bypass_candidates");
  assert.equal(report.analysis.dns_records.length, 1);
  assert.deepEqual(report.analysis.dns_records[0].risk_flags, ["proxied", "proxied_cname", "base44_target"]);
  assert.equal(report.analysis.custom_hostnames.length, 1);
  assert.equal(report.analysis.rulesets.length, 1);
  assert.ok(report.analysis.candidates.some((candidate) => candidate.source === "dns_records"));
  assert.ok(report.analysis.candidates.some((candidate) => candidate.source === "custom_hostnames"));
  assert.ok(report.analysis.candidates.some((candidate) => candidate.source === "rulesets"));

  const formatted = formatRouteBypassDiagnosis(report);
  assert.match(formatted, /Bypass candidates:/);
  assert.match(formatted, /CNAME clientsurgesystems\.com -> client-surge\.base44\.app/);
  assert.match(formatted, /http_request_dynamic_redirect/);
});
