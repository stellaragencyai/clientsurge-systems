import test from "node:test";
import assert from "node:assert/strict";

import worker, {
  applySecurityHeaders,
  isSensitivePath,
  SECURITY_TXT,
} from "../cloudflare/clientsurge-security-edge-worker.mjs";

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
